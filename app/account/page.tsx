'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import {
  ACTIVE_ORDER_STATUSES,
  getOrderStatusTone,
  type OrderStatus,
} from '@/lib/orders/status'
import { useI18n } from '@/lib/i18n/useI18n'
import QuestWidget from '@/components/quest/QuestWidget'

/* ─── Types ──────────────────────────────────────────────── */
type OrderItem = {
  name: string
  qty: number
}

type Order = {
  id: string
  created_at: string
  status: OrderStatus
  total: number
  items: OrderItem[] | null
  order_type: string | null
}

/* ─── Helpers ────────────────────────────────────────────── */
function currency(x: number) {
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(x)
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function itemSummary(items: OrderItem[] | null, t: (key: string) => string): string {
  if (!items || items.length === 0) return ''
  const shown = items.slice(0, 2).map((it) => `${it.name} ×${it.qty}`).join(', ')
  const extra = items.length - 2
  if (extra <= 0) return shown
  const suffix = t('account.and_more_suffix')
  return suffix
    ? `${shown} ${t('account.and_more')} ${extra} ${suffix}`
    : `${shown} ${t('account.and_more')} ${extra}`
}

function waitText(order: Order, t: (key: string) => string): string {
  const isTakeaway = (order.order_type ?? '').toUpperCase() === 'TAKEAWAY'
  switch (order.status) {
    case 'pending':    return t('account.wait_pending')
    case 'preparing':  return t('account.wait_preparing')
    case 'ready':      return t('account.wait_ready')
    case 'delivering': return isTakeaway ? t('account.wait_ready') : t('account.wait_delivering')
    default:           return ''
  }
}

/* ─── Active order card ──────────────────────────────────── */
function ActiveOrderCard({ order }: { order: Order }) {
  const { t }   = useI18n()
  const tone    = getOrderStatusTone(order.status)
  const label   = t('order.status.' + order.status)
  const wait    = waitText(order, t)
  const summary = itemSummary(order.items, t)

  return (
    <article className="bg-white border-2 border-black rounded-2xl overflow-hidden">
      <div className="h-[6px] bg-buns-yellow" />
      <div className="p-5 space-y-4">

        {/* Status sticker + total */}
        <div className="flex items-start justify-between gap-3">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wide border ${tone.badge}`}>
            {tone.emoji} {label}
          </span>
          <span className="text-black font-black text-xl tabular-nums shrink-0">
            {currency(order.total)}
          </span>
        </div>

        {/* Order ID + time */}
        <div>
          <p className="font-display text-black uppercase leading-none text-2xl">
            #{order.id.slice(0, 8).toUpperCase()}
          </p>
          <p className="text-black/40 text-xs tabular-nums mt-1">{formatTime(order.created_at)}</p>
        </div>

        {/* Item summary */}
        {summary && (
          <p className="text-sm text-black/55 leading-snug">{summary}</p>
        )}

        {/* Wait estimate */}
        {wait && (
          <p className="text-xs text-black/45 flex items-center gap-1.5">
            <span>⏱</span><span>{wait}</span>
          </p>
        )}

        {/* CTA */}
        <Link
          href={`/order/${order.id}`}
          className="block w-full py-3 bg-black text-buns-yellow font-black text-sm uppercase tracking-wide rounded-xl text-center active:scale-[0.98] transition"
        >
          {t('account.order_cta')}
        </Link>
      </div>
    </article>
  )
}

/* ─── History order row ──────────────────────────────────── */
function HistoryRow({ order }: { order: Order }) {
  const { t }   = useI18n()
  const tone    = getOrderStatusTone(order.status)
  const label   = t('order.status.' + order.status)
  const summary = itemSummary(order.items, t)

  return (
    <li className="bg-white border-2 border-black/10 rounded-2xl overflow-hidden">
      <div className="p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl shrink-0 mt-0.5" aria-hidden="true">{tone.emoji}</span>
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-black text-black text-sm">
                #{order.id.slice(0, 8).toUpperCase()}
              </span>
              <span className="text-black/30 text-xs">·</span>
              <span className="text-black/45 text-xs tabular-nums">
                {formatDate(order.created_at)} {formatTime(order.created_at)}
              </span>
            </div>
            {summary && (
              <p className="text-xs text-black/45 leading-snug break-words">{summary}</p>
            )}
            <div className="flex items-center justify-between gap-2 pt-1">
              <span className={`text-[11px] px-2.5 py-1 rounded-lg border font-black uppercase tracking-wide ${tone.badge}`}>
                {label}
              </span>
              <span className="text-black font-black text-sm tabular-nums shrink-0">
                {currency(order.total)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </li>
  )
}

/* ─── Loading skeleton ───────────────────────────────────── */
function Skeleton() {
  return (
    <div className="space-y-4">
      {[1, 2].map((n) => (
        <div key={n} className="bg-white border-2 border-black/10 rounded-2xl p-5 space-y-3 animate-pulse">
          <div className="h-6 bg-black/8 rounded-lg w-28" />
          <div className="h-8 bg-black/8 rounded-lg w-40" />
          <div className="h-10 bg-black/8 rounded-xl" />
        </div>
      ))}
    </div>
  )
}

/* ─── Page ───────────────────────────────────────────────── */
export default function AccountPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const { t } = useI18n()

  useEffect(() => {
    let sub: ReturnType<typeof supabase.channel> | null = null

    async function load() {
      setErr(null)
      setLoading(true)

      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user
      setUserEmail(user?.email ?? null)
      setAccessToken(session?.access_token ?? null)

      if (!user) {
        setLoading(false)
        setErr(t('account.must_login'))
        return
      }

      const { data, error } = await supabase
        .from('orders')
        .select('id, created_at, status, total, items, order_type')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) setErr(error.message)
      setOrders((data ?? []) as unknown as Order[])
      setLoading(false)

      sub = supabase
        .channel('orders_account')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'orders', filter: `user_id=eq.${user.id}` },
          async () => {
            const { data } = await supabase
              .from('orders')
              .select('id, created_at, status, total, items, order_type')
              .eq('user_id', user.id)
              .order('created_at', { ascending: false })
            setOrders((data ?? []) as unknown as Order[])
          }
        )
        .subscribe()
    }

    load()
    return () => { sub?.unsubscribe() }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  /* ── Partition */
  const active  = orders.filter((o) => ACTIVE_ORDER_STATUSES.includes(o.status))
  const history = orders.filter((o) => !ACTIVE_ORDER_STATUSES.includes(o.status))

  /* ── Loading */
  if (loading) {
    return (
      <main className="w-full max-w-full overflow-x-hidden bg-buns-cream min-h-full">
        <div className="bg-black px-4 sm:px-6 pt-8 pb-7 border-b-4 border-buns-yellow">
          <div className="max-w-screen-xl mx-auto">
            <div className="h-12 bg-white/10 rounded-xl animate-pulse w-48" />
          </div>
        </div>
        <div className="max-w-2xl mx-auto px-4 pt-6 pb-32 space-y-4">
          <Skeleton />
        </div>
      </main>
    )
  }

  /* ── Error / not logged in */
  if (err) {
    return (
      <main className="w-full max-w-full overflow-x-hidden bg-buns-cream min-h-full">
        <div className="bg-black px-4 sm:px-6 pt-8 pb-7 border-b-4 border-buns-yellow">
          <div className="max-w-screen-xl mx-auto">
            <h1 className="font-display text-white uppercase leading-none tracking-tight"
                style={{ fontSize: 'clamp(2.8rem, 10vw, 5.5rem)' }}>
              BUNS<br /><span className="text-buns-yellow">{t('account.hero_title2')}</span>
            </h1>
          </div>
        </div>
        <div className="max-w-2xl mx-auto px-4 pt-6 pb-32 space-y-4">
          <div className="bg-white border-2 border-black rounded-2xl overflow-hidden">
            <div className="h-[6px] bg-buns-yellow" />
            <div className="p-6 space-y-4">
              <p className="text-black font-black text-lg">{err}</p>
              <Link
                href="/login"
                className="inline-block px-6 py-3 bg-black text-buns-yellow font-black text-sm uppercase tracking-wide rounded-xl"
              >
                {t('account.sign_in_cta')}
              </Link>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="w-full max-w-full overflow-x-hidden bg-buns-cream min-h-full">

      {/* ── Hero strip ─────────────────────────────────────── */}
      <div className="bg-black px-4 sm:px-6 pt-8 pb-7 border-b-4 border-buns-yellow">
        <div className="max-w-screen-xl mx-auto">
          <div className="inline-flex items-center gap-1.5 bg-buns-yellow text-black text-[11px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg mb-5">
            {t('account.hero_tag')}
          </div>
          <h1
            className="font-display text-white uppercase leading-none tracking-tight"
            style={{ fontSize: 'clamp(2.8rem, 10vw, 5.5rem)' }}
          >
            BUNS<br />
            <span className="text-buns-yellow">{t('account.hero_title2')}</span>
          </h1>
          {userEmail && (
            <p className="mt-3 text-white/40 text-sm font-medium break-all">{userEmail}</p>
          )}
        </div>
      </div>

      {/* ── Body ───────────────────────────────────────────── */}
      <div className="max-w-2xl mx-auto px-4 pt-6 pb-32 space-y-8">

        {/* ── Header actions ── */}
        <div className="flex flex-col sm:flex-row gap-2">
          <Link
            href="/menu"
            className="flex-1 py-3 bg-black text-buns-yellow font-black text-sm uppercase tracking-wide rounded-xl text-center active:scale-[0.98] transition"
          >
            {t('account.new_order')}
          </Link>
          <button
            onClick={handleSignOut}
            className="flex-1 py-3 bg-white border-2 border-black text-black font-black text-sm uppercase tracking-wide rounded-xl active:scale-[0.98] transition"
          >
            {t('account.sign_out')}
          </button>
        </div>

        {/* ── Active orders ── */}
        <section>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-black/35 mb-3">
            {t('account.active_orders')}
          </p>

          {active.length === 0 ? (
            <div className="bg-white border-2 border-black/10 rounded-2xl p-6 flex flex-col items-center text-center gap-3">
              <span className="text-4xl" aria-hidden="true">🍔</span>
              <div>
                <p className="font-black text-black text-base">{t('account.no_active')}</p>
                <p className="text-black/45 text-sm mt-0.5">
                  {t('account.no_active_sub')}
                </p>
              </div>
              <Link
                href="/menu"
                className="w-full py-3 bg-black text-buns-yellow font-black text-sm uppercase tracking-wide rounded-xl text-center active:scale-[0.98] transition"
              >
                {t('account.make_order')}
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {active.map((o) => (
                <ActiveOrderCard key={o.id} order={o} />
              ))}
            </div>
          )}
        </section>

        {/* ── History ── */}
        {history.length > 0 && (
          <section>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-black/35 mb-3">
              {t('account.history')}
            </p>
            <ul className="space-y-2">
              {history.map((o) => (
                <HistoryRow key={o.id} order={o} />
              ))}
            </ul>
          </section>
        )}

        {/* ── Quest ── */}
        {accessToken && <QuestWidget accessToken={accessToken} />}

      </div>
    </main>
  )
}
