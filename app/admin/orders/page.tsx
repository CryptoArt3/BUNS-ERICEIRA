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
  const armedRef = useRef(false);

  // Lê preferência gravada
  useEffect(() => {
    const saved =
      typeof window !== 'undefined'
        ? localStorage.getItem('buns_admin_sound')
        : null;
    if (saved) setEnabled(saved === '1');
  }, []);

  // Grava e notifica
  useEffect(() => {
    if (typeof window !== 'undefined')
      localStorage.setItem('buns_admin_sound', enabled ? '1' : '0');
    onChange?.(enabled);
  }, [enabled, onChange]);

  // "Prime" de áudio: tenta desbloquear assim que o utilizador faz 1º gesto
  useEffect(() => {
    if (!enabled || armedRef.current) return;

    const armAudio = async () => {
      try {
        const a = new Audio();
        // 1 frame de WAV silencioso só para abrir o contexto
        a.src =
          'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABYAAAAAAABAAAA';
        await a.play().catch(() => {});
        armedRef.current = true;
      } catch {}
    };

    const onFirstGesture = () => {
      armAudio();
      document.removeEventListener('pointerdown', onFirstGesture, { capture: true } as any);
      document.removeEventListener('keydown', onFirstGesture, { capture: true } as any);
    };

    // Se o browser bloquear autoplay, desbloqueamos no 1º gesto
    document.addEventListener('pointerdown', onFirstGesture, { once: true, capture: true } as any);
    document.addEventListener('keydown', onFirstGesture, { once: true, capture: true } as any);

    return () => {
      document.removeEventListener('pointerdown', onFirstGesture, { capture: true } as any);
      document.removeEventListener('keydown', onFirstGesture, { capture: true } as any);
    };
  }, [enabled]);

  const toggle = () => setEnabled((v) => !v);

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

/* ================== sons utilitários ================== */
function playOnce(srcs: string[], fallbackFreq?: number) {
  const tryPlay = (i: number) => {
    if (i >= srcs.length) {
      if (fallbackFreq) makeBeep(fallbackFreq);
      return;
    }
    const a = new Audio(srcs[i]);
    a.play().catch(() => tryPlay(i + 1));
  };
  tryPlay(0);
}
function makeBeep(freq = 880, duration = 0.18) {
  try {
    const ctx = new (window.AudioContext ||
      (window as any).webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.22, ctx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    o.connect(g).connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + duration);
    setTimeout(() => void ctx.close(), (duration + 0.1) * 1000);
  } catch {}
}

/* ================== Tipos ================== */
type ItemOptions = {
  note?: string | null;
  fries?: string | null; // 'normal' | 'doce'
  drink?: string | null; // ex.: 'Coca-Cola', 'Água'
  ingredients?: string[] | null; // ingredientes removidos / escolhidos
} | null;

type Item = {
  id: string;
  name: string;
  qty: number;
  price: number;
  note?: string | null; // nota direta do item (textarea do carrinho)
  variant?: string | null; // 'burger' | 'menu'
  options?: ItemOptions; // struct de opções
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

const STATUSES: Order['status'][] = [
  'pending',
  'preparing',
  'delivering',
  'done',
];

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

  /* ---- alarmes por pedido ---- */
  const alarmTimers = useRef<Map<string, number>>(new Map());
  const startAlarm = (id: string) => {
    if (!sound) return;
    if (alarmTimers.current.has(id)) return;
    playOnce(['/sounds/new-order.wav'], 1046.5);
    const interval = window.setInterval(() => {
      playOnce(['/sounds/new-order.wav'], 1046.5);
    }, 4000);
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

  /* ---- subscrição realtime (sem refresh) ---- */
  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      await fetchOrders(); // 1º load

      // Canal dedicado com INSERT + UPDATE
      const channel = supabase
        .channel('orders-rt')
        // INSERTs
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'orders' },
          (payload) => {
            const row = payload.new as any as Order;

            // optimista: coloca no topo sem novo fetch
            setOrders((prev) => {
              // evita duplicado se já existir
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
        // UPDATEs
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
              if (newS === 'preparing')
                playOnce(['/sounds/preparing.wav'], 740);
              if (newS === 'done' || newS === 'delivering')
                playOnce(['/sounds/delivered.wav'], 523.25);
            }
            if (newS !== 'pending' || row.acknowledged) {
              stopAlarm(row.id);
            }
          }
        )
        .subscribe((status) => {
          // útil para debug
          // console.log('realtime status:', status);
        });

      // cleanup
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
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', id);
      if (error) throw error;
      // Não fazemos fetch — o realtime UPDATE já atualiza a UI
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
      // Realtime atualiza a UI
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

  /* ---- helpers UI para opções/nota ---- */
  const ItemExtras = ({ item }: { item: Item }) => {
    const note = item.note || item.options?.note;
    const fries = item.options?.fries;
    const drink = item.options?.drink;
    const ingredients = item.options?.ingredients;

    return (
      <>
        {/* badges pequenas */}
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

        {/* NOTA — destaque em laranja */}
        {note && note.trim() !== '' && (
          <div className="mt-2 rounded-xl border px-4 py-3 text-lg bg-orange-500/15 border-orange-500/30 text-orange-200">
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
