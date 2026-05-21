'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import {
  getFlowStepIndex,
  getOrderStatusTone,
  isActiveOrder,
  type OrderStatus,
} from '@/lib/orders/status'
import { useI18n } from '@/lib/i18n/useI18n'

/* ─── Store config ───────────────────────────────────────── */
const STORE_PHONE = ''
const STORE_ADDRESS = 'Calçada da Baleia 29A, Ericeira'

/* ─── Types ──────────────────────────────────────────────── */
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

/* ─── Timeline step type ─────────────────────────────────── */
type TimelineStep = { status: OrderStatus; label: string; sub: string }

/* ─── Status accent map (cream-background palette) ──────── */
type Accent = { stripe: string; badge: string; label: string }
const STATUS_ACCENT: Record<string, Accent> = {
  pending:    { stripe: 'bg-orange-400',   badge: 'bg-orange-100 text-orange-700 border border-orange-300',   label: 'text-orange-700' },
  preparing:  { stripe: 'bg-buns-yellow',  badge: 'bg-yellow-100 text-yellow-800 border border-yellow-400',   label: 'text-yellow-700' },
  ready:      { stripe: 'bg-green-500',    badge: 'bg-green-100  text-green-700  border border-green-400',    label: 'text-green-700'  },
  delivering: { stripe: 'bg-blue-500',     badge: 'bg-blue-100   text-blue-700   border border-blue-300',     label: 'text-blue-700'   },
  done:       { stripe: 'bg-black/20',     badge: 'bg-black/5    text-black/50   border border-black/15',     label: 'text-black/50'   },
  cancelled:  { stripe: 'bg-red-500',      badge: 'bg-red-100    text-red-700    border border-red-300',      label: 'text-red-700'    },
}
function accent(status: string): Accent {
  return STATUS_ACCENT[status] ?? STATUS_ACCENT.done
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

/* ─── Skeleton ───────────────────────────────────────────── */
function SkeletonPage() {
  return (
    <main className="w-full max-w-full overflow-x-hidden bg-buns-cream min-h-full">
      <div className="bg-black px-4 sm:px-6 pt-8 pb-7 border-b-4 border-buns-yellow animate-pulse">
        <div className="max-w-lg mx-auto space-y-3">
          <div className="h-4 bg-white/15 rounded w-32" />
          <div className="h-14 bg-white/15 rounded-xl w-64" />
          <div className="h-4 bg-white/10 rounded w-40" />
        </div>
      </div>
      <div className="max-w-lg mx-auto px-4 pt-6 pb-32 space-y-4">
        {[1, 2, 3].map((n) => (
          <div key={n} className="bg-white rounded-3xl border-2 border-black/8 p-6 space-y-3 animate-pulse">
            <div className="h-5 bg-black/8 rounded w-28" />
            <div className="h-16 bg-black/8 rounded-xl" />
          </div>
        ))}
      </div>
    </main>
  )
}

/* ─── Status card ────────────────────────────────────────── */
function StatusCard({ order }: { order: TrackedOrder }) {
  const { t }       = useI18n()
  const ac          = accent(order.status)
  const label       = t('order.status.' + order.status)
  const active      = isActiveOrder(order.status)
  const isTakeaway  = isTakeawayOrder(order.order_type)
  const tone        = getOrderStatusTone(order.status)

  const statusSub = ((): string => {
    switch (order.status) {
      case 'pending':    return t('order.sub.pending')
      case 'preparing':  return t('order.sub.preparing')
      case 'ready':      return isTakeaway ? t('order.sub.ready_takeaway')      : t('order.sub.ready_delivery')
      case 'delivering': return isTakeaway ? t('order.sub.delivering_takeaway') : t('order.sub.delivering_delivery')
      case 'done':       return t('order.sub.done')
      case 'cancelled':  return t('order.sub.cancelled')
      default:           return ''
    }
  })()

  return (
    <div className={`bg-white border-2 border-black/8 rounded-3xl overflow-hidden${active ? ' shadow-lg' : ''}`}>
      <div className={`h-2 ${ac.stripe}${active ? ' animate-pulse' : ''}`} style={{ animationDuration: '2s' }} />
      <div className="p-6 sm:p-8 flex flex-col items-center text-center gap-4">
        <span
          className={`text-7xl sm:text-8xl block${active ? ' animate-pulse' : ''}`}
          style={{ animationDuration: '2.5s' }}
          role="img"
          aria-label={label}
        >
          {tone.emoji}
        </span>
        <div className="space-y-1.5">
          <p className={`font-display uppercase text-black leading-none ${ac.label}`}
             style={{ fontSize: 'clamp(1.6rem, 5vw, 2.2rem)' }}>
            {label}
          </p>
          <p className="text-black/50 text-sm leading-snug max-w-xs mx-auto">
            {statusSub}
          </p>
        </div>
      </div>
    </div>
  )
}

/* ─── Timeline ───────────────────────────────────────────── */
function Timeline({ order }: { order: TrackedOrder }) {
  const { t }  = useI18n()

  if (order.status === 'cancelled') {
    return (
      <div className="bg-white border-2 border-red-300 rounded-3xl overflow-hidden">
        <div className="h-2 bg-red-500" />
        <div className="p-5 flex items-start gap-3">
          <span className="text-2xl shrink-0">❌</span>
          <div>
            <p className="font-black text-black text-base">{t('order.cancelled_title')}</p>
            <p className="text-black/50 text-sm mt-0.5">{t('order.cancelled_sub')}</p>
          </div>
        </div>
      </div>
    )
  }

  const isTakeaway = isTakeawayOrder(order.order_type)

  const TAKEAWAY_STEPS: TimelineStep[] = [
    { status: 'pending',   label: t('order.tl.received'),     sub: t('order.tl.received_sub') },
    { status: 'preparing', label: t('order.tl.preparing'),    sub: t('order.tl.preparing_sub') },
    { status: 'ready',     label: t('order.tl.ready_pickup'), sub: t('order.tl.ready_pickup_sub') },
    { status: 'done',      label: t('order.tl.done_pickup'),  sub: t('order.tl.done_pickup_sub') },
  ]

  const DELIVERY_STEPS: TimelineStep[] = [
    { status: 'pending',    label: t('order.tl.received'),       sub: t('order.tl.received_sub') },
    { status: 'preparing',  label: t('order.tl.preparing'),      sub: t('order.tl.preparing_sub') },
    { status: 'delivering', label: t('order.tl.delivering'),     sub: t('order.tl.delivering_sub') },
    { status: 'done',       label: t('order.tl.done_delivery'),  sub: t('order.tl.done_delivery_sub') },
  ]

  const steps      = isTakeaway ? TAKEAWAY_STEPS : DELIVERY_STEPS
  const currentIdx = getFlowStepIndex(order.status, order.order_type)

  return (
    <div className="bg-white border-2 border-black/8 rounded-3xl p-5 sm:p-6">
      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-black/35 mb-5">
        {t('order.timeline_label')}
      </p>
      <ol className="space-y-0" aria-label={t('order.timeline_aria')}>
        {steps.map((step, i) => {
          const isPast   = currentIdx > i
          const isActive = currentIdx === i
          const isFuture = currentIdx < i
          const isLast   = i === steps.length - 1

          return (
            <li key={step.status} className="flex gap-4">
              {/* connector column */}
              <div className="flex flex-col items-center shrink-0">
                {/* node */}
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-black border-2 transition-all duration-500
                    ${isPast   ? 'bg-buns-yellow border-buns-yellow text-black' : ''}
                    ${isActive ? 'bg-black border-black text-buns-yellow shadow-md' : ''}
                    ${isFuture ? 'bg-black/5 border-black/15 text-black/30' : ''}`}
                  aria-current={isActive ? 'step' : undefined}
                >
                  {isPast ? '✓' : i + 1}
                </div>
                {/* connector line */}
                {!isLast && (
                  <div
                    className={`w-[3px] flex-1 my-1.5 min-h-[32px] rounded-full transition-all duration-700
                      ${isPast ? 'bg-buns-yellow' : 'bg-black/10'}`}
                  />
                )}
              </div>

              {/* text */}
              <div className={`${isLast ? '' : 'pb-7'} pt-1 min-w-0`}>
                <p className={`text-sm font-black leading-tight uppercase tracking-wide
                  ${isActive ? 'text-black' : isFuture ? 'text-black/25' : 'text-black/60'}`}>
                  {step.label}
                </p>
                <p className={`text-xs mt-0.5 leading-snug
                  ${isActive ? 'text-black/55' : isFuture ? 'text-black/20' : 'text-black/40'}`}>
                  {step.sub}
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
  const { t } = useI18n()

  /* ── Sound alert state ── */
  const [soundEnabled, setSoundEnabled]           = useState(false)
  const [readyToastVisible, setReadyToastVisible] = useState(false)
  const audioRef       = useRef<HTMLAudioElement | null>(null)
  const soundPlayedRef = useRef(false)
  const alertPlayedKey = `buns_order_ready_alert_played_${id}`

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

    pollRef.current = setInterval(fetchOrder, 10_000)

    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current)
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [id, fetchOrder])

  /* ── Load sound preference ── */
  useEffect(() => {
    setSoundEnabled(!!localStorage.getItem('buns_sound_enabled'))
  }, [])

  /* ── Init audio element once ── */
  useEffect(() => {
    const audio = new Audio('/sounds/order-ready.mp3')
    audio.volume = 0.65
    audio.preload = 'auto'
    audioRef.current = audio
    return () => { audioRef.current = null }
  }, [])

  /* ── Detect ready: show toast + vibrate (once per order) ── */
  useEffect(() => {
    if (!order || order.status !== 'ready') return
    if (localStorage.getItem(alertPlayedKey)) return

    localStorage.setItem(alertPlayedKey, '1')
    setReadyToastVisible(true)
    try { navigator.vibrate?.([200, 80, 200]) } catch {}
  }, [order?.status, alertPlayedKey])

  /* ── Play sound when ready + enabled (separate to handle late opt-in) ── */
  useEffect(() => {
    if (!order || order.status !== 'ready') return
    if (!soundEnabled || soundPlayedRef.current || !audioRef.current) return

    soundPlayedRef.current = true
    audioRef.current.currentTime = 0
    audioRef.current.play().catch(() => {})
  }, [order?.status, soundEnabled])

  /* ── Sound toggle handler (must run in user-gesture context for iOS) ── */
  function handleToggleSound() {
    if (soundEnabled) {
      setSoundEnabled(false)
      localStorage.removeItem('buns_sound_enabled')
      return
    }

    setSoundEnabled(true)
    localStorage.setItem('buns_sound_enabled', '1')

    if (!audioRef.current) return
    const audio = audioRef.current

    if (order?.status === 'ready' && !soundPlayedRef.current) {
      // Order already ready — play immediately within gesture context
      soundPlayedRef.current = true
      audio.currentTime = 0
      audio.volume = 0.65
      audio.play().catch(() => {})
    } else {
      // Prime WebAudio context silently so future async play is unlocked on iOS
      audio.volume = 0
      audio.play().then(() => {
        audio.pause()
        audio.currentTime = 0
        audio.volume = 0.65
      }).catch(() => {})
    }
  }

  /* ── Loading */
  if (loading) return <SkeletonPage />

  /* ── Not found */
  if (notFound || !order) {
    return (
      <main className="w-full max-w-full overflow-x-hidden bg-buns-cream min-h-full">
        <div className="bg-black px-4 sm:px-6 pt-8 pb-7 border-b-4 border-buns-yellow">
          <div className="max-w-lg mx-auto">
            <h1 className="font-display text-white uppercase leading-none tracking-tight"
                style={{ fontSize: 'clamp(2.8rem, 10vw, 5.5rem)' }}>
              BUNS<br /><span className="text-buns-yellow">#{id.slice(0, 8).toUpperCase()}</span>
            </h1>
          </div>
        </div>
        <div className="max-w-lg mx-auto px-4 pt-6 pb-32">
          <div className="bg-white border-2 border-black/8 rounded-3xl overflow-hidden">
            <div className="h-[6px] bg-buns-yellow" />
            <div className="p-8 flex flex-col items-center text-center gap-4">
              <span className="text-5xl">🔍</span>
              <div className="space-y-1">
                <p className="font-black text-black text-lg">{t('order.not_found')}</p>
                <p className="text-black/50 text-sm">{t('order.not_found_sub')}</p>
              </div>
              <Link
                href="/menu"
                className="w-full py-4 bg-black text-buns-yellow font-black text-base uppercase tracking-wide rounded-2xl text-center active:scale-[0.98] transition"
              >
                {t('order.back_menu')}
              </Link>
            </div>
          </div>
        </div>
      </main>
    )
  }

  const isTakeaway = isTakeawayOrder(order.order_type)
  const isActive   = isActiveOrder(order.status)
  const ac         = accent(order.status)

  return (
    <main className="w-full max-w-full overflow-x-hidden bg-buns-cream min-h-full">

      {/* ── Hero strip ─────────────────────────────────────── */}
      <div className="bg-black px-4 sm:px-6 pt-8 pb-7 border-b-4 border-buns-yellow">
        <div className="max-w-lg mx-auto">

          {/* Status badge in hero */}
          <div className={`inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg mb-5 ${ac.badge}`}>
            {t('order.hero_badge')}
          </div>

          {/* Order ID heading */}
          <h1
            className="font-display text-white uppercase leading-none tracking-tight"
            style={{ fontSize: 'clamp(2.2rem, 9vw, 4.5rem)' }}
          >
            BUNS<br />
            <span className="text-buns-yellow">#{id.slice(0, 8).toUpperCase()}</span>
          </h1>

          {/* Name + time */}
          <p className="mt-3 text-white/45 text-sm font-medium tabular-nums">
            {order.name} · {formatTime(order.created_at)}
          </p>
        </div>
      </div>

      {/* ── Body ───────────────────────────────────────────── */}
      <div className="max-w-lg mx-auto px-4 pt-5 pb-32 space-y-4">

        {/* ── Big status card ── */}
        <StatusCard order={order} />

        {/* ── Sound alert toggle — shown while order is active ── */}
        {isActive && (
          <button
            onClick={handleToggleSound}
            className={[
              'w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2',
              'text-sm font-black uppercase tracking-wide transition active:scale-[0.98]',
              soundEnabled
                ? 'bg-buns-yellow border-buns-yellow text-black'
                : 'bg-white border-black/15 text-black/45 hover:border-black/30 hover:text-black/65',
            ].join(' ')}
          >
            {t(soundEnabled ? 'order.sound_enabled' : 'order.sound_enable')}
          </button>
        )}

        {/* ── "You can close" notice ── */}
        {isActive && (
          <div className="bg-white border-2 border-black/8 rounded-2xl px-4 py-3 flex items-center gap-3">
            <span className="text-xl shrink-0">✅</span>
            <p className="text-sm text-black/60 leading-snug">
              {t('order.close_notice')}{' '}
              <Link href="/account" className="font-black text-black underline underline-offset-2">
                {t('order.close_account')}
              </Link>
              .
            </p>
          </div>
        )}

        {/* ── Timeline ── */}
        <Timeline order={order} />

        {/* ── Items ── */}
        <div className="bg-white border-2 border-black/8 rounded-3xl overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 bg-black">
            <h2 className="font-black text-white uppercase tracking-wide text-sm">{t('order.section_order')}</h2>
          </div>
          <div className="p-5 space-y-3">
            <ul className="space-y-2.5" aria-label={t('order.items_aria')}>
              {(order.items ?? []).map((item, i) => (
                <li key={i} className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span className="font-black text-buns-yellow">{item.qty}×</span>
                    <span className="ml-1.5 font-black text-black">{item.name}</span>
                    {item.variant && (
                      <span className="ml-1.5 text-xs text-black/40 capitalize">({item.variant})</span>
                    )}
                    {item.note && item.note.trim() !== '' && (
                      <p className="text-xs text-orange-600/80 mt-0.5 pl-5">📝 {item.note}</p>
                    )}
                  </div>
                  <span className="text-black/60 text-sm shrink-0 tabular-nums font-bold">
                    {currency(item.price * item.qty)}
                  </span>
                </li>
              ))}
            </ul>

            <div className="border-t-2 border-black/8 pt-3 space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-black/45">{t('order.subtotal')}</span>
                <span className="text-black font-bold tabular-nums">{currency(order.subtotal)}</span>
              </div>
              {order.delivery_fee > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-black/45">{t('order.delivery_fee')}</span>
                  <span className="text-black font-bold tabular-nums">{currency(order.delivery_fee)}</span>
                </div>
              )}
              <div className="border-t-2 border-black/8 pt-2 flex justify-between">
                <span className="text-black font-black text-base">{t('order.total')}</span>
                <span className="text-black font-black text-xl tabular-nums">{currency(order.total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Pickup / Delivery info ── */}
        <div className="bg-white border-2 border-black/8 rounded-3xl overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 bg-black">
            <h2 className="font-black text-white uppercase tracking-wide text-sm">{t('order.section_info')}</h2>
          </div>
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              <div>
                <p className="text-[11px] font-black uppercase tracking-widest text-black/35 mb-1">{t('order.type_label')}</p>
                <p className="font-bold text-black text-sm">{isTakeaway ? t('order.type_takeaway') : t('order.type_delivery')}</p>
              </div>

              {!isTakeaway && order.zone && (
                <div>
                  <p className="text-[11px] font-black uppercase tracking-widest text-black/35 mb-1">{t('order.zone_label')}</p>
                  <p className="font-bold text-black text-sm">{order.zone}</p>
                </div>
              )}

              <div>
                <p className="text-[11px] font-black uppercase tracking-widest text-black/35 mb-1">{t('order.payment_label')}</p>
                <p className="font-bold text-black text-sm">
                  {order.payment_method === 'cash'  ? t('order.pay_cash')  :
                   order.payment_method === 'mbway' ? t('order.pay_mbway') :
                   order.payment_method === 'card'  ? t('order.pay_card')  :
                   order.payment_method}
                </p>
              </div>

              <div>
                <p className="text-[11px] font-black uppercase tracking-widest text-black/35 mb-1">{t('order.time_label')}</p>
                <p className="font-bold text-black text-sm tabular-nums">{formatTime(order.created_at)}</p>
              </div>
            </div>

            {isTakeaway && (
              <div className="bg-buns-cream rounded-xl px-4 py-3 text-sm flex items-start gap-2.5">
                <span className="shrink-0 mt-0.5">📍</span>
                <span className="text-black/65 leading-snug">
                  <strong className="text-black">{STORE_ADDRESS}</strong>
                  {' '}{t('order.pickup_notice')}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ── Action buttons ── */}
        <div className="space-y-2.5 pt-1">
          {STORE_PHONE && (
            <a
              href={`tel:${STORE_PHONE}`}
              className="block w-full py-4 bg-white border-2 border-black text-black font-black text-sm uppercase tracking-wide rounded-2xl text-center active:scale-[0.98] transition"
            >
              {t('order.call_cta')}
            </a>
          )}
          <Link
            href="/account"
            className="block w-full py-4 bg-white border-2 border-black/20 text-black/60 font-black text-sm uppercase tracking-wide rounded-2xl text-center active:scale-[0.98] transition"
          >
            {t('order.view_account')}
          </Link>
          <Link
            href="/menu"
            className="block w-full py-4 bg-black text-buns-yellow font-black text-base uppercase tracking-wide rounded-2xl border-2 border-black text-center active:scale-[0.98] transition"
          >
            {t('order.back_menu')}
          </Link>
        </div>

      </div>

      {/* ── Ready toast — fixed bottom, shown once when status becomes ready ── */}
      {readyToastVisible && (
        <div className="fixed bottom-[calc(1.5rem+env(safe-area-inset-bottom,0px))] inset-x-0 z-50 px-4 pointer-events-none">
          <div className="max-w-lg mx-auto pointer-events-auto">
            <div className="bg-white border-2 border-green-500/40 rounded-2xl overflow-hidden shadow-[0_4px_32px_rgba(34,197,94,0.18)]">
              <div className="h-[5px] bg-green-500" />
              <div className="px-4 py-3.5 flex items-start gap-3">
                <span className="text-2xl shrink-0 mt-0.5" aria-hidden="true">🔔</span>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-black text-sm leading-snug">
                    {t('order.ready_toast')}
                  </p>
                  <p className="text-green-700 text-xs font-black uppercase tracking-wide mt-0.5">
                    {t('order.ready_toast_cta')} →
                  </p>
                </div>
                <button
                  onClick={() => setReadyToastVisible(false)}
                  className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full bg-black/5 text-black/40 hover:text-black transition text-xl leading-none select-none"
                  aria-label="Fechar"
                >
                  ×
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
