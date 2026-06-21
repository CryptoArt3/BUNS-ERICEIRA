'use client'

import { useEffect, useMemo, useState } from 'react'

type EventStatus = 'confirmed' | 'planned' | 'pending' | 'deciding' | 'exploring'

type CalendarEvent = {
  id: string
  title: string
  description: string | null
  status: EventStatus
  event_date: string | null
  recurring: string | null
  recurring_start_date: string | null
}

/* ── Status config ─────────────────────────────────────────── */
const STATUS_LABEL: Record<EventStatus, string> = {
  confirmed: 'Confirmado',
  planned:   'Planeado',
  pending:   'Pendente',
  deciding:  'A decidir',
  exploring: 'A explorar',
}

const STATUS_CLASS: Record<EventStatus, string> = {
  confirmed: 'bg-green-500/20 text-green-300 border border-green-500/30',
  planned:   'bg-emerald-500/15 text-emerald-300 border border-emerald-500/25',
  pending:   'bg-orange-500/20 text-orange-300 border border-orange-500/30',
  deciding:  'bg-amber-500/20 text-amber-300 border border-amber-500/30',
  exploring: 'bg-violet-500/20 text-violet-300 border border-violet-500/30',
}

const STATUS_DOT: Record<EventStatus, string> = {
  confirmed: 'bg-green-400',
  planned:   'bg-emerald-400',
  pending:   'bg-orange-400',
  deciding:  'bg-amber-400',
  exploring: 'bg-violet-400',
}

/* ── Recurring expansion ───────────────────────────────────── */
const DAY_MAP: Record<string, number> = {
  sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
  thursday: 4, friday: 5, saturday: 6,
}

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function expandRecurring(event: CalendarEvent, year: number, month: number): string[] {
  if (!event.recurring || !event.recurring_start_date) return []
  const target = DAY_MAP[event.recurring.toLowerCase()]
  if (target === undefined) return []
  const start = new Date(event.recurring_start_date + 'T00:00:00')
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const dates: string[] = []
  for (let d = 1; d <= daysInMonth; d++) {
    const dt = new Date(year, month, d)
    if (dt.getDay() === target && dt >= start) dates.push(toDateStr(dt))
  }
  return dates
}

/* ── Build a map: dateStr → events[] ──────────────────────── */
function buildDayMap(events: CalendarEvent[], year: number, month: number): Map<string, CalendarEvent[]> {
  const map = new Map<string, CalendarEvent[]>()

  const add = (date: string, ev: CalendarEvent) => {
    if (!map.has(date)) map.set(date, [])
    map.get(date)!.push(ev)
  }

  for (const ev of events) {
    if (ev.recurring) {
      for (const date of expandRecurring(ev, year, month)) add(date, ev)
    } else if (ev.event_date) {
      const d = new Date(ev.event_date + 'T00:00:00')
      if (d.getFullYear() === year && d.getMonth() === month) add(ev.event_date, ev)
    }
  }

  return map
}

/* ── Calendar grid (weeks start Monday) ───────────────────── */
function calendarGrid(year: number, month: number): (number | null)[] {
  const first = new Date(year, month, 1).getDay()
  const offset = (first + 6) % 7 // Mon=0
  const days = new Date(year, month + 1, 0).getDate()
  const grid: (number | null)[] = Array(offset).fill(null)
  for (let d = 1; d <= days; d++) grid.push(d)
  while (grid.length % 7 !== 0) grid.push(null)
  return grid
}

const MONTH_PT = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
]
const WEEK_PT = ['Seg','Ter','Qua','Qui','Sex','Sáb','Dom']

/* ── Component ─────────────────────────────────────────────── */
export default function EventosPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const now = new Date()
  const [viewYear, setViewYear]   = useState(now.getFullYear())
  const [viewMonth, setViewMonth] = useState(now.getMonth())
  const [selectedDay, setSelectedDay] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/calendar')
      .then((r) => r.json())
      .then((data) => {
        if (!Array.isArray(data)) { setError(true); return }
        setEvents(data)
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  const dayMap = useMemo(
    () => buildDayMap(events, viewYear, viewMonth),
    [events, viewYear, viewMonth]
  )

  const grid = useMemo(() => calendarGrid(viewYear, viewMonth), [viewYear, viewMonth])

  const undatedEvents = useMemo(
    () => events.filter((ev) => !ev.event_date && !ev.recurring),
    [events]
  )

  const selectedEvents = selectedDay ? (dayMap.get(selectedDay) ?? []) : []

  function prevMonth() {
    if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11) }
    else setViewMonth((m) => m - 1)
    setSelectedDay(null)
  }

  function nextMonth() {
    if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0) }
    else setViewMonth((m) => m + 1)
    setSelectedDay(null)
  }

  function toggleDay(dateStr: string) {
    setSelectedDay((prev) => (prev === dateStr ? null : dateStr))
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">

        {/* Header */}
        <div className="space-y-1">
          <p className="text-buns-yellow font-black text-xs uppercase tracking-[0.25em]">BUNS Ericeira</p>
          <h1 className="font-display text-white text-5xl uppercase leading-none">Eventos</h1>
        </div>

        {/* Loading / error */}
        {loading && (
          <div className="space-y-3">
            <div className="h-64 rounded-2xl bg-white/5 animate-pulse" />
          </div>
        )}
        {error && (
          <p className="text-white/30 text-sm">Erro ao carregar eventos. Tenta mais tarde.</p>
        )}

        {!loading && !error && (
          <>
            {/* ── Calendar ── */}
            <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">

              {/* Month nav */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
                <button
                  onClick={prevMonth}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/8 transition text-lg"
                >
                  ‹
                </button>
                <span className="font-black text-white text-sm uppercase tracking-widest">
                  {MONTH_PT[viewMonth]} {viewYear}
                </span>
                <button
                  onClick={nextMonth}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/8 transition text-lg"
                >
                  ›
                </button>
              </div>

              {/* Weekday headers */}
              <div className="grid grid-cols-7 border-b border-white/8">
                {WEEK_PT.map((d) => (
                  <div key={d} className="py-2 text-center text-[10px] font-black uppercase tracking-widest text-white/25">
                    {d}
                  </div>
                ))}
              </div>

              {/* Days grid */}
              <div className="grid grid-cols-7">
                {grid.map((day, idx) => {
                  if (!day) {
                    return <div key={`empty-${idx}`} className="h-16 border-b border-r border-white/5 last:border-r-0" />
                  }
                  const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                  const dayEvents = dayMap.get(dateStr) ?? []
                  const isToday = dateStr === toDateStr(new Date())
                  const isSelected = selectedDay === dateStr
                  const colIdx = idx % 7

                  return (
                    <button
                      key={dateStr}
                      onClick={() => dayEvents.length > 0 ? toggleDay(dateStr) : undefined}
                      className={`
                        h-16 p-1.5 border-b border-r border-white/5 text-left transition-colors
                        ${colIdx === 6 ? 'border-r-0' : ''}
                        ${dayEvents.length > 0 ? 'cursor-pointer hover:bg-white/5' : 'cursor-default'}
                        ${isSelected ? 'bg-white/8' : ''}
                      `}
                    >
                      <span className={`
                        inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-black mb-1
                        ${isToday ? 'bg-buns-yellow text-black' : 'text-white/50'}
                      `}>
                        {day}
                      </span>
                      <div className="flex flex-wrap gap-0.5">
                        {dayEvents.slice(0, 3).map((ev, i) => (
                          <span
                            key={`${ev.id}-${i}`}
                            className={`inline-block w-2 h-2 rounded-full ${STATUS_DOT[ev.status]}`}
                          />
                        ))}
                        {dayEvents.length > 3 && (
                          <span className="text-[8px] text-white/30 font-black leading-none self-center">
                            +{dayEvents.length - 3}
                          </span>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* ── Status legend ── */}
            <div className="flex flex-wrap gap-2">
              {(Object.keys(STATUS_LABEL) as EventStatus[]).map((s) => (
                <span key={s} className={`text-[10px] font-black uppercase tracking-wide px-2 py-1 rounded-full ${STATUS_CLASS[s]}`}>
                  {STATUS_LABEL[s]}
                </span>
              ))}
            </div>

            {/* ── Selected day panel ── */}
            {selectedDay && selectedEvents.length > 0 && (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4">
                <p className="text-[11px] font-black uppercase tracking-widest text-white/35">
                  {new Date(selectedDay + 'T00:00:00').toLocaleDateString('pt-PT', {
                    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
                  })}
                </p>
                <div className="space-y-3">
                  {selectedEvents.map((ev) => (
                    <div
                      key={ev.id}
                      className="flex items-start gap-3 rounded-xl border border-white/8 bg-zinc-950/50 p-4"
                    >
                      <span className={`mt-1 shrink-0 inline-block w-2.5 h-2.5 rounded-full ${STATUS_DOT[ev.status]}`} />
                      <div className="min-w-0 flex-1">
                        <p className="font-black text-white text-sm leading-tight">{ev.title}</p>
                        {ev.description && (
                          <p className="text-white/45 text-xs mt-1 leading-relaxed">{ev.description}</p>
                        )}
                      </div>
                      <span className={`shrink-0 text-[9px] font-black uppercase tracking-wide px-2 py-0.5 rounded-full ${STATUS_CLASS[ev.status]}`}>
                        {STATUS_LABEL[ev.status]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Events with date in this month (list view) ── */}
            {(() => {
              const monthEvents: { date: string; events: CalendarEvent[] }[] = []
              dayMap.forEach((evs, date) => {
                monthEvents.push({ date, events: evs })
              })
              monthEvents.sort((a, b) => a.date.localeCompare(b.date))
              if (monthEvents.length === 0) return (
                <p className="text-white/20 text-sm text-center py-4">Sem eventos este mês.</p>
              )
              return null
            })()}

            {/* ── Undated events ── */}
            {undatedEvents.length > 0 && (
              <div className="space-y-3">
                <p className="text-[11px] font-black uppercase tracking-widest text-white/35">
                  Em estudo / sem data
                </p>
                <div className="space-y-2">
                  {undatedEvents.map((ev) => (
                    <div
                      key={ev.id}
                      className="flex items-start gap-3 rounded-xl border border-white/8 bg-white/5 px-4 py-3"
                    >
                      <span className={`mt-1 shrink-0 inline-block w-2 h-2 rounded-full ${STATUS_DOT[ev.status]}`} />
                      <div className="min-w-0 flex-1">
                        <p className="font-black text-white text-sm">{ev.title}</p>
                        {ev.description && (
                          <p className="text-white/40 text-xs mt-0.5 leading-relaxed">{ev.description}</p>
                        )}
                      </div>
                      <span className={`shrink-0 text-[9px] font-black uppercase tracking-wide px-2 py-0.5 rounded-full ${STATUS_CLASS[ev.status]}`}>
                        {STATUS_LABEL[ev.status]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  )
}
