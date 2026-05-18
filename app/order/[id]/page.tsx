'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'

/* ─── Store config ───────────────────────────────────────── */
// Fill in the restaurant phone to show the "call" button, or leave empty to hide it.
const STORE_PHONE = ''
const STORE_ADDRESS = 'Calçada da Baleia 29A, Ericeira'

/* ─── Types ──────────────────────────────────────────────── */
type OrderStatus = 'pending' | 'preparing' | 'delivering' | 'done' | 'cancelled'

type OrderItem = {
  id: string
  name: string
  qty: number
  price: number
  variant?: string | null
  note?: string | null
}

type TrackedOrder = {
  id: string
  name: string
  status: OrderStatus
  order_type: string
  zone: string
  items: OrderItem[]
  subtotal: number
  delivery_fee: number
  total: number
  payment_method: string
  created_at: string
}

/* ─── Status config ──────────────────────────────────────── */
const STATUS_STYLE: Record<
  OrderStatus,
  { emoji: string; color: string; ring: string; bg: string }
> = {
  pending:    { emoji: '🎯', color: 'text-buns-yellow',  ring: 'ring-buns-yellow/40',  bg: 'bg-buns-yellow/8'  },
  preparing:  { emoji: '👨‍🍳', color: 'text-orange-400',  ring: 'ring-orange-400/40',  bg: 'bg-orange-400/8'   },
  delivering: { emoji: '🍔', color: 'text-teal-400',     ring: 'ring-teal-400/40',     bg: 'bg-teal-400/8'     },
  done:       { emoji: '✅', color: 'text-green-400',    ring: 'ring-green-400/40',    bg: 'bg-green-400/8'    },
  cancelled:  { emoji: '❌', color: 'text-red-400',      ring: 'ring-red-400/40',      bg: 'bg-red-400/8'      },
}

/* ─── Timeline ───────────────────────────────────────────── */
type TimelineStep = {
  status: OrderStatus
  takeawayLabel: string
  deliveryLabel: string
  takeawaySub: string
  deliverySub: string
}

const TIMELINE: TimelineStep[] = [
  {
    status: 'pending',
    takeawayLabel: 'Pedido recebido',
    deliveryLabel: 'Pedido recebido',
    takeawaySub: 'O teu pedido chegou à BUNS',
    deliverySub: 'O teu pedido chegou à BUNS',
  },
  {
    status: 'preparing',
    takeawayLabel: 'Em preparação',
    deliveryLabel: 'Em preparação',
    takeawaySub: 'A equipa está na chapa 🔥',
    deliverySub: 'A equipa está na chapa 🔥',
  },
  {
    status: 'delivering',
    takeawayLabel: 'Pronto para levantar',
    deliveryLabel: 'A caminho',
    takeawaySub: 'Dirige-te ao balcão — está quente!',
    deliverySub: 'O teu pedido está a caminho',
  },
  {
    status: 'done',
    takeawayLabel: 'Levantado',
    deliveryLabel: 'Entregue',
    takeawaySub: 'Bom proveito! 🤙',
    deliverySub: 'Bom proveito! 🤙',
  },
]

const PROGRESS_ORDER: OrderStatus[] = ['pending', 'preparing', 'delivering', 'done']

function statusIndex(s: OrderStatus) {
  return PROGRESS_ORDER.indexOf(s)
}

/* ─── Helpers ────────────────────────────────────────────── */
function currency(x: number) {
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(x)
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })
}

function isTakeawayOrder(order_type: string) {
  return (order_type ?? '').toUpperCase() === 'TAKEAWAY'
}

/* ─── Sub-components ─────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div className="card p-6 space-y-3 animate-pulse">
      <div className="h-4 bg-white/10 rounded w-32" />
      <div className="h-20 bg-white/10 rounded-2xl" />
      <div className="h-4 bg-white/10 rounded w-24" />
    </div>
  )
}

function StatusCard({ order }: { order: TrackedOrder }) {
  const style = STATUS_STYLE[order.status] ?? STATUS_STYLE.pending
  const isTakeaway = isTakeawayOrder(order.order_type)
  const isActive = order.status !== 'done' && order.status !== 'cancelled'

  const statusLabel: Record<OrderStatus, string> = {
    pending:    'Pedido recebido',
    preparing:  'Em preparação',
    delivering: isTakeaway ? 'Pronto para levantar' : 'A caminho',
    done:       isTakeaway ? 'Levantado' : 'Entregue',
    cancelled:  'Cancelado',
  }

  const statusSub: Record<OrderStatus, string> = {
    pending:    'A equipa vai aceitar em breve',
    preparing:  'O teu smash burger está na chapa 🔥',
    delivering: isTakeaway ? 'Dirige-te ao balcão para levantares' : 'O pedido está a caminho',
    done:       'Obrigado! Bom proveito 🤙',
    cancelled:  'Contacta a BUNS para mais informação',
  }

  return (
    <div
      className={`card p-6 sm:p-8 ring-2 ${style.ring} ${style.bg}
        flex flex-col items-center text-center gap-3
        ${isActive ? 'animate-pulse' : ''}`}
      style={{ animationDuration: '2.5s' }}
    >
      <span className="text-5xl sm:text-6xl" role="img" aria-label={statusLabel[order.status]}>
        {style.emoji}
      </span>
      <div>
        <p className={`text-xl sm:text-2xl font-bold ${style.color}`}>
          {statusLabel[order.status]}
        </p>
        <p className="text-white/60 text-sm mt-1">{statusSub[order.status]}</p>
      </div>
    </div>
  )
}

function Timeline({ order }: { order: TrackedOrder }) {
  if (order.status === 'cancelled') {
    return (
      <div className="card p-5 border-red-500/30 bg-red-500/5 space-y-1">
        <p className="text-red-400 font-semibold">❌ Pedido cancelado</p>
        <p className="text-white/60 text-sm">Contacta a BUNS para mais informação.</p>
      </div>
    )
  }

  const isTakeaway = isTakeawayOrder(order.order_type)
  const currentIdx = statusIndex(order.status)

  return (
    <div className="card p-5">
      <h2 className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-4">
        Estado do pedido
      </h2>
      <ol className="space-y-0" aria-label="Progresso do pedido">
        {TIMELINE.map((step, i) => {
          const isPast   = currentIdx > i
          const isActive = currentIdx === i
          const isFuture = currentIdx < i
          const isLast   = i === TIMELINE.length - 1
          const label    = isTakeaway ? step.takeawayLabel : step.deliveryLabel
          const sub      = isTakeaway ? step.takeawaySub   : step.deliverySub

          return (
            <li key={step.status} className="flex gap-4">
              {/* connector column */}
              <div className="flex flex-col items-center shrink-0">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-500
                    ${isPast   ? 'bg-buns-yellow/20 border-buns-yellow/50 text-buns-yellow'                   : ''}
                    ${isActive ? 'bg-buns-yellow border-buns-yellow text-black animate-pulse'                  : ''}
                    ${isFuture ? 'bg-white/5 border-white/15 text-white/30'                                   : ''}`}
                  aria-current={isActive ? 'step' : undefined}
                >
                  {isPast ? '✓' : i + 1}
                </div>
                {!isLast && (
                  <div
                    className={`w-0.5 flex-1 my-1 min-h-[28px] rounded-full transition-all duration-700
                      ${currentIdx > i ? 'bg-buns-yellow/40' : 'bg-white/10'}`}
                  />
                )}
              </div>

              {/* text */}
              <div className={`${isLast ? '' : 'pb-6'} pt-0.5`}>
                <p className={`text-sm font-semibold leading-tight
                  ${isFuture ? 'text-white/30' : 'text-white'}`}>
                  {label}
                </p>
                <p className={`text-xs mt-0.5
                  ${isFuture ? 'text-white/20' : 'text-white/55'}`}>
                  {sub}
                </p>
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

/* ─── Page ───────────────────────────────────────────────── */
export default function OrderTrackingPage({ params }: { params: { id: string } }) {
  const { id } = params
  const [order, setOrder] = useState<TrackedOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const pollRef    = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchOrder = useCallback(async () => {
    const { data, error } = await supabase
      .from('orders')
      .select(
        'id, name, status, order_type, zone, items, subtotal, delivery_fee, total, payment_method, created_at'
      )
      .eq('id', id)
      .single()

    if (error || !data) {
      setNotFound(true)
      setLoading(false)
      return
    }

    setOrder(data as unknown as TrackedOrder)
    setLoading(false)
  }, [id])

  useEffect(() => {
    fetchOrder()

    // Realtime: instant updates for this specific order
    channelRef.current = supabase
      .channel(`order-track-${id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${id}` },
        (payload) => {
          setOrder((prev) =>
            prev ? { ...prev, ...(payload.new as Partial<TrackedOrder>) } : prev
          )
        }
      )
      .subscribe()

    // Polling fallback: catch up every 10 s if realtime is delayed or unavailable
    pollRef.current = setInterval(fetchOrder, 10_000)

    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current)
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [id, fetchOrder])

  /* ── Loading skeleton */
  if (loading) {
    return (
      <main className="mx-auto max-w-lg px-4 pt-10 pb-24 space-y-4">
        <div className="h-8 bg-white/10 rounded-lg w-56 animate-pulse" />
        <SkeletonCard />
        <SkeletonCard />
      </main>
    )
  }

  /* ── Not found */
  if (notFound || !order) {
    return (
      <main className="mx-auto max-w-lg px-4 pt-12 pb-24 text-center space-y-6">
        <h1 className="text-3xl font-display">
          <span className="text-buns-yellow">BUNS</span> Pedido
        </h1>
        <div className="card p-8 space-y-4">
          <p className="text-4xl">🔍</p>
          <p className="text-white/80">
            Pedido não encontrado. Verifica o link ou contacta a BUNS.
          </p>
          <Link href="/menu" className="btn btn-primary">
            Voltar ao menu
          </Link>
        </div>
      </main>
    )
  }

  const isTakeaway = isTakeawayOrder(order.order_type)
  const isActive = order.status !== 'done' && order.status !== 'cancelled'

  return (
    <main className="mx-auto max-w-lg px-4 pt-8 pb-28 space-y-4">

      {/* ── Header ── */}
      <div className="px-1">
        <p className="text-[11px] font-semibold text-white/40 uppercase tracking-[0.18em] mb-1">
          Rastrear pedido
        </p>
        <h1 className="text-3xl sm:text-4xl font-display leading-tight">
          <span className="text-buns-yellow">BUNS</span>
          <span className="ml-2 text-white">&nbsp;#{id.slice(0, 8).toUpperCase()}</span>
        </h1>
        <p className="text-white/50 text-sm mt-1 tabular-nums">
          {order.name} · {formatTime(order.created_at)}
        </p>
      </div>

      {/* ── Big status card ── */}
      <StatusCard order={order} />

      {/* ── "Don't close" notice ── */}
      {isActive && (
        <div className="flex items-center gap-3 rounded-xl border border-buns-yellow/20 bg-buns-yellow/5 px-4 py-3">
          <span className="text-xl shrink-0">📱</span>
          <p className="text-sm text-white/80">
            <strong className="text-buns-yellow">Não feches esta página</strong>{' '}
            — o estado atualiza automaticamente.
          </p>
        </div>
      )}

      {/* ── Timeline ── */}
      <Timeline order={order} />

      {/* ── Items ── */}
      <div className="card p-5 space-y-3">
        <h2 className="text-xs font-semibold text-white/40 uppercase tracking-widest">
          O teu pedido
        </h2>
        <ul className="space-y-2.5" aria-label="Itens do pedido">
          {(order.items ?? []).map((item, i) => (
            <li key={i} className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <span className="text-buns-yellow font-extrabold">{item.qty}×</span>
                <span className="ml-1.5 font-medium text-white">{item.name}</span>
                {item.variant && (
                  <span className="ml-1.5 text-xs text-white/45 capitalize">
                    ({item.variant})
                  </span>
                )}
                {item.note && item.note.trim() !== '' && (
                  <p className="text-xs text-orange-300/80 mt-0.5 pl-5">📝 {item.note}</p>
                )}
              </div>
              <span className="text-white/75 text-sm shrink-0 tabular-nums">
                {currency(item.price * item.qty)}
              </span>
            </li>
          ))}
        </ul>

        <div className="border-t border-white/10 pt-3 space-y-1.5">
          <div className="flex justify-between text-sm text-white/55">
            <span>Subtotal</span>
            <span className="tabular-nums">{currency(order.subtotal)}</span>
          </div>
          {order.delivery_fee > 0 && (
            <div className="flex justify-between text-sm text-white/55">
              <span>Taxa de entrega</span>
              <span className="tabular-nums">{currency(order.delivery_fee)}</span>
            </div>
          )}
          <div className="flex justify-between text-base font-bold text-buns-yellow pt-1 border-t border-white/10">
            <span>Total</span>
            <span className="tabular-nums">{currency(order.total)}</span>
          </div>
        </div>
      </div>

      {/* ── Pickup / Delivery info ── */}
      <div className="card p-5 space-y-3">
        <h2 className="text-xs font-semibold text-white/40 uppercase tracking-widest">
          Informações
        </h2>

        <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          <div>
            <p className="text-white/40 text-xs mb-0.5">Tipo</p>
            <p className="font-medium">{isTakeaway ? '🏪 Takeaway' : '🚚 Entrega'}</p>
          </div>

          {!isTakeaway && order.zone && (
            <div>
              <p className="text-white/40 text-xs mb-0.5">Zona</p>
              <p className="font-medium">{order.zone}</p>
            </div>
          )}

          <div>
            <p className="text-white/40 text-xs mb-0.5">Pagamento</p>
            <p className="font-medium">
              {order.payment_method === 'cash'  ? '💵 Dinheiro'  :
               order.payment_method === 'mbway' ? '📱 MB WAY'    :
               order.payment_method === 'card'  ? '💳 Cartão'    :
               order.payment_method}
            </p>
          </div>

          <div>
            <p className="text-white/40 text-xs mb-0.5">Hora do pedido</p>
            <p className="font-medium tabular-nums">{formatTime(order.created_at)}</p>
          </div>
        </div>

        {isTakeaway && (
          <div className="rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white/70 flex items-start gap-2">
            <span className="shrink-0 mt-0.5">📍</span>
            <span>
              <strong className="text-white">{STORE_ADDRESS}</strong>
              {' '}— levanta no balcão quando receberes o aviso.
            </span>
          </div>
        )}
      </div>

      {/* ── Action buttons ── */}
      <div className="space-y-3 pt-1">
        {STORE_PHONE && (
          <a
            href={`tel:${STORE_PHONE}`}
            className="btn btn-ghost w-full flex items-center justify-center gap-2"
          >
            📞 Ligar para a BUNS
          </a>
        )}
        <Link href="/menu" className="btn btn-primary w-full">
          Voltar ao menu
        </Link>
      </div>
    </main>
  )
}
