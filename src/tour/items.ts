import { allVehicles, useDemo } from '@/store'
import type { ComplianceItem } from '@/store/derived'
import type { ComplianceKind } from '@/data/types'
import { daysUntil } from '@/lib/time'

/** Non-hook version of useComplianceItems for scripts. */
export function buildComplianceItems(horizon = 30): ComplianceItem[] {
  const s = useDemo.getState()
  const out: ComplianceItem[] = []
  for (const v of allVehicles(s.vehiclePatches)) {
    if (v.status === 'Defleet') continue
    for (const [k, date] of Object.entries(v.due) as [ComplianceKind, string][]) {
      const days = daysUntil(date)
      if (days > horizon) continue
      const id = `${v.id}:${k}`
      out.push({ id, vehicle: v, kind: k, due: date, days, booked: s.bookings[id] })
    }
  }
  return out.sort((a, b) => a.days - b.days || a.vehicle.reg.localeCompare(b.vehicle.reg))
}
