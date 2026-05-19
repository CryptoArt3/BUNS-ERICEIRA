'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import {
  ACTIVE_ORDER_STATUSES,
  getOrderStatusLabel,
  getOrderStatusTone,
  type OrderStatus,
} from '@/lib/orders/status'

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

function itemSummary(items: OrderItem[] | null): string {
  if (!items || items.length === 0) return ''
  const shown = items.slice(0, 2).map((it) => `${it.name} × ${it.qty}`).join(', ')
  const extra = items.length - 2
  return extra > 0 ? `${shown} e mais ${extra}` : shown
}

function waitText(order: Order): string {
  const isTakeaway = (order.order_type ?? '').toUpperCase() === 'TAKEAWAY'
  switch (order.status) {
    case 'pending':    return 'A aguardar confirmação...'
    case 'preparing':  return '~10–15 min'
    case 'ready':      return 'Vai buscar ao balcão! 🏃'
    case 'delivering': return isTakeaway ? 'Vai buscar ao balcão 🏃' : 'A caminho...'
    default:           return ''
  }
}

/* ─── Active order card ──────────────────────────────────── */
function ActiveOrderCard({ order }: { order: Order }) {
  const tone    = getOrderStatusTone(order.status)
  const label   = getOrderStatusLabel(order.status, order.order_type ?? '')
  const wait    = waitText(order)
  const summary = itemSummary(order.items)

  return (
    <article className={`card border ${tone.border} ${tone.bg} p-5 space-y-3`}>
      {/* top row */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full
              text-xs font-semibold border ${tone.badge}`}
          >
            {tone.emoji}&nbsp;{label}
          </span>
          <p className="mt-2 font-display text-white text-base leading-none">
            #{order.id.slice(0, 8).toUpperCase()}
          </p>
          <p className="text-white/40 text-xs tabular-nums mt-0.5">
            {formatTime(order.created_at)}
          </p>
        </div>
        <p className="text-buns-yellow font-bold text-lg tabular-nums shrink-0">
          {currency(order.total)}
        </p>
      </div>

      {/* item summary */}
      {summary && (
        <p className="text-sm text-white/60 leading-snug">{summary}</p>
      )}

      {/* estimated wait */}
      {wait && (
        <p className="text-xs text-white/45 flex items-center gap-1.5">
          <span>⏱</span>
          <span>{wait}</span>
        </p>
      )}

      {/* CTA */}
      <Link
        href={`/order/${order.id}`}
        className="btn btn-primary w-full mt-1"
      >
        Ver estado do pedido →
      </Link>
    </article>
  )
}

/* ─── History order row ──────────────────────────────────── */
function HistoryRow({ order }: { order: Order }) {
  const tone    = getOrderStatusTone(order.status)
  const label   = getOrderStatusLabel(order.status, order.order_type ?? '')
  const summary = itemSummary(order.items)

  return (
    <li className={`card border ${tone.border} p-4 flex items-center gap-3`}>
      <span className="text-xl shrink-0" aria-hidden="true">{tone.emoji}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-sm font-semibold text-white/75">
            #{order.id.slice(0, 8).toUpperCase()}
          </span>
          <span className="text-white/25 text-xs">·</span>
          <span className="text-white/40 text-xs tabular-nums">
            {formatDate(order.created_at)} {formatTime(order.created_at)}
          </span>
        </div>
        {summary && (
          <p className="text-xs text-white/35 mt-0.5 truncate">{summary}</p>
        )}
      </div>
      <div className="text-right shrink-0 space-y-1">
        <p className="text-sm font-semibold text-white/60 tabular-nums">
          {currency(order.total)}
        </p>
        <span className={`text-[11px] px-2 py-0.5 rounded-full border ${tone.badge} inline-block`}>
          {label}
        </span>
      </div>
    </li>
  )
}

/* ─── Loading skeleton ───────────────────────────────────── */
function Skeleton() {
  return (
    <div className="space-y-4">
      {[1, 2].map((n) => (
        <div key={n} className="card p-5 space-y-3 animate-pulse">
          <div className="h-5 bg-white/10 rounded w-28" />
          <div className="h-4 bg-white/10 rounded w-40" />
          <div className="h-10 bg-white/10 rounded-xl" />
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

  useEffect(() => {
    let sub: ReturnType<typeof supabase.channel> | null = null

    async function load() {
      setErr(null)
      setLoading(true)

      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user
      setUserEmail(user?.email ?? null)

      if (!user) {
        setLoading(false)
        setErr('Precisas de iniciar sessão.')
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

      // Realtime: re-fetch on any change to this user's orders
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
      <main className="mx-auto max-w-2xl px-4 py-8 pb-24 md:pb-8 space-y-6 overflow-x-hidden">
        <div className="h-8 bg-white/10 rounded animate-pulse w-48" />
        <Skeleton />
      </main>
    )
  }

  /* ── Error / not logged in */
  if (err) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-8 pb-24 md:pb-8 space-y-4 overflow-x-hidden">
        <p className="text-red-300">{err}</p>
        <Link className="btn btn-primary" href="/login">Entrar</Link>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 pb-24 md:pb-8 space-y-8 overflow-x-hidden">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-4xl font-display">A minha conta</h1>
          {userEmail && (
            <p className="text-white/45 text-sm mt-1">{userEmail}</p>
          )}
        </div>
        <div className="flex gap-2 shrink-0">
          <Link href="/menu" className="btn btn-ghost">Novo pedido</Link>
          <button onClick={handleSignOut} className="btn btn-ghost">Sair</button>
        </div>
      </div>

      {/* ── Active orders ── */}
      <section aria-labelledby="active-heading">
        <h2
          id="active-heading"
          className="text-[11px] font-semibold text-white/40 uppercase tracking-[0.18em] mb-3"
        >
          Pedidos ativos
        </h2>

        {active.length === 0 ? (
          <div className="card border border-white/10 p-6 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
            <span className="text-3xl shrink-0" aria-hidden="true">🍔</span>
            <div className="flex-1">
              <p className="font-semibold text-white/80">Sem pedidos ativos de momento</p>
              <p className="text-white/45 text-sm mt-0.5">
                Os teus pedidos em curso aparecem aqui em tempo real.
              </p>
            </div>
            <Link href="/menu" className="btn btn-primary shrink-0">
              Fazer novo pedido
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
        <section aria-labelledby="history-heading">
          <h2
            id="history-heading"
            className="text-[11px] font-semibold text-white/40 uppercase tracking-[0.18em] mb-3"
          >
            Histórico
          </h2>
          <ul className="space-y-2">
            {history.map((o) => (
              <HistoryRow key={o.id} order={o} />
            ))}
          </ul>
        </section>
      )}

    </main>
  )
}
