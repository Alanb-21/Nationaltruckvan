// Demo clock: today's date, frozen at 08:10 Dublin time so the morning story always lines up.
const base = new Date()
base.setHours(8, 10, 0, 0)
export const NOW = base
export const TODAY_KEY = isoDate(base)

export function isoDate(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function dayOffset(n: number) {
  const d = new Date(NOW)
  d.setDate(d.getDate() + n)
  return isoDate(d)
}

/** ISO datetime today at hh:mm, or n days from today */
export function at(hh: number, mm: number, days = 0) {
  const d = new Date(NOW)
  d.setDate(d.getDate() + days)
  d.setHours(hh, mm, 0, 0)
  return d.toISOString()
}

export function minutesFromNow(min: number) {
  return new Date(NOW.getTime() + min * 60000).toISOString()
}

export function daysUntil(date: string) {
  const d = new Date(date + (date.length === 10 ? 'T00:00:00' : ''))
  const t = new Date(NOW)
  t.setHours(0, 0, 0, 0)
  d.setHours(0, 0, 0, 0)
  return Math.round((d.getTime() - t.getTime()) / 86400000)
}

export function daysSince(iso: string) {
  return Math.max(0, Math.floor((NOW.getTime() - new Date(iso).getTime()) / 86400000))
}

const timeFmt = new Intl.DateTimeFormat('en-IE', { hour: '2-digit', minute: '2-digit', hour12: false })
const dayFmt = new Intl.DateTimeFormat('en-IE', { day: 'numeric', month: 'short' })
const dayLongFmt = new Intl.DateTimeFormat('en-IE', { weekday: 'short', day: 'numeric', month: 'short' })
const fullFmt = new Intl.DateTimeFormat('en-IE', { weekday: 'long', day: 'numeric', month: 'long' })
const yearFmt = new Intl.DateTimeFormat('en-IE', { day: 'numeric', month: 'short', year: 'numeric' })

export const fmtTime = (iso: string) => timeFmt.format(new Date(iso))
export const fmtDay = (date: string) => dayFmt.format(new Date(date.length === 10 ? date + 'T12:00:00' : date))
export const fmtDayLong = (date: string) => dayLongFmt.format(new Date(date.length === 10 ? date + 'T12:00:00' : date))
export const fmtFull = (d: Date) => fullFmt.format(d)
export const fmtDate = (date: string) => yearFmt.format(new Date(date.length === 10 ? date + 'T12:00:00' : date))

/** Feed-style timestamp: 07:42 today, Yesterday, or 3 Oct */
export function fmtWhen(iso: string) {
  const d = daysUntil(iso.slice(0, 10))
  if (d === 0) return fmtTime(iso)
  if (d === -1) return 'Yesterday'
  return fmtDay(iso)
}

export function relDays(date: string) {
  const d = daysUntil(date)
  if (d === 0) return 'Today'
  if (d === 1) return 'Tomorrow'
  if (d === -1) return '1 day overdue'
  if (d < 0) return `${-d} days overdue`
  return `In ${d} days`
}
