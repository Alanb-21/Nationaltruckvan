import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion'
import * as Menu from '@radix-ui/react-dropdown-menu'
import { ChevronRight, MapPin, MoreHorizontal, Repeat, Truck } from 'lucide-react'
import { Avatar, Button, PageHeader, Pill, Segmented, toast } from '@/components/ui'
import { VehicleThumb } from '@/components/vehicles/VehicleArt'
import { customersById, matchReplacement, nowIso, placeOf, useDemo, useVehicles } from '@/store'
import { MOBILE_TECHS, TECHNICIANS } from '@/data/seed'
import { DEPOTS, JOB_STAGES } from '@/data/catalog'
import type { Depot, Job, JobStage } from '@/data/types'
import { cn } from '@/lib/format'
import { fmtDayLong, fmtTime } from '@/lib/time'

const stageTone: Record<JobStage, string> = {
  Booked: 'bg-white/30',
  'In bay': 'bg-warn',
  'Awaiting parts': 'bg-bad',
  QC: 'bg-accent',
  Ready: 'bg-ok',
}

function since(iso: string) {
  const min = Math.max(1, Math.round((new Date(nowIso()).getTime() - new Date(iso).getTime()) / 60000))
  if (min < 60) return `${min}m`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h}h ${min % 60}m`
  return `${Math.floor(h / 24)}d ${h % 24}h`
}

export default function Workshop() {
  const [params, setParams] = useSearchParams()
  const depot = (params.get('depot') as Depot) || 'Dublin'
  const setDepot = (d: Depot) => setParams({ depot: d }, { replace: true })
  const jobs = useDemo((s) => s.jobs)
  const swaps = useDemo((s) => s.swaps)
  const vehicles = useVehicles()
  const navigate = useNavigate()
  const vById = useMemo(() => new Map(vehicles.map((v) => [v.id, v])), [vehicles])
  const [dragId, setDragId] = useState<string | null>(null)
  const [over, setOver] = useState<JobStage | null>(null)

  const djobs = jobs.filter((j) => j.depot === depot)
  const bays = DEPOTS[depot].bays
  const occupied = new Map(djobs.filter((j) => (j.stage === 'In bay' || j.stage === 'QC') && j.bay).map((j) => [j.bay!, j]))
  const mobiles = MOBILE_TECHS.filter((m) => m.depot === depot)
  const sortJobs = (a: Job, b: Job) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0) || (a.bookedFor ?? '').localeCompare(b.bookedFor ?? '') || a.stageSince.localeCompare(b.stageSince)

  const move = (id: string, stage: JobStage) => {
    useDemo.getState().moveJob(id, stage)
  }

  const dispatch = (job: Job) => {
    const v = vById.get(job.vehicleId)!
    const m = matchReplacement(v, placeOf(v), vehicles)
    if (!m) return
    useDemo.getState().dispatchReplacement(v.id, m.vehicle.id, { place: v.site ?? DEPOTS[v.depot].site, reason: 'Defect', etaMin: m.etaMin, jobId: job.id })
    toast(`${m.vehicle.reg} dispatched to ${v.site ?? v.depot}, about ${m.etaMin} min`)
  }

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-6 md:px-8 md:py-8">
      <PageHeader
        title="Workshop"
        sub={`${occupied.size} of ${bays} bays in use at ${DEPOTS[depot].site}. ${djobs.filter((j) => j.stage === 'Awaiting parts').length} jobs held on parts.`}
        right={<Segmented layoutId="ws-depot" value={depot} onChange={setDepot} options={[{ value: 'Dublin', label: 'Dublin' }, { value: 'Cork', label: 'Cork' }]} data-tour="depot-toggle" />}
      />

      <div className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="card rounded-xl p-4" data-tour="bays">
          <div className="mb-3 flex items-center justify-between text-sm">
            <span className="font-medium">Bays</span>
            <span className="text-muted">
              {occupied.size}/{bays} in use
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {Array.from({ length: bays }, (_, i) => i + 1).map((b) => {
              const j = occupied.get(b)
              const v = j ? vById.get(j.vehicleId) : undefined
              return (
                <div key={b} className={cn('relative flex h-16 flex-col justify-between rounded-[10px] p-2 text-2xs', j ? 'bg-white/[0.07] ring-1 ring-inset ring-white/[0.08]' : 'border border-dashed border-white/[0.1]')}>
                  <span className="text-faint">Bay {b}</span>
                  {v ? (
                    <>
                      <span className="truncate text-xs font-semibold">{v.reg}</span>
                      <span className={cn('absolute right-2 top-2 h-1.5 w-1.5 rounded-full', stageTone[j!.stage])} />
                    </>
                  ) : (
                    <span className="text-faint">Free</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
        <div className="card rounded-xl p-4">
          <div className="mb-3 flex items-center justify-between text-sm">
            <span className="font-medium">Mobile technicians</span>
            <span className="text-muted">{mobiles.length} out</span>
          </div>
          <div className="space-y-3">
            {mobiles.map((m) => (
              <div key={m.id} className="flex items-center gap-3">
                <Avatar name={m.name} size={34} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{m.name}</div>
                  <div className="flex items-center gap-1 truncate text-xs text-muted">
                    <MapPin className="h-3 w-3" /> {m.job}, {m.place}
                  </div>
                </div>
                <Pill tone="ok" dot>
                  On site
                </Pill>
              </div>
            ))}
          </div>
        </div>
      </div>

      <LayoutGroup>
        <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-4 md:mx-0 md:px-0" data-tour="kanban">
          {JOB_STAGES.map((stage) => {
            const col = djobs.filter((j) => j.stage === stage).sort(sortJobs)
            return (
              <div
                key={stage}
                onDragOver={(e) => {
                  e.preventDefault()
                  setOver(stage)
                }}
                onDragLeave={() => setOver((o) => (o === stage ? null : o))}
                onDrop={(e) => {
                  e.preventDefault()
                  if (dragId) move(dragId, stage)
                  setDragId(null)
                  setOver(null)
                }}
                className={cn('flex w-[280px] shrink-0 flex-col rounded-xl bg-white/[0.025] p-2 ring-1 ring-inset transition-colors xl:w-auto xl:min-w-0 xl:flex-1', over === stage ? 'ring-accent/50 bg-accent/[0.04]' : 'ring-white/[0.04]')}
                data-tour={`col-${stage.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <div className="flex items-center gap-2 px-2 pb-2 pt-1">
                  <span className={cn('h-2 w-2 rounded-full', stageTone[stage])} />
                  <span className="text-sm font-semibold">{stage}</span>
                  <span className="num ml-auto text-xs text-muted">{col.length}</span>
                </div>
                <div className="flex min-h-[120px] flex-col gap-2">
                  <AnimatePresence initial={false}>
                    {col.map((j) => {
                      const v = vById.get(j.vehicleId)
                      if (!v) return null
                      const tech = TECHNICIANS.find((t) => t.id === j.techId)
                      const cust = v.customerId ? customersById[v.customerId] : undefined
                      const swap = swaps.find((s) => s.forVehicleId === v.id)
                      const repl = j.replacementId ? vById.get(j.replacementId) : swap ? vById.get(swap.replacementId) : undefined
                      const suggest = !repl && j.source === 'Driver app' && v.status !== 'Available' ? matchReplacement(v, placeOf(v), vehicles) : undefined
                      return (
                        <motion.div
                          key={j.id}
                          layout
                          layoutId={`job-${j.id}`}
                          initial={{ opacity: 0, scale: 0.96, y: -8 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.96 }}
                          transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                          data-tour={j.isNew ? 'new-job' : undefined}
                        >
                        <div
                          draggable
                          onDragStart={(e) => {
                            setDragId(j.id)
                            e.dataTransfer.setData('text/plain', j.id)
                          }}
                          onDragEnd={() => setDragId(null)}
                          className={cn('card group cursor-grab rounded-[14px] p-3 active:cursor-grabbing', j.isNew && 'shadow-glow', dragId === j.id && 'opacity-50')}
                        >
                          <div className="flex items-start gap-3">
                            <VehicleThumb type={v.type} className="h-10 w-12" />
                            <div className="min-w-0 flex-1">
                              <button onClick={() => navigate(`/fleet/${v.id}`)} className="block truncate text-sm font-semibold hover:text-accent">
                                {v.reg}
                              </button>
                              <div className="line-clamp-2 text-xs leading-4 text-muted">{j.title}</div>
                            </div>
                            <Menu.Root modal={false}>
                              <Menu.Trigger asChild>
                                <button className="-mr-1 -mt-1 rounded-md p-1 text-faint hover:bg-white/[0.06] hover:text-ink" aria-label="Move job">
                                  <MoreHorizontal className="h-4 w-4" />
                                </button>
                              </Menu.Trigger>
                              <Menu.Portal>
                                <Menu.Content align="end" className="glass-strong z-[70] w-44 rounded-xl p-1 text-sm">
                                  <div className="label px-2.5 py-1.5">Move to</div>
                                  {JOB_STAGES.filter((s) => s !== j.stage).map((s) => (
                                    <Menu.Item key={s} onSelect={() => move(j.id, s)} className="flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 outline-none data-[highlighted]:bg-white/[0.07]">
                                      <span className={cn('h-2 w-2 rounded-full', stageTone[s])} />
                                      {s}
                                    </Menu.Item>
                                  ))}
                                </Menu.Content>
                              </Menu.Portal>
                            </Menu.Root>
                          </div>
                          <div className="mt-3 flex items-center gap-2 text-xs text-muted">
                            {tech && <Avatar name={tech.name} size={22} />}
                            <span className="min-w-0 flex-1 truncate">{tech ? tech.name.split(' ')[0] : cust?.name}</span>
                            {j.bay && (j.stage === 'In bay' || j.stage === 'QC' || j.stage === 'Booked') && <span className="num">Bay {j.bay}</span>}
                            <span className="num text-faint">{j.stage === 'Booked' && j.bookedFor ? fmtDayLong(j.bookedFor) : since(j.stageSince)}</span>
                          </div>
                          {repl && (
                            <div className="mt-2.5 flex items-center gap-2 rounded-[10px] bg-ok/10 px-2.5 py-1.5 text-xs text-ok">
                              <Repeat className="h-3.5 w-3.5" /> {repl.reg} covering
                              {swap && <span className="ml-auto text-ok/80">ETA {fmtTime(swap.eta)}</span>}
                            </div>
                          )}
                          {suggest && (
                            <div className="mt-2.5 rounded-[10px] bg-accent/[0.08] p-2.5 ring-1 ring-inset ring-accent/20" data-tour="suggest">
                              <div className="flex items-center gap-2 text-xs">
                                <Truck className="h-3.5 w-3.5 text-accent" />
                                <span className="font-medium text-ink">Replacement {suggest.vehicle.reg}</span>
                              </div>
                              <div className="mt-0.5 text-2xs text-muted">
                                {suggest.reasons[0]}. {suggest.reasons[1]}.
                              </div>
                              <Button size="sm" variant="primary" className="mt-2 h-7 w-full text-xs" onClick={() => dispatch(j)} data-tour="dispatch">
                                Dispatch <ChevronRight className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          )}
                        </div>
                        </motion.div>
                      )
                    })}
                  </AnimatePresence>
                </div>
              </div>
            )
          })}
        </div>
      </LayoutGroup>
    </div>
  )
}
