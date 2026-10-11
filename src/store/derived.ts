import { useMemo } from 'react'
import { useDemo, useVehicles } from './index'
import type { ComplianceKind, Depot, Vehicle } from '@/data/types'
import { DEPOTS } from '@/data/catalog'
import { daysUntil } from '@/lib/time'

export interface ComplianceItem {
  id: string
  vehicle: Vehicle
  kind: ComplianceKind
  due: string
  days: number
  booked?: { date: string; depot: Depot; replacementId?: string; jobId: string }
}

export type Bucket = 'Overdue' | 'This week' | 'Next 2 weeks' | 'This month'
export const BUCKETS: Bucket[] = ['Overdue', 'This week', 'Next 2 weeks', 'This month']
export function bucketOf(days: number): Bucket {
  if (days < 0) return 'Overdue'
  if (days <= 6) return 'This week'
  if (days <= 20) return 'Next 2 weeks'
  return 'This month'
}

export function useComplianceItems(horizon = 30) {
  const vehicles = useVehicles()
  const bookings = useDemo((s) => s.bookings)
  return useMemo(() => {
    const out: ComplianceItem[] = []
    for (const v of vehicles) {
      if (v.status === 'Defleet') continue
      for (const [k, date] of Object.entries(v.due) as [ComplianceKind, string][]) {
        const days = daysUntil(date)
        if (days > horizon) continue
        const id = `${v.id}:${k}`
        out.push({ id, vehicle: v, kind: k, due: date, days, booked: bookings[id] })
      }
    }
    return out.sort((a, b) => a.days - b.days || a.vehicle.reg.localeCompare(b.vehicle.reg))
  }, [vehicles, bookings, horizon])
}

export function useStats() {
  const vehicles = useVehicles()
  const jobs = useDemo((s) => s.jobs)
  const breakdowns = useDemo((s) => s.breakdowns)
  const items = useComplianceItems(14)
  return useMemo(() => {
    const active = vehicles.filter((v) => v.status !== 'Defleet')
    const onRoad = vehicles.filter((v) => v.status === 'On hire').length
    const vor = vehicles.filter((v) => v.status === 'VOR').length
    const occupied = (d: Depot) => jobs.filter((j) => j.depot === d && (j.stage === 'In bay' || j.stage === 'QC')).length
    const bays = DEPOTS.Dublin.bays + DEPOTS.Cork.bays
    const load = ((occupied('Dublin') + occupied('Cork')) / bays) * 100
    const due14 = items.filter((i) => !i.booked).length
    const overdue = items.filter((i) => i.days < 0 && !i.booked).length
    const liveBreakdowns = breakdowns.filter((b) => !b.steps.some((s) => s.step === 'Back on the road')).length
    return {
      total: vehicles.length,
      active: active.length,
      onRoad,
      vor,
      load,
      occupied: { Dublin: occupied('Dublin'), Cork: occupied('Cork') },
      due14,
      overdue,
      liveBreakdowns,
      available: vehicles.filter((v) => v.status === 'Available').length,
    }
  }, [vehicles, jobs, breakdowns, items])
}

export function useBadges() {
  const feed = useDemo((s) => s.feed)
  const threads = useDemo((s) => s.threads)
  const returns = useDemo((s) => s.returns)
  return {
    today: feed.filter((f) => !f.done).length,
    inbox: threads.filter((t) => t.unread).length,
    returns: returns.filter((r) => r.status === 'Waiting').length,
  }
}
