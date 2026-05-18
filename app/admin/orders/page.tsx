'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useOrderSounds } from '@/components/admin/useOrderSounds';

/* ================== Tipos ================== */
type ItemOptions = {
  note?: string | null;
  fries?: string | null;
  drink?: string | null;
  ingredients?: string[] | null;
} | null;

type Item = {
  id: string;
  name: string;
  qty: number;
  price: number;
  note?: string | null;
  variant?: string | null;
  options?: ItemOptions;
};

type Order = {
  id: string;
  created_at: string;
  name: string;
  phone: string;
  address: string;
  zone: string;
  order_type?: 'delivery' | 'takeaway';
  items: Item[];
  subtotal: number;
  delivery_fee: number;
  total: number;
  payment_method: 'cash' | 'mbway' | 'card';
  status: 'pending' | 'preparing' | 'delivering' | 'done';
  acknowledged: boolean;
  note?: string | null;
  order_note?: string | null;
  obs?: string | null;
};

const STATUSES: Order['status'][] = ['pending', 'preparing', 'delivering', 'done'];

/* ================== Página ================== */
export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | Order['status']>('all');

  // IDs de pedidos novos que chegaram via realtime — usados para animação de shake
  const [newIds, setNewIds] = useState<Set<string>>(new Set());

  // refs de cartões para scroll
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const setCardRef = (id: string) => (el: HTMLDivElement | null) => {
    if (el) cardRefs.current.set(id, el);
    else cardRefs.current.delete(id);
  };
  const scrollToOrder = (id: string) => {
    const el = cardRefs.current.get(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  /* ---- fetch + realtime ---- */
  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);
    if (!error && data) setOrders(data as unknown as Order[]);
    setLoading(false);
  };

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const lastEventAt = useRef<number>(Date.now());

  const openRealtime = () => {
    if (channelRef.current) supabase.removeChannel(channelRef.current);

    const ch = supabase.channel('orders-rt');

    ch.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'orders' },
      (p) => {
        lastEventAt.current = Date.now();
        const row = p.new as any;

        if (p.eventType === 'INSERT') {
          if (row.status === 'pending' && !row.acknowledged) {
            // Add to shaking set, scroll to it, remove shake after animation
            setNewIds((prev) => new Set([...prev, row.id]));
            setTimeout(() => scrollToOrder(row.id), 50);
            setTimeout(() => {
              setNewIds((prev) => {
                const next = new Set(prev);
                next.delete(row.id);
                return next;
              });
            }, 8000);
          }
          setOrders((prev) => {
            if (prev.find((o) => o.id === row.id)) return prev;
            return [row as Order, ...prev];
          });
          return;
        }

        if (p.eventType === 'UPDATE') {
          if (row.acknowledged || row.status !== 'pending') {
            setNewIds((prev) => {
              const next = new Set(prev);
              next.delete(row.id);
              return next;
            });
          }
          setOrders((prev) => prev.map((o) => (o.id === row.id ? (row as Order) : o)));
          return;
        }

        if (p.eventType === 'DELETE') {
          const oldRow = p.old as any;
          setNewIds((prev) => {
            const next = new Set(prev);
            next.delete(oldRow?.id);
            return next;
          });
          setOrders((prev) => prev.filter((o) => o.id !== oldRow?.id));
        }
      }
    );

    ch.subscribe((status) => {
      if (status === 'SUBSCRIBED') lastEventAt.current = Date.now();
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        setTimeout(openRealtime, 1200);
      }
    });

    channelRef.current = ch;
  };

  useEffect(() => {
    (async () => {
      await fetchOrders();
      openRealtime();
    })().catch(console.error);

    const onVis = () => {
      if (document.visibilityState === 'visible') fetchOrders();
    };
    const onFocus = () => fetchOrders();
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('focus', onFocus);

    const poll = window.setInterval(() => {
      if (Date.now() - lastEventAt.current > 15000) fetchOrders();
    }, 5000);

    return () => {
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('focus', onFocus);
      window.clearInterval(poll);
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, []);

  /* ---- sound (any unacknowledged pending order triggers the alarm) ---- */
  const hasAlerts = useMemo(
    () => orders.some((o) => o.status === 'pending' && !o.acknowledged),
    [orders]
  );
  const { soundEnabled, soundBlocked, toggleSound } = useOrderSounds(hasAlerts);

  /* ---- ações ---- */
  const updateStatus = async (id: string, status: Order['status']) => {
    try {
      setSavingId(id);
      setErrMsg(null);
      const patch: Record<string, unknown> = { status };
      // Moving out of pending acknowledges automatically
      if (status !== 'pending') patch.acknowledged = true;
      const { error } = await supabase.from('orders').update(patch).eq('id', id);
      if (error) throw error;
      await fetchOrders();
    } catch (e: any) {
      console.error(e);
      setErrMsg(e?.message || 'Falhou a atualização do estado.');
    } finally {
      setSavingId(null);
    }
  };

  const markSeen = async (id: string) => {
    try {
      setSavingId(id);
      setErrMsg(null);
      const { error } = await supabase
        .from('orders')
        .update({ acknowledged: true })
        .eq('id', id);
      if (error) throw error;
      setNewIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      await fetchOrders();
    } catch (e: any) {
      console.error(e);
      setErrMsg(e?.message || 'Falhou ao marcar como visto.');
    } finally {
      setSavingId(null);
    }
  };

  /* ---- derivado ---- */
  const filtered = useMemo(
    () => (filter === 'all' ? orders : orders.filter((o) => o.status === filter)),
    [orders, filter]
  );

  const StatusBtn = ({
    active,
    onClick,
    children,
    disabled,
  }: {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
    disabled?: boolean;
  }) => (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`px-5 py-3 rounded-xl text-base font-semibold transition shadow-sm ${
        active
          ? 'bg-buns-yellow text-black shadow-[0_0_0_2px_rgba(0,0,0,0.2)]'
          : 'bg-white/10 text-white hover:bg-white/20 disabled:opacity-50'
      }`}
    >
      {children}
    </button>
  );

  const getOrderLevelNote = (o: Order): string | null => {
    return (o.note || o.order_note || o.obs || '')?.toString()?.trim() || null;
  };

  const ItemExtras = ({ item }: { item: Item }) => {
    const note = item.note || item.options?.note;
    const fries = item.options?.fries;
    const drink = item.options?.drink;
    const ingredients = item.options?.ingredients;

    return (
      <>
        <div className="mt-1 flex flex-wrap gap-1 text-xs">
          {item.variant && (
            <span className="px-2 py-0.5 rounded-full bg-white/10 border border-white/10">
              {item.variant}
            </span>
          )}
          {fries && (
            <span className="px-2 py-0.5 rounded-full bg-white/10 border border-white/10">
              Batata: {fries}
            </span>
          )}
          {drink && (
            <span className="px-2 py-0.5 rounded-full bg-white/10 border border-white/10">
              Bebida: {drink}
            </span>
          )}
          {ingredients && ingredients.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-white/10 border border-white/10">
              Ing.: {ingredients.join(', ')}
            </span>
          )}
        </div>

        {note && note.trim() !== '' && (
          <div className="mt-2 rounded-xl border px-3 py-2 text-sm bg-orange-500/15 border-orange-500/30 text-orange-200">
            📝 <span className="font-semibold">Nota do item:</span> {note}
          </div>
        )}
      </>
    );
  };

  /* ---- render ---- */
  return (
    <main className="container mx-auto px-4 py-8 text-white">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-3xl font-display">Pedidos (Admin)</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={toggleSound}
            className={`btn ${soundEnabled ? 'btn-primary' : 'btn-ghost'}`}
            aria-pressed={soundEnabled}
          >
            {soundEnabled ? '🔊 Som ativo' : '🔈 Ativar som'}
          </button>
          <button
            className="btn btn-ghost"
            onClick={() => setNewIds(new Set())}
            title="Remove o destaque visual atual"
          >
            🔕 Fechar destaque
          </button>
        </div>
      </div>

      {/* Sound blocked banner */}
      {soundBlocked && (
        <div className="mt-3 flex items-center gap-3 rounded-xl bg-red-500/20 border border-red-500/40 px-4 py-3 text-red-200 flex-wrap">
          <span className="text-sm font-medium flex-1">
            🔇 Som bloqueado pelo browser — clica em <strong>Ativar Som</strong> para receber alertas de áudio.
          </span>
          <button
            onClick={toggleSound}
            className="px-4 py-2 rounded-lg bg-buns-yellow text-black text-sm font-black shrink-0"
          >
            🔊 Ativar Som
          </button>
        </div>
      )}

      {/* filtros */}
      <div className="flex gap-2 mt-4 flex-wrap">
        <button
          onClick={() => setFilter('all')}
          className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-ghost'}`}
        >
          Todos ({orders.length})
        </button>
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`btn ${filter === s ? 'btn-primary' : 'btn-ghost'}`}
          >
            {s === 'pending'
              ? 'Pendentes'
              : s === 'preparing'
              ? 'Em prep.'
              : s === 'delivering'
              ? 'A caminho'
              : 'Entregues'}{' '}
            ({orders.filter((o) => o.status === s).length})
          </button>
        ))}
      </div>

      {errMsg && <p className="text-red-400 mt-3">{errMsg}</p>}
      {loading && <p className="text-white/70 mt-4">A carregar…</p>}
      {!loading && filtered.length === 0 && <p className="mt-4">Sem pedidos neste filtro.</p>}

      <div className="grid gap-4 mt-6">
        {filtered.map((o) => {
          const orderNote = getOrderLevelNote(o);
          const isAttention = o.status === 'pending' && !o.acknowledged;
          const isShaking = newIds.has(o.id);

          return (
            <div
              key={o.id}
              ref={setCardRef(o.id)}
              className={`card p-5 border transition-shadow relative
                ${isAttention
                  ? 'border-red-500/50 ring-4 ring-red-500/50 shadow-[0_0_48px_rgba(239,68,68,0.3)]'
                  : 'border-white/10'}
                ${isShaking ? 'animate-[shake_0.6s_ease]' : ''}
                ${isAttention ? 'pb-28' : ''}`}
            >
              {/* NEW ORDER badge + timestamp */}
              {isAttention && (
                <div className="flex items-center gap-3 mb-3 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500 text-white text-sm font-black tracking-wide animate-pulse shadow-[0_0_16px_rgba(239,68,68,0.7)]">
                    🔔 NOVO PEDIDO
                  </span>
                  <time className="text-buns-yellow text-base font-bold tabular-nums">
                    {new Date(o.created_at).toLocaleTimeString('pt-PT', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </time>
                </div>
              )}

              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h2 className="text-xl font-semibold">
                    #{o.id.slice(0, 8)} — {o.name} ({o.phone})
                  </h2>
                  <p className="text-white/70 text-sm mt-1">
                    {o.address} — {o.order_type === 'takeaway' ? 'Levantamento' : o.zone}
                  </p>
                </div>
                {!isAttention && (
                  <time className="text-sm text-white/60 tabular-nums">
                    {new Date(o.created_at).toLocaleString('pt-PT')}
                  </time>
                )}
              </div>

              <div className="flex items-center gap-2 mt-3 text-sm text-white/70 flex-wrap">
                <span
                  className={`px-3 py-1 rounded-full border capitalize ${
                    o.status === 'pending'
                      ? 'bg-buns-yellow/15 border-buns-yellow/40 text-buns-yellow'
                      : 'bg-white/10 border-white/10 text-white/80'
                  }`}
                >
                  {o.status}
                </span>
                <span className="px-3 py-1 rounded-full bg-white/10 border border-white/10">
                  {(o.order_type || 'delivery').toUpperCase()}
                </span>
                <span className="px-3 py-1 rounded-full bg-white/10 border border-white/10">
                  {o.items?.length || 0} item(s)
                </span>
              </div>

              {o.items?.length > 0 && (
                <ul className="mt-3 space-y-2">
                  {o.items.map((it, i) => (
                    <li key={i} className="pb-2 border-b border-white/5 last:border-0">
                      <div className="text-buns-yellow text-xl font-extrabold tracking-wide drop-shadow-[0_1px_0_rgba(0,0,0,0.6)]">
                        • {it.name} × {it.qty}
                        <span className="text-white/80 text-base font-semibold ml-2">
                          — €{(it.qty * it.price).toFixed(2)}
                        </span>
                      </div>
                      <ItemExtras item={it} />
                    </li>
                  ))}
                </ul>
              )}

              {orderNote && (
                <div className="mt-3 rounded-xl border px-4 py-3 text-base bg-orange-500/15 border-orange-500/30 text-orange-200">
                  🧾 <span className="font-semibold">Nota do pedido:</span> {orderNote}
                </div>
              )}

              <div className="mt-4 flex items-center justify-between flex-wrap gap-3">
                <div className="flex flex-wrap gap-2">
                  <StatusBtn
                    disabled={savingId === o.id}
                    active={o.status === 'pending'}
                    onClick={() => updateStatus(o.id, 'pending')}
                  >
                    Pending
                  </StatusBtn>
                  <StatusBtn
                    disabled={savingId === o.id}
                    active={o.status === 'preparing'}
                    onClick={() => updateStatus(o.id, 'preparing')}
                  >
                    Em preparação
                  </StatusBtn>
                  <StatusBtn
                    disabled={savingId === o.id}
                    active={o.status === 'delivering'}
                    onClick={() => updateStatus(o.id, 'delivering')}
                  >
                    A caminho
                  </StatusBtn>
                  <StatusBtn
                    disabled={savingId === o.id}
                    active={o.status === 'done'}
                    onClick={() => updateStatus(o.id, 'done')}
                  >
                    Entregue
                  </StatusBtn>
                </div>

                <div className="text-buns-yellow font-bold text-lg">
                  Total: €{o.total.toFixed(2)}
                </div>
              </div>

              {/* Acknowledge button — only when pending and unread */}
              {isAttention && (
                <div className="pointer-events-none">
                  <div className="absolute inset-x-0 bottom-0 px-4 pb-4">
                    <button
                      onClick={() => markSeen(o.id)}
                      disabled={savingId === o.id}
                      className="pointer-events-auto w-full py-5 rounded-2xl
                                 bg-buns-yellow text-black text-2xl font-black
                                 shadow-[0_12px_32px_rgba(255,214,10,0.35)]
                                 border-4 border-black/20
                                 animate-[wiggle_1.2s_ease-in-out_infinite]
                                 hover:scale-[1.01] transition
                                 disabled:opacity-60"
                      title="Aceitar pedido e parar alarme"
                    >
                      👀 ACEITAR PEDIDO
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <style jsx global>{`
        @keyframes wiggle {
          0%, 100% { transform: translateX(0) rotate(0deg); }
          15%       { transform: translateX(-2px) rotate(-0.4deg); }
          30%       { transform: translateX(2px) rotate(0.4deg); }
          45%       { transform: translateX(-2px) rotate(-0.3deg); }
          60%       { transform: translateX(2px) rotate(0.3deg); }
          75%       { transform: translateX(-1px) rotate(-0.2deg); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%       { transform: translateX(-10px); }
          20%       { transform: translateX(10px); }
          30%       { transform: translateX(-10px); }
          40%       { transform: translateX(10px); }
          50%       { transform: translateX(-5px); }
          60%       { transform: translateX(5px); }
          70%       { transform: translateX(-3px); }
          80%       { transform: translateX(3px); }
          90%       { transform: translateX(-1px); }
        }
      `}</style>
    </main>
  );
}
