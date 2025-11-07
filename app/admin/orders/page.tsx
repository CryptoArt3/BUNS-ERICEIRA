// app/admin/orders/page.tsx
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

/* ================== UI: toggle som ================== */
function SoundToggle({
  onChange,
  className = '',
}: {
  onChange?: (enabled: boolean) => void;
  className?: string;
}) {
  const [enabled, setEnabled] = useState<boolean>(false);

  useEffect(() => {
    const saved =
      typeof window !== 'undefined'
        ? localStorage.getItem('buns_admin_sound')
        : null;
    if (saved) setEnabled(saved === '1');
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined')
      localStorage.setItem('buns_admin_sound', enabled ? '1' : '0');
    onChange?.(enabled);
  }, [enabled, onChange]);

  const primeAutoplay = async () => {
    try {
      // pequeno click para desbloquear autoplay nos browsers
      const a = new Audio();
      a.src =
        'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABYAAAAAAABAAAA';
      await a.play().catch(() => {});
    } catch {}
  };

  const toggle = async () => {
    if (!enabled) await primeAutoplay();
    setEnabled((v) => !v);
  };

  return (
    <button
      onClick={toggle}
      className={`btn ${enabled ? 'btn-primary' : 'btn-ghost'} ${className}`}
      aria-pressed={enabled}
    >
      {enabled ? '🔊 Som ativo' : '🔈 Ativar som'}
    </button>
  );
}

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

/* ================== Página ================== */
export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | Order['status']>('all');
  const [newId, setNewId] = useState<string | null>(null);

  // som ligado/desligado
  const [sound, setSound] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('buns_admin_sound') === '1';
  });

  // ======== Áudio (beep) com fallback ========
  const audioCtxRef = useRef<AudioContext | null>(null);
  const unlockedRef = useRef(false);
  const wavRef = useRef<HTMLAudioElement | null>(null);

  const ensureAudio = async () => {
    if (!sound) return;
    if (!audioCtxRef.current) {
      try {
        audioCtxRef.current =
          new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch {
        audioCtxRef.current = null;
      }
    }
    try {
      await audioCtxRef.current?.resume();
      // arm beep (inaudível) para desbloquear
      const ctx = audioCtxRef.current!;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      g.gain.value = 0;
      o.connect(g).connect(ctx.destination);
      o.start();
      o.stop(ctx.currentTime + 0.01);
      unlockedRef.current = true;
    } catch {
      unlockedRef.current = false;
    }
    if (!wavRef.current) {
      const a = new Audio('/sounds/new-order.wav'); // <-- garante que existe
      a.preload = 'auto';
      (a as any).playsInline = true;
      wavRef.current = a;
      try {
        await a.load();
      } catch {}
    }
  };

  const testBeep = () => {
    // toca pequeno beep quando liga o toggle (confirma som ativo)
    if (!sound) return;
    if (audioCtxRef.current && unlockedRef.current) {
      try {
        const ctx = audioCtxRef.current;
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sine';
        o.frequency.value = 880;
        g.gain.setValueAtTime(0.0001, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.18);
        o.connect(g).connect(ctx.destination);
        o.start();
        o.stop(ctx.currentTime + 0.2);
        return;
      } catch {}
    }
    if (wavRef.current) {
      wavRef.current.currentTime = 0;
      wavRef.current.play().catch(() => {});
    }
  };

  // ======== Alarme Global (apenas pára ao "Marcar como visto") ========
  const alarmIntervalRef = useRef<number | null>(null);
  const alarmingOrderIdRef = useRef<string | null>(null); // qual pedido está a tocar

  const startAlarmFor = (orderId: string) => {
    if (!sound) return;
    if (document.visibilityState !== 'visible') return; // evita tocar quando o tab está escondido
    // se já estamos a tocar para este pedido, não duplica
    if (alarmIntervalRef.current != null && alarmingOrderIdRef.current === orderId) return;

    // se estava a tocar para outro pedido, pára e troca
    if (alarmIntervalRef.current != null && alarmingOrderIdRef.current !== orderId) {
      window.clearInterval(alarmIntervalRef.current);
      alarmIntervalRef.current = null;
    }

    alarmingOrderIdRef.current = orderId;

    // toca já
    testBeep();
    // loop de 4s
    alarmIntervalRef.current = window.setInterval(() => testBeep(), 4000);
  };

  const stopAlarmIfMatches = (orderId: string) => {
    if (alarmingOrderIdRef.current === orderId && alarmIntervalRef.current != null) {
      window.clearInterval(alarmIntervalRef.current);
      alarmIntervalRef.current = null;
      alarmingOrderIdRef.current = null;
    }
  };

  const stopAll = () => {
    if (alarmIntervalRef.current != null) {
      window.clearInterval(alarmIntervalRef.current);
      alarmIntervalRef.current = null;
    }
    alarmingOrderIdRef.current = null;
  };

  // quando muda o toggle do som
  const handleToggleSound = async (enabled: boolean) => {
    setSound(enabled);
    if (!enabled) {
      stopAll();
      return;
    }
    await ensureAudio();
    testBeep(); // beep de confirmação ao ligar
  };

  // ======== Fetch + Realtime ========
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
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    const ch = supabase.channel('orders-rt');

    ch.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'orders' },
      (p) => {
        lastEventAt.current = Date.now();
        const row = p.new as any;

        setOrders((prev) => {
          if (p.eventType === 'INSERT') {
            // NOVA ENCOMENDA: toca até alguém marcar como visto
            if (row.status === 'pending' && !row.acknowledged) {
              setNewId(row.id);
              startAlarmFor(row.id);
              setTimeout(() => setNewId(null), 8000);
            }
            if (prev.find((o) => o.id === row.id)) return prev;
            return [row as Order, ...prev];
          }

          if (p.eventType === 'UPDATE') {
            // Não paramos o som aqui (só ao "Marcar como visto")
            const next = prev.map((o) => (o.id === row.id ? (row as Order) : o));
            return next;
          }

          if (p.eventType === 'DELETE') {
            // Se por acaso apagarem, cala só se for o mesmo pedido
            stopAlarmIfMatches(row?.id);
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
      stopAll();
    };
  }, [sound]);

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

      // pára o som *imediatamente* se o alarme pertence a este pedido
      stopAlarmIfMatches(id);

      const { error } = await supabase
        .from('orders')
        .update({ acknowledged: true })
        .eq('id', id);
      if (error) throw error;
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
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-3xl font-display">Pedidos (Admin)</h1>
        <div className="flex items-center gap-2">
          <SoundToggle
            onChange={async (enabled) => {
              await handleToggleSound(enabled);
            }}
          />
          <button className="btn btn-ghost" onClick={stopAll}>
            🔕 Silenciar todos
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
      {!loading && filtered.length === 0 && (
        <p className="mt-4">Sem pedidos neste filtro.</p>
      )}

      <div className="grid gap-4 mt-6">
        {filtered.map((o) => (
          <div
            key={o.id}
            className={`card p-5 border border-white/10 transition ${
              newId === o.id
                ? 'ring-2 ring-buns-yellow/60 shadow-[0_0_40px_rgba(255,214,10,0.25)]'
                : ''
            } ${o.status === 'pending' && !o.acknowledged ? 'animate-pulse' : ''}`}
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
                    <ItemExtras item={it} />
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
                    title="Pára o alarme deste pedido"
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
