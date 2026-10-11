import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Check, Repeat } from 'lucide-react'
import { Button, Chip, CountUp, PageHeader, Pill, Sheet, toast } from '@/components/ui'
import { VehicleThumb } from '@/components/vehicles/VehicleArt'
import { BUCKETS, bucketOf, useComplianceItems, type Bucket, type ComplianceItem } from '@/store/derived'
import { planBookings } from '@/store/planning'
import { customersById, useDemo, useVehicles } from '@/store'
import { COMPLIANCE_FILTERS, COMPLIANCE_LABEL, DEPOTS } from '@/data/catalog'
import { cn } from '@/lib/format'
import { fmtDayLong, relDays } from '@/lib/time'

const bucketTone: Record<Bucket, string> = {
  Overdue: 'bg-bad',
  'This week': 'bg-warn',
  'Next 2 weeks': 'bg-warn/60',
  'This month': 'bg-ok',
}

function Checkbox({ checked, onChange, label, partial }: { checked: boolean; onChange: () => void; label: string; partial?: boolean }) {
  return (
    <button
      role="checkbox"
      aria-checked={partial ? 'mixed' : checked}
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation()
        onChange()
      }}
      className={cn('focus-ring flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-[7px] ring-1 ring-inset transition-colors', checked || partial ? 'bg-accent text-accent-ink ring-accent' : 'ring-white/20 hover:ring-white/40')}
    >
      {checked && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
      {!checked && partial && <span className="h-0.5 w-2.5 rounded bg-accent-ink" />}
    </button>
  )
}

export default function Compliance() {
  const all = useComplianceItems(30)
  const vehicles = useVehicles()
  const [filter, setFilter] = useState<(typeof COMPLIANCE_FILTERS)[number] | 'All'>('All')
  const [sel, setSel] = useState<Set<string>>(new Set())
  const [sheet, setSheet] = useState(false)
  const vById = useMemo(() => new Map(vehicles.map((v) => [v.id, v])), [vehicles])

  const matches = (i: ComplianceItem) => filter === 'All' || i.kind === filter || (filter === 'Fridge' && i.kind === 'Probe')
  const items = all.filter(matches)
  const open = items.filter((i) => !i.booked)
  const booked = items.filter((i) => i.booked).sort((a, b) => a.booked!.date.localeCompare(b.booked!.date))
  const byBucket = (b: Bucket) => open.filter((i) => bucketOf(i.days) === b)
  const selected = open.filter((i) => sel.has(i.id))
  const plan = useMemo(() => (sheet ? planBookings(selected) : []), [sheet]) // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = (id: string) =>
    setSel((s) => {
      const n = new Set(s)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  const toggleBucket = (b: Bucket) => {
    const ids = byBucket(b).map((i) => i.id)
    const allOn = ids.every((id) => sel.has(id))
    setSel((s) => {
      const n = new Set(s)
      ids.forEach((id) => (allOn ? n.delete(id) : n.add(id)))
      return n
    })
  }
  const confirm = () => {
    useDemo.getState().bookCompliance(plan)
    const n = plan.length
    const custs = new Set(plan.map((p) => vById.get(p.vehicleId)?.customerId).filter(Boolean)).size
    setSheet(false)
    setSel(new Set())
    toast(`${n} booked. ${custs} customers notified.`)
  }

  const count = (b: Bucket) => all.filter((i) => !i.booked && bucketOf(i.days) === b).length

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-6 md:px-8 md:py-8">
      <PageHeader title="Compliance" sub="Everything due in the next 30 days, both depots, every type." />

      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-5" data-tour="radar-counts">
        {BUCKETS.map((b) => (
          <div key={b} className="card rounded-xl p-4">
            <div className="flex items-center gap-2 text-sm text-muted">
              <span className={cn('h-2 w-2 rounded-full', bucketTone[b])} />
              {b}
            </div>
            <div className="mt-1 text-2xl font-semibold">
              <CountUp value={count(b)} />
            </div>
          </div>
        ))}
        <div className="card col-span-2 rounded-xl p-4 md:col-span-1">
          <div className="flex items-center gap-2 text-sm text-muted">
            <Check className="h-3.5 w-3.5 text-ok" /> Booked
          </div>
          <div className="mt-1 text-2xl font-semibold">
            <CountUp value={all.filter((i) => i.booked).length} />
          </div>
        </div>
      </div>

      <div className="-mx-4 mb-6 flex gap-2 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0">
        <Chip active={filter === 'All'} onClick={() => setFilter('All')} count={all.length}>
          All
        </Chip>
        {COMPLIANCE_FILTERS.map((f) => (
          <Chip key={f} active={filter === f} onClick={() => setFilter(f)} count={all.filter((i) => i.kind === f || (f === 'Fridge' && i.kind === 'Probe')).length}>
            {f === 'Tail-lift' ? 'Tail-lift' : f === 'Fridge' ? 'Fridge and probes' : f}
          </Chip>
        ))}
      </div>

      <div className="space-y-6">
        {BUCKETS.map((b) => {
          const list = byBucket(b)
          if (!list.length) return null
          const allOn = list.every((i) => sel.has(i.id))
          const some = list.some((i) => sel.has(i.id))
          return (
            <section key={b} data-tour={`bucket-${b.toLowerCase().replace(/\s+/g, '-')}`}>
              <div className="mb-2 flex items-center gap-3 px-1">
                <Checkbox checked={allOn} partial={some && !allOn} onChange={() => toggleBucket(b)} label={`Select all ${b}`} />
                <span className={cn('h-2.5 w-2.5 rounded-full', bucketTone[b])} />
                <h2 className="text-lg font-semibold">{b}</h2>
                <span className="num text-sm text-muted">{list.length}</span>
              </div>
              <div className="card overflow-hidden rounded-xl">
                <AnimatePresence initial={false}>
                  {list.map((i, idx) => {
                    const cust = i.vehicle.customerId ? customersById[i.vehicle.customerId] : undefined
                    return (
                      <motion.div
                        key={i.id}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, height: 0, transition: { duration: 0.3 } }}
                        className={cn('overflow-hidden', idx > 0 && 'border-t border-white/[0.05]')}
                      >
                        <div onClick={() => toggle(i.id)} className={cn('flex cursor-pointer items-center gap-3.5 px-4 py-3 transition-colors hover:bg-white/[0.03] md:px-5', sel.has(i.id) && 'bg-accent/[0.05]')}>
                          <Checkbox checked={sel.has(i.id)} onChange={() => toggle(i.id)} label={`Select ${i.vehicle.reg}`} />
                          <VehicleThumb type={i.vehicle.type} className="hidden h-10 w-12 sm:flex" />
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-[15px] font-medium">
                              {COMPLIANCE_LABEL[i.kind]} <span className="text-muted">· {i.vehicle.reg}</span>
                            </div>
                            <div className="truncate text-sm text-muted">{cust ? cust.name : `${i.vehicle.status}, ${i.vehicle.depot} depot`}</div>
                          </div>
                          <div className="text-right">
                            <Pill tone={i.days < 0 ? 'bad' : i.days <= 2 ? 'warn' : 'neutral'}>{relDays(i.due)}</Pill>
                            <div className="mt-1 hidden text-xs text-faint sm:block">{fmtDayLong(i.due)}</div>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </div>
            </section>
          )
        })}

        {booked.length > 0 && (
          <section data-tour="booked">
            <div className="mb-2 flex items-center gap-3 px-1">
              <Check className="h-4 w-4 text-ok" />
              <h2 className="text-lg font-semibold">Booked</h2>
              <span className="num text-sm text-muted">{booked.length}</span>
            </div>
            <div className="card overflow-hidden rounded-xl">
              <AnimatePresence initial={false}>
                {booked.map((i, idx) => {
                  const r = i.booked?.replacementId ? vById.get(i.booked.replacementId) : undefined
                  return (
                    <motion.div key={i.id} layout initial={{ opacity: 0, backgroundColor: 'rgba(92,184,138,0.18)' }} animate={{ opacity: 1, backgroundColor: 'rgba(92,184,138,0)' }} transition={{ duration: 1.2 }} className={cn(idx > 0 && 'border-t border-white/[0.05]')}>
                      <div className="flex items-center gap-3.5 px-4 py-3 md:px-5">
                        <VehicleThumb type={i.vehicle.type} className="h-10 w-12" />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[15px] font-medium">
                            {COMPLIANCE_LABEL[i.kind]} <span className="text-muted">· {i.vehicle.reg}</span>
                          </div>
                          <div className="truncate text-sm text-muted">
                            {fmtDayLong(i.booked!.date)}, {DEPOTS[i.booked!.depot].site}
                            {r ? ` · replacement ${r.reg}` : ''}
                          </div>
                        </div>
                        <Pill tone="ok">Booked</Pill>
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          </section>
        )}
      </div>

      <AnimatePresence>
        {selected.length > 0 && (
          <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }} transition={{ type: 'spring', stiffness: 420, damping: 34 }} className="pointer-events-none fixed inset-x-0 bottom-24 z-40 flex justify-center px-4 lg:bottom-6 lg:pl-[244px]">
            <div className="glass-strong pointer-events-auto flex items-center gap-4 rounded-2xl py-2.5 pl-5 pr-2.5">
              <span className="text-sm">
                <span className="num font-semibold">{selected.length}</span> selected
              </span>
              <Button variant="ghost" size="sm" onClick={() => setSel(new Set())}>
                Clear
              </Button>
              <Button variant="primary" onClick={() => setSheet(true)} data-tour="book-all">
                Book all <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Sheet
        open={sheet}
        onOpenChange={setSheet}
        wide
        title={`Book ${plan.length} items`}
        description="Slots proposed across Ballycoolin and Douglas, each with a replacement matched by spec and distance."
        footer={
          <>
            <Button variant="ghost" onClick={() => setSheet(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={confirm} data-tour="confirm-booking">
              Confirm and notify customers
            </Button>
          </>
        }
      >
        <div className="mb-4 grid grid-cols-3 gap-3">
          {(['Dublin', 'Cork'] as const).map((d) => (
            <div key={d} className="rounded-xl bg-white/[0.04] p-3">
              <div className="text-xs text-muted">{DEPOTS[d].site}</div>
              <div className="text-xl font-semibold">{plan.filter((p) => p.depot === d).length} slots</div>
            </div>
          ))}
          <div className="rounded-xl bg-white/[0.04] p-3">
            <div className="text-xs text-muted">Replacements</div>
            <div className="text-xl font-semibold">{plan.filter((p) => p.replacementId).length} matched</div>
          </div>
        </div>
        <div className="overflow-hidden rounded-xl ring-1 ring-inset ring-white/[0.06]" data-tour="plan-list">
          {plan.map((p, idx) => {
            const v = vById.get(p.vehicleId)!
            const r = p.replacementId ? vById.get(p.replacementId) : undefined
            return (
              <motion.div key={p.itemId} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(idx * 0.04, 0.6) }} className={cn('grid grid-cols-1 gap-2 px-4 py-3 sm:grid-cols-[1.1fr_1fr_1.2fr] sm:items-center', idx > 0 && 'border-t border-white/[0.05]')}>
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{v.reg}</div>
                  <div className="truncate text-xs text-muted">{COMPLIANCE_LABEL[p.kind]}</div>
                </div>
                <div className="text-sm">
                  {fmtDayLong(p.date)}
                  <div className="text-xs text-muted">
                    {DEPOTS[p.depot].site}, bay {p.bay}
                  </div>
                </div>
                <div className="flex min-w-0 items-center gap-2 text-sm">
                  {r ? (
                    <>
                      <Repeat className="h-4 w-4 shrink-0 text-ok" />
                      <div className="min-w-0">
                        <div className="truncate font-medium">{r.reg}</div>
                        <div className="truncate text-xs text-muted">{p.reasons[1]}</div>
                      </div>
                    </>
                  ) : (
                    <span className="text-xs text-faint">{v.status === 'On hire' ? 'No match free' : 'Not on hire, no cover needed'}</span>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      </Sheet>
    </div>
  )
}
