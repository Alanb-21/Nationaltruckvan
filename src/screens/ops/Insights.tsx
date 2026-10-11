import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Database } from 'lucide-react'
import { CountUp, PageHeader, Pill, Segmented } from '@/components/ui'
import { VehicleThumb } from '@/components/vehicles/VehicleArt'
import { seed, useDemo, useVehicles } from '@/store'
import { TYPES, TYPE_SHORT, TYPE_LABEL } from '@/data/catalog'
import { cn, fmtEur, fmtKm } from '@/lib/format'
import { NOW, dayOffset, fmtDay } from '@/lib/time'

const ACCENT = '#FFCD00'
const AXIS = { fill: '#62728e', fontSize: 12 }
const GRID = 'rgba(255,255,255,0.06)'

function ChartCard({ title, sub, children, className, tour }: { title: string; sub?: string; children: React.ReactNode; className?: string; tour?: string }) {
  return (
    <section className={cn('card rounded-xl p-5', className)} data-tour={tour}>
      <h2 className="text-lg font-semibold">{title}</h2>
      {sub && <p className="mt-0.5 text-sm text-muted">{sub}</p>}
      <div className="mt-4">{children}</div>
    </section>
  )
}

function Tip({ active, payload, label, unit = '', fmt }: { active?: boolean; payload?: { value: number }[]; label?: string; unit?: string; fmt?: (n: number) => string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="glass-strong rounded-lg px-3 py-2 text-xs">
      <div className="text-muted">{label}</div>
      <div className="num text-sm font-semibold text-ink">{fmt ? fmt(payload[0].value) : `${payload[0].value}${unit}`}</div>
    </div>
  )
}

export default function Insights() {
  const vehicles = useVehicles()
  const recharges = useDemo((s) => s.recharges)
  const navigate = useNavigate()
  const [depot, setDepot] = useState<'All' | 'Dublin' | 'Cork'>('All')

  const util = useMemo(
    () =>
      TYPES.map((t) => {
        const vs = vehicles.filter((v) => v.type === t && v.status !== 'Defleet' && (depot === 'All' || v.depot === depot))
        const on = vs.filter((v) => v.status === 'On hire').length
        return { name: TYPE_SHORT[t], value: vs.length ? Math.round((on / vs.length) * 100) : 0, n: vs.length }
      }).sort((a, b) => b.value - a.value),
    [vehicles, depot],
  )
  const active = vehicles.filter((v) => v.status !== 'Defleet' && (depot === 'All' || v.depot === depot))
  const utilAll = Math.round((active.filter((v) => v.status === 'On hire').length / Math.max(1, active.length)) * 100)

  const downtime = useMemo(() => {
    const weeks = Array.from({ length: 12 }, (_, i) => ({ start: dayOffset(-(12 - i) * 7), value: 0 }))
    for (const e of seed.vorHistory) {
      const idx = weeks.findIndex((w, i) => e.start >= w.start && (i === 11 || e.start < weeks[i + 1].start))
      if (idx >= 0) weeks[idx].value += e.days
    }
    return weeks.map((w) => ({ name: fmtDay(w.start), value: w.value }))
  }, [])
  const last4 = downtime.slice(-4).reduce((a, w) => a + w.value, 0)
  const prev4 = downtime.slice(-8, -4).reduce((a, w) => a + w.value, 0)

  const onTime = useMemo(() => {
    const weeks = Array.from({ length: 12 }, (_, i) => ({ start: dayOffset(-(12 - i) * 7), done: 0, ok: 0 }))
    for (const r of seed.complianceHistory) {
      const idx = weeks.findIndex((w, i) => r.due >= w.start && (i === 11 || r.due < weeks[i + 1].start))
      if (idx < 0) continue
      weeks[idx].done++
      if (r.done <= r.due) weeks[idx].ok++
    }
    return weeks.map((w) => ({ name: fmtDay(w.start), value: Math.round((w.ok / Math.max(1, w.done)) * 1000) / 10 }))
  }, [])
  const onTimeAll = (() => {
    const h = seed.complianceHistory.slice(-260)
    return Math.round((h.filter((r) => r.done <= r.due).length / h.length) * 1000) / 10
  })()

  const month = NOW.toISOString().slice(0, 7)
  const monthTotal = recharges.filter((r) => r.raisedAt.slice(0, 7) === month).reduce((a, r) => a + r.total, 0)
  const rechargeSeries = [
    ...seed.rechargeHistory.map((m) => ({ name: new Intl.DateTimeFormat('en-IE', { month: 'short' }).format(new Date(m.month + '-15')), value: m.total })),
    { name: new Intl.DateTimeFormat('en-IE', { month: 'short' }).format(NOW) + ' so far', value: Math.round(monthTotal) },
  ]

  const reasons = useMemo(() => {
    const m: Record<string, number> = {}
    for (const e of seed.vorHistory) {
      const key = e.reason.replace(/ failure| fault.*| seized/i, '').replace('Fridge unit compressor', 'Fridge unit fault').replace('Tail-lift hydraulic leak', 'Tail-lift fault')
      m[key] = (m[key] ?? 0) + e.days
    }
    return Object.entries(m)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6)
  }, [])

  const defleet = useMemo(
    () =>
      vehicles
        .filter((v) => v.status !== 'Defleet' && v.year <= 2020)
        .map((v) => {
          const age = NOW.getFullYear() - v.year
          const typical = v.type === 'tractor' ? 650000 : ['panel-van', 'high-roof-van', 'fridge-van', 'luton'].includes(v.type) ? 220000 : 480000
          return { v, score: age / 6 + v.odometer / typical, age }
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, 8),
    [vehicles],
  )
  const idle = vehicles.filter((v) => v.status === 'Available' && !v.reservedFor && v.idx % 3 === 0)

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-6 md:px-8 md:py-8">
      <PageHeader title="Insights" sub="How the fleet is working, built from the same live records." right={<Segmented layoutId="ins-depot" size="sm" value={depot} onChange={setDepot} options={[{ value: 'All', label: 'Both depots' }, { value: 'Dublin', label: 'Dublin' }, { value: 'Cork', label: 'Cork' }]} />} />

      <div className="mb-4 grid grid-cols-2 gap-3 xl:grid-cols-4" data-tour="insight-kpis">
        <div className="card rounded-xl p-4">
          <div className="text-sm text-muted">Utilisation</div>
          <div className="mt-1 text-3xl font-semibold"><CountUp value={utilAll} format={(n) => `${Math.round(n)}%`} /></div>
          <div className="text-xs text-faint">of active vehicles on hire</div>
        </div>
        <div className="card rounded-xl p-4">
          <div className="text-sm text-muted">Downtime, last 4 weeks</div>
          <div className="mt-1 text-3xl font-semibold"><CountUp value={last4} /> <span className="text-base font-normal text-muted">days</span></div>
          <div className={cn('text-xs', last4 <= prev4 ? 'text-ok' : 'text-warn')}>{last4 <= prev4 ? `${prev4 - last4} fewer than the 4 weeks before` : `${last4 - prev4} more than the 4 weeks before`}</div>
        </div>
        <div className="card rounded-xl p-4">
          <div className="text-sm text-muted">Compliance on time</div>
          <div className="mt-1 text-3xl font-semibold"><CountUp value={onTimeAll} format={(n) => `${n.toFixed(1)}%`} /></div>
          <div className="text-xs text-faint">last 4 weeks</div>
        </div>
        <div className="card rounded-xl p-4">
          <div className="text-sm text-muted">Recharges recovered</div>
          <div className="mt-1 text-3xl font-semibold"><CountUp value={monthTotal} format={(n) => fmtEur(n)} /></div>
          <div className="text-xs text-faint">this month</div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Utilisation by vehicle type" sub="Share of each type out on hire today" tour="chart-util">
          <div className="h-[300px]">
            <ResponsiveContainer>
              <BarChart data={util} layout="vertical" margin={{ left: 8, right: 36, top: 0, bottom: 0 }} barCategoryGap={6}>
                <XAxis type="number" domain={[0, 100]} hide />
                <YAxis type="category" dataKey="name" width={96} tick={AXIS} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.04)' }} content={<Tip unit="%" />} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} fill={ACCENT} label={{ position: 'right', fill: '#96a4bc', fontSize: 12, formatter: (v: number) => `${v}%` }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Downtime days per week" sub="Days off road across the fleet, last 12 weeks" tour="chart-downtime">
          <div className="h-[300px]">
            <ResponsiveContainer>
              <AreaChart data={downtime} margin={{ left: -16, right: 8, top: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id="dt" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor={ACCENT} stopOpacity={0.28} />
                    <stop offset="1" stopColor={ACCENT} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={GRID} vertical={false} />
                <XAxis dataKey="name" tick={AXIS} axisLine={false} tickLine={false} interval={2} />
                <YAxis tick={AXIS} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ stroke: 'rgba(255,255,255,0.2)' }} content={<Tip unit=" days" />} />
                <Area type="monotone" dataKey="value" stroke={ACCENT} strokeWidth={2} fill="url(#dt)" activeDot={{ r: 5, stroke: '#081832', strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Compliance on time" sub="Items done on or before the due date, by week">
          <div className="h-[260px]">
            <ResponsiveContainer>
              <AreaChart data={onTime} margin={{ left: -16, right: 8, top: 8, bottom: 0 }}>
                <CartesianGrid stroke={GRID} vertical={false} />
                <XAxis dataKey="name" tick={AXIS} axisLine={false} tickLine={false} interval={2} />
                <YAxis domain={[90, 100]} tick={AXIS} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                <Tooltip cursor={{ stroke: 'rgba(255,255,255,0.2)' }} content={<Tip unit="%" />} />
                <Area type="monotone" dataKey="value" stroke={ACCENT} strokeWidth={2} fill="transparent" activeDot={{ r: 5, stroke: '#081832', strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Recharges recovered" sub="Damage, fuel and excess mileage raised at check-in">
          <div className="h-[260px]">
            <ResponsiveContainer>
              <BarChart data={rechargeSeries} margin={{ left: -4, right: 8, top: 8, bottom: 0 }} barCategoryGap="28%">
                <CartesianGrid stroke={GRID} vertical={false} />
                <XAxis dataKey="name" tick={AXIS} axisLine={false} tickLine={false} />
                <YAxis tick={AXIS} axisLine={false} tickLine={false} tickFormatter={(v) => `€${Math.round(v / 1000)}k`} />
                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.04)' }} content={<Tip fmt={fmtEur} />} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {rechargeSeries.map((_, i) => (
                    <Cell key={i} fill={i === rechargeSeries.length - 1 ? ACCENT : 'rgba(255,205,0,0.45)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Top reasons off road" sub="Downtime days by cause, last 12 weeks">
          <div className="space-y-3">
            {reasons.map((r) => (
              <div key={r.name}>
                <div className="mb-1 flex justify-between text-sm">
                  <span>{r.name}</span>
                  <span className="num text-muted">{r.value} days</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
                  <div className="h-full rounded-full bg-accent/80" style={{ width: `${(r.value / reasons[0].value) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </ChartCard>

        <ChartCard title="Defleet candidates" sub={`Oldest and highest mileage first. ${idle.length} more units idle at the depots.`} tour="defleet">
          <div className="-mx-1">
            {defleet.map(({ v, age }) => (
              <button key={v.id} onClick={() => navigate(`/fleet/${v.id}`)} className="flex w-full items-center gap-3 rounded-lg px-1 py-2 text-left hover:bg-white/[0.04]">
                <VehicleThumb type={v.type} className="h-9 w-12" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium">{v.reg}</div>
                  <div className="truncate text-xs text-muted">{TYPE_LABEL[v.type]}, {v.make}</div>
                </div>
                <div className="text-right text-xs text-muted">
                  <div className="num text-ink">{fmtKm(v.odometer)}</div>
                  <div>{age} years</div>
                </div>
              </button>
            ))}
          </div>
        </ChartCard>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2 text-sm text-muted" data-tour="sources">
        <Database className="h-4 w-4" />
        {['Telematics', 'Workshop system', 'Accounts', 'Tachograph'].map((s) => (
          <Pill key={s}>{s}</Pill>
        ))}
        <span className="ml-1">Sits on top of the systems National already runs.</span>
      </div>
    </div>
  )
}
