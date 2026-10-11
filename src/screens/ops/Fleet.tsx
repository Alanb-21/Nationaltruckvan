import { useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useVirtualizer } from '@tanstack/react-virtual'
import * as Menu from '@radix-ui/react-dropdown-menu'
import { motion } from 'framer-motion'
import { Building2, CalendarPlus, Check, ChevronDown, MessageSquare, Search, X } from 'lucide-react'
import { Button, Chip, PageHeader, Segmented, StatusPill, inputClass, toast } from '@/components/ui'
import { VehicleThumb } from '@/components/vehicles/VehicleArt'
import { customersById, seed, useVehicles } from '@/store'
import { STATUSES, TYPES, TYPE_SHORT, TYPE_LABEL } from '@/data/catalog'
import type { Vehicle, VehicleStatus, VehicleType } from '@/data/types'
import { cn, fmtKm } from '@/lib/format'
import { daysUntil, relDays } from '@/lib/time'

function nextDue(v: Vehicle) {
  const entries = Object.entries(v.due) as [string, string][]
  entries.sort((a, b) => a[1].localeCompare(b[1]))
  return entries[0]
}

export default function Fleet() {
  const vehicles = useVehicles()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const [status, setStatus] = useState<VehicleStatus | 'All'>((params.get('status') as VehicleStatus) || 'All')
  const [depot, setDepot] = useState<'All' | 'Dublin' | 'Cork'>('All')
  const [type, setType] = useState<VehicleType | 'All'>('All')
  const [q, setQ] = useState('')
  const customer = params.get('customer') ?? ''

  const base = useMemo(
    () => vehicles.filter((v) => (depot === 'All' || v.depot === depot) && (type === 'All' || v.type === type) && (!customer || v.customerId === customer) && (!q || v.reg.toLowerCase().replace(/[-\u2011]/g, '').includes(q.toLowerCase().replace(/[-\u2011]/g, '')))),
    [vehicles, depot, type, customer, q],
  )
  const list = useMemo(() => (status === 'All' ? base : base.filter((v) => v.status === status)), [base, status])
  const counts = useMemo(() => {
    const c: Record<string, number> = {}
    for (const v of base) c[v.status] = (c[v.status] ?? 0) + 1
    return c
  }, [base])

  const parentRef = useRef<HTMLDivElement>(null)
  const rv = useVirtualizer({ count: list.length, getScrollElement: () => parentRef.current, estimateSize: () => 72, overscan: 10 })

  const customers = useMemo(() => {
    const n: Record<string, number> = {}
    for (const v of vehicles) if (v.customerId) n[v.customerId] = (n[v.customerId] ?? 0) + 1
    return seed.customers.map((c) => ({ ...c, n: n[c.id] ?? 0 })).sort((a, b) => a.name.localeCompare(b.name))
  }, [vehicles])

  const setCustomer = (id: string) => {
    const p = new URLSearchParams(params)
    if (id) p.set('customer', id)
    else p.delete('customer')
    setParams(p, { replace: true })
  }

  return (
    <div className="mx-auto flex h-full max-w-[1280px] flex-col px-4 pt-6 md:px-8 md:pt-8">
      <PageHeader
        title="Fleet"
        sub={`${vehicles.length.toLocaleString('en-IE')} vehicles across Dublin and Cork`}
        right={
          <div className="relative w-full md:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find a registration" className={cn(inputClass, 'h-10 pl-9 text-sm')} />
          </div>
        }
      />

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Segmented layoutId="fleet-depot" size="sm" value={depot} onChange={setDepot} options={[{ value: 'All', label: 'Both depots' }, { value: 'Dublin', label: 'Dublin' }, { value: 'Cork', label: 'Cork' }]} />
        <Menu.Root modal={false}>
          <Menu.Trigger asChild>
            <button className={cn('focus-ring inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-sm font-medium', customer ? 'bg-ink text-canvas' : 'bg-white/[0.06] text-muted hover:text-ink')}>
              <Building2 className="h-4 w-4" />
              <span className="max-w-[180px] truncate">{customer ? customersById[customer].name : 'All customers'}</span>
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
          </Menu.Trigger>
          <Menu.Portal>
            <Menu.Content align="start" sideOffset={8} className="glass-strong z-[70] max-h-[60vh] w-72 overflow-y-auto rounded-xl p-1.5 text-sm">
              <Menu.Item onSelect={() => setCustomer('')} className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 outline-none data-[highlighted]:bg-white/[0.07]">
                {!customer ? <Check className="h-4 w-4 text-accent" /> : <span className="w-4" />} All customers
              </Menu.Item>
              {customers.map((c) => (
                <Menu.Item key={c.id} onSelect={() => setCustomer(c.id)} className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 outline-none data-[highlighted]:bg-white/[0.07]">
                  {customer === c.id ? <Check className="h-4 w-4 text-accent" /> : <span className="w-4" />}
                  <span className="flex-1 truncate">{c.name}</span>
                  <span className="num text-xs text-faint">{c.n}</span>
                </Menu.Item>
              ))}
            </Menu.Content>
          </Menu.Portal>
        </Menu.Root>
        {customer && (
          <button onClick={() => setCustomer('')} className="text-faint hover:text-ink" aria-label="Clear customer">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      <div className="-mx-4 mb-2 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0">
        <Chip active={type === 'All'} onClick={() => setType('All')}>
          All types
        </Chip>
        {TYPES.map((t) => (
          <Chip key={t} active={type === t} onClick={() => setType(type === t ? 'All' : t)}>
            {TYPE_SHORT[t]}
          </Chip>
        ))}
      </div>
      <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0">
        <Chip active={status === 'All'} onClick={() => setStatus('All')} count={base.length}>
          All
        </Chip>
        {STATUSES.map((s) => (
          <Chip key={s} active={status === s} onClick={() => setStatus(status === s ? 'All' : s)} count={counts[s] ?? 0}>
            {s}
          </Chip>
        ))}
      </div>

      <div ref={parentRef} className="card mb-4 min-h-[360px] flex-1 overflow-y-auto rounded-xl lg:mb-8" data-tour="fleet-list">
        {list.length === 0 && <div className="py-16 text-center text-muted">No vehicles match these filters.</div>}
        <div style={{ height: rv.getTotalSize(), position: 'relative' }}>
          {rv.getVirtualItems().map((row) => {
            const v = list[row.index]
            const nd = nextDue(v)
            const d = daysUntil(nd[1])
            const cust = v.customerId ? customersById[v.customerId] : undefined
            return (
              <div key={v.id} className={cn('absolute inset-x-0', row.index > 0 && 'border-t border-white/[0.05]')} style={{ top: 0, transform: `translateY(${row.start}px)`, height: row.size }}>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(`/fleet/${v.id}`)}
                  onKeyDown={(e) => e.key === 'Enter' && navigate(`/fleet/${v.id}`)}
                  className="group flex h-full cursor-pointer items-center gap-3.5 px-4 hover:bg-white/[0.035] md:px-5"
                >
                  <motion.div layoutId={`veh-${v.id}`}>
                    <VehicleThumb type={v.type} />
                  </motion.div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-[15px] font-semibold">{v.reg}</span>
                      <span className="hidden truncate text-sm text-faint sm:inline">
                        {v.make} {v.model}
                      </span>
                    </div>
                    <div className="truncate text-sm text-muted">
                      {TYPE_LABEL[v.type]} · {cust ? cust.name : `${v.depot} depot`}
                      <span className="hidden md:inline"> · {fmtKm(v.odometer)}</span>
                    </div>
                  </div>
                  <div className="hidden items-center gap-1.5 opacity-0 transition-opacity group-hover:opacity-100 lg:flex">
                    <Button size="sm" variant="ghost" onClick={(e) => (e.stopPropagation(), toast(`Service request opened for ${v.reg}`))}>
                      <CalendarPlus className="h-4 w-4" /> Book
                    </Button>
                    {cust && (
                      <Button size="sm" variant="ghost" onClick={(e) => (e.stopPropagation(), navigate('/inbox'))}>
                        <MessageSquare className="h-4 w-4" /> Message
                      </Button>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <StatusPill status={v.status} />
                    <span className={cn('text-xs', d < 0 ? 'text-bad' : d <= 7 ? 'text-warn' : 'text-faint')}>
                      {nd[0] === 'Probe' ? 'Probe cal' : nd[0]} {relDays(nd[1]).toLowerCase()}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
