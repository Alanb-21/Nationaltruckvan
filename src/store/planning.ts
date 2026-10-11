import type { PlannedBooking } from './index'
import { allVehicles, matchReplacement, placeOf, useDemo } from './index'
import type { ComplianceItem } from './derived'
import { DEPOTS } from '@/data/catalog'
import { dayOffset } from '@/lib/time'
import type { Depot } from '@/data/types'

/** Propose workshop slots across both depots and a matched replacement for each on-hire vehicle. */
export function planBookings(items: ComplianceItem[]): (PlannedBooking & { reasons: string[]; km?: number })[] {
  const s = useDemo.getState()
  const vehicles = allVehicles(s.vehiclePatches)
  const used = new Set<string>()
  const perDay: Record<string, number> = {}
  const out: (PlannedBooking & { reasons: string[]; km?: number })[] = []
  for (const it of items) {
    const v = it.vehicle
    // book a day or two ahead of the due date, never in the past
    const lead = it.days <= 1 ? Math.max(0, it.days) : Math.max(1, it.days - 2)
    let day = Math.max(it.days < 0 ? 1 : 0, lead)
    let depot: Depot = v.depot
    // spread load: max 4 compliance slots per depot per day, overflow to the other depot or next day
    for (let tries = 0; tries < 10; tries++) {
      const key = `${depot}:${day}`
      if ((perDay[key] ?? 0) < 4) break
      const other: Depot = depot === 'Dublin' ? 'Cork' : 'Dublin'
      if ((perDay[`${other}:${day}`] ?? 0) < 2 && tries === 0) {
        depot = other
        continue
      }
      day += 1
    }
    const key = `${depot}:${day}`
    perDay[key] = (perDay[key] ?? 0) + 1
    const bay = ((perDay[key] * 3 + (depot === 'Dublin' ? 1 : 0)) % DEPOTS[depot].bays) + 1
    let replacementId: string | undefined
    let reasons: string[] = []
    let km: number | undefined
    if (it.kind === 'Tax') {
      out.push({ itemId: it.id, vehicleId: v.id, kind: it.kind, date: dayOffset(Math.max(0, Math.min(it.days, 1))), depot: v.depot, bay: 0, reasons: [] })
      continue
    }
    if (v.status === 'On hire') {
      const m = matchReplacement(v, placeOf(v), vehicles, used)
      if (m) {
        used.add(m.vehicle.id)
        replacementId = m.vehicle.id
        reasons = m.reasons
        km = m.km
      }
    }
    out.push({ itemId: it.id, vehicleId: v.id, kind: it.kind, date: dayOffset(day), depot, bay, replacementId, reasons, km })
  }
  return out
}
