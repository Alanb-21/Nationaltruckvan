import { useMemo, useState } from 'react'
import { NavLink, Route, Routes } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Bell, CalendarClock, Check, Download, FileText, Repeat, Send, Truck } from 'lucide-react'
import { Button, Chip, CountUp, Field, Pill, Sheet, inputClass, toast, type Tone } from '@/components/ui'
import { VehicleArt, VehicleThumb } from '@/components/vehicles/VehicleArt'
import { customersById, TOUR, useDemo, useVehicles } from '@/store'
import { useComplianceItems } from '@/store/derived'
import { documentsFor, serviceHistory } from '@/data/seed'
import { COMPLIANCE_LABEL, DEPOTS, REQUEST_TYPES, TYPE_LABEL } from '@/data/catalog'
import type { Vehicle } from '@/data/types'
import { cn } from '@/lib/format'
import { NOW, dayOffset, fmtDate, fmtDay, fmtDayLong, fmtTime, fmtWhen } from '@/lib/time'
import { Logo } from '@/components/Logo'

const CID = TOUR.slaneyId

function usePortalData() {
  const vehicles = useVehicles()
  const swaps = useDemo((s) => s.swaps)
  return useMemo(() => {
    const mine = vehicles.filter((v) => v.customerId === CID)
    const replacementIds = new Set(swaps.filter((s) => mine.some((m) => m.id === s.forVehicleId)).map((s) => s.replacementId))
    const contract = mine.filter((v) => !replacementIds.has(v.id))
    return { mine, contract, replacements: mine.filter((v) => replacementIds.has(v.id)) }
  }, [vehicles, swaps])
}

function friendlyStatus(v: Vehicle, covered: boolean): { label: string; tone: Tone } {
  if (v.status === 'VOR') return { label: covered ? 'Off road, replacement with you' : 'Off road', tone: covered ? 'warn' : 'bad' }
  if (v.status === 'In workshop') return { label: 'In workshop', tone: 'warn' }
  return { label: 'Working', tone: 'ok' }
}

function PortalNav() {
  const items = [
    { to: '/portal', label: 'Fleet', end: true },
    { to: '/portal/bookings', label: 'Bookings' },
    { to: '/portal/requests', label: 'Requests' },
    { to: '/portal/documents', label: 'Documents' },
  ]
  return (
    <div className="sticky top-0 z-20 px-3 pt-3">
      <div className="glass mx-auto flex max-w-[1180px] items-center gap-2 overflow-x-auto rounded-2xl px-3 py-2 md:gap-4 md:px-4">
        <div className="hidden shrink-0 items-center gap-3 border-r border-white/[0.08] pr-4 md:flex">
          <Logo className="h-7" />
        </div>
        <span className="shrink-0 text-sm font-semibold md:text-base">Slaney Pharma Logistics</span>
        <nav className="ml-auto flex shrink-0 gap-1">
          {items.map((i) => (
            <NavLink key={i.to} to={i.to} end={i.end} data-tour={`portal-${i.label.toLowerCase()}`} className={({ isActive }) => cn('rounded-[10px] px-3 py-1.5 text-sm font-medium transition-colors', isActive ? 'bg-white/[0.1] text-ink' : 'text-muted hover:text-ink')}>
              {i.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  )
}

function Notices() {
  const notices = useDemo((s) => s.notices).filter((n) => n.customerId === CID)
  const vehicles = useVehicles()
  return (
    <section className="card rounded-xl p-5" data-tour="portal-notices">
      <div className="mb-3 flex items-center gap-2">
        <Bell className="h-4 w-4 text-accent" />
        <h2 className="text-lg font-semibold">Updates from National</h2>
      </div>
      <div>
        <AnimatePresence initial={false}>
          {notices.slice(0, 5).map((n) => {
            const v = n.vehicleId ? vehicles.find((x) => x.id === n.vehicleId) : undefined
            return (
              <motion.div key={n.id} layout initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className={cn('relative flex gap-3 border-t border-white/[0.05] py-3 first:border-0 first:pt-0', n.isNew && '-mx-3 rounded-lg border-0 bg-accent/[0.07] px-3 first:pt-3')} data-tour={n.isNew && n.kind === 'replacement' ? 'portal-replacement' : undefined}>
                <div className={cn('mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full', n.kind === 'replacement' ? 'bg-ok/15 text-ok' : n.kind === 'booking' ? 'bg-accent/15 text-accent' : 'bg-white/[0.07] text-muted')}>
                  {n.kind === 'replacement' ? <Repeat className="h-4 w-4" /> : n.kind === 'booking' ? <CalendarClock className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <div className="text-[15px] font-medium">{n.title}</div>
                    <div className="num shrink-0 text-xs text-faint">{fmtWhen(n.at)}</div>
                  </div>
                  <div className="text-sm text-muted">{n.body}</div>
                  {v && n.kind === 'replacement' && n.isNew && <div className="mt-1 text-xs text-faint">No need to call. We will collect {v.reg} when it is fixed.</div>}
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </section>
  )
}

function FleetView() {
  const { contract, replacements } = usePortalData()
  const swaps = useDemo((s) => s.swaps)
  const bookings = useDemo((s) => s.bookings)
  const cust = customersById[CID]
  const covered = (id: string) => swaps.some((s) => s.forVehicleId === id)
  const working = contract.filter((v) => v.status === 'On hire').length
  const sorted = [...contract].sort((a, b) => (a.status === 'On hire' ? 1 : 0) - (b.status === 'On hire' ? 1 : 0) || a.reg.localeCompare(b.reg))
  return (
    <div className="mx-auto max-w-[1180px] px-4 py-6 md:px-8">
      <h1 className="text-3xl font-semibold">Morning, {cust.contact.split(' ')[0]}.</h1>
      <p className="mt-1.5 text-muted">
        {contract.length} vehicles on contract. {working} working today.
      </p>
      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          ['On contract', contract.length],
          ['Working', working],
          ['In workshop or off road', contract.length - working],
          ['Replacements with you', replacements.length],
        ].map(([l, n]) => (
          <div key={l} className="card rounded-xl p-4">
            <div className="text-sm text-muted">{l}</div>
            <div className="mt-1 text-2xl font-semibold">
              <CountUp value={n as number} />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_400px]">
        <section className="card overflow-hidden rounded-xl">
          <div className="px-5 pb-2 pt-4 text-lg font-semibold">Your vehicles</div>
          <div className="max-h-[620px] overflow-y-auto">
            {sorted.map((v) => {
              const s = friendlyStatus(v, covered(v.id))
              const b = Object.values(bookings).find((x) => x.itemId.startsWith(v.id + ':'))
              return (
                <div key={v.id} className="flex items-center gap-3.5 border-t border-white/[0.05] px-5 py-3">
                  <VehicleThumb type={v.type} />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium">{v.reg}</div>
                    <div className="truncate text-sm text-muted">
                      {TYPE_LABEL[v.type]} · {v.site}
                    </div>
                  </div>
                  <div className="text-right">
                    <Pill tone={s.tone} dot>
                      {s.label}
                    </Pill>
                    {b && <div className="mt-1 text-xs text-faint">Booked {fmtDay(b.date)}</div>}
                  </div>
                </div>
              )
            })}
          </div>
        </section>
        <div className="space-y-4">
          <Notices />
          {replacements.length > 0 && (
            <section className="card rounded-xl p-5">
              <h2 className="mb-3 text-lg font-semibold">Replacements</h2>
              {replacements.map((r) => {
                const sw = swaps.find((s) => s.replacementId === r.id)!
                const orig = contract.find((v) => v.id === sw.forVehicleId)
                const arrived = new Date(sw.eta).getTime() < NOW.getTime()
                return (
                  <div key={r.id} className="flex items-center gap-3 border-t border-white/[0.05] py-3 first:border-0 first:pt-0">
                    <VehicleThumb type={r.type} className="h-10 w-12" />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium">{r.reg}</div>
                      <div className="truncate text-xs text-muted">Covering {orig?.reg}</div>
                    </div>
                    <Pill tone={arrived ? 'ok' : 'accent'}>{arrived ? 'With you' : `ETA ${fmtTime(sw.eta)}`}</Pill>
                  </div>
                )
              })}
            </section>
          )}
        </div>
      </div>
    </div>
  )
}

function BookingsView() {
  const { contract } = usePortalData()
  const items = useComplianceItems(60).filter((i) => i.vehicle.customerId === CID && contract.some((c) => c.id === i.vehicle.id))
  const vehicles = useVehicles()
  const jobs = useDemo((s) => s.jobs).filter((j) => contract.some((c) => c.id === j.vehicleId) && j.kind !== 'Compliance')
  const booked = items.filter((i) => i.booked).sort((a, b) => a.booked!.date.localeCompare(b.booked!.date))
  const upcoming = items.filter((i) => !i.booked)
  return (
    <div className="mx-auto max-w-[1000px] px-4 py-6 md:px-8">
      <h1 className="text-3xl font-semibold">Bookings</h1>
      <p className="mt-1.5 text-muted">Every CVRT, service and inspection, with the replacement that covers it.</p>
      <section className="mt-6" data-tour="portal-booked">
        <h2 className="mb-2 text-lg font-semibold">Booked</h2>
        <div className="card overflow-hidden rounded-xl">
          {booked.length === 0 && <div className="p-6 text-sm text-muted">Nothing booked yet.</div>}
          {booked.map((i, idx) => {
            const r = i.booked!.replacementId ? vehicles.find((x) => x.id === i.booked!.replacementId) : undefined
            return (
              <motion.div key={i.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={cn('grid gap-2 px-5 py-3.5 sm:grid-cols-[1fr_1fr_1fr] sm:items-center', idx > 0 && 'border-t border-white/[0.05]')}>
                <div>
                  <div className="font-medium">{COMPLIANCE_LABEL[i.kind]}</div>
                  <div className="text-sm text-muted">{i.vehicle.reg}</div>
                </div>
                <div className="text-sm">
                  {fmtDayLong(i.booked!.date)}
                  <div className="text-muted">{i.kind === 'Tax' ? 'Renewed by National' : DEPOTS[i.booked!.depot].site}</div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  {i.kind === 'Tax' ? (
                    <span className="text-muted">No downtime</span>
                  ) : r ? (
                    <>
                      <Repeat className="h-4 w-4 text-ok" />
                      <span>
                        <span className="font-medium">{r.reg}</span> <span className="text-muted">covers it</span>
                      </span>
                    </>
                  ) : (
                    <span className="text-muted">Collection and delivery arranged</span>
                  )}
                </div>
              </motion.div>
            )
          })}
          {jobs.map((j) => {
            const v = vehicles.find((x) => x.id === j.vehicleId)!
            return (
              <div key={j.id} className="grid gap-2 border-t border-white/[0.05] px-5 py-3.5 sm:grid-cols-[1fr_1fr_1fr] sm:items-center">
                <div>
                  <div className="font-medium">{j.title}</div>
                  <div className="text-sm text-muted">{v.reg}</div>
                </div>
                <div className="text-sm">
                  {j.stage === 'Booked' ? fmtDayLong(j.bookedFor ?? dayOffset(0)) : j.stage}
                  <div className="text-muted">{DEPOTS[j.depot].site}</div>
                </div>
                <div className="text-sm text-muted">{j.replacementId ? 'Replacement allocated' : 'In hand'}</div>
              </div>
            )
          })}
        </div>
      </section>
      <section className="mt-6">
        <h2 className="mb-2 text-lg font-semibold">Coming up</h2>
        <div className="card overflow-hidden rounded-xl">
          {upcoming.slice(0, 12).map((i, idx) => (
            <div key={i.id} className={cn('flex items-center justify-between gap-3 px-5 py-3', idx > 0 && 'border-t border-white/[0.05]')}>
              <div className="min-w-0">
                <div className="truncate text-[15px] font-medium">
                  {COMPLIANCE_LABEL[i.kind]} <span className="text-muted">· {i.vehicle.reg}</span>
                </div>
                <div className="text-sm text-muted">Due {fmtDate(i.due)}</div>
              </div>
              <Pill>National will book this</Pill>
            </div>
          ))}
          {upcoming.length === 0 && <div className="p-6 text-sm text-muted">Nothing else due in the next 60 days.</div>}
        </div>
      </section>
    </div>
  )
}

function RequestsView() {
  const { contract } = usePortalData()
  const threads = useDemo((s) => s.threads).filter((t) => t.customerId === CID)
  const [type, setType] = useState<string>('Book a Service')
  const [vehicle, setVehicle] = useState('')
  const [date, setDate] = useState(dayOffset(3))
  const [details, setDetails] = useState('')
  const [sent, setSent] = useState(false)
  const submit = () => {
    useDemo.getState().submitCustomerRequest({ customerId: CID, type, vehicleId: vehicle || undefined, details: details || 'Please confirm.', date: type === 'Ask a Question' || type === 'Parts Enquiry' ? undefined : date })
    setSent(true)
    setDetails('')
    toast('Sent to National')
    setTimeout(() => setSent(false), 2200)
  }
  return (
    <div className="mx-auto grid max-w-[1100px] gap-6 px-4 py-6 md:px-8 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div>
        <h1 className="text-3xl font-semibold">Requests</h1>
        <p className="mt-1.5 text-muted">The same options as the website form. It lands with the National team straight away.</p>
        <div className="card mt-6 space-y-5 rounded-xl p-5" data-tour="portal-form">
          <Field label="What do you need?">
            <div className="flex flex-wrap gap-2">
              {REQUEST_TYPES.map((t) => (
                <Chip key={t} active={type === t} onClick={() => setType(t)}>
                  {t}
                </Chip>
              ))}
            </div>
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Vehicle">
              <select value={vehicle} onChange={(e) => setVehicle(e.target.value)} className={inputClass}>
                <option value="">{type === 'Request an extra vehicle' ? 'New vehicle' : 'Any or not sure'}</option>
                {contract.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.reg} · {TYPE_LABEL[v.type]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Preferred date">
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} />
            </Field>
          </div>
          <Field label="Details">
            <textarea value={details} onChange={(e) => setDetails(e.target.value)} rows={3} placeholder="Anything we should know" className={cn(inputClass, 'h-auto py-3')} />
          </Field>
          <div className="flex justify-end">
            <Button variant="primary" size="lg" onClick={submit}>
              {sent ? (
                <>
                  <Check className="h-4 w-4" /> Sent
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" /> Send request
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
      <div>
        <h2 className="mb-2 mt-1 text-lg font-semibold lg:mt-[86px]">Your recent requests</h2>
        <div className="card overflow-hidden rounded-xl">
          {threads.map((t, i) => {
            const last = t.messages[t.messages.length - 1]
            return (
              <div key={t.id} className={cn('px-4 py-3', i > 0 && 'border-t border-white/[0.05]')}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium">{t.tag}</span>
                  <span className="num text-xs text-faint">{fmtWhen(last.at)}</span>
                </div>
                <div className="truncate text-sm text-muted">{last.from === 'us' ? `National: ${last.text}` : last.text}</div>
                {t.converted && <div className="mt-1 text-xs text-ok">{t.converted.replace(/^Job .* created$/, 'Booked into the workshop')}</div>}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function PackPreview({ vehicles }: { vehicles: Vehicle[] }) {
  const cust = customersById[CID]
  return (
    <div className="mx-auto max-w-[680px] rounded-md bg-white p-8 text-[#0d1b30] shadow-2xl">
      <div className="flex items-start justify-between border-b-2 border-[#071b3a] pb-4">
        <div>
          <div className="text-xl font-extrabold tracking-wide text-[#071b3a]">NATIONAL</div>
          <div className="text-[9px] font-semibold tracking-[0.2em] text-[#b48f00]">TRUCK &amp; VAN RENTAL</div>
        </div>
        <div className="text-right text-xs text-[#4b5a70]">
          Compliance and maintenance pack
          <br />
          Issued {fmtDate(dayOffset(0))}
        </div>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3 text-xs">
        <div>
          <div className="text-[#6b7a90]">Customer</div>
          <div className="font-semibold">{cust.name}</div>
        </div>
        <div>
          <div className="text-[#6b7a90]">Vehicles</div>
          <div className="font-semibold">{vehicles.length}</div>
        </div>
        <div>
          <div className="text-[#6b7a90]">Prepared for</div>
          <div className="font-semibold">{cust.contact}</div>
        </div>
      </div>
      <table className="mt-5 w-full text-left text-[11px]">
        <thead>
          <tr className="border-b border-[#d5dbe4] text-[#6b7a90]">
            <th className="py-1.5 font-medium">Registration</th>
            <th className="py-1.5 font-medium">Type</th>
            <th className="py-1.5 font-medium">CVRT due</th>
            <th className="py-1.5 font-medium">Last service</th>
            <th className="py-1.5 font-medium">Fridge / probe</th>
          </tr>
        </thead>
        <tbody>
          {vehicles.slice(0, 14).map((v) => {
            const h = serviceHistory(v)[0]
            return (
              <tr key={v.id} className="border-b border-[#eef1f5]">
                <td className="py-1.5 font-semibold">{v.reg}</td>
                <td className="py-1.5">{TYPE_LABEL[v.type]}</td>
                <td className="py-1.5">{v.due.CVRT ? fmtDate(v.due.CVRT) : 'n/a'}</td>
                <td className="py-1.5">{fmtDate(h.date)}</td>
                <td className="py-1.5">{v.due.Probe ? `Calibrated, next ${fmtDay(v.due.Probe)}` : 'n/a'}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
      {vehicles.length > 14 && <div className="mt-2 text-[11px] text-[#6b7a90]">and {vehicles.length - 14} more vehicles in the full pack</div>}
      <div className="mt-6 grid grid-cols-2 gap-4 text-[11px] text-[#4b5a70]">
        <div>Temperature probe calibration records are traceable for GDP audit. Tail-lift examinations meet LOLER six-month intervals.</div>
        <div className="text-right">
          Martin Brannock
          <br />
          Head of Fleet Operations
        </div>
      </div>
    </div>
  )
}

function DocumentsView() {
  const { contract } = usePortalData()
  const [sel, setSel] = useState(contract[0]?.id)
  const [pack, setPack] = useState(false)
  const v = contract.find((x) => x.id === sel) ?? contract[0]
  return (
    <div className="mx-auto max-w-[1100px] px-4 py-6 md:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Documents</h1>
          <p className="mt-1.5 text-muted">Maintenance and inspection records for every vehicle, ready for audit.</p>
        </div>
        <Button variant="primary" size="lg" onClick={() => setPack(true)} data-tour="portal-pack">
          <Download className="h-4 w-4" /> Download compliance pack
        </Button>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-[300px_minmax(0,1fr)]">
        <div className="card max-h-[560px] overflow-y-auto rounded-xl p-1.5">
          {contract.map((x) => (
            <button key={x.id} onClick={() => setSel(x.id)} className={cn('flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left', x.id === v?.id ? 'bg-white/[0.08]' : 'hover:bg-white/[0.04]')}>
              <VehicleThumb type={x.type} className="h-8 w-10" />
              <span className="text-sm font-medium">{x.reg}</span>
              <span className="ml-auto truncate text-xs text-faint">{TYPE_LABEL[x.type]}</span>
            </button>
          ))}
        </div>
        {v && (
          <div className="card rounded-xl p-5">
            <div className="flex items-center gap-4">
              <VehicleArt type={v.type} className="w-40" />
              <div>
                <div className="text-xl font-semibold">{v.reg}</div>
                <div className="text-sm text-muted">
                  {v.make} {v.model}
                </div>
              </div>
            </div>
            <h3 className="mb-1 mt-5 font-semibold">Records</h3>
            {documentsFor(v).map((d) => (
              <button key={d.name} onClick={() => toast(`${d.name} downloaded`)} className="flex w-full items-center gap-3 border-t border-white/[0.05] py-2.5 text-left text-sm first:border-0 hover:text-accent">
                <FileText className="h-4 w-4 text-muted" />
                <span className="flex-1">{d.name}</span>
                <span className="text-xs text-faint">{fmtDate(d.date)}</span>
              </button>
            ))}
            <h3 className="mb-1 mt-5 font-semibold">Maintenance history</h3>
            {serviceHistory(v).map((h, i) => (
              <div key={i} className="flex items-center gap-3 border-t border-white/[0.05] py-2.5 text-sm first:border-0">
                <Truck className="h-4 w-4 text-muted" />
                <span className="flex-1">{h.title}</span>
                <span className="text-xs text-faint">{fmtDate(h.date)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <Sheet open={pack} onOpenChange={setPack} wide title="Compliance pack" description={`${contract.length} vehicles, generated ${fmtDayLong(dayOffset(0))}`} footer={<><Button variant="ghost" onClick={() => setPack(false)}>Close</Button><Button variant="primary" onClick={() => (setPack(false), toast('Compliance pack saved as PDF'))}><Download className="h-4 w-4" /> Save PDF</Button></>}>
        <div className="rounded-xl bg-[#1a2a44] p-4 md:p-6">
          <PackPreview vehicles={contract} />
        </div>
      </Sheet>
    </div>
  )
}

export default function Portal() {
  return (
    <div className="pb-10">
      <PortalNav />
      <Routes>
        <Route index element={<FleetView />} />
        <Route path="bookings" element={<BookingsView />} />
        <Route path="requests" element={<RequestsView />} />
        <Route path="documents" element={<DocumentsView />} />
      </Routes>
    </div>
  )
}
