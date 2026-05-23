'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

/* ── Types ─────────────────────────────────────────────────── */
type DateRange = 'today' | 'yesterday' | '7d' | '30d'

type OrderRow = {
  id: string
  created_at: string
  status: string
  order_type: string
  payment_method: string
  total: number
  items: { id: string; name: string; qty: number; price: number }[] | null
}

type EventRow = {
  event_name: string
  language: string | null
  is_pwa: boolean | null
  session_id: string | null
  metadata: Record<string, unknown> | null
}

type LiveRow = {
  session_id: string | null
  path: string | null
  is_pwa: boolean | null
  created_at: string
}

type LiveData = {
  onlineNow: number
  uniqueToday: number
  topPages: { path: string; count: number }[]
  pwaNow: number
  browserNow: number
}

/* ── Helpers ────────────────────────────────────────────────── */
const euro = (n: number) =>
  new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(n)

function pct(a: number, b: number) {
  return b > 0 ? Math.round((a / b) * 100) : 0
}

function getDateRange(r: DateRange): [string, string] {
  const sod = new Date()
  sod.setHours(0, 0, 0, 0)
  const eod = new Date(sod.getTime() + 86_400_000)
  switch (r) {
    case 'today':     return [sod.toISOString(), eod.toISOString()]
    case 'yesterday': return [new Date(sod.getTime() - 86_400_000).toISOString(), sod.toISOString()]
    case '7d':        return [new Date(sod.getTime() - 6 * 86_400_000).toISOString(), eod.toISOString()]
    case '30d':       return [new Date(sod.getTime() - 29 * 86_400_000).toISOString(), eod.toISOString()]
  }
}

/* ── Sub-components ─────────────────────────────────────────── */
function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-white/10 bg-white/5 p-5 ${className}`}>
      {children}
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-black uppercase tracking-widest text-white/35 mb-4">{children}</p>
  )
}

function KpiCard({
  label, value, sub, accent = false,
}: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div className={`rounded-2xl border p-5 ${accent
      ? 'border-buns-yellow/40 bg-buns-yellow/8'
      : 'border-white/10 bg-white/5'
    }`}>
      <p className="text-[11px] font-black uppercase tracking-widest text-white/40 mb-2">{label}</p>
      <p className={`font-display text-3xl sm:text-4xl leading-none ${accent ? 'text-buns-yellow' : 'text-white'}`}>
        {value}
      </p>
      {sub && <p className="text-xs text-white/30 mt-1.5">{sub}</p>}
    </div>
  )
}

function HourlyChart({ data }: { data: number[] }) {
  const max = Math.max(...data, 1)
  const peakH = data.indexOf(Math.max(...data))
  return (
    <div>
      <div className="flex items-end gap-px h-20">
        {data.map((v, h) => (
          <div
            key={h}
            title={`${String(h).padStart(2, '0')}h — ${v} pedido${v !== 1 ? 's' : ''}`}
            className="flex-1 rounded-t-sm cursor-default"
            style={{
              height: `${Math.max((v / max) * 100, v > 0 ? 4 : 0)}%`,
              backgroundColor: h === peakH && v > 0 ? '#FFD400' : 'rgba(255,255,255,0.18)',
            }}
          />
        ))}
      </div>
      <div className="flex justify-between mt-1.5">
        {['00h', '06h', '12h', '18h', '23h'].map((l) => (
          <span key={l} className="text-[9px] text-white/30">{l}</span>
        ))}
      </div>
    </div>
  )
}

function BarRow({
  label, count, revenue, total, color = '#FFD400',
}: { label: string; count: number; revenue: number; total: number; color?: string }) {
  const w = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div className="flex items-center gap-3">
      <span className="text-white/60 text-sm w-20 shrink-0 capitalize">{label}</span>
      <div className="flex-1 h-2 bg-white/8 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${w}%`, backgroundColor: color }} />
      </div>
      <span className="text-white/50 text-xs w-6 text-right">{w}%</span>
      <span className="text-white font-black text-sm w-20 text-right">{euro(revenue)}</span>
      <span className="text-white/35 text-xs w-8 text-right">{count}x</span>
    </div>
  )
}

function FunnelStep({
  label, count, fromCount, isFirst,
}: { label: string; count: number; fromCount: number; isFirst: boolean }) {
  const conv = isFirst ? 100 : pct(count, fromCount)
  const width = isFirst ? 100 : Math.max(pct(count, fromCount), 4)
  return (
    <div>
      {!isFirst && (
        <div className="flex items-center gap-2 py-0.5 pl-4">
          <span className="text-white/20 text-xs">▼</span>
          <span className="text-white/25 text-xs">{conv}% conversão</span>
        </div>
      )}
      <div className="flex items-center gap-3">
        <div
          className="h-9 rounded-xl flex items-center px-4 transition-all"
          style={{ width: `${width}%`, minWidth: '40%', backgroundColor: isFirst ? '#FFD400' : 'rgba(255,255,255,0.1)' }}
        >
          <span className={`font-black text-sm truncate ${isFirst ? 'text-black' : 'text-white'}`}>{label}</span>
        </div>
        <span className="font-black text-white text-lg shrink-0">{count.toLocaleString()}</span>
      </div>
    </div>
  )
}

/* ── Status accent colours ─────────────────────────────────── */
const STATUS_COLOR: Record<string, string> = {
  pending:    'text-orange-400',
  preparing:  'text-yellow-400',
  ready:      'text-green-400',
  delivering: 'text-blue-400',
  done:       'text-white/50',
  cancelled:  'text-red-400',
}
const STATUS_PT: Record<string, string> = {
  pending: 'Pendente', preparing: 'A preparar', ready: 'Pronto',
  delivering: 'A entregar', done: 'Entregue', cancelled: 'Cancelado',
}
const PAYMENT_PT: Record<string, string> = {
  cash: 'Dinheiro', mbway: 'MB Way', card: 'Cartão', unknown: '—',
}

/* ── Page ───────────────────────────────────────────────────── */
export default function AdminAnalyticsPage() {
  const [range, setRange] = useState<DateRange>('today')
  const [orders, setOrders] = useState<OrderRow[]>([])
  const [events, setEvents] = useState<EventRow[] | null>(null)
  const [eventsUnavailable, setEventsUnavailable] = useState(false)
  const [loading, setLoading] = useState(true)
  const [tick, setTick] = useState(0)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [liveData, setLiveData] = useState<LiveData | null>(null)
  const [liveAvailable, setLiveAvailable] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const [from, to] = getDateRange(range)

    const [ordRes, evtRes] = await Promise.all([
      supabase
        .from('orders')
        .select('id,created_at,status,order_type,payment_method,total,items')
        .gte('created_at', from)
        .lt('created_at', to),
      supabase
        .from('analytics_events')
        .select('event_name,language,is_pwa,session_id,metadata')
        .gte('created_at', from)
        .lt('created_at', to),
    ])

    if (!ordRes.error) setOrders((ordRes.data ?? []) as OrderRow[])

    if (evtRes.error) {
      setEventsUnavailable(true)
      setEvents(null)
    } else {
      setEvents((evtRes.data ?? []) as EventRow[])
      setEventsUnavailable(false)
    }

    setLastUpdated(new Date())
    setLoading(false)
  }, [range, tick]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load() }, [load])

  /* ── Live visitors (independent 15-second refresh) ── */
  const fetchLive = useCallback(async () => {
    const sod = new Date(); sod.setHours(0, 0, 0, 0)
    const fiveMinAgo = new Date(Date.now() - 5 * 60_000).toISOString()
    const twoMinAgo  = new Date(Date.now() - 2 * 60_000).toISOString()

    const [recentRes, todayRes] = await Promise.all([
      supabase.from('analytics_events').select('session_id,path,is_pwa,created_at').gte('created_at', fiveMinAgo),
      supabase.from('analytics_events').select('session_id').gte('created_at', sod.toISOString()).not('session_id', 'is', null),
    ])

    if (recentRes.error) { setLiveAvailable(false); return }
    setLiveAvailable(true)

    const todaySessions = new Set(
      ((todayRes.data ?? []) as { session_id: string }[]).map((r) => r.session_id)
    )

    if (!recentRes.data || recentRes.data.length === 0) {
      setLiveData({ onlineNow: 0, uniqueToday: todaySessions.size, topPages: [], pwaNow: 0, browserNow: 0 })
      return
    }

    // Keep most-recent event per session to get current page + is_pwa state
    const latest: Record<string, { path: string | null; is_pwa: boolean; created_at: string }> = {}
    for (const row of recentRes.data as LiveRow[]) {
      if (!row.session_id) continue
      const ex = latest[row.session_id]
      if (!ex || row.created_at > ex.created_at) {
        latest[row.session_id] = { path: row.path, is_pwa: row.is_pwa ?? false, created_at: row.created_at }
      }
    }

    const all    = Object.values(latest)
    const twoMin = all.filter((s) => s.created_at >= twoMinAgo)

    const pathCounts: Record<string, number> = {}
    for (const s of all) pathCounts[s.path || '/'] = (pathCounts[s.path || '/'] ?? 0) + 1

    setLiveData({
      onlineNow:   twoMin.length,
      uniqueToday: todaySessions.size,
      topPages:    Object.entries(pathCounts)
                     .sort((a, b) => b[1] - a[1])
                     .slice(0, 5)
                     .map(([path, count]) => ({ path, count })),
      pwaNow:      twoMin.filter((s) => s.is_pwa).length,
      browserNow:  twoMin.filter((s) => !s.is_pwa).length,
    })
  }, [])

  useEffect(() => {
    fetchLive()
    const id = setInterval(fetchLive, 15_000)
    return () => clearInterval(id)
  }, [fetchLive])

  /* ── Order metrics ── */
  const m = useMemo(() => {
    const active = orders.filter((o) => o.status !== 'cancelled')
    const revenue = active.reduce((s, o) => s + (o.total ?? 0), 0)
    const orderCount = active.length
    const aov = orderCount > 0 ? revenue / orderCount : 0
    const completed = orders.filter((o) => o.status === 'done').length
    const cancelled = orders.filter((o) => o.status === 'cancelled').length

    const statusCounts: Record<string, number> = {}
    for (const o of orders) statusCounts[o.status] = (statusCounts[o.status] ?? 0) + 1

    const paymentMap: Record<string, { count: number; rev: number }> = {}
    const typeMap: Record<string, { count: number; rev: number }> = {}
    for (const o of active) {
      const pm = o.payment_method || 'unknown'
      if (!paymentMap[pm]) paymentMap[pm] = { count: 0, rev: 0 }
      paymentMap[pm].count++
      paymentMap[pm].rev += o.total ?? 0

      const ot = (o.order_type || 'unknown').toUpperCase()
      if (!typeMap[ot]) typeMap[ot] = { count: 0, rev: 0 }
      typeMap[ot].count++
      typeMap[ot].rev += o.total ?? 0
    }

    const productMap: Record<string, { name: string; qty: number; rev: number }> = {}
    for (const o of active) {
      for (const it of Array.isArray(o.items) ? o.items : []) {
        if (!productMap[it.id]) productMap[it.id] = { name: it.name, qty: 0, rev: 0 }
        productMap[it.id].qty += it.qty ?? 1
        productMap[it.id].rev += (it.price ?? 0) * (it.qty ?? 1)
      }
    }
    const topProducts = Object.entries(productMap)
      .map(([id, v]) => ({ id, ...v }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 12)

    const hourly = new Array(24).fill(0)
    for (const o of active) hourly[new Date(o.created_at).getHours()]++

    return { revenue, orderCount, aov, completed, cancelled, statusCounts, paymentMap, typeMap, topProducts, hourly }
  }, [orders])

  /* ── Funnel metrics ── */
  const fm = useMemo(() => {
    if (!events) return null
    const counts: Record<string, number> = {}
    let langPt = 0, langEn = 0
    const sessions = new Set<string>()
    const pwaSessions = new Set<string>()
    const collabsPkgCounts: Record<string, number> = {}

    for (const e of events) {
      counts[e.event_name] = (counts[e.event_name] ?? 0) + 1
      if (e.language === 'pt') langPt++
      else if (e.language === 'en') langEn++
      if (e.session_id) {
        sessions.add(e.session_id)
        if (e.is_pwa) pwaSessions.add(e.session_id)
      }
      if (e.event_name === 'collabs_package_selected' && e.metadata) {
        const pkg = e.metadata.package as string | undefined
        if (pkg) collabsPkgCounts[pkg] = (collabsPkgCounts[pkg] ?? 0) + 1
      }
    }
    return { counts, langPt, langEn, sessionCount: sessions.size, pwaSessionCount: pwaSessions.size, collabsPkgCounts }
  }, [events])

  const RANGE_LABELS: Record<DateRange, string> = {
    today: 'Hoje', yesterday: 'Ontem', '7d': '7 Dias', '30d': '30 Dias',
  }

  const FUNNEL_STEPS = [
    { key: 'menu_view',       label: 'Menu Aberto' },
    { key: 'product_add',     label: 'Produto Adicionado' },
    { key: 'cart_view',       label: 'Carrinho Visto' },
    { key: 'checkout_start',  label: 'Checkout Iniciado' },
    { key: 'order_submitted', label: 'Pedido Feito' },
  ]

  /* ── Derived for bar rows ── */
  const totalPaymentOrders = Object.values(m.paymentMap).reduce((s, v) => s + v.count, 0)
  const totalTypeOrders    = Object.values(m.typeMap).reduce((s, v) => s + v.count, 0)
  const topProductRevTotal = m.topProducts.reduce((s, p) => s + p.rev, 0)

  /* ── Render ─────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">

        {/* ── Page header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-buns-yellow uppercase text-3xl sm:text-4xl leading-none">
              Analytics
            </h1>
            {lastUpdated && !loading && (
              <p className="text-white/30 text-xs mt-1">
                Atualizado às {lastUpdated.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {(Object.keys(RANGE_LABELS) as DateRange[]).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-4 py-2 rounded-xl text-sm font-black uppercase tracking-wide transition ${
                  range === r
                    ? 'bg-buns-yellow text-black'
                    : 'bg-white/8 text-white/60 hover:bg-white/12 hover:text-white'
                }`}
              >
                {RANGE_LABELS[r]}
              </button>
            ))}
            <button
              onClick={() => setTick((t) => t + 1)}
              className="px-3 py-2 rounded-xl bg-white/8 text-white/40 hover:text-white transition text-lg"
              title="Atualizar"
            >
              ↻
            </button>
          </div>
        </div>

        {/* ── Live Visitors ── */}
        {liveAvailable && (
          <div className={`rounded-2xl border p-5 transition-colors ${
            liveData && liveData.onlineNow > 0
              ? 'border-green-500/30 bg-green-500/5'
              : 'border-white/10 bg-white/5'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                {/* Pulse dot */}
                <span className="relative flex h-2.5 w-2.5 shrink-0">
                  {liveData && liveData.onlineNow > 0 ? (
                    <>
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-60" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-400" />
                    </>
                  ) : (
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white/20" />
                  )}
                </span>
                <p className="text-[11px] font-black uppercase tracking-widest text-white/40">
                  Visitantes em Tempo Real
                </p>
              </div>
              <span className="text-[10px] text-white/20 tabular-nums">↻ 15s</span>
            </div>

            {liveData === null ? (
              <div className="h-14 bg-white/5 rounded-xl animate-pulse" />
            ) : (
              <div className="flex flex-col sm:flex-row gap-6">

                {/* ── Counts ── */}
                <div className="flex gap-8 shrink-0">
                  <div>
                    <p className={`font-display text-5xl leading-none tabular-nums ${
                      liveData.onlineNow > 0 ? 'text-green-400' : 'text-white/20'
                    }`}>
                      {liveData.onlineNow}
                    </p>
                    <p className="text-[11px] uppercase tracking-widest text-white/35 mt-1.5">Online agora</p>
                    {liveData.onlineNow > 0 && (
                      <div className="flex gap-3 mt-2">
                        <span className="text-xs text-white/40">📱 PWA: <strong className="text-white/70">{liveData.pwaNow}</strong></span>
                        <span className="text-xs text-white/40">🌐 Browser: <strong className="text-white/70">{liveData.browserNow}</strong></span>
                      </div>
                    )}
                  </div>

                  <div className="w-px bg-white/8 self-stretch" />

                  <div>
                    <p className="font-display text-5xl leading-none tabular-nums text-white">
                      {liveData.uniqueToday}
                    </p>
                    <p className="text-[11px] uppercase tracking-widest text-white/35 mt-1.5">Sessões únicas hoje</p>
                  </div>
                </div>

                {/* ── Top pages ── */}
                {liveData.topPages.length > 0 && (
                  <>
                    <div className="hidden sm:block w-px bg-white/8 self-stretch" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] uppercase tracking-widest text-white/25 mb-2.5">Páginas ativas</p>
                      <div className="space-y-1.5">
                        {liveData.topPages.map(({ path, count }) => (
                          <div key={path} className="flex items-center gap-2">
                            <span className="text-white/50 text-xs font-mono truncate flex-1">{path}</span>
                            <span className="shrink-0 min-w-[20px] text-right font-black text-xs text-white">{count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

              </div>
            )}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[1,2,3,4].map((n) => (
              <div key={n} className="rounded-2xl border border-white/10 bg-white/5 p-5 h-28 animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {/* ── KPI Cards ── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <KpiCard accent label="Receita" value={euro(m.revenue)} sub={`${m.orderCount} pedido${m.orderCount !== 1 ? 's' : ''}`} />
              <KpiCard label="Pedidos" value={String(m.orderCount)} sub={`${m.cancelled} cancelado${m.cancelled !== 1 ? 's' : ''}`} />
              <KpiCard label="Ticket Médio" value={euro(m.aov)} />
              <KpiCard
                label="Taxa Conclusão"
                value={`${pct(m.completed, m.orderCount)}%`}
                sub={`${m.completed} entregue${m.completed !== 1 ? 's' : ''}`}
              />
            </div>

            {/* ── Status breakdown ── */}
            <Card>
              <SectionTitle>Estado dos Pedidos</SectionTitle>
              <div className="flex flex-wrap gap-6">
                {['pending', 'preparing', 'ready', 'delivering', 'done', 'cancelled'].map((s) => (
                  <div key={s} className="flex flex-col items-center gap-1 min-w-[70px]">
                    <span className={`text-3xl font-black ${STATUS_COLOR[s] ?? 'text-white'}`}>
                      {m.statusCounts[s] ?? 0}
                    </span>
                    <span className="text-[10px] uppercase tracking-widest text-white/35">
                      {STATUS_PT[s]}
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            {/* ── Revenue breakdown ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card>
                <SectionTitle>Por Método de Pagamento</SectionTitle>
                <div className="space-y-3">
                  {Object.entries(m.paymentMap)
                    .sort((a, b) => b[1].rev - a[1].rev)
                    .map(([pm, v]) => (
                      <BarRow
                        key={pm}
                        label={PAYMENT_PT[pm] ?? pm}
                        count={v.count}
                        revenue={v.rev}
                        total={totalPaymentOrders}
                      />
                    ))}
                  {Object.keys(m.paymentMap).length === 0 && (
                    <p className="text-white/25 text-sm">Sem dados</p>
                  )}
                </div>
              </Card>

              <Card>
                <SectionTitle>Por Tipo de Pedido</SectionTitle>
                <div className="space-y-3">
                  {Object.entries(m.typeMap)
                    .sort((a, b) => b[1].rev - a[1].rev)
                    .map(([ot, v]) => (
                      <BarRow
                        key={ot}
                        label={ot === 'TAKEAWAY' ? 'Takeaway' : 'Entrega'}
                        count={v.count}
                        revenue={v.rev}
                        total={totalTypeOrders}
                        color={ot === 'TAKEAWAY' ? '#FFD400' : '#60A5FA'}
                      />
                    ))}
                  {Object.keys(m.typeMap).length === 0 && (
                    <p className="text-white/25 text-sm">Sem dados</p>
                  )}
                  {/* Takeaway revenue highlight */}
                  {m.typeMap['TAKEAWAY'] && (
                    <div className="mt-3 pt-3 border-t border-white/8">
                      <p className="text-[11px] text-white/35 uppercase tracking-widest">Receita Takeaway</p>
                      <p className="text-buns-yellow font-black text-2xl mt-0.5">{euro(m.typeMap['TAKEAWAY'].rev)}</p>
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* ── Top products ── */}
            <Card>
              <SectionTitle>Produtos Mais Vendidos</SectionTitle>
              {m.topProducts.length === 0 ? (
                <p className="text-white/25 text-sm">Sem dados no período selecionado</p>
              ) : (
                <div className="overflow-x-auto -mx-1">
                  <table className="w-full text-sm min-w-[400px]">
                    <thead>
                      <tr className="text-[10px] uppercase tracking-widest text-white/30 border-b border-white/8">
                        <th className="text-left pb-3 font-black">#</th>
                        <th className="text-left pb-3 font-black">Produto</th>
                        <th className="text-right pb-3 font-black">Qtd</th>
                        <th className="text-right pb-3 font-black">Receita</th>
                        <th className="text-right pb-3 font-black">% Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {m.topProducts.map((p, i) => (
                        <tr key={p.id} className="group">
                          <td className="py-2.5 pr-3 text-white/25 font-black">{i + 1}</td>
                          <td className="py-2.5 text-white font-medium leading-tight">{p.name}</td>
                          <td className="py-2.5 text-right">
                            <span className="text-buns-yellow font-black">{p.qty}</span>
                          </td>
                          <td className="py-2.5 text-right text-white/80 font-medium">{euro(p.rev)}</td>
                          <td className="py-2.5 text-right text-white/35 text-xs">
                            {topProductRevTotal > 0 ? pct(p.rev, topProductRevTotal) : 0}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

            {/* ── Hourly distribution ── */}
            <Card>
              <SectionTitle>Distribuição Horária de Pedidos</SectionTitle>
              <HourlyChart data={m.hourly} />
              <p className="text-white/25 text-xs mt-2">
                Hora de pico: {m.hourly.some((v) => v > 0)
                  ? `${String(m.hourly.indexOf(Math.max(...m.hourly))).padStart(2, '0')}h — ${Math.max(...m.hourly)} pedido${Math.max(...m.hourly) !== 1 ? 's' : ''}`
                  : '—'
                }
              </p>
            </Card>

            {/* ── Funnel ── */}
            {eventsUnavailable ? (
              <Card className="border-buns-yellow/20">
                <SectionTitle>Funil de Conversão</SectionTitle>
                <div className="flex items-start gap-3">
                  <span className="text-2xl shrink-0">📊</span>
                  <div>
                    <p className="text-white font-black text-sm">Tabela analytics_events não encontrada</p>
                    <p className="text-white/40 text-sm mt-1 leading-relaxed">
                      Para ativar o funil, corre o ficheiro{' '}
                      <code className="text-buns-yellow bg-white/8 px-1 rounded text-xs">docs/analytics_migration.sql</code>{' '}
                      no Supabase SQL Editor.
                    </p>
                  </div>
                </div>
              </Card>
            ) : fm ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                {/* Conversion funnel */}
                <Card>
                  <SectionTitle>Funil de Conversão</SectionTitle>
                  <div className="space-y-1">
                    {FUNNEL_STEPS.map((step, i) => {
                      const fromKey = i > 0 ? FUNNEL_STEPS[i - 1].key : step.key
                      return (
                        <FunnelStep
                          key={step.key}
                          label={step.label}
                          count={fm.counts[step.key] ?? 0}
                          fromCount={fm.counts[fromKey] ?? 0}
                          isFirst={i === 0}
                        />
                      )
                    })}
                  </div>
                  {/* Abandonment stats */}
                  <div className="mt-5 pt-4 border-t border-white/8 space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-white/40">Abandono carrinho</span>
                      <span className="text-white font-black">
                        {pct(
                          Math.max(0, (fm.counts.cart_view ?? 0) - (fm.counts.checkout_start ?? 0)),
                          fm.counts.cart_view ?? 0
                        )}%
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-white/40">Abandono checkout</span>
                      <span className="text-white font-black">
                        {pct(
                          Math.max(0, (fm.counts.checkout_start ?? 0) - (fm.counts.order_submitted ?? 0)),
                          fm.counts.checkout_start ?? 0
                        )}%
                      </span>
                    </div>
                  </div>
                </Card>

                {/* Audience breakdown */}
                <div className="space-y-4">
                  {/* Language */}
                  <Card>
                    <SectionTitle>Idioma</SectionTitle>
                    <div className="space-y-2.5">
                      {[
                        { label: '🇵🇹 Português', count: fm.langPt, total: fm.langPt + fm.langEn },
                        { label: '🇬🇧 English',   count: fm.langEn, total: fm.langPt + fm.langEn },
                      ].map(({ label, count, total }) => (
                        <div key={label} className="flex items-center gap-3">
                          <span className="text-white/60 text-sm w-28 shrink-0">{label}</span>
                          <div className="flex-1 h-2 bg-white/8 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-buns-yellow rounded-full"
                              style={{ width: `${pct(count, total)}%` }}
                            />
                          </div>
                          <span className="text-white font-black text-sm w-8 text-right">{pct(count, total)}%</span>
                        </div>
                      ))}
                    </div>
                  </Card>

                  {/* PWA + Login */}
                  <Card>
                    <SectionTitle>PWA & Login</SectionTitle>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-white/50 text-sm">Sessões únicas</span>
                        <span className="text-white font-black text-xl">{fm.sessionCount}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-white/50 text-sm">Sessões PWA</span>
                        <span className="text-buns-yellow font-black text-xl">{fm.pwaSessionCount}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-white/50 text-sm">Login iniciado</span>
                        <span className="text-white font-black">{fm.counts.login_started ?? 0}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-white/50 text-sm">Login concluído</span>
                        <span className="text-white font-black">{fm.counts.login_success ?? 0}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-white/50 text-sm">Taxa login</span>
                        <span className="text-white font-black">
                          {pct(fm.counts.login_success ?? 0, fm.counts.login_started ?? 0)}%
                        </span>
                      </div>
                      <div className="pt-2 border-t border-white/8 flex justify-between items-center">
                        <span className="text-white/50 text-sm">Banner PWA visto</span>
                        <span className="text-white font-black">{fm.counts.pwa_install_prompt_seen ?? 0}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-white/50 text-sm">Banner dispensado</span>
                        <span className="text-white font-black">{fm.counts.pwa_install_hint_dismissed ?? 0}</span>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            ) : null}

            {/* ── BUNS & BUNANA COLLABS ── */}
            {fm && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🎬</span>
                  <p className="text-[11px] font-black uppercase tracking-widest text-buns-yellow">
                    BUNS &amp; BUNANA COLLABS
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <KpiCard
                    accent
                    label="Visitas à página"
                    value={String(fm.counts.collabs_view ?? 0)}
                  />
                  <KpiCard
                    label="Pacotes clicados"
                    value={String(fm.counts.collabs_package_selected ?? 0)}
                    sub={`de ${fm.counts.collabs_view ?? 0} visitas`}
                  />
                  <KpiCard
                    label="WhatsApps abertos"
                    value={String(fm.counts.collabs_whatsapp_opened ?? 0)}
                  />
                  <KpiCard
                    label="Taxa conversão"
                    value={`${pct(fm.counts.collabs_whatsapp_opened ?? 0, fm.counts.collabs_view ?? 0)}%`}
                    sub="visita → contacto"
                  />
                </div>

                <Card>
                  <SectionTitle>Pacotes selecionados</SectionTitle>
                  {Object.keys(fm.collabsPkgCounts).length === 0 ? (
                    <p className="text-white/25 text-sm">Sem dados no período selecionado</p>
                  ) : (
                    <div className="space-y-3">
                      {['QUICK DROP', 'CHAOS POST', 'CHAOS EPISODE'].map((pkg) => {
                        const count = fm.collabsPkgCounts[pkg] ?? 0
                        const total = fm.counts.collabs_package_selected ?? 0
                        const w = total > 0 ? Math.round((count / total) * 100) : 0
                        return (
                          <div key={pkg} className="flex items-center gap-3">
                            <span className="text-white/60 text-sm w-32 shrink-0">{pkg}</span>
                            <div className="flex-1 h-2 bg-white/8 rounded-full overflow-hidden">
                              <div className="h-full bg-buns-yellow rounded-full transition-all" style={{ width: `${w}%` }} />
                            </div>
                            <span className="text-white/50 text-xs w-8 text-right">{w}%</span>
                            <span className="text-white font-black text-sm w-6 text-right">{count}x</span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </Card>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
