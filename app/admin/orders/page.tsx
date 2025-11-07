'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

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
};

const STATUSES: Order['status'][] = ['pending', 'preparing', 'delivering', 'done'];

/* ================== Wake Lock helper ================== */
async function requestWakeLock(): Promise<WakeLockSentinel | null> {
  try {
    // @ts-ignore
    if ('wakeLock' in navigator) {
      // @ts-ignore
      return await navigator.wakeLock.request('screen');
    }
  } catch {}
  return null;
}

/* ================== ALERTA (overlay) ================== */
function NewOrderAlert({
  order,
  onClose,
  onMarkSeen,
}: {
  order: Order | null;
  onClose: () => void;
  onMarkSeen: (id: string) => Promise<void>;
}) {
  // título a piscar
  useEffect(() => {
    if (!order) return;
    const original = document.title;
    let flag = false;
    const t = window.setInterval(() => {
      flag = !flag;
      document.title = flag ? '🟡 NOVO PEDIDO! — BUNS Admin' : original;
    }, 800);
    return () => {
      window.clearInterval(t);
      document.title = original;
    };
  }, [order]);

  // vibração curta (se suportado)
  useEffect(() => {
    if (!order) return;
    try {
      if ('vibrate' in navigator) navigator.vibrate(200);
    } catch {}
  }, [order]);

  // manter ecrã ligado enquanto alerta estiver aberto
  useEffect(() => {
    let sentinel: WakeLockSentinel | null = null;
    let cancelled = false;
    (async () => {
      if (!order) return;
      sentinel = await requestWakeLock();
      if (cancelled && sentinel) {
        try { await sentinel.release(); } catch {}
      }
    })();
    return () => {
      cancelled = true;
      if (sentinel) {
        try { sentinel.release(); } catch {}
      }
    };
  }, [order]);

  if (!order) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center">
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* caixa a piscar */}
      <div className="relative mx-4 max-w-3xl w-full">
        <div className="animate-[pulse_1.2s_infinite] rounded-3xl border-4 border-buns-yellow bg-[#141A0F] shadow-[0_0_60px_rgba(255,214,10,0.35)]">
          <div className="p-7">
            <div className="text-3xl md:text-4xl font-extrabold text-buns-yellow mb-2">
              🟡 Novo pedido!
            </div>
            <div className="text-white/90 text-lg mb-1">
              <span className="font-semibold">#{order.id.slice(0, 8)}</span> —{' '}
              <span className="font-semibold">{order.name}</span> ({order.phone})
            </div>
            <div className="text-white/70 mb-4">
              {order.address} — {order.order_type === 'takeaway' ? 'Levantamento' : order.zone}
            </div>

            <div className="rounded-xl bg-black/30 border border-white/10 p-4 mb-4">
              {order.items?.map((it, i) => (
                <div key={i} className="flex items-center justify-between text-white/90 text-lg">
                  <div className="font-bold">• {it.name} × {it.qty}</div>
                  <div>€{(it.qty * it.price).toFixed(2)}</div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between text-2xl font-extrabold text-buns-yellow">
              <div>Total</div>
              <div>€{order.total.toFixed(2)}</div>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                className="px-5 py-4 rounded-xl text-lg font-bold bg-buns-yellow text-black hover:brightness-95"
                onClick={() => onMarkSeen(order.id)}
              >
                👀 Marcar como visto
              </button>
              <button
                className="px-5 py-4 rounded-xl text-lg font-bold bg-white/10 text-white hover:bg-white/20"
                onClick={onClose}
              >
                Ir ao pedido
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================== Página ================== */
export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | Order['status']>('all');

  // alerta visual
  const [alertOrderId, setAlertOrderId] = useState<string | null>(null);
  const alertOrder = useMemo(
    () => orders.find((o) => o.id === alertOrderId) || null,
    [orders, alertOrderId]
  );

  // refs para dar scroll ao cartão do pedido
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

        setOrders((prev) => {
          if (p.eventType === 'INSERT') {
            if (row.status === 'pending' && !row.acknowledged) {
              setAlertOrderId(row.id); // abre overlay
            }
            if (prev.find((o) => o.id === row.id)) return prev;
            return [row as Order, ...prev];
          }

          if (p.eventType === 'UPDATE') {
            const updated = prev.map((o) => (o.id === row.id ? (row as Order) : o));
            // se este que está no overlay foi reconhecido, fecha
            if (alertOrderId === row.id && (row.acknowledged || row.status !== 'pending')) {
              setAlertOrderId(null);
            }
            return updated;
          }

          if (p.eventType === 'DELETE') {
            if (alertOrderId === row?.id) setAlertOrderId(null);
            return prev.filter((o) => o.id !== row?.id);
          }

          return prev;
        });
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

  /* ---- ações ---- */
  const updateStatus = async (id: string, status: Order['status']) => {
    try {
      setSavingId(id);
      setErrMsg(null);
      const { error } = await supabase.from('orders').update({ status }).eq('id', id);
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
      setAlertOrderId(null); // fecha overlay imediatamente
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
            📝 <span className="font-semibold">Nota:</span> {note}
          </div>
        )}
      </>
    );
  };

  /* ---- render ---- */
  return (
    <main className="container mx-auto px-4 py-8 text-white">
      {/* ALERTA OVERLAY */}
      <NewOrderAlert
        order={alertOrder}
        onClose={() => {
          if (alertOrderId) scrollToOrder(alertOrderId);
        }}
        onMarkSeen={markSeen}
      />

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-3xl font-display">Pedidos (Admin)</h1>
        <div className="flex items-center gap-2">
          {/* Já não precisamos do toggle de som; podes manter um "Silenciar todos" se quiseres */}
          <button
            className="btn btn-ghost"
            onClick={() => setAlertOrderId(null)}
            title="Fecha qualquer alerta aberto"
          >
            🔕 Fechar alerta
          </button>
        </div>
      </div>

      {/* filtros */}
      <div className="flex gap-2 mt-2">
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
        {filtered.map((o) => (
          <div
            key={o.id}
            ref={setCardRef(o.id)}
            className={`card p-5 border border-white/10 transition ${
              o.status === 'pending' && !o.acknowledged ? 'animate-pulse' : ''
            }`}
          >
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h2 className="text-xl font-semibold">
                  #{o.id.slice(0, 8)} — {o.name} ({o.phone})
                </h2>
                <p className="text-white/70 text-sm mt-1">
                  {o.address} — {o.order_type === 'takeaway' ? 'Levantamento' : o.zone}
                </p>
              </div>
              <span className="text-sm text-white/60">
                {new Date(o.created_at).toLocaleString()}
              </span>
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
              {o.status === 'pending' && !o.acknowledged && (
                <span className="px-3 py-1 rounded-full bg-red-500/20 border border-red-500/30 text-red-200">
                  Alarme ativo
                </span>
              )}
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
                  </li>
                ))}
              </ul>
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
                  Preparar
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

              <div className="flex items-center gap-2">
                {o.status === 'pending' && !o.acknowledged && (
                  <button
                    className="btn btn-primary"
                    disabled={savingId === o.id}
                    onClick={() => markSeen(o.id)}
                    title="Marca o pedido como visto (fecha o alerta, se aberto)"
                  >
                    👀 Marcar como visto
                  </button>
                )}
                <div className="text-buns-yellow font-bold text-lg">
                  Total: €{o.total.toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
