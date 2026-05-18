'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { useOrderSounds } from '@/components/admin/useOrderSounds'
import type { OrderStatus } from '@/lib/orders/status'

/* ─── Types ──────────────────────────────────────────────── */
type ItemOptions = {
  note?: string | null
  fries?: string | null
  drink?: string | null
  ingredients?: string[] | null
} | null

type Item = {
  id: string
  name: string
  qty: number
  price: number
  note?: string | null
  variant?: string | null
  options?: ItemOptions
}

type KitchenOrder = {
  id: string
  created_at: string
  name: string
  phone: string
  zone: string
  order_type?: 'delivery' | 'takeaway'
  items: Item[]
  total: number
  status: OrderStatus
  acknowledged: boolean
  note?: string | null
  order_note?: string | null
  obs?: string | null
}

/* ─── Column config ──────────────────────────────────────── */
type Column = {
  id: string
  label: string
  sublabel: string
  statuses: OrderStatus[]
  headerBg: string
  headerText: string
  countBg: string
  emptyText: string
}

const COLUMNS: Column[] = [
  {
    id: 'new',
    label: 'Novo / Pendente',
    sublabel: 'A aguardar aceitação',
    statuses: ['pending'],
    headerBg: 'bg-red-500/15 border-red-500/30',
    headerText: 'text-red-300',
    countBg: 'bg-red-500 text-white',
    emptyText: 'Sem novos pedidos',
  },
  {
    id: 'preparing',
    label: 'Em Preparação',
    sublabel: 'Na cozinha',
    statuses: ['preparing'],
    headerBg: 'bg-orange-500/15 border-orange-500/30',
    headerText: 'text-orange-300',
    countBg: 'bg-orange-500 text-white',
    emptyText: 'Nada em preparação',
  },
  {
    id: 'ready',
    label: 'Pronto',
    sublabel: 'Para levantar / entregar',
    statuses: ['ready', 'delivering'],
    headerBg: 'bg-teal-500/15 border-teal-500/30',
    headerText: 'text-teal-300',
    countBg: 'bg-teal-500 text-white',
    emptyText: 'Nada pronto ainda',
  },
]

/* ─── Helpers ────────────────────────────────────────────── */
function currency(x: number) {
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(x)
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })
}

function isTakeaway(order: KitchenOrder) {
  return (order.order_type ?? '').toUpperCase() === 'TAKEAWAY'
}

function getOrderNote(o: KitchenOrder): string | null {
  return (o.note || o.order_note || o.obs || '')?.toString().trim() || null
}

function getItemNote(item: Item): string | null {
  return (item.note || item.options?.note || '')?.toString().trim() || null
}

/* ─── ElapsedTime ────────────────────────────────────────── */
function ElapsedTime({ createdAt, urgent }: { createdAt: string; urgent?: boolean }) {
  const [, setTick] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 20_000)
    return () => clearInterval(id)
  }, [])

  const ms = Date.now() - new Date(createdAt).getTime()
  const totalMins = Math.floor(ms / 60_000)
  const hrs = Math.floor(totalMins / 60)
  const mins = totalMins % 60

  const label = hrs > 0 ? `${hrs}h ${mins}m` : totalMins > 0 ? `${totalMins} min` : 'agora'
  const isLate = totalMins >= 20

  return (
    <span
      className={`tabular-nums font-bold text-sm ${
        isLate
          ? 'text-red-400 animate-pulse'
          : urgent
          ? 'text-yellow-400'
          : 'text-white/50'
      }`}
    >
      ⏱ {label}
    </span>
  )
}

/* ─── KitchenCard ────────────────────────────────────────── */
function KitchenCard({
  order,
  saving,
  onAction,
}: {
  order: KitchenOrder
  saving: boolean
  onAction: (id: string, status: OrderStatus) => void
}) {
  const isPending = order.status === 'pending'
  const isPreparing = order.status === 'preparing'
  const isReady = order.status === 'ready' || order.status === 'delivering'
  const isDelivery = !isTakeaway(order)
  const orderNote = getOrderNote(order)
  const shortId = order.id.slice(0, 8).toUpperCase()

  const actionLabel = isPending
    ? '✅ ACEITAR / PREPARAR'
    : isPreparing
    ? isDelivery
      ? '🚚 PRONTO — ENVIAR'
      : '🛎 PRONTO PARA LEVANTAR'
    : '📦 ENTREGUE / LEVANTADO'

  const nextStatus: OrderStatus = isPending
    ? 'preparing'
    : isPreparing
    ? isDelivery
      ? 'delivering'
      : 'ready'
    : 'done'

  const cardBorder = isPending
    ? 'border-red-500/50 shadow-[0_0_24px_rgba(239,68,68,0.2)]'
    : isPreparing
    ? 'border-orange-500/40 shadow-[0_0_16px_rgba(249,115,22,0.15)]'
    : 'border-teal-500/40 shadow-[0_0_16px_rgba(20,184,166,0.15)]'

  const typeBadge = isTakeaway(order)
    ? 'bg-buns-yellow/15 text-buns-yellow border-buns-yellow/30'
    : 'bg-blue-500/15 text-blue-300 border-blue-500/30'

  const actionBg = isPending
    ? 'bg-buns-yellow text-black hover:bg-yellow-300 shadow-[0_4px_20px_rgba(255,214,10,0.4)]'
    : isPreparing
    ? 'bg-orange-500 text-white hover:bg-orange-400 shadow-[0_4px_20px_rgba(249,115,22,0.3)]'
    : 'bg-teal-500 text-white hover:bg-teal-400 shadow-[0_4px_20px_rgba(20,184,166,0.3)]'

  return (
    <div
      className={`rounded-2xl border-2 bg-neutral-900 flex flex-col gap-0 overflow-hidden transition-all ${cardBorder}`}
    >
      {/* Card header */}
      <div className="flex items-center justify-between gap-2 px-4 pt-4 pb-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-white font-black text-lg leading-none tracking-tight">
            #{shortId}
          </span>
          <span
            className={`px-2 py-0.5 rounded-full border text-xs font-bold uppercase tracking-wide ${typeBadge}`}
          >
            {isTakeaway(order) ? 'Takeaway' : 'Delivery'}
          </span>
          {!isTakeaway(order) && order.zone && (
            <span className="px-2 py-0.5 rounded-full bg-blue-900/50 border border-blue-500/30 text-blue-200 text-xs font-medium truncate">
              📍 {order.zone}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <ElapsedTime createdAt={order.created_at} urgent={isPending} />
          <span className="text-white/40 text-sm tabular-nums">{formatTime(order.created_at)}</span>
        </div>
      </div>

      {/* Customer */}
      <div className="px-4 pb-3 flex items-center gap-3">
        <span className="text-white text-xl font-semibold truncate">{order.name}</span>
        {order.phone && (
          <a
            href={`tel:${order.phone}`}
            className="text-white/50 text-sm hover:text-white/80 tabular-nums transition"
          >
            📞 {order.phone}
          </a>
        )}
      </div>

      {/* Order-level note */}
      {orderNote && (
        <div className="mx-4 mb-3 rounded-xl bg-amber-500/15 border border-amber-500/40 px-3 py-2 flex items-start gap-2">
          <span className="text-amber-400 shrink-0 text-base">⚠️</span>
          <p className="text-amber-200 text-sm font-semibold leading-snug">{orderNote}</p>
        </div>
      )}

      {/* Items */}
      <div className="px-4 pb-3 space-y-2 flex-1">
        {(order.items ?? []).map((item, i) => {
          const note = getItemNote(item)
          const fries = item.options?.fries
          const drink = item.options?.drink
          const ingredients = item.options?.ingredients

          return (
            <div key={i} className="rounded-xl bg-white/5 border border-white/8 px-3 py-2.5">
              <div className="flex items-baseline gap-2">
                <span className="text-buns-yellow font-black text-2xl leading-none tabular-nums">
                  {item.qty}×
                </span>
                <span className="text-white font-bold text-lg leading-tight">{item.name}</span>
                {item.variant && (
                  <span className="text-white/50 text-sm">({item.variant})</span>
                )}
              </div>

              {/* options */}
              {(fries || drink || (ingredients && ingredients.length > 0)) && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {fries && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/70">
                      Batata: {fries}
                    </span>
                  )}
                  {drink && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/70">
                      Bebida: {drink}
                    </span>
                  )}
                  {ingredients && ingredients.length > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/70">
                      Ing.: {ingredients.join(', ')}
                    </span>
                  )}
                </div>
              )}

              {/* item note — most prominent */}
              {note && (
                <div className="mt-2 rounded-lg bg-amber-500/20 border border-amber-500/50 px-2.5 py-1.5">
                  <p className="text-amber-200 text-sm font-bold leading-snug">📝 {note}</p>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Footer: total + action */}
      <div className="px-4 pb-4 pt-1 flex items-center justify-between gap-3">
        <span className="text-buns-yellow font-black text-xl tabular-nums">
          {currency(order.total)}
        </span>
      </div>

      {/* Action button */}
      <div className="px-3 pb-4">
        <button
          disabled={saving}
          onClick={() => onAction(order.id, nextStatus)}
          className={`w-full py-5 rounded-2xl text-xl font-black tracking-wide
            transition active:scale-95 disabled:opacity-50 ${actionBg}`}
        >
          {saving ? '…' : actionLabel}
        </button>
      </div>
    </div>
  )
}

/* ─── KitchenColumn ──────────────────────────────────────── */
function KitchenColumn({ col, orders, saving, onAction }: {
  col: Column
  orders: KitchenOrder[]
  saving: string | null
  onAction: (id: string, status: OrderStatus) => void
}) {
  return (
    <div className="flex flex-col min-h-0 flex-1">
      {/* Column header */}
      <div className={`rounded-xl border px-4 py-3 mb-3 flex items-center justify-between ${col.headerBg}`}>
        <div>
          <p className={`text-lg font-black tracking-wide uppercase ${col.headerText}`}>
            {col.label}
          </p>
          <p className="text-white/40 text-xs mt-0.5">{col.sublabel}</p>
        </div>
        {orders.length > 0 && (
          <span className={`w-9 h-9 rounded-full flex items-center justify-center text-lg font-black ${col.countBg}`}>
            {orders.length}
          </span>
        )}
      </div>

      {/* Cards */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-white/25 gap-2">
            <span className="text-4xl">✓</span>
            <span className="text-sm font-medium">{col.emptyText}</span>
          </div>
        ) : (
          orders.map((o) => (
            <KitchenCard
              key={o.id}
              order={o}
              saving={saving === o.id}
              onAction={onAction}
            />
          ))
        )}
      </div>
    </div>
  )
}

/* ─── Page ───────────────────────────────────────────────── */
export default function KitchenPage() {
  const [orders, setOrders] = useState<KitchenOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [errMsg, setErrMsg] = useState<string | null>(null)

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  /* ── fetch ── */
  const fetchOrders = useCallback(async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .in('status', ['pending', 'preparing', 'ready', 'delivering'])
      .order('created_at', { ascending: true })

    if (error) {
      console.error('[KITCHEN] query error', error)
      setErrMsg(error.message)
    } else {
      const orders = (data ?? []) as unknown as KitchenOrder[]
      console.log('[KITCHEN] loaded orders count', orders.length)
      console.log(
        '[KITCHEN] active orders by status',
        orders.reduce<Record<string, number>>((acc, o) => {
          acc[o.status] = (acc[o.status] ?? 0) + 1
          return acc
        }, {})
      )
      setOrders(orders)
    }
    setLoading(false)
  }, [])

  /* ── realtime ── */
  const openRealtime = useCallback(() => {
    if (channelRef.current) supabase.removeChannel(channelRef.current)

    const ch = supabase
      .channel('kitchen-rt')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (p) => {
          const row = p.new as KitchenOrder | undefined
          const ACTIVE: OrderStatus[] = ['pending', 'preparing', 'ready', 'delivering']

          if (p.eventType === 'INSERT') {
            if (row && ACTIVE.includes(row.status)) {
              setOrders((prev) =>
                prev.find((o) => o.id === row.id)
                  ? prev
                  : [...prev, row].sort(
                      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                    )
              )
            }
            return
          }

          if (p.eventType === 'UPDATE') {
            if (row) {
              if (ACTIVE.includes(row.status)) {
                setOrders((prev) => {
                  const exists = prev.find((o) => o.id === row.id)
                  if (exists) return prev.map((o) => (o.id === row.id ? row : o))
                  return [...prev, row].sort(
                    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                  )
                })
              } else {
                // moved to done/cancelled — remove from board
                setOrders((prev) => prev.filter((o) => o.id !== row.id))
              }
            }
            return
          }

          if (p.eventType === 'DELETE') {
            const oldId = (p.old as any)?.id
            if (oldId) setOrders((prev) => prev.filter((o) => o.id !== oldId))
          }
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setTimeout(openRealtime, 1500)
        }
      })

    channelRef.current = ch
  }, [])

  useEffect(() => {
    fetchOrders().then(openRealtime)

    // Polling fallback every 10 s
    pollRef.current = setInterval(fetchOrders, 10_000)

    const onVis = () => { if (document.visibilityState === 'visible') fetchOrders() }
    document.addEventListener('visibilitychange', onVis)

    return () => {
      document.removeEventListener('visibilitychange', onVis)
      if (pollRef.current) clearInterval(pollRef.current)
      if (channelRef.current) supabase.removeChannel(channelRef.current)
    }
  }, [fetchOrders, openRealtime])

  /* ── sound ── */
  const hasAlerts = useMemo(
    () => orders.some((o) => o.status === 'pending' && !o.acknowledged),
    [orders]
  )
  const { soundEnabled, soundBlocked, toggleSound, alarmActive } = useOrderSounds(hasAlerts)

  /* ── update status ── */
  const handleAction = useCallback(async (id: string, status: OrderStatus) => {
    try {
      setSaving(id)
      setErrMsg(null)
      const patch: Record<string, unknown> = { status }
      if (status !== 'pending') patch.acknowledged = true
      const { error } = await supabase.from('orders').update(patch).eq('id', id)
      if (error) throw error
      await fetchOrders()
    } catch (e: any) {
      setErrMsg(e?.message || 'Erro ao atualizar.')
    } finally {
      setSaving(null)
    }
  }, [fetchOrders])

  /* ── derive columns ── */
  const columnOrders = useMemo(() => {
    const map: Record<string, KitchenOrder[]> = {}
    for (const col of COLUMNS) {
      map[col.id] = orders.filter((o) => (col.statuses as string[]).includes(o.status))
    }
    return map
  }, [orders])

  /* ── render ── */
  return (
    <div className="h-[calc(100dvh-3.5rem)] flex flex-col bg-neutral-950 text-white overflow-hidden">

      {/* Top bar */}
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-white/10 bg-neutral-900 shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/orders"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white/70 text-sm font-medium transition"
          >
            ← Admin Orders
          </Link>
          <div>
            <p className="font-black text-lg leading-none">
              <span className="text-buns-yellow">BUNS</span>
              <span className="ml-1.5 text-white">Kitchen</span>
            </p>
            <p className="text-white/40 text-xs">
              {orders.length} pedido{orders.length !== 1 ? 's' : ''} ativos
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {errMsg && (
            <span className="text-red-400 text-sm font-medium">{errMsg}</span>
          )}
          {loading && (
            <span className="text-white/40 text-sm">A carregar…</span>
          )}

          {soundBlocked && (
            <span className="text-red-300 text-sm font-bold animate-pulse">
              🔇 Som bloqueado — clica Ativar som
            </span>
          )}

          {alarmActive && (
            <span className="px-3 py-1.5 rounded-xl bg-red-600 text-white text-sm font-black animate-pulse">
              🔔 Alarme ativo
            </span>
          )}

          <button
            onClick={toggleSound}
            aria-pressed={soundEnabled}
            className={`px-3 py-2 rounded-xl text-sm font-bold transition ${
              soundEnabled
                ? 'bg-buns-yellow text-black'
                : 'bg-white/10 text-white/70 hover:bg-white/15'
            }`}
          >
            {soundEnabled ? '🔊 Som ativo' : '🔈 Ativar som'}
          </button>
        </div>
      </div>

      {/* Alert banner — new unacknowledged orders */}
      {hasAlerts && (
        <div className="bg-red-600 px-4 py-2 flex items-center justify-between gap-3 shrink-0 animate-pulse">
          <span className="text-white font-black text-base">
            🔔 NOVO PEDIDO — Aceita na coluna da esquerda!
          </span>
          <span className="text-red-100 text-sm">
            {orders.filter((o) => o.status === 'pending' && !o.acknowledged).length} por aceitar
          </span>
        </div>
      )}

      {/* 3-column board */}
      <div className="flex-1 min-h-0 grid grid-cols-3 gap-3 p-3">
        {COLUMNS.map((col) => (
          <KitchenColumn
            key={col.id}
            col={col}
            orders={columnOrders[col.id] ?? []}
            saving={saving}
            onAction={handleAction}
          />
        ))}
      </div>
    </div>
  )
}
