// Opening-hours helpers, Europe/Lisbon timezone.
// August 2026 special schedule; outside Jul/Aug, closing defaults to midnight (00:00).

const AUGUST_CLOSING_HOUR: Record<string, number> = {
  Mon: 2, Tue: 1, Wed: 1, Thu: 1, Fri: 2, Sat: 2, Sun: 2,
}

export function getLisbonParts(now: Date) {
  const fmt = (o: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Lisbon', ...o }).format(now)
  const h = parseInt(fmt({ hour: '2-digit', hour12: false }), 10)
  const weekday = fmt({ weekday: 'short' })          // 'Mon', 'Fri', 'Sat', …
  const month = parseInt(fmt({ month: 'numeric' }), 10) // 1–12
  return { h, weekday, month }
}

export function closingHourForDay(weekday: string, month: number): number {
  if (month === 8) return AUGUST_CLOSING_HOUR[weekday] ?? 0
  if (month === 7) return (weekday === 'Fri' || weekday === 'Sat') ? 2 : 0 // Jul: Fri/Sat until 02:00
  return 0
}

// Resolves whether the shop is currently open, and the hour it closes tonight
// (or closed tonight, if currently in the early-morning carryover of last night's session).
export function getOpenStatus(now: Date) {
  const { h, weekday, month } = getLisbonParts(now)
  const todayClosingHour = closingHourForDay(weekday, month)

  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const { weekday: prevWeekday, month: prevMonth } = getLisbonParts(yesterday)
  const yesterdayClosingHour = closingHourForDay(prevWeekday, prevMonth)

  const isEarlyFromLateNight = h < yesterdayClosingHour
  const open = h >= 11 || isEarlyFromLateNight
  const closingHour = h >= 11 ? todayClosingHour : yesterdayClosingHour
  return { open, closingHour }
}
