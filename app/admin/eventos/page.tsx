'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

type EventStatus = 'confirmed' | 'planned' | 'pending' | 'deciding' | 'exploring'

type CalendarEvent = {
  id: string
  title: string
  description: string | null
  status: EventStatus
  event_date: string | null
  recurring: string | null
  recurring_start_date: string | null
  created_at: string
  updated_at: string
}

type FormState = 'idle' | 'loading' | 'success' | 'error'

/* ── Status config ─────────────────────────────────────────── */
const STATUS_OPTIONS: { value: EventStatus; label: string }[] = [
  { value: 'confirmed', label: 'Confirmado'  },
  { value: 'planned',   label: 'Planeado'    },
  { value: 'pending',   label: 'Pendente'    },
  { value: 'deciding',  label: 'A decidir'   },
  { value: 'exploring', label: 'A explorar'  },
]

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

function calendarGrid(year: number, month: number): (number | null)[] {
  const first = new Date(year, month, 1).getDay()
  const offset = (first + 6) % 7
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

/* ── Blank form ────────────────────────────────────────────── */
function blankForm(date = '') {
  return {
    title: '',
    description: '',
    status: 'planned' as EventStatus,
    event_date: date,
    recurring: '',
    recurring_start_date: date,
  }
}

/* ── Auth helper ───────────────────────────────────────────── */
async function getToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token ?? null
}

/* ── Component ─────────────────────────────────────────────── */
export default function AdminEventosPage() {
  const [events, setEvents]   = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)

  const now = new Date()
  const [viewYear, setViewYear]   = useState(now.getFullYear())
  const [viewMonth, setViewMonth] = useState(now.getMonth())
  const [selectedDay, setSelectedDay] = useState<string | null>(null)

  // Form
  const [editingId, setEditingId]   = useState<string | null>(null)
  const [showForm, setShowForm]     = useState(false)
  const [form, setForm]             = useState(blankForm())
  const [formState, setFormState]   = useState<FormState>('idle')
  const [formMsg, setFormMsg]       = useState('')

  // Confirm delete
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/calendar')
    const data = await res.json()
    if (Array.isArray(data)) setEvents(data)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const dayMap = useMemo(
    () => buildDayMap(events, viewYear, viewMonth),
    [events, viewYear, viewMonth]
  )
  const grid = useMemo(() => calendarGrid(viewYear, viewMonth), [viewYear, viewMonth])

  const undatedEvents = useMemo(
    () => events.filter((ev) => !ev.event_date && !ev.recurring),
    [events]
  )

  const selectedDayEvents = selectedDay ? (dayMap.get(selectedDay) ?? []) : []

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

  function openCreate(date = '') {
    setEditingId(null)
    setForm(blankForm(date))
    setFormState('idle')
    setFormMsg('')
    setShowForm(true)
  }

  function openEdit(ev: CalendarEvent) {
    setEditingId(ev.id)
    setForm({
      title:                ev.title,
      description:          ev.description ?? '',
      status:               ev.status,
      event_date:           ev.event_date ?? '',
      recurring:            ev.recurring ?? '',
      recurring_start_date: ev.recurring_start_date ?? '',
    })
    setFormState('idle')
    setFormMsg('')
    setShowForm(true)
    setSelectedDay(null)
  }

  function closeForm() {
    setShowForm(false)
    setEditingId(null)
    setFormMsg('')
    setFormState('idle')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim() || formState === 'loading') return

    setFormState('loading')
    setFormMsg('')
    const token = await getToken()
    if (!token) { setFormState('error'); setFormMsg('Sem sessão activa.'); return }

    const body = {
      title:                form.title.trim(),
      description:          form.description.trim() || null,
      status:               form.status,
      event_date:           form.event_date || null,
      recurring:            form.recurring || null,
      recurring_start_date: form.recurring ? (form.recurring_start_date || null) : null,
      ...(editingId ? { id: editingId } : {}),
    }

    const res = await fetch('/api/calendar', {
      method:  editingId ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body:    JSON.stringify(body),
    })

    if (res.ok) {
      setFormState('success')
      setFormMsg(editingId ? 'Evento actualizado.' : 'Evento criado.')
      await load()
      setTimeout(closeForm, 1200)
    } else {
      const d = await res.json()
      setFormState('error')
      setFormMsg(d.error ?? 'Erro desconhecido.')
    }
  }

  async function handleDelete(id: string) {
    setDeleting(true)
    const token = await getToken()
    if (!token) { setDeleting(false); return }

    const res = await fetch('/api/calendar', {
      method:  'DELETE',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body:    JSON.stringify({ id }),
    })

    if (res.ok) { await load() }
    setDeleteId(null)
    setDeleting(false)
  }

  /* ── Render ─────────────────────────────────────────────── */
  return (
    <main className="min-h-[calc(100vh-3.5rem)] bg-black text-white">
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">

        {/* Header */}
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-buns-yellow font-black text-xs uppercase tracking-[0.25em]">Admin</p>
            <h1 className="font-display text-white text-4xl uppercase leading-none">Eventos</h1>
          </div>
          <button
            onClick={() => openCreate()}
            className="px-4 py-2.5 bg-buns-yellow text-black font-black text-xs uppercase tracking-wide rounded-xl hover:brightness-110 transition active:scale-[0.98]"
          >
            + Novo evento
          </button>
        </div>

        {loading && <div className="h-64 rounded-2xl bg-white/5 animate-pulse" />}

        {!loading && (
          <>
            {/* ── Calendar ── */}
            <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">

              {/* Month nav */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
                <button
                  onClick={prevMonth}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/8 transition text-lg"
                >‹</button>
                <span className="font-black text-white text-sm uppercase tracking-widest">
                  {MONTH_PT[viewMonth]} {viewYear}
                </span>
                <button
                  onClick={nextMonth}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/8 transition text-lg"
                >›</button>
              </div>

              {/* Weekday headers */}
              <div className="grid grid-cols-7 border-b border-white/8">
                {WEEK_PT.map((d) => (
                  <div key={d} className="py-2 text-center text-[10px] font-black uppercase tracking-widest text-white/25">{d}</div>
                ))}
              </div>

              {/* Days */}
              <div className="grid grid-cols-7">
                {grid.map((day, idx) => {
                  if (!day) return (
                    <div key={`e-${idx}`} className="h-20 border-b border-r border-white/5 last:border-r-0" />
                  )

                  const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                  const dayEvents = dayMap.get(dateStr) ?? []
                  const isToday   = dateStr === toDateStr(new Date())
                  const isSelected = selectedDay === dateStr
                  const colIdx = idx % 7

                  return (
                    <div
                      key={dateStr}
                      className={`
                        h-20 p-1.5 border-b border-r border-white/5 flex flex-col
                        ${colIdx === 6 ? 'border-r-0' : ''}
                        ${isSelected ? 'bg-white/8' : 'hover:bg-white/4'}
                        transition-colors
                      `}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span
                          onClick={() => setSelectedDay((p) => p === dateStr ? null : dateStr)}
                          className={`
                            cursor-pointer inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-black
                            ${isToday ? 'bg-buns-yellow text-black' : 'text-white/50 hover:text-white'}
                          `}
                        >
                          {day}
                        </span>
                        <button
                          onClick={() => openCreate(dateStr)}
                          className="w-5 h-5 flex items-center justify-center rounded text-white/20 hover:text-buns-yellow hover:bg-white/8 transition text-xs font-black"
                          title={`Criar evento em ${dateStr}`}
                        >
                          +
                        </button>
                      </div>
                      <div className="flex flex-col gap-0.5 overflow-hidden">
                        {dayEvents.slice(0, 2).map((ev, i) => (
                          <button
                            key={`${ev.id}-${i}`}
                            onClick={() => openEdit(ev)}
                            className="text-left truncate text-[9px] font-black px-1 py-0.5 rounded transition-opacity hover:opacity-75"
                            style={{}}
                          >
                            <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${STATUS_DOT[ev.status]}`} />
                            <span className="text-white/60">{ev.title}</span>
                          </button>
                        ))}
                        {dayEvents.length > 2 && (
                          <span
                            onClick={() => setSelectedDay((p) => p === dateStr ? null : dateStr)}
                            className="text-[9px] text-white/30 font-black px-1 cursor-pointer"
                          >
                            +{dayEvents.length - 2} mais
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* ── Selected day events ── */}
            {selectedDay && selectedDayEvents.length > 0 && (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[11px] font-black uppercase tracking-widest text-white/35">
                    {new Date(selectedDay + 'T00:00:00').toLocaleDateString('pt-PT', {
                      weekday: 'long', day: '2-digit', month: 'long',
                    })}
                  </p>
                  <button
                    onClick={() => openCreate(selectedDay)}
                    className="text-[10px] font-black uppercase tracking-wide text-buns-yellow border border-buns-yellow/30 px-2.5 py-1 rounded-lg hover:bg-buns-yellow/10 transition"
                  >
                    + Adicionar aqui
                  </button>
                </div>
                {selectedDayEvents.map((ev) => (
                  <EventRow
                    key={ev.id}
                    ev={ev}
                    onEdit={() => openEdit(ev)}
                    onDelete={() => setDeleteId(ev.id)}
                    deleteId={deleteId}
                    deleting={deleting}
                    onConfirmDelete={handleDelete}
                    onCancelDelete={() => setDeleteId(null)}
                  />
                ))}
              </div>
            )}

            {/* ── Form panel ── */}
            {showForm && (
              <form
                onSubmit={handleSubmit}
                className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[11px] font-black uppercase tracking-widest text-white/35">
                    {editingId ? 'Editar evento' : 'Novo evento'}
                  </p>
                  <button
                    type="button"
                    onClick={closeForm}
                    className="text-white/30 hover:text-white transition text-lg leading-none"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-3">
                  {/* Title */}
                  <div>
                    <label className="text-xs text-white/50 mb-1.5 block">Título *</label>
                    <input
                      type="text"
                      required
                      value={form.title}
                      onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                      placeholder="Nome do evento"
                      className="w-full bg-white/8 border border-white/15 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/20 focus:border-buns-yellow focus:outline-none transition-colors"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="text-xs text-white/50 mb-1.5 block">Descrição</label>
                    <textarea
                      rows={2}
                      value={form.description}
                      onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                      placeholder="Detalhe horário, condições, etc."
                      className="w-full bg-white/8 border border-white/15 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/20 focus:border-buns-yellow focus:outline-none transition-colors resize-none"
                    />
                  </div>

                  {/* Status + Date */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-white/50 mb-1.5 block">Status *</label>
                      <select
                        value={form.status}
                        onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as EventStatus }))}
                        className="w-full bg-white/8 border border-white/15 rounded-xl px-4 py-3 text-white text-sm focus:border-buns-yellow focus:outline-none transition-colors"
                      >
                        {STATUS_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-white/50 mb-1.5 block">Data (opcional)</label>
                      <input
                        type="date"
                        value={form.event_date}
                        onChange={(e) => setForm((f) => ({ ...f, event_date: e.target.value }))}
                        className="w-full bg-white/8 border border-white/15 rounded-xl px-4 py-3 text-white text-sm focus:border-buns-yellow focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  {/* Recurrence */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-white/50 mb-1.5 block">Recorrência</label>
                      <select
                        value={form.recurring}
                        onChange={(e) => setForm((f) => ({ ...f, recurring: e.target.value }))}
                        className="w-full bg-white/8 border border-white/15 rounded-xl px-4 py-3 text-white text-sm focus:border-buns-yellow focus:outline-none transition-colors"
                      >
                        <option value="">Sem recorrência</option>
                        <option value="monday">Todas as 2ªs</option>
                        <option value="tuesday">Todas as 3ªs</option>
                        <option value="wednesday">Todas as 4ªs</option>
                        <option value="thursday">Todas as 5ªs</option>
                        <option value="friday">Todas as 6ªs</option>
                        <option value="saturday">Todos os Sábados</option>
                        <option value="sunday">Todos os Domingos</option>
                      </select>
                    </div>
                    {form.recurring && (
                      <div>
                        <label className="text-xs text-white/50 mb-1.5 block">Início da recorrência</label>
                        <input
                          type="date"
                          value={form.recurring_start_date}
                          onChange={(e) => setForm((f) => ({ ...f, recurring_start_date: e.target.value }))}
                          className="w-full bg-white/8 border border-white/15 rounded-xl px-4 py-3 text-white text-sm focus:border-buns-yellow focus:outline-none transition-colors"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!form.title.trim() || formState === 'loading'}
                  className="w-full py-3 bg-buns-yellow text-black font-black text-sm uppercase tracking-wide rounded-xl disabled:opacity-30 transition active:scale-[0.98]"
                >
                  {formState === 'loading'
                    ? 'A guardar...'
                    : editingId ? 'Guardar alterações' : 'Criar evento'}
                </button>

                {formMsg && (
                  <p className={`text-sm font-black ${formState === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                    {formMsg}
                  </p>
                )}
              </form>
            )}

            {/* ── All events list ── */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] font-black uppercase tracking-widest text-white/35">
                  Todos os eventos ({events.length})
                </p>
                {!showForm && (
                  <button
                    onClick={() => openCreate()}
                    className="text-[10px] font-black uppercase tracking-wide text-buns-yellow border border-buns-yellow/30 px-2.5 py-1 rounded-lg hover:bg-buns-yellow/10 transition"
                  >
                    + Novo
                  </button>
                )}
              </div>

              {events.length === 0 ? (
                <p className="text-white/20 text-sm text-center py-4">Sem eventos. Cria o primeiro.</p>
              ) : (
                <div className="space-y-2">
                  {events.map((ev) => (
                    <EventRow
                      key={ev.id}
                      ev={ev}
                      onEdit={() => openEdit(ev)}
                      onDelete={() => setDeleteId(ev.id)}
                      deleteId={deleteId}
                      deleting={deleting}
                      onConfirmDelete={handleDelete}
                      onCancelDelete={() => setDeleteId(null)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Undated section */}
            {undatedEvents.length > 0 && (
              <div className="space-y-2">
                <p className="text-[11px] font-black uppercase tracking-widest text-white/35">
                  Sem data / em estudo
                </p>
                {undatedEvents.map((ev) => (
                  <EventRow
                    key={`u-${ev.id}`}
                    ev={ev}
                    onEdit={() => openEdit(ev)}
                    onDelete={() => setDeleteId(ev.id)}
                    deleteId={deleteId}
                    deleting={deleting}
                    onConfirmDelete={handleDelete}
                    onCancelDelete={() => setDeleteId(null)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  )
}

/* ── EventRow sub-component ──────────────────────────────────── */
function EventRow({
  ev,
  onEdit,
  onDelete,
  deleteId,
  deleting,
  onConfirmDelete,
  onCancelDelete,
}: {
  ev: CalendarEvent
  onEdit: () => void
  onDelete: () => void
  deleteId: string | null
  deleting: boolean
  onConfirmDelete: (id: string) => void
  onCancelDelete: () => void
}) {
  const isConfirming = deleteId === ev.id

  return (
    <div className="flex items-start gap-3 rounded-xl border border-white/8 bg-zinc-950/50 px-4 py-3">
      <span className={`mt-1 shrink-0 inline-block w-2 h-2 rounded-full ${STATUS_DOT[ev.status]}`} />
      <div className="min-w-0 flex-1">
        <p className="font-black text-white text-sm leading-tight">{ev.title}</p>
        {ev.description && (
          <p className="text-white/40 text-xs mt-0.5 leading-relaxed">{ev.description}</p>
        )}
        <div className="flex flex-wrap items-center gap-2 mt-1.5">
          <span className={`text-[9px] font-black uppercase tracking-wide px-2 py-0.5 rounded-full ${STATUS_CLASS[ev.status]}`}>
            {STATUS_OPTIONS.find((o) => o.value === ev.status)?.label}
          </span>
          {ev.event_date && (
            <span className="text-[10px] text-white/35 font-black">
              {new Date(ev.event_date + 'T00:00:00').toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' })}
            </span>
          )}
          {ev.recurring && (
            <span className="text-[10px] text-white/35 font-black">
              ↻ {ev.recurring} desde {ev.recurring_start_date}
            </span>
          )}
        </div>
      </div>
      <div className="shrink-0 flex items-center gap-1.5">
        {isConfirming ? (
          <>
            <button
              onClick={() => onConfirmDelete(ev.id)}
              disabled={deleting}
              className="text-[10px] font-black uppercase tracking-wide text-red-400 border border-red-400/30 px-2 py-1 rounded-lg hover:bg-red-400/10 transition disabled:opacity-40"
            >
              {deleting ? '...' : 'Apagar'}
            </button>
            <button
              onClick={onCancelDelete}
              className="text-[10px] font-black uppercase tracking-wide text-white/40 border border-white/15 px-2 py-1 rounded-lg hover:text-white transition"
            >
              Cancelar
            </button>
          </>
        ) : (
          <>
            <button
              onClick={onEdit}
              className="text-[10px] font-black uppercase tracking-wide text-white/40 border border-white/15 px-2 py-1 rounded-lg hover:text-white hover:border-white/30 transition"
            >
              Editar
            </button>
            <button
              onClick={onDelete}
              className="text-[10px] font-black uppercase tracking-wide text-white/25 border border-transparent px-2 py-1 rounded-lg hover:text-red-400 hover:border-red-400/25 transition"
            >
              ✕
            </button>
          </>
        )}
      </div>
    </div>
  )
}
