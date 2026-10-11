import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { useMemo } from 'react'
import { buildSeed, TOUR, TECHNICIANS, type Seed } from '@/data/seed'
import type {
  Breakdown,
  ComplianceBooking,
  ComplianceKind,
  CustomerNotice,
  DamageMark,
  Defect,
  Depot,
  FeedItem,
  Job,
  JobStage,
  Recharge,
  ReturnCheck,
  Swap,
  Thread,
  Vehicle,
  VehicleStatus,
} from '@/data/types'
import { DEPOTS, PLACES, damageCharge, EXCESS_KM_RATE, FUEL_RATE_PER_LITRE, REFUEL_SERVICE, TANK_LITRES, COMPLIANCE_LABEL, isFridge } from '@/data/catalog'
import { NOW, TODAY_KEY, dayOffset, minutesFromNow, daysUntil, fmtTime } from '@/lib/time'
import { distanceKm } from '@/lib/format'

// Base seed is rebuilt on every load (deterministic) and never persisted.
export const seed: Seed = buildSeed()
export const customersById = Object.fromEntries(seed.customers.map((c) => [c.id, c]))
const baseById = new Map(seed.vehicles.map((v) => [v.id, v]))

export type Lens = 'ops' | 'driver' | 'customer'

interface DemoState {
  seedDay: string
  welcomeSeen: boolean
  lens: Lens
  vehiclePatches: Record<string, Partial<Vehicle>>
  jobs: Job[]
  feed: FeedItem[]
  breakdowns: Breakdown[]
  returns: ReturnCheck[]
  recharges: Recharge[]
  threads: Thread[]
  bookings: Record<string, ComplianceBooking>
  notices: CustomerNotice[]
  swaps: Swap[]
  counter: number
}

interface Actions {
  setLens: (l: Lens) => void
  setWelcomeSeen: (b: boolean) => void
  resetDemo: () => void
  patchVehicle: (id: string, p: Partial<Vehicle>) => void
  submitDriverReport: (p: { vehicleId: string; driver: string; item: string; fault: string; severity: Defect['severity']; note?: string; photo?: boolean }) => string
  createJobFromFeed: (feedId: string) => string | undefined
  createJob: (p: { vehicleId: string; title: string; kind: string; source: Job['source']; depot?: Depot; stage?: JobStage; bookedFor?: string }) => string
  moveJob: (jobId: string, stage: JobStage) => void
  dispatchReplacement: (forVehicleId: string, replacementId: string, opts: { place: string; reason: string; etaMin: number; jobId?: string; breakdownId?: string }) => void
  completeFeed: (feedId: string, label: string) => void
  bookCompliance: (plan: PlannedBooking[]) => void
  markVOR: (vehicleId: string, reason: string) => void
  advanceBreakdown: (id: string) => void
  addDamage: (returnId: string, m: Omit<DamageMark, 'id'>) => void
  removeDamage: (returnId: string, markId: string) => void
  raiseRecharge: (returnId: string) => void
  clearReturn: (returnId: string) => void
  sendMessage: (threadId: string, text: string) => void
  markThreadRead: (threadId: string) => void
  convertThread: (threadId: string, to: 'job' | 'booking') => string | undefined
  submitCustomerRequest: (p: { customerId: string; type: string; vehicleId?: string; details: string; date?: string }) => void
  clearNewFlags: () => void
  reportBreakdown: (p: { vehicleId: string; driver: string; place: string; lat: number; lon: number; fault: string }) => string
}

export interface PlannedBooking {
  itemId: string
  vehicleId: string
  kind: ComplianceKind
  date: string
  depot: Depot
  bay: number
  replacementId?: string
}

function initialState(): DemoState {
  const s = structuredClone(seed)
  return {
    seedDay: TODAY_KEY,
    welcomeSeen: false,
    lens: 'ops',
    vehiclePatches: {},
    jobs: s.jobs,
    feed: s.feed,
    breakdowns: s.breakdowns,
    returns: s.returns,
    recharges: s.recharges,
    threads: s.threads,
    bookings: s.bookings,
    notices: s.notices,
    swaps: s.swaps,
    counter: 1,
  }
}

const merged = (patches: Record<string, Partial<Vehicle>>, id: string): Vehicle => {
  const b = baseById.get(id)!
  const p = patches[id]
  return p ? { ...b, ...p } : b
}

function pickTech(jobs: Job[], depot: Depot, prefer?: string) {
  const busy = new Set(jobs.filter((j) => j.depot === depot && (j.stage === 'In bay' || j.stage === 'QC' || j.stage === 'Booked')).map((j) => j.techId))
  const techs = TECHNICIANS.filter((t) => t.depot === depot)
  return (prefer && techs.find((t) => t.role.includes(prefer) && !busy.has(t.id))) || techs.find((t) => !busy.has(t.id)) || techs[0]
}
function freeBay(jobs: Job[], depot: Depot) {
  const used = new Set(jobs.filter((j) => j.depot === depot && (j.stage === 'In bay' || j.stage === 'QC' || j.stage === 'Booked') && j.bay).map((j) => j.bay))
  for (let b = 1; b <= DEPOTS[depot].bays; b++) if (!used.has(b)) return b
  return 1
}

export const useDemo = create<DemoState & Actions>()(
  persist(
    (set, get) => {
      const id = (p: string) => {
        const n = get().counter
        set({ counter: n + 1 })
        return `${p}-${n}-${Date.now().toString(36).slice(-4)}`
      }
      const notify = (n: Omit<CustomerNotice, 'id' | 'at'>) => {
        set((s) => ({ notices: [{ ...n, id: id('n'), at: new Date(Math.max(Date.now(), NOW.getTime())).toISOString(), isNew: true }, ...s.notices] }))
      }
      return {
        ...initialState(),
        setLens: (lens) => set({ lens }),
        setWelcomeSeen: (welcomeSeen) => set({ welcomeSeen }),
        resetDemo: () => set({ ...initialState(), welcomeSeen: true, lens: 'ops' }),
        patchVehicle: (vid, p) => set((s) => ({ vehiclePatches: { ...s.vehiclePatches, [vid]: { ...s.vehiclePatches[vid], ...p } } })),

        submitDriverReport: ({ vehicleId, driver, item, fault, severity, note, photo }) => {
          const s = get()
          const v = merged(s.vehiclePatches, vehicleId)
          const defect: Defect = { id: id('df'), item, fault, severity, reportedAt: nowIso(), reportedBy: driver, note, photo }
          get().patchVehicle(vehicleId, { defects: [defect, ...v.defects] })
          const cust = v.customerId ? customersById[v.customerId] : undefined
          const feedId = id('f')
          const threadId = id('t')
          set((st) => ({
            feed: [
              {
                id: feedId,
                kind: 'defect',
                title: fault,
                context: `${v.reg}${cust ? `, ${cust.name}` : ''}${v.site ? ` at ${v.site}` : ''}. ${severity}. Reported by ${driver}.`,
                time: defect.reportedAt,
                vehicleId,
                refId: defect.id,
                isNew: true,
              },
              ...st.feed,
            ],
            threads: [
              {
                id: threadId,
                kind: 'Driver',
                tag: 'Defect',
                name: driver,
                customerId: v.customerId,
                vehicleId,
                unread: true,
                isNew: true,
                messages: [{ id: 'm1', from: 'them', at: defect.reportedAt, text: `Walkaround on ${v.reg}. ${item}: ${fault.toLowerCase()}. ${severity}.${photo ? ' Photo attached.' : ''}${note ? ` ${note}` : ''}` }],
              },
              ...st.threads,
            ],
          }))
          return feedId
        },

        createJob: ({ vehicleId, title, kind, source, depot, stage = 'Booked', bookedFor }) => {
          const s = get()
          const v = merged(s.vehiclePatches, vehicleId)
          const d = depot ?? v.depot
          const prefer = /tail-lift/i.test(title) ? 'Tail-lift' : /fridge|temperature/i.test(title) ? 'Fridge' : undefined
          const tech = pickTech(s.jobs, d, prefer)
          const jobId = `J-${4200 + s.counter}`
          set({ counter: s.counter + 1 })
          const job: Job = {
            id: jobId,
            vehicleId,
            depot: d,
            stage,
            title,
            kind,
            techId: tech.id,
            bay: freeBay(s.jobs, d),
            stageSince: nowIso(),
            createdAt: nowIso(),
            bookedFor: bookedFor ?? dayOffset(0),
            source,
            isNew: true,
          }
          set((st) => ({ jobs: [job, ...st.jobs] }))
          return jobId
        },

        createJobFromFeed: (feedId) => {
          const s = get()
          const f = s.feed.find((x) => x.id === feedId)
          if (!f || !f.vehicleId) return
          const v = merged(s.vehiclePatches, f.vehicleId)
          const defect = v.defects.find((d) => d.id === f.refId)
          const existing = s.jobs.find((j) => j.vehicleId === v.id && j.title === (defect ? defect.fault : f.title))
          if (existing) return existing.id
          const jobId = get().createJob({ vehicleId: v.id, title: defect ? defect.fault : f.title, kind: 'Defect repair', source: defect ? 'Driver app' : 'Workshop' })
          if (defect) get().patchVehicle(v.id, { defects: v.defects.map((d) => (d.id === defect.id ? { ...d, jobId } : d)) })
          get().completeFeed(feedId, `Job ${jobId} created`)
          return jobId
        },

        moveJob: (jobId, stage) =>
          set((s) => {
            const job = s.jobs.find((j) => j.id === jobId)
            if (!job || job.stage === stage) return {}
            const jobs = s.jobs.map((j) => (j.id === jobId ? { ...j, stage, stageSince: nowIso(), isNew: false } : j))
            let patches = s.vehiclePatches
            const v = merged(s.vehiclePatches, job.vehicleId)
            let status: VehicleStatus | undefined
            if (stage === 'In bay' || stage === 'QC') status = v.status === 'VOR' ? 'VOR' : 'In workshop'
            if (stage === 'Ready') status = 'In workshop'
            if (status && status !== v.status) patches = { ...patches, [v.id]: { ...patches[v.id], status } }
            return { jobs, vehiclePatches: patches }
          }),

        dispatchReplacement: (forVehicleId, replacementId, { place, reason, etaMin, jobId, breakdownId }) => {
          const s = get()
          if (s.swaps.some((x) => x.forVehicleId === forVehicleId && x.replacementId === replacementId)) return
          const v = merged(s.vehiclePatches, forVehicleId)
          const r = merged(s.vehiclePatches, replacementId)
          const eta = new Date(new Date(nowIso()).getTime() + etaMin * 60000).toISOString()
          get().patchVehicle(replacementId, { status: 'On hire', customerId: v.customerId, site: place, reservedFor: forVehicleId, contract: { kind: 'Short-term rental', ref: `RT-${51200 + s.counter}`, start: dayOffset(0), end: dayOffset(5), annualAllowanceKm: 73000 } })
          set((st) => ({
            swaps: [{ id: id('s'), forVehicleId, replacementId, eta, place, reason, createdAt: nowIso() }, ...st.swaps],
            jobs: jobId ? st.jobs.map((j) => (j.id === jobId ? { ...j, replacementId } : j)) : st.jobs,
          }))
          if (breakdownId) {
            set((st) => ({
              breakdowns: st.breakdowns.map((b) => (b.id === breakdownId ? { ...b, replacementId, replacementEta: eta, steps: addStep(b.steps, 'Replacement matched') } : b)),
            }))
          }
          if (v.customerId) {
            notify({
              customerId: v.customerId,
              kind: 'replacement',
              title: `Replacement on the way to ${place}`,
              body: `${r.reg} ${r.model} is covering for ${v.reg}. Arriving around ${fmtTime(eta)}.`,
              vehicleId: forVehicleId,
            })
            if (breakdownId) set((st) => ({ breakdowns: st.breakdowns.map((b) => (b.id === breakdownId ? { ...b, steps: addStep(b.steps, 'Customer notified') } : b)) }))
          }
        },

        completeFeed: (feedId, label) => set((s) => ({ feed: s.feed.map((f) => (f.id === feedId ? { ...f, done: true, doneLabel: label } : f)) })),

        bookCompliance: (plan) => {
          for (const p of plan) {
            const s = get()
            if (s.bookings[p.itemId]) continue
            const v = merged(s.vehiclePatches, p.vehicleId)
            const title = COMPLIANCE_LABEL[p.kind].replace('Temperature probe calibration', 'Probe calibration')
            const jobId = get().createJob({ vehicleId: p.vehicleId, title, kind: 'Compliance', source: 'Compliance', depot: p.depot, bookedFor: p.date })
            set((st) => ({
              jobs: st.jobs.map((j) => (j.id === jobId ? { ...j, bay: p.bay, replacementId: p.replacementId } : j)),
              bookings: { ...st.bookings, [p.itemId]: { itemId: p.itemId, date: p.date, depot: p.depot, bay: p.bay, replacementId: p.replacementId, jobId } },
              feed: st.feed.map((f) => (f.refId === p.itemId && !f.done ? { ...f, done: true, doneLabel: 'Booked' } : f)),
            }))
            if (p.replacementId) get().patchVehicle(p.replacementId, { reservedFor: p.vehicleId })
            if (v.customerId) {
              const r = p.replacementId ? merged(get().vehiclePatches, p.replacementId) : undefined
              notify({
                customerId: v.customerId,
                kind: 'booking',
                title: `${title} booked for ${v.reg}`,
                body: `${DEPOTS[p.depot].site}, ${p.date}.${r ? ` ${r.reg} allocated as the replacement.` : ''}`,
                vehicleId: v.id,
              })
            }
          }
        },

        markVOR: (vehicleId, reason) => {
          const v = merged(get().vehiclePatches, vehicleId)
          const d = DEPOTS[v.depot]
          get().patchVehicle(vehicleId, { status: 'VOR', vor: { reason, location: `${v.depot} workshop`, lat: d.lat, lon: d.lon, since: nowIso(), eta: minutesFromNow(60 * 24 * 2) } })
        },

        advanceBreakdown: (bid) => {
          const s = get()
          const b = s.breakdowns.find((x) => x.id === bid)
          if (!b) return
          const done = new Set(b.steps.map((x) => x.step))
          if (!done.has('Recovery assigned')) {
            set((st) => ({ breakdowns: st.breakdowns.map((x) => (x.id === bid ? { ...x, recovery: { by: 'Kildare Commercial Recovery', eta: minutesFromNow(40) }, steps: addStep(x.steps, 'Recovery assigned') } : x)) }))
          } else if (!done.has('Replacement matched')) {
            const v = merged(s.vehiclePatches, b.vehicleId)
            const m = matchReplacement(v, { lat: b.lat, lon: b.lon }, allVehicles(s.vehiclePatches))
            if (m) get().dispatchReplacement(v.id, m.vehicle.id, { place: b.place.replace(/^.* near /, ''), reason: 'Breakdown', etaMin: m.etaMin, breakdownId: bid })
            const fid = s.feed.find((f) => f.refId === bid && !f.done)?.id
            if (fid) get().completeFeed(fid, 'Replacement dispatched')
          } else if (!done.has('Customer notified')) {
            set((st) => ({ breakdowns: st.breakdowns.map((x) => (x.id === bid ? { ...x, steps: addStep(x.steps, 'Customer notified') } : x)) }))
          } else if (!done.has('Back on the road')) {
            set((st) => ({ breakdowns: st.breakdowns.map((x) => (x.id === bid ? { ...x, steps: addStep(x.steps, 'Back on the road') } : x)) }))
          }
        },

        addDamage: (rid, m) => set((s) => ({ returns: s.returns.map((r) => (r.id === rid ? { ...r, after: [...r.after, { ...m, id: `d-${Date.now().toString(36)}` }] } : r)) })),
        removeDamage: (rid, mid) => set((s) => ({ returns: s.returns.map((r) => (r.id === rid ? { ...r, after: r.after.filter((x) => x.id !== mid) } : r)) })),

        raiseRecharge: (rid) => {
          const s = get()
          const r = s.returns.find((x) => x.id === rid)
          if (!r || r.status !== 'Waiting') return
          const v = merged(s.vehiclePatches, r.vehicleId)
          const lines = rechargeLines(r, v)
          const total = Math.round(lines.reduce((a, l) => a + l.amount, 0) * 100) / 100
          set((st) => ({
            returns: st.returns.map((x) => (x.id === rid ? { ...x, status: lines.length ? 'Raised' : 'Clear' } : x)),
            recharges: lines.length ? [{ id: id('rc'), vehicleId: v.id, customerId: r.customerId, raisedAt: nowIso(), lines, total, status: 'Queued for invoicing' }, ...st.recharges] : st.recharges,
            feed: st.feed.map((f) => (f.refId === rid && !f.done ? { ...f, done: true, doneLabel: 'Recharge raised' } : f)),
          }))
          get().patchVehicle(v.id, { status: 'Available', customerId: undefined, contract: undefined, site: undefined })
        },
        clearReturn: (rid) => {
          const r = get().returns.find((x) => x.id === rid)
          if (!r) return
          set((st) => ({ returns: st.returns.map((x) => (x.id === rid ? { ...x, status: 'Clear' } : x)), feed: st.feed.map((f) => (f.refId === rid && !f.done ? { ...f, done: true, doneLabel: 'Checked in' } : f)) }))
          get().patchVehicle(r.vehicleId, { status: 'Available', customerId: undefined, contract: undefined, site: undefined })
        },

        sendMessage: (tid, text) =>
          set((s) => ({
            threads: s.threads.map((t) => (t.id === tid ? { ...t, unread: false, messages: [...t.messages, { id: `m${t.messages.length + 1}`, from: 'us', text, at: nowIso() }] } : t)),
            feed: s.feed.map((f) => (f.refId === tid && !f.done ? { ...f, done: true, doneLabel: 'Replied' } : f)),
          })),
        markThreadRead: (tid) => set((s) => ({ threads: s.threads.map((t) => (t.id === tid ? { ...t, unread: false, isNew: false } : t)) })),

        convertThread: (tid, to) => {
          const s = get()
          const t = s.threads.find((x) => x.id === tid)
          if (!t || t.converted) return
          let label = ''
          if (to === 'job' && t.vehicleId) {
            const title = t.tag === 'Defect' ? (merged(s.vehiclePatches, t.vehicleId).defects[0]?.fault ?? 'Defect repair') : t.tag === 'Tail Lift Inspection' ? 'Tail-lift exam' : t.tag === 'CVRT' ? 'CVRT' : 'Service B'
            const jobId = get().createJob({ vehicleId: t.vehicleId, title, kind: t.tag === 'Defect' ? 'Defect repair' : 'Service', source: t.kind === 'Driver' ? 'Driver app' : 'Customer', bookedFor: dayOffset(t.tag === 'Defect' ? 0 : 2) })
            label = `Job ${jobId} created`
          } else {
            label = `Booking held for ${t.name}`
          }
          set((st) => ({
            threads: st.threads.map((x) => (x.id === tid ? { ...x, converted: label, unread: false } : x)),
            feed: st.feed.map((f) => (f.refId === tid && !f.done ? { ...f, done: true, doneLabel: label } : f)),
          }))
          if (t.customerId && to === 'booking') notify({ customerId: t.customerId, kind: 'request', title: 'Request confirmed', body: `National Truck & Van Rental confirmed your ${t.tag.toLowerCase()} request.` })
          if (t.tag === 'Defect' && t.vehicleId) {
            const f = get().feed.find((x) => x.vehicleId === t.vehicleId && x.kind === 'defect' && !x.done)
            if (f) get().completeFeed(f.id, label)
          }
          return label
        },

        submitCustomerRequest: ({ customerId, type, vehicleId, details, date }) => {
          const c = customersById[customerId]
          const v = vehicleId ? merged(get().vehiclePatches, vehicleId) : undefined
          const threadId = id('t')
          const text = `${type}${v ? ` for ${v.reg}` : ''}${date ? `, preferred date ${date}` : ''}. ${details}`.trim()
          set((s) => ({
            threads: [{ id: threadId, kind: 'Customer', tag: type, name: c.name, customerId, vehicleId, unread: true, isNew: true, messages: [{ id: 'm1', from: 'them', at: nowIso(), text }] }, ...s.threads],
            feed: [{ id: id('f'), kind: 'request', title: type, context: `${c.name} via the customer portal.${v ? ` ${v.reg}.` : ''}`, time: nowIso(), vehicleId, refId: threadId, isNew: true }, ...s.feed],
          }))
          notify({ customerId, kind: 'request', title: `${type} sent`, body: 'The National team has it. You will get a reply here.' })
        },

        reportBreakdown: ({ vehicleId, driver, place, lat, lon, fault }) => {
          const existing = get().breakdowns.find((b) => b.vehicleId === vehicleId && !b.steps.some((x) => x.step === 'Back on the road'))
          if (existing) return existing.id
          const bid = id('b')
          const v = merged(get().vehiclePatches, vehicleId)
          const t = nowIso()
          set((st) => ({
            breakdowns: [{ id: bid, vehicleId, place, lat, lon, fault, reportedAt: t, driver, recovery: { by: 'Kildare Commercial Recovery', eta: new Date(new Date(t).getTime() + 35 * 60000).toISOString() }, steps: [{ step: 'Reported', at: t }, { step: 'Recovery assigned', at: t }] }, ...st.breakdowns],
            feed: [{ id: id('f'), kind: 'breakdown', title: `Breakdown at ${place}`, context: `${v.reg}${v.customerId ? `, ${customersById[v.customerId].name}` : ''}. Reported from the driver app.`, time: t, vehicleId, refId: bid, isNew: true }, ...st.feed],
          }))
          const s2 = get()
          const m = matchReplacement(v, { lat, lon }, allVehicles(s2.vehiclePatches))
          if (m) get().dispatchReplacement(vehicleId, m.vehicle.id, { place, reason: 'Breakdown', etaMin: m.etaMin, breakdownId: bid })
          return bid
        },

        clearNewFlags: () =>
          set((s) => ({
            feed: s.feed.map((f) => (f.isNew ? { ...f, isNew: false } : f)),
            jobs: s.jobs.map((j) => (j.isNew ? { ...j, isNew: false } : j)),
            notices: s.notices.map((n) => (n.isNew ? { ...n, isNew: false } : n)),
          })),
      }
    },
    {
      name: 'ntvr-fleet-command',
      version: 3,
      storage: createJSONStorage(() => localStorage),
      merge: (persisted, current) => {
        const p = persisted as Partial<DemoState> | undefined
        if (!p || p.seedDay !== TODAY_KEY) return { ...current, welcomeSeen: p?.welcomeSeen ?? false }
        return { ...current, ...p }
      },
      migrate: () => initialState(),
    },
  ),
)

// ---------- helpers ----------
export function nowIso() {
  // Demo clock moves forward from 08:10 in real time
  const elapsed = Math.min(Date.now() - bootAt, 1000 * 60 * 60 * 3)
  return new Date(NOW.getTime() + elapsed).toISOString()
}
const bootAt = Date.now()

function addStep(steps: Breakdown['steps'], step: Breakdown['steps'][number]['step']) {
  if (steps.some((s) => s.step === step)) return steps
  return [...steps, { step, at: nowIso() }]
}

export function rechargeLines(r: ReturnCheck, v: Vehicle) {
  const lines: { label: string; amount: number }[] = []
  for (const m of r.after) lines.push({ label: `${m.type}, ${m.zone.toLowerCase()} ${m.side.toLowerCase()} (${m.severity.toLowerCase()})`, amount: damageCharge(m.type, m.severity) })
  const eighths = r.fuelOut - r.fuelIn
  if (eighths > 0) {
    const litres = (TANK_LITRES[v.type] / 8) * eighths
    lines.push({ label: `Fuel, ${eighths}/8 tank (${Math.round(litres)} L)`, amount: Math.round((litres * FUEL_RATE_PER_LITRE + REFUEL_SERVICE) * 100) / 100 })
  }
  const excess = r.kmIn - r.kmOut - r.allowanceKm
  if (excess > 0) lines.push({ label: `Excess mileage, ${excess} km`, amount: Math.round(excess * EXCESS_KM_RATE * 100) / 100 })
  return lines
}

let cacheKey: unknown = null
let cacheVal: Vehicle[] = []
export function allVehicles(patches: Record<string, Partial<Vehicle>>) {
  if (cacheKey === patches) return cacheVal
  cacheKey = patches
  cacheVal = seed.vehicles.map((v) => (patches[v.id] ? { ...v, ...patches[v.id] } : v))
  return cacheVal
}

export function useVehicles() {
  const patches = useDemo((s) => s.vehiclePatches)
  return allVehicles(patches)
}
export function useVehicle(id?: string) {
  const patch = useDemo((s) => (id ? s.vehiclePatches[id] : undefined))
  return useMemo(() => {
    if (!id) return undefined
    const b = baseById.get(id)
    if (!b) return undefined
    return patch ? { ...b, ...patch } : b
  }, [id, patch])
}
export const getVehicle = (id: string) => merged(useDemo.getState().vehiclePatches, id)

export interface ReplacementMatch {
  vehicle: Vehicle
  km: number
  etaMin: number
  reasons: string[]
}
/** Match by spec first (type, fridge, tail-lift), then the nearest depot. */
export function matchReplacement(v: Vehicle, near: { lat: number; lon: number }, vehicles: Vehicle[], exclude: Set<string> = new Set()): ReplacementMatch | undefined {
  const cands = vehicles.filter(
    (c) => c.status === 'Available' && !c.reservedFor && !exclude.has(c.id) && c.id !== v.id && c.type === v.type && (!v.tailLift || c.tailLift),
  )
  if (!cands.length) return undefined
  const scored = cands
    .map((c) => {
      const d = DEPOTS[c.depot]
      const km = Math.round(distanceKm(near, d) * 1.25)
      return { c, km }
    })
    .sort((a, b) => a.km - b.km || a.c.idx - b.c.idx)
  const best = scored[0]
  const reasons = [`Same spec: ${specLine(v)}`, `${DEPOTS[best.c.depot].site}, ${best.km} km away`]
  return { vehicle: best.c, km: best.km, etaMin: Math.round(25 + best.km * 0.95), reasons }
}

export function specLine(v: Vehicle) {
  const parts = [] as string[]
  if (isFridge(v.type)) parts.push('refrigerated')
  if (v.tailLift) parts.push('tail-lift')
  const t = v.type === 'fridge-rigid' || v.type === 'tail-lift' || v.type === 'rigid-box' ? 'rigid' : v.type === 'fridge-van' ? 'van' : null
  const base = t ?? v.type.replace(/-/g, ' ')
  return [...parts, base].join(' ').replace(/^./, (c) => c.toUpperCase())
}

export function placeOf(v: Vehicle) {
  if (v.vor) return { lat: v.vor.lat, lon: v.vor.lon }
  if (v.site && PLACES[v.site]) return PLACES[v.site]
  return DEPOTS[v.depot]
}

export { TOUR, daysUntil }
