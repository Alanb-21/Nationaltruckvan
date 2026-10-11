import { TOUR, getVehicle, useDemo } from '@/store'
import { planBookings } from '@/store/planning'
import { useDriver } from './tourStore'
import { buildComplianceItems } from './items'

export interface TourCtx {
  focus: (selector: string | null) => Promise<void>
  tap: (selector: string, opts?: { pause?: number }) => Promise<void>
  wait: (ms: number) => Promise<void>
  waitFor: (selector: string, timeout?: number) => Promise<Element | null>
  cancelled: () => boolean
}

export interface TourStep {
  title: string
  body: string
  route: string
  target: string | null
  /** scripted, watchable actions; must be safe to skip */
  run?: (ctx: TourCtx) => Promise<void>
  /** applies the step's end state instantly (used when skipping ahead) */
  ensure?: () => void
}

const tourDefectFeed = () => useDemo.getState().feed.find((f) => f.kind === 'defect' && f.vehicleId === TOUR.driverVehicleId)
const tourJob = () => useDemo.getState().jobs.find((j) => j.vehicleId === TOUR.driverVehicleId && j.source === 'Driver app')
const tourSwap = () => useDemo.getState().swaps.find((s) => s.forVehicleId === TOUR.driverVehicleId)

function ensureDriverReport() {
  if (tourDefectFeed()) return
  useDemo.getState().submitDriverReport({ vehicleId: TOUR.driverVehicleId, driver: TOUR.driverName, item: 'Tail-lift', fault: 'Tail-lift not operating', severity: 'Not safe to drive', photo: true })
  useDriver.getState().set({ screen: 'done', vehicleId: TOUR.driverVehicleId, defect: { item: 'Tail-lift', fault: 'Tail-lift not operating', severity: 'Not safe to drive', photo: true } })
}
function ensureJob() {
  ensureDriverReport()
  if (tourJob()) return
  const f = tourDefectFeed()
  if (f) useDemo.getState().createJobFromFeed(f.id)
}
function ensureDispatch() {
  ensureJob()
  if (tourSwap()) return
  const j = tourJob()
  useDemo.getState().dispatchReplacement(TOUR.driverVehicleId, TOUR.replacementId, { place: TOUR.site, reason: 'Defect', etaMin: 49, jobId: j?.id })
}
function weekItems() {
  return buildComplianceItems().filter((i) => !i.booked && i.days >= 0 && i.days <= 6)
}
function ensureBooked() {
  const items = weekItems()
  if (items.length) useDemo.getState().bookCompliance(planBookings(items))
}
function ensureRecharge() {
  const s = useDemo.getState()
  const r = s.returns.find((x) => x.id === TOUR.returnId)
  if (!r || r.status !== 'Waiting') return
  if (!r.after.length) s.addDamage(r.id, { zone: 'Side panel', side: 'Nearside', type: 'Scuff', severity: 'Minor' })
  useDemo.getState().raiseRecharge(r.id)
}

const WALK = ['tyres-and-wheels', 'lights', 'mirrors-and-glass', 'brakes']
const WALK_AFTER = ['body-and-load-security', 'fluids-and-warnings']

export const STEPS: TourStep[] = [
  {
    title: "Martin's morning",
    body: "What's on the road, what's off, and what needs him, in one screen. Every number comes from the live records.",
    route: '/today',
    target: '[data-tour="stats"]',
    run: async (c) => {
      await c.wait(2600)
      await c.focus('[data-tour="feed"]')
    },
  },
  {
    title: '07:42, a customer yard in Naas',
    body: 'The driver scans the code on the dash of a tail-lift rigid. No login. The walkaround takes under a minute and the tail-lift gets flagged with a photo.',
    route: '/driver',
    target: '[data-tour="phone"]',
    run: async (c) => {
      if (tourDefectFeed()) {
        useDriver.getState().set({ screen: 'done', vehicleId: TOUR.driverVehicleId })
        return
      }
      useDriver.getState().reset()
      await c.wait(900)
      await c.tap('[data-tour="driver-scan"]')
      await c.waitFor('[data-tour="driver-start"]', 5000)
      await c.wait(1300)
      await c.tap('[data-tour="driver-start"]')
      await c.wait(500)
      for (const k of WALK) await c.tap(`[data-tour="walk-${k}-ok"]`, { pause: 380 })
      await c.tap('[data-tour="walk-tail-lift-defect"]')
      await c.waitFor('[data-tour="fault-tail-lift-not-operating"]')
      await c.tap('[data-tour="fault-tail-lift-not-operating"]')
      await c.tap('[data-tour="sev-not-safe-to-drive"]')
      await c.tap('[data-tour="add-photo"]')
      await c.waitFor('[data-tour="shutter"]')
      await c.wait(500)
      await c.tap('[data-tour="shutter"]')
      await c.waitFor('[data-tour="defect-save"]')
      await c.wait(700)
      await c.tap('[data-tour="defect-save"]')
      await c.waitFor('[data-tour="walk-body-and-load-security-ok"]')
      for (const k of WALK_AFTER) await c.tap(`[data-tour="walk-${k}-ok"]`, { pause: 380 })
      await c.tap('[data-tour="driver-submit"]')
      await c.wait(1800)
    },
    ensure: ensureDriverReport,
  },
  {
    title: 'It lands live',
    body: "The report is at the top of Martin's feed before the driver has left the yard. One tap turns it into a workshop job.",
    route: '/today',
    target: '[data-tour="feed-first"]',
    run: async (c) => {
      ensureDriverReport()
      if (tourJob()) return
      await c.wait(2200)
      await c.tap('[data-tour="feed-first-action"]')
      await c.focus('[data-tour="stats"]')
      await c.wait(600)
    },
    ensure: ensureJob,
  },
  {
    title: 'Bay, technician and a replacement',
    body: 'The job is on the Dublin board with a bay and a tail-lift technician. A matching tail-lift rigid at Ballycoolin is suggested. Dispatch.',
    route: '/workshop?depot=Dublin',
    target: '[data-tour="new-job"]',
    run: async (c) => {
      ensureJob()
      if (tourSwap()) return
      await c.waitFor('[data-tour="dispatch"]')
      await c.wait(2400)
      await c.tap('[data-tour="dispatch"]')
      await c.wait(800)
    },
    ensure: ensureDispatch,
  },
  {
    title: 'The customer already knows',
    body: 'Slaney Pharma Logistics see the replacement on its way with an ETA. Nobody had to pick up the phone.',
    route: '/portal',
    target: '[data-tour="portal-notices"]',
    run: async () => {
      ensureDispatch()
    },
  },
  {
    title: 'Everything due, booked in one go',
    body: 'All compliance due in the next 30 days, traffic-lit by week. Select the week, Book all: slots across both depots and a replacement matched to each.',
    route: '/compliance',
    target: '[data-tour="bucket-this-week"]',
    run: async (c) => {
      if (!weekItems().length) {
        await c.focus('[data-tour="radar-counts"]')
        return
      }
      await c.wait(2000)
      await c.tap('[data-tour="bucket-this-week"] [role="checkbox"]')
      await c.wait(900)
      await c.tap('[data-tour="book-all"]')
      await c.waitFor('[data-tour="plan-list"]')
      await c.focus('[data-sheet]')
      await c.wait(3200)
      await c.tap('[data-tour="confirm-booking"]')
      await c.wait(700)
      await c.focus('[data-tour="radar-counts"]')
    },
    ensure: ensureBooked,
  },
  {
    title: "What's off the road, and when it's back",
    body: 'Two breakdowns in progress and every VOR vehicle with its reason, days off road and ETA back.',
    route: '/live',
    target: '[data-tour="map"]',
    run: async (c) => {
      await c.wait(2600)
      await c.focus('[data-tour="vor-list"]')
    },
  },
  {
    title: 'Damage that reaches the invoice',
    body: 'A van comes back. Before and after side by side. Mark a scuff on the nearside panel and the recharge is raised and queued for invoicing.',
    route: `/returns/${TOUR.returnId}`,
    target: '[data-tour="diagrams"]',
    run: async (c) => {
      const r = useDemo.getState().returns.find((x) => x.id === TOUR.returnId)
      if (!r || r.status !== 'Waiting') {
        await c.focus('[data-tour="recharge"]')
        return
      }
      await c.wait(1800)
      await c.tap('[data-tour="zone-side-panel"]')
      await c.waitFor('[data-tour="add-damage"]')
      await c.tap('[data-tour="dtype-scuff"]')
      await c.tap('[data-tour="add-damage"]')
      await c.focus('[data-tour="recharge"]')
      await c.wait(2000)
      await c.tap('[data-tour="raise-recharge"]')
      await c.wait(600)
    },
    ensure: ensureRecharge,
  },
  {
    title: 'How the fleet is really working',
    body: 'Downtime, on-time compliance, recharges recovered, utilisation by type and the defleet candidates.',
    route: '/insights',
    target: '[data-tour="insight-kpis"]',
    run: async (c) => {
      await c.wait(2400)
      await c.focus('[data-tour="chart-util"]')
    },
  },
  {
    title: 'One system for the whole fleet operation',
    body: 'Built around how National already works.',
    route: '/today',
    target: null,
  },
]

export { getVehicle }
