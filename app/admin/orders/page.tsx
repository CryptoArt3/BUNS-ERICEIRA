'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

/* ================== Toggle som (preferência) ================== */
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

  return (
    <button
      onClick={() => setEnabled((v) => !v)}
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
  const [sound, setSound] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('buns_admin_sound') === '1';
  });

  /* --------- Áudio: refs + prime --------- */
  const newOrderRef = useRef<HTMLAudioElement | null>(null);
  const preparingRef = useRef<HTMLAudioElement | null>(null);
  const deliveredRef = useRef<HTMLAudioElement | null>(null);
  const armedRef = useRef(false);

  // Prime: no primeiro gesto do utilizador, toca com volume 0 e pausa — desbloqueia autoplay
  useEffect(() => {
    if (!sound || armedRef.current) return;

    const prime = async () => {
      const elms = [newOrderRef.current, preparingRef.current, deliveredRef.current].filter(
        Boolean
      ) as HTMLAudioElement[];
      try {
        for (const a of elms) {
          a.volume = 0;
          await a.play().catch(() => {});
          await new Promise((r) => setTimeout(r, 50));
          a.pause();
          a.currentTime = 0;
          a.volume = 1;
        }
        armedRef.current = true;
      } catch {
        // ignorar
      }
    };

    const onFirstGesture = () => {
      prime();
      document.removeEventListener('pointerdown', onFirstGesture, { capture: true } as any);
      document.removeEventListener('keydown', onFirstGesture, { capture: true } as any);
    };

    document.addEventListener('pointerdown', onFirstGesture, { once: true, capture: true } as any);
    document.addEventListener('keydown', onFirstGesture, { once: true, capture: true } as any);

    return () => {
      document.removeEventListener('pointerdown', onFirstGesture, { capture: true } as any);
      document.removeEventListener('keydown', onFirstGesture, { capture: true } as any);
    };
  }, [sound]);

  // Helpers para tocar os sons
  const playNewOrder = () => {
    if (!sound || !newOrderRef.current) return;
    // Garante que toca sempre desde o início
    newOrderRef.current.currentTime = 0;
    newOrderRef.current.play().catch(() => {});
  };
  const playPreparing = () => {
    if (!sound || !preparingRef.current) return;
    preparingRef.current.currentTime = 0;
    preparingRef.current.play().catch(() => {});
  };
  const playDelivered = () => {
    if (!sound || !deliveredRef.current) return;
    deliveredRef.current.currentTime = 0;
    deliveredRef.current.play().catch(() => {});
  };

  /* ---- alarmes por pedido (loop até "visto" ou sair de pending) ---- */
  const alarmTimers = useRef<Map<string, number>>(new Map());
  const startAlarm = (id: string) => {
    if (!sound) return;
    if (alarmTimers.current.has(id)) return;
    playNewOrder(); // toca já à entrada
    const interval = window.setInterval(() => playNewOrder(), 4000);
    alarmTimers.current.set(id, interval);
  };
  const stopAlarm = (id: string) => {
    const t = alarmTimers.current.get(id);
    if (t) {
      window.clearInterval(t);
      alarmTimers.current.delete(id);
    }
  };
  const stopAll = () => {
    alarmTimers.current.forEach((t) => window.clearInterval(t));
    alarmTimers.current.clear();
  };
  useEffect(() => () => stopAll(), []);

  /* ---- fetch inicial ---- */
  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);
    if (!error && data) setOrders(data as unknown as Order[]);
    setLoading(false);
  };

  /* ---- realtime (INSERT/UPDATE) sem refresh ---- */
  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      await fetchOrders();

      const channel = supabase
        .channel('orders-rt')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'orders' },
          (payload) => {
            const row = payload.new as any as Order;

            setOrders((prev) => {
              if (prev.find((p) => p.id === row.id)) return prev;
              return [row, ...prev].sort((a, b) =>
                a.created_at > b.created_at ? -1 : 1
              );
            });

            if (row.status === 'pending' && !row.acknowledged) {
              setNewId(row.id);
              startAlarm(row.id);
              setTimeout(() => setNewId(null), 8000);
            }
          }
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'orders' },
          (payload) => {
            const row = payload.new as any as Order;
            const old = payload.old as any as Order | null;

            setOrders((prev) =>
              prev.map((o) => (o.id === row.id ? { ...o, ...row } : o))
            );

            const oldS = old?.status;
            const newS = row.status;

            if (oldS !== newS) {
              if (newS === 'preparing') playPreparing();
              if (newS === 'done' || newS === 'delivering') playDelivered();
            }
            if (newS !== 'pending' || row.acknowledged) {
              stopAlarm(row.id);
            }
          }
        )
        .subscribe();

      return () => {
        if (mounted) supabase.removeChannel(channel);
      };
    };

    bootstrap();
    return () => {
      mounted = false;
    };
  }, [sound]);

  /* ---- ações ---- */
  const updateStatus = async (id: string, status: Order['status']) => {
    try {
      setSavingId(id);
      setErrMsg(null);
      const { error } = await supabase.from('orders').update({ status }).eq('id', id);
      if (error) throw error;
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
      stopAlarm(id);
      const { error } = await supabase
        .from('orders')
        .update({ acknowledged: true })
        .eq('id', id);
      if (error) throw error;
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
      className={`px-5 py-2 rounded-xl text-base font-semibold transition ${
        active
          ? 'bg-buns-yellow text-black'
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
        <div className="mt-1 flex flex-wrap gap-2 text-sm">
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
          <div className="mt-2 rounded-xl border px-4 py-3 text-lg bg-orange-500/15 border-orange-500/30 text-orange-200">
            📝 <span className="font-semibold">Nota:</span> {note}
          </div>
        )}
      </>
    );
  };

  return (
    <main className="container mx-auto px-4 py-8 text-white">
      {/* Áudio escondido — pré-carregado */}
      <audio ref={newOrderRef} src="/sounds/new-order.wav" preload="auto" />
      <audio ref={preparingRef} src="/sounds/preparing.wav" preload="auto" />
      <audio ref={deliveredRef} src="/sounds/delivered.wav" preload="auto" />

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-4xl font-display">Pedidos (Admin)</h1>
        <div className="flex items-center gap-2">
          <SoundToggle
            onChange={(v) => {
              setSound(v);
              if (!v) stopAll();
            }}
          />
          <button className="btn btn-ghost" onClick={stopAll}>
            🔕 Silenciar todos
          </button>
        </div>
      </div>

      {/* filtros */}
      <div className="flex gap-2 mt-3">
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
            className={`card p-6 border border-white/10 transition ${
              newId === o.id ? 'ring-2 ring-buns-yellow/60' : ''
            } ${o.status === 'pending' && !o.acknowledged ? 'animate-pulse' : ''}`}
          >
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h2 className="text-2xl font-extrabold">
                  #{o.id.slice(0, 8)} — {o.name} ({o.phone})
                </h2>
                <p className="text-white/70 text-lg mt-1">
                  {o.address} — {o.order_type === 'takeaway' ? 'Levantamento' : o.zone}
                </p>
              </div>
              <span className="text-base text-white/60">
                {new Date(o.created_at).toLocaleString()}
              </span>
            </div>

            <div className="flex items-center gap-2 mt-3 text-base text-white/70 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-white/10 border border-white/10 capitalize">
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
              <ul className="mt-4 space-y-3">
                {o.items.map((it, i) => (
                  <li
                    key={i}
                    className="pb-3 border-b border-white/5 last:border-0 text-2xl font-extrabold text-buns-yellow"
                  >
                    <div>
                      • {it.name} × {it.qty}{' '}
                      <span className="text-white/80 text-xl font-semibold">
                        — €{(it.qty * it.price).toFixed(2)}
                      </span>
                    </div>
                    <ItemExtras item={it} />
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-5 flex items-center justify-between flex-wrap gap-3">
              <div className="flex flex-wrap gap-3">
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
                <div className="text-buns-yellow font-extrabold text-3xl">
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
