import { useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Check, LifeBuoy, Repeat } from 'lucide-react'
import { Button, PageHeader, Pill, Sheet } from '@/components/ui'
import { IrelandMap, type MapPin } from '@/components/IrelandMap'
import { VehicleArt, VehicleThumb } from '@/components/vehicles/VehicleArt'
import { customersById, matchReplacement, allVehicles, useDemo, useVehicles } from '@/store'
import { DEPOTS, TYPE_LABEL } from '@/data/catalog'
import type { Breakdown, BreakdownStep } from '@/data/types'
import { cn } from '@/lib/format'
import { daysSince, fmtDayLong, fmtTime } from '@/lib/time'

const STEPS: BreakdownStep[] = ['Reported', 'Recovery assigned', 'Replacement matched', 'Customer notified', 'Back on the road']
const NEXT_LABEL: Partial<Record<BreakdownStep, string>> = {
  'Recovery assigned': 'Assign recovery',
  'Replacement matched': 'Match and dispatch replacement',
  'Customer notified': 'Notify customer',
  'Back on the road': 'Mark back on the road',
}

function BreakdownFlow({ b }: { b: Breakdown }) {
  const vehicles = useVehicles()
  const v = vehicles.find((x) => x.id === b.vehicleId)!
  const cust = v.customerId ? customersById[v.customerId] : undefined
  const done = new Map(b.steps.map((s) => [s.step, s.at]))
  const next = STEPS.find((s) => !done.has(s))
  const repl = b.replacementId ? vehicles.find((x) => x.id === b.replacementId) : undefined
  const preview = !repl ? matchReplacement(v, { lat: b.lat, lon: b.lon }, allVehicles(useDemo.getState().vehiclePatches)) : undefined
  const detail = (s: BreakdownStep) => {
    if (s === 'Reported') return `${b.driver} reported: ${b.fault.toLowerCase()}.`
    if (s === 'Recovery assigned') return b.recovery ? `${b.recovery.by}, on scene by ${fmtTime(b.recovery.eta)}.` : 'Nearest approved recovery agent.'
    if (s === 'Replacement matched') return repl ? `${repl.reg} ${TYPE_LABEL[repl.type].toLowerCase()} from ${DEPOTS[repl.depot].site}, due ${b.replacementEta ? fmtTime(b.replacementEta) : 'shortly'}.` : preview ? `Best match ${preview.vehicle.reg} at ${DEPOTS[preview.vehicle.depot].site}, ${preview.km} km away.` : 'Matched by spec and depot distance.'
    if (s === 'Customer notified') return cust ? `${cust.contact} at ${cust.name} told by text and in their portal.` : 'Customer told automatically.'
    return 'Recovered vehicle booked into the workshop.'
  }
  return (
    <div>
      <div className="mb-5 flex items-center gap-4 rounded-xl bg-white/[0.04] p-4">
        <VehicleArt type={v.type} className="w-32 shrink-0" />
        <div className="min-w-0">
          <div className="text-lg font-semibold">{v.reg}</div>
          <div className="truncate text-sm text-muted">
            {TYPE_LABEL[v.type]}
            {cust ? `, ${cust.name}` : ''}
          </div>
          <div className="mt-1 text-sm text-bad">{b.fault}</div>
        </div>
      </div>
      <ol className="relative ml-2" data-tour="breakdown-steps">
        {STEPS.map((s, i) => {
          const at = done.get(s)
          return (
            <li key={s} className="relative pb-5 pl-8 last:pb-0">
              {i < STEPS.length - 1 && <span className={cn('absolute left-[9px] top-6 h-[calc(100%-16px)] w-px', at ? 'bg-ok/50' : 'bg-white/[0.1]')} />}
              <motion.span initial={false} animate={{ scale: at ? 1 : 0.9 }} className={cn('absolute left-0 top-0.5 flex h-[19px] w-[19px] items-center justify-center rounded-full', at ? 'bg-ok text-canvas' : s === next ? 'ring-2 ring-accent' : 'ring-1 ring-white/20')}>
                {at && <Check className="h-3 w-3" strokeWidth={3} />}
              </motion.span>
              <div className="flex items-baseline justify-between gap-3">
                <span className={cn('font-medium', !at && 'text-muted')}>{s}</span>
                {at && <span className="num text-xs text-faint">{fmtTime(at)}</span>}
              </div>
              <div className="mt-0.5 text-sm text-muted">{detail(s)}</div>
            </li>
          )
        })}
      </ol>
      {repl && (
        <div className="mt-5 flex items-center gap-3 rounded-xl bg-ok/10 p-3 text-sm ring-1 ring-inset ring-ok/20">
          <Repeat className="h-4 w-4 text-ok" />
          <span>
            {repl.reg} is the same spec: {TYPE_LABEL[repl.type].toLowerCase()}
            {repl.fridgeUnit ? `, ${repl.fridgeUnit}` : ''}.
          </span>
        </div>
      )}
      {next && (
        <Button variant="primary" className="mt-6 w-full" size="lg" onClick={() => useDemo.getState().advanceBreakdown(b.id)}>
          {NEXT_LABEL[next]}
        </Button>
      )}
    </div>
  )
}

export default function Live() {
  const vehicles = useVehicles()
  const breakdowns = useDemo((s) => s.breakdowns)
  const swaps = useDemo((s) => s.swaps)
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const openId = params.get('b')
  const open = breakdowns.find((b) => b.id === openId)
  const vor = useMemo(() => vehicles.filter((v) => v.status === 'VOR' && v.vor).sort((a, b) => a.vor!.since.localeCompare(b.vor!.since)), [vehicles])
  const vById = useMemo(() => new Map(vehicles.map((v) => [v.id, v])), [vehicles])
  const live = breakdowns.filter((b) => !b.steps.some((s) => s.step === 'Back on the road'))

  const pins: MapPin[] = [
    { id: 'depot-dublin', kind: 'depot', lat: DEPOTS.Dublin.lat, lon: DEPOTS.Dublin.lon, label: 'Ballycoolin' },
    { id: 'depot-cork', kind: 'depot', lat: DEPOTS.Cork.lat, lon: DEPOTS.Cork.lon, label: 'Douglas' },
    ...vor.filter((v) => !v.vor!.location.includes('workshop')).map((v) => ({ id: v.id, kind: 'vor' as const, lat: v.vor!.lat, lon: v.vor!.lon, onClick: () => navigate(`/fleet/${v.id}`) })),
    ...live.map((b) => ({ id: b.id, kind: 'breakdown' as const, lat: b.lat, lon: b.lon, label: b.place.replace(/^.* near /, ''), onClick: () => setParams({ b: b.id }) })),
  ]
  const workshopVor = vor.filter((v) => v.vor!.location.includes('workshop')).length

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-6 md:px-8 md:py-8">
      <PageHeader title="Live" sub={`${live.length} breakdowns in progress and ${vor.length} vehicles off road. ${swaps.length} replacements out covering.`} />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_420px]">
        <div className="card relative overflow-hidden rounded-xl" data-tour="map">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_40%,rgba(30,72,140,0.25),transparent_70%)]" />
          <IrelandMap pins={pins} className="relative mx-auto h-[420px] w-full md:h-[640px]" />
          <div className="absolute bottom-4 left-4 flex flex-wrap gap-3 text-xs text-muted">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-accent" /> Depot</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-bad" /> Breakdown</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-warn" /> Off road away from depot</span>
          </div>
          {workshopVor > 0 && <div className="absolute right-4 top-4 rounded-full bg-white/[0.06] px-3 py-1.5 text-xs text-muted">{workshopVor} more off road in our workshops</div>}
        </div>

        <div className="space-y-4">
          <section>
            <h2 className="mb-2 text-lg font-semibold">Breakdowns</h2>
            <div className="card overflow-hidden rounded-xl" data-tour="breakdowns">
              {live.map((b, i) => {
                const v = vById.get(b.vehicleId)!
                const last = b.steps[b.steps.length - 1]
                return (
                  <button key={b.id} onClick={() => setParams({ b: b.id })} className={cn('flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-white/[0.035]', i > 0 && 'border-t border-white/[0.05]')}>
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-bad/15 text-bad">
                      <LifeBuoy className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{b.place}</div>
                      <div className="truncate text-sm text-muted">
                        {v.reg} · {last.step}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="num text-xs text-faint">{fmtTime(b.reportedAt)}</div>
                      <div className="mt-1 flex gap-0.5">
                        {STEPS.map((s) => (
                          <span key={s} className={cn('h-1 w-3 rounded-full', b.steps.some((x) => x.step === s) ? 'bg-ok' : 'bg-white/[0.12]')} />
                        ))}
                      </div>
                    </div>
                  </button>
                )
              })}
              {live.length === 0 && <div className="p-6 text-center text-sm text-muted">No live breakdowns.</div>}
            </div>
          </section>
          <section>
            <h2 className="mb-2 text-lg font-semibold">Off road</h2>
            <div className="card overflow-hidden rounded-xl" data-tour="vor-list">
              {vor.map((v, i) => (
                <button key={v.id} onClick={() => navigate(`/fleet/${v.id}`)} className={cn('flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-white/[0.035]', i > 0 && 'border-t border-white/[0.05]')}>
                  <VehicleThumb type={v.type} className="h-10 w-12" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="font-medium">{v.reg}</span>
                      <span className="truncate text-xs text-faint">{v.vor!.location}</span>
                    </div>
                    <div className="truncate text-sm text-muted">{v.vor!.reason}</div>
                  </div>
                  <div className="shrink-0 text-right">
                    <Pill tone={daysSince(v.vor!.since) >= 4 ? 'bad' : 'warn'}>{daysSince(v.vor!.since) === 0 ? 'Today' : `${daysSince(v.vor!.since)}d off`}</Pill>
                    <div className="num mt-1 text-xs text-faint">Back {fmtDayLong(v.vor!.eta).replace(/,.*/, '')}</div>
                  </div>
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>
      <Sheet open={!!open} onOpenChange={(o) => !o && setParams({})} side="right" title={open ? open.place : ''} description={open ? `Reported ${fmtTime(open.reportedAt)} by ${open.driver}` : ''}>
        {open && <BreakdownFlow b={open} />}
      </Sheet>
    </div>
  )
}
