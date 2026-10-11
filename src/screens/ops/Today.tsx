import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, CalendarClock, Check, ChevronDown, ClipboardCheck, LifeBuoy, MessageSquare, PackageOpen } from 'lucide-react'
import { Button, CountUp, toast } from '@/components/ui'
import { IconBubble, ListRow } from '@/components/ListRow'
import { useComplianceItems, useStats } from '@/store/derived'
import { useDemo, useVehicles, getVehicle, matchReplacement, allVehicles } from '@/store'
import { planBookings } from '@/store/planning'
import type { FeedItem } from '@/data/types'
import { DEPOTS } from '@/data/catalog'
import { fmtFull, fmtTime, fmtWhen, NOW } from '@/lib/time'
import { cn, fmtPct } from '@/lib/format'

function StatTile({ label, value, sub, tone, format, tour }: { label: string; value: number; sub: string; tone?: 'bad' | 'warn' | 'ok'; format?: (n: number) => string; tour?: string }) {
  return (
    <div className="glass rounded-xl p-4 md:p-5" data-tour={tour}>
      <div className="flex items-center gap-2 text-sm text-muted">
        {tone && <span className={cn('h-2 w-2 rounded-full', tone === 'bad' ? 'bg-bad' : tone === 'warn' ? 'bg-warn' : 'bg-ok')} />}
        {label}
      </div>
      <div className="mt-2 text-3xl font-semibold md:text-4xl">
        <CountUp value={value} format={format} />
      </div>
      <div className="mt-1 truncate text-sm text-faint">{sub}</div>
    </div>
  )
}

const KIND_META = {
  defect: { icon: AlertTriangle, tone: 'warn' as const, action: 'Create job' },
  breakdown: { icon: LifeBuoy, tone: 'bad' as const, action: 'Dispatch replacement' },
  compliance: { icon: CalendarClock, tone: 'warn' as const, action: 'Book now' },
  return: { icon: PackageOpen, tone: 'neutral' as const, action: 'Review' },
  request: { icon: ClipboardCheck, tone: 'accent' as const, action: 'Reply' },
  message: { icon: MessageSquare, tone: 'accent' as const, action: 'Reply' },
}

export default function Today() {
  const stats = useStats()
  const feed = useDemo((s) => s.feed)
  const breakdowns = useDemo((s) => s.breakdowns)
  const jobs = useDemo((s) => s.jobs)
  const returns = useDemo((s) => s.returns)
  const items = useComplianceItems(30)
  const vehicles = useVehicles()
  const navigate = useNavigate()
  const [showDone, setShowDone] = useState(false)
  const open = feed.filter((f) => !f.done)
  const done = feed.filter((f) => f.done)
  const vById = useMemo(() => new Map(vehicles.map((v) => [v.id, v])), [vehicles])
  const hour = NOW.getHours()
  const greeting = hour < 12 ? 'Morning' : hour < 18 ? 'Afternoon' : 'Evening'

  function act(f: FeedItem) {
    const s = useDemo.getState()
    if (f.kind === 'defect') {
      const jobId = s.createJobFromFeed(f.id)
      const j = useDemo.getState().jobs.find((x) => x.id === jobId)
      if (j) toast(`Job ${j.id} added to the ${j.depot} board`)
    } else if (f.kind === 'breakdown') {
      const b = s.breakdowns.find((x) => x.id === f.refId)
      if (b && !b.replacementId) {
        const v = getVehicle(b.vehicleId)
        const m = matchReplacement(v, { lat: b.lat, lon: b.lon }, allVehicles(s.vehiclePatches))
        if (m) {
          s.dispatchReplacement(v.id, m.vehicle.id, { place: b.place.replace(/^.* near /, ''), reason: 'Breakdown', etaMin: m.etaMin, breakdownId: b.id })
          s.completeFeed(f.id, `Replacement ${m.vehicle.reg} dispatched`)
          toast(`${m.vehicle.reg} on the way, about ${m.etaMin} min`)
        }
      } else navigate(`/live?b=${f.refId}`)
    } else if (f.kind === 'compliance') {
      const it = items.find((i) => i.id === f.refId)
      if (it) {
        const plan = planBookings([it])
        s.bookCompliance(plan)
        toast(`Booked for ${plan[0].date.slice(8)}/${plan[0].date.slice(5, 7)} at ${DEPOTS[plan[0].depot].site}`)
      }
    } else if (f.kind === 'return') navigate(`/returns/${f.refId}`)
    else navigate(`/inbox/${f.refId}`)
  }

  const actionLabel = (f: FeedItem) => {
    if (f.kind === 'breakdown') {
      const b = breakdowns.find((x) => x.id === f.refId)
      return b?.replacementId ? 'Review' : 'Dispatch replacement'
    }
    return KIND_META[f.kind].action
  }

  const returnsWaiting = returns.filter((r) => r.status === 'Waiting').length
  const liveB = breakdowns.filter((b) => !b.steps.some((s) => s.step === 'Back on the road'))

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-6 md:px-8 md:py-8">
      <div className="mb-6 md:mb-8" data-tour="today-header">
        <h1 className="text-3xl font-semibold md:text-4xl">{greeting}, Martin.</h1>
        <p className="mt-2 text-base text-muted">
          {fmtFull(NOW)}. {open.length} {open.length === 1 ? 'thing needs' : 'things need'} you this morning.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-4" data-tour="stats">
        <StatTile label="Fleet on the road" value={stats.onRoad} sub={`${fmtPct((stats.onRoad / stats.active) * 100)} of ${stats.active.toLocaleString('en-IE')} active vehicles`} tone="ok" />
        <StatTile label="Off road (VOR)" value={stats.vor} sub={`${stats.liveBreakdowns} live breakdowns on top`} tone="bad" />
        <StatTile label="Compliance due, 14 days" value={stats.due14} sub={stats.overdue ? `${stats.overdue} overdue, not booked` : 'Nothing overdue'} tone="warn" />
        <StatTile label="Workshop load" value={stats.load} format={(n) => `${Math.round(n)}%`} sub={`${stats.occupied.Dublin + stats.occupied.Cork} of 20 bays in use`} />
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Needs you</h2>
            <span className="text-sm text-muted">Newest first</span>
          </div>
          <div className="card overflow-hidden rounded-xl" data-tour="feed">
            {open.length === 0 && (
              <div className="flex flex-col items-center py-14 text-center">
                <IconBubble icon={<Check className="h-5 w-5" />} tone="ok" />
                <div className="mt-3 font-medium">All clear</div>
                <div className="text-sm text-muted">Nothing needs you right now.</div>
              </div>
            )}
            <AnimatePresence initial={false}>
              {open.map((f, i) => {
                const meta = KIND_META[f.kind]
                const v = f.vehicleId ? vById.get(f.vehicleId) : undefined
                return (
                  <motion.div
                    key={f.id}
                    layout
                    initial={{ opacity: 0, y: -16, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, height: 0, x: 40, transition: { duration: 0.32, ease: [0.4, 0, 0.2, 1] } }}
                    transition={{ type: 'spring', stiffness: 380, damping: 34 }}
                    className={cn('overflow-hidden', i > 0 && 'border-t border-white/[0.05]')}
                  >
                    <ListRow
                      data-tour={i === 0 ? 'feed-first' : undefined}
                      highlight={f.isNew}
                      leading={<IconBubble icon={<meta.icon className="h-5 w-5" />} tone={meta.tone} />}
                      title={f.title}
                      context={f.context}
                      time={fmtWhen(f.time)}
                      onClick={v ? () => navigate(`/fleet/${v.id}`) : undefined}
                      actions={
                        <Button
                          size="sm"
                          variant={f.kind === 'breakdown' || f.isNew ? 'primary' : 'secondary'}
                          data-tour={i === 0 ? 'feed-first-action' : undefined}
                          onClick={(e) => {
                            e.stopPropagation()
                            act(f)
                          }}
                        >
                          {actionLabel(f)}
                        </Button>
                      }
                    />
                  </motion.div>
                )
              })}
            </AnimatePresence>
            {done.length > 0 && (
              <div className="border-t border-white/[0.05]">
                <button onClick={() => setShowDone((s) => !s)} className="flex w-full items-center gap-2 px-5 py-3 text-sm text-muted hover:text-ink">
                  <Check className="h-4 w-4 text-ok" />
                  {done.length} handled this morning
                  <ChevronDown className={cn('ml-auto h-4 w-4 transition-transform', showDone && 'rotate-180')} />
                </button>
                <AnimatePresence>
                  {showDone && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      {done.map((f) => (
                        <div key={f.id} className="flex items-center gap-3 px-5 py-2.5 text-sm">
                          <Check className="h-4 w-4 shrink-0 text-ok" />
                          <span className="min-w-0 flex-1 truncate text-muted">{f.title}</span>
                          <span className="shrink-0 text-faint">{f.doneLabel}</span>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </section>

        <aside className="space-y-4">
          <h2 className="text-lg font-semibold">Right now</h2>
          <div className="card rounded-xl p-4">
            <div className="mb-3 flex items-center justify-between text-sm">
              <span className="font-medium">Breakdowns</span>
              <button onClick={() => navigate('/live')} className="text-accent">
                Open map
              </button>
            </div>
            <div className="space-y-3">
              {liveB.map((b) => {
                const v = vById.get(b.vehicleId)
                const last = b.steps[b.steps.length - 1]
                return (
                  <button key={b.id} onClick={() => navigate(`/live?b=${b.id}`)} className="flex w-full items-start gap-3 text-left">
                    <span className="relative mt-1.5 flex h-2.5 w-2.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-bad opacity-60" />
                      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-bad" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{b.place}</div>
                      <div className="truncate text-xs text-muted">
                        {v?.reg} · {last.step} {fmtTime(last.at)}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
          <div className="card rounded-xl p-4">
            <div className="mb-3 flex items-center justify-between text-sm">
              <span className="font-medium">Workshop</span>
              <button onClick={() => navigate('/workshop')} className="text-accent">
                Open boards
              </button>
            </div>
            {(['Dublin', 'Cork'] as const).map((d) => {
              const used = stats.occupied[d]
              const total = DEPOTS[d].bays
              const parts = jobs.filter((j) => j.depot === d && j.stage === 'Awaiting parts').length
              return (
                <div key={d} className="mb-3 last:mb-0">
                  <div className="mb-1.5 flex justify-between text-sm">
                    <span className="text-muted">{d}</span>
                    <span className="num">
                      {used}/{total} bays{parts ? ` · ${parts} on parts` : ''}
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                    <motion.div className="h-full rounded-full bg-accent" initial={{ width: 0 }} animate={{ width: `${(used / total) * 100}%` }} transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }} />
                  </div>
                </div>
              )
            })}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => navigate('/returns')} className="card rounded-xl p-4 text-left">
              <div className="text-sm text-muted">Returns to check in</div>
              <div className="mt-1 text-2xl font-semibold">
                <CountUp value={returnsWaiting} />
              </div>
            </button>
            <button onClick={() => navigate('/compliance')} className="card rounded-xl p-4 text-left">
              <div className="text-sm text-muted">Due in 30 days</div>
              <div className="mt-1 text-2xl font-semibold">
                <CountUp value={items.filter((i) => !i.booked).length} />
              </div>
            </button>
          </div>
        </aside>
      </div>
    </div>
  )
}
