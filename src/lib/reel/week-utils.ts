/** Monday (YYYY-MM-DD) of the calendar week containing `dateStr` (UTC date math). */
export function mondayOfWeekUtc(dateStr: string): string {
  const d = new Date(`${dateStr}T12:00:00Z`)
  const dow = d.getUTCDay()
  const diff = dow === 0 ? -6 : 1 - dow
  d.setUTCDate(d.getUTCDate() + diff)
  return d.toISOString().slice(0, 10)
}

export function addDaysUtc(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

export function weekRangeLabel(weekMonday: string): string {
  const sun = addDaysUtc(weekMonday, 6)
  return `${weekMonday} → ${sun}`
}
