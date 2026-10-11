import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, Check, Fuel, Gauge, PackageCheck, X } from 'lucide-react'
import { Button, Chip, CountUp, PageHeader, Pill, Segmented, toast } from '@/components/ui'
import { ListRow } from '@/components/ListRow'
import { VehicleArt, VehicleThumb } from '@/components/vehicles/VehicleArt'
import { customersById, rechargeLines, useDemo, useVehicles } from '@/store'
import { DAMAGE_TYPES, SEVERITIES, TYPE_LABEL } from '@/data/catalog'
import type { DamageMark, ReturnCheck, Vehicle } from '@/data/types'
import { cn, fmtEur, fmtEur2, fmtKm } from '@/lib/format'
import { NOW, fmtWhen } from '@/lib/time'

type Zone = { name: string; x: number; y: number }
const VAN_ZONES: Zone[] = [
  { name: 'Front bumper', x: 89, y: 75 },
  { name: 'Front wing', x: 81, y: 60 },
  { name: 'Cab door', x: 70, y: 52 },
  { name: 'Mirror', x: 79, y: 41 },
  { name: 'Side panel', x: 44, y: 46 },
  { name: 'Rear corner', x: 15, y: 46 },
  { name: 'Rear bumper', x: 12, y: 75 },
  { name: 'Roof', x: 40, y: 22 },
  { name: 'Wheel', x: 25, y: 77 },
]
const TRUCK_ZONES: Zone[] = [
  { name: 'Front bumper', x: 89, y: 78 },
  { name: 'Cab door', x: 80, y: 50 },
  { name: 'Mirror', x: 92, y: 40 },
  { name: 'Side panel', x: 42, y: 40 },
  { name: 'Rear corner', x: 9, y: 40 },
  { name: 'Rear bumper', x: 9, y: 70 },
  { name: 'Roof', x: 40, y: 12 },
  { name: 'Wheel', x: 25, y: 77 },
]
const zonesFor = (v: Vehicle) => (['panel-van', 'high-roof-van', 'fridge-van', 'luton'].includes(v.type) ? VAN_ZONES : TRUCK_ZONES)

function Diagram({ v, marks, side, interactive, onZone, activeZone, label }: { v: Vehicle; marks: DamageMark[]; side: 'Nearside' | 'Offside'; interactive?: boolean; onZone?: (z: string) => void; activeZone?: string | null; label: string }) {
  const zones = zonesFor(v)
  // Nearside is the left side in Ireland: the vehicle faces left when you stand at the nearside.
  const flip = side === 'Nearside'
  return (
    <div className="rounded-xl bg-gradient-to-b from-white/[0.05] to-white/[0.015] p-4 ring-1 ring-inset ring-white/[0.06]">
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-xs text-muted">{side}</span>
      </div>
      <div className="relative aspect-[280/120] w-full">
        <div className={cn('absolute inset-0', flip && '-scale-x-100')}>
          <VehicleArt type={v.type} className="h-full w-full" />
        </div>
        {zones.map((z) => {
          const x = flip ? 100 - z.x : z.x
          const zoneMarks = marks.filter((m) => m.zone === z.name && m.side === side)
          const has = zoneMarks.length > 0
          if (!interactive && !has) return null
          return (
            <button
              key={z.name}
              disabled={!interactive}
              onClick={() => onZone?.(z.name)}
              data-tour={interactive ? `zone-${z.name.toLowerCase().replace(/\s+/g, '-')}` : undefined}
              className={cn('group absolute -translate-x-1/2 -translate-y-1/2', interactive ? 'cursor-pointer' : 'cursor-default')}
              style={{ left: `${x}%`, top: `${z.y}%` }}
              aria-label={`${z.name}${has ? `, ${zoneMarks[0].type}` : ''}`}
            >
              {has ? (
                <span className={cn('relative flex h-6 w-6 items-center justify-center rounded-full text-2xs font-bold text-white ring-2 ring-canvas', interactive ? 'bg-bad' : 'bg-faint')}>
                  {interactive && <span className="absolute inset-0 animate-ping rounded-full bg-bad/50" />}
                  <span className="relative">{zoneMarks.length}</span>
                </span>
              ) : (
                <span className={cn('block h-4 w-4 rounded-full border-2 transition-all', activeZone === z.name ? 'scale-125 border-accent bg-accent/40' : 'border-white/50 bg-white/10 group-hover:scale-110 group-hover:border-accent')} />
              )}
              {interactive && <span className="pointer-events-none absolute left-1/2 top-full mt-1 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-raised px-2 py-0.5 text-2xs group-hover:block">{z.name}</span>}
            </button>
          )
        })}
      </div>
      <div className="mt-2 min-h-[20px] text-xs text-muted">
        {marks.length === 0 ? 'No damage recorded' : marks.map((m) => `${m.type} on ${m.zone.toLowerCase()} (${m.side.toLowerCase()})`).join(', ')}
      </div>
    </div>
  )
}

function FuelGauge({ eighths, label }: { eighths: number; label: string }) {
  return (
    <div>
      <div className="mb-1.5 flex justify-between text-xs text-muted">
        <span>{label}</span>
        <span className="num">{eighths}/8</span>
      </div>
      <div className="flex gap-1">
        {Array.from({ length: 8 }, (_, i) => (
          <span key={i} className={cn('h-2 flex-1 rounded-full', i < eighths ? (eighths <= 3 ? 'bg-warn' : 'bg-ok') : 'bg-white/[0.08]')} />
        ))}
      </div>
    </div>
  )
}

function CheckIn({ r, v }: { r: ReturnCheck; v: Vehicle }) {
  const navigate = useNavigate()
  const [side, setSide] = useState<'Nearside' | 'Offside'>('Nearside')
  const [zone, setZone] = useState<string | null>(null)
  const [dtype, setDtype] = useState<DamageMark['type']>('Scuff')
  const [sev, setSev] = useState<DamageMark['severity']>('Minor')
  const cust = customersById[r.customerId]
  const lines = rechargeLines(r, v)
  const total = lines.reduce((a, l) => a + l.amount, 0)
  const used = r.kmIn - r.kmOut
  const locked = r.status !== 'Waiting'

  const add = () => {
    if (!zone) return
    useDemo.getState().addDamage(r.id, { zone, side, type: dtype, severity: sev })
    setZone(null)
  }
  const raise = () => {
    useDemo.getState().raiseRecharge(r.id)
    toast(lines.length ? `Recharge of ${fmtEur2(total)} queued for invoicing` : `${v.reg} checked in, no charges`)
  }

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-6 md:px-8 md:py-8">
      <button onClick={() => navigate('/returns')} className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Returns
      </button>
      <PageHeader
        title={`${v.reg} check-in`}
        sub={`${v.make} ${v.model}, back from ${cust.name} after ${r.hireDays} days. Returned ${fmtWhen(r.returnedAt)}.`}
        right={<Segmented layoutId="ret-side" value={side} onChange={setSide} options={[{ value: 'Nearside', label: 'Nearside' }, { value: 'Offside', label: 'Offside' }]} />}
      />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2" data-tour="diagrams">
            <Diagram v={v} marks={r.before} side={side} label="At check-out" />
            <Diagram v={v} marks={r.after} side={side} interactive={!locked} onZone={(z) => setZone(z)} activeZone={zone} label="Now" />
          </div>
          <AnimatePresence>
            {zone && !locked && (
              <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="card rounded-xl p-4" data-tour="damage-form">
                <div className="mb-3 flex items-center justify-between">
                  <div className="font-medium">
                    {zone}, {side.toLowerCase()}
                  </div>
                  <button onClick={() => setZone(null)} className="text-faint hover:text-ink" aria-label="Close">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="mb-3 flex flex-wrap gap-2">
                  {DAMAGE_TYPES.map((t) => (
                    <Chip key={t} active={dtype === t} onClick={() => setDtype(t)} data-tour={`dtype-${t.toLowerCase()}`}>
                      {t}
                    </Chip>
                  ))}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {SEVERITIES.map((s) => (
                    <Chip key={s} active={sev === s} onClick={() => setSev(s)}>
                      {s}
                    </Chip>
                  ))}
                  <Button variant="primary" size="sm" className="ml-auto" onClick={add} data-tour="add-damage">
                    Add damage
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="card rounded-xl p-4">
              <div className="mb-3 flex items-center gap-2 font-medium">
                <Fuel className="h-4 w-4 text-muted" /> Fuel
              </div>
              <div className="space-y-3">
                <FuelGauge eighths={r.fuelOut} label="At check-out" />
                <FuelGauge eighths={r.fuelIn} label="Now" />
              </div>
            </div>
            <div className="card rounded-xl p-4">
              <div className="mb-3 flex items-center gap-2 font-medium">
                <Gauge className="h-4 w-4 text-muted" /> Mileage
              </div>
              <div className="text-2xl font-semibold">{fmtKm(used)}</div>
              <div className="mb-2 text-sm text-muted">against {fmtKm(r.allowanceKm)} allowed for this hire</div>
              <div className="relative h-2 overflow-hidden rounded-full bg-white/[0.08]">
                <div className={cn('h-full rounded-full', used > r.allowanceKm ? 'bg-warn' : 'bg-ok')} style={{ width: `${Math.min(100, (used / r.allowanceKm) * 100)}%` }} />
              </div>
              {used > r.allowanceKm && <div className="mt-1.5 text-xs text-warn">{fmtKm(used - r.allowanceKm)} over</div>}
            </div>
          </div>
        </div>

        <div className="lg:sticky lg:top-4 lg:self-start">
          <div className="card rounded-xl p-5" data-tour="recharge">
            <div className="mb-1 text-sm text-muted">Recharge</div>
            <div className="text-3xl font-semibold">
              <CountUp value={total} format={(n) => fmtEur2(n)} />
            </div>
            <div className="mt-4 space-y-0">
              <AnimatePresence initial={false}>
                {lines.map((l) => (
                  <motion.div key={l.label} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                    <div className="flex items-start justify-between gap-3 border-t border-white/[0.06] py-2.5 text-sm">
                      <span className="text-muted">{l.label}</span>
                      <span className="num shrink-0">{fmtEur2(l.amount)}</span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {lines.length === 0 && <div className="border-t border-white/[0.06] py-3 text-sm text-muted">Nothing to charge yet. Tap a point on the diagram to mark new damage.</div>}
            </div>
            {r.after.length > 0 && !locked && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {r.after.map((m) => (
                  <button key={m.id} onClick={() => useDemo.getState().removeDamage(r.id, m.id)} className="inline-flex items-center gap-1 rounded-full bg-white/[0.06] px-2.5 py-1 text-xs text-muted hover:text-ink">
                    {m.type}, {m.zone.toLowerCase()} <X className="h-3 w-3" />
                  </button>
                ))}
              </div>
            )}
            {locked ? (
              <div className="mt-5 flex items-center gap-2 rounded-lg bg-ok/10 p-3 text-sm text-ok">
                <Check className="h-4 w-4" /> {r.status === 'Raised' ? 'Raised and queued for invoicing' : 'Checked in, no charges'}
              </div>
            ) : (
              <Button variant="primary" size="lg" className="mt-5 w-full" onClick={raise} data-tour="raise-recharge">
                {lines.length ? 'Raise recharge' : 'Check in, no charges'}
              </Button>
            )}
            <p className="mt-3 text-xs text-faint">Photos and diagrams go with the invoice so the customer sees exactly what changed.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Returns() {
  const { id } = useParams()
  const returns = useDemo((s) => s.returns)
  const recharges = useDemo((s) => s.recharges)
  const vehicles = useVehicles()
  const navigate = useNavigate()
  const vById = useMemo(() => new Map(vehicles.map((v) => [v.id, v])), [vehicles])
  const current = id ? returns.find((r) => r.id === id) : undefined
  if (current) return <CheckIn r={current} v={vById.get(current.vehicleId)!} />

  const waiting = returns.filter((r) => r.status === 'Waiting')
  const month = NOW.toISOString().slice(0, 7)
  const thisMonth = recharges.filter((r) => r.raisedAt.slice(0, 7) === month)
  const monthTotal = thisMonth.reduce((a, r) => a + r.total, 0)
  const queued = recharges.filter((r) => r.status === 'Queued for invoicing')

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-6 md:px-8 md:py-8">
      <PageHeader title="Returns" sub="Check vehicles in against how they went out. Damage, fuel and mileage go straight to invoicing." />
      <div className="mb-6 grid grid-cols-3 gap-3">
        <div className="card rounded-xl p-4">
          <div className="text-sm text-muted">Waiting for check-in</div>
          <div className="mt-1 text-2xl font-semibold"><CountUp value={waiting.length} /></div>
        </div>
        <div className="card rounded-xl p-4" data-tour="recovered">
          <div className="text-sm text-muted">Recovered this month</div>
          <div className="mt-1 text-2xl font-semibold"><CountUp value={monthTotal} format={(n) => fmtEur(n)} /></div>
        </div>
        <div className="card rounded-xl p-4">
          <div className="text-sm text-muted">Queued for invoicing</div>
          <div className="mt-1 text-2xl font-semibold"><CountUp value={queued.length} /></div>
        </div>
      </div>

      <h2 className="mb-2 text-lg font-semibold">Waiting</h2>
      <div className="card mb-8 overflow-hidden rounded-xl" data-tour="returns-list">
        {waiting.length === 0 && <div className="p-8 text-center text-sm text-muted">All returns checked in.</div>}
        {waiting.map((r, i) => {
          const v = vById.get(r.vehicleId)!
          return (
            <div key={r.id} className={cn(i > 0 && 'border-t border-white/[0.05]')}>
              <ListRow
                data-tour={`return-${r.id}`}
                onClick={() => navigate(`/returns/${r.id}`)}
                leading={<VehicleThumb type={v.type} />}
                title={v.reg}
                context={`${TYPE_LABEL[v.type]} · ${customersById[r.customerId].name} · ${r.hireDays} days`}
                time={fmtWhen(r.returnedAt)}
                status={r.after.length ? <Pill tone="warn">Damage noted</Pill> : r.fuelIn < r.fuelOut ? <Pill>Fuel short</Pill> : <Pill>Ready</Pill>}
              />
            </div>
          )
        })}
      </div>

      <h2 className="mb-2 text-lg font-semibold">Recharge queue</h2>
      <div className="card overflow-hidden rounded-xl" data-tour="recharge-queue">
        {recharges.slice(0, 12).map((rc, i) => {
          const v = vById.get(rc.vehicleId)
          return (
            <div key={rc.id} className={cn('flex items-center gap-3 px-5 py-3', i > 0 && 'border-t border-white/[0.05]')}>
              <PackageCheck className="h-5 w-5 shrink-0 text-muted" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">
                  {customersById[rc.customerId]?.name} <span className="text-muted">· {v?.reg}</span>
                </div>
                <div className="truncate text-xs text-muted">{rc.lines.map((l) => l.label).join(', ')}</div>
              </div>
              <div className="text-right">
                <div className="num text-sm font-semibold">{fmtEur2(rc.total)}</div>
                <div className={cn('text-xs', rc.status === 'Invoiced' ? 'text-faint' : 'text-accent')}>{rc.status}</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
