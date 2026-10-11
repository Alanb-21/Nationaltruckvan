import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AlertTriangle, ArrowLeft, CalendarPlus, FileText, MessageSquare, Repeat, Download, OctagonAlert } from 'lucide-react'
import { Button, Chip, Pill, Sheet, STATUS_TONE, StatusPill, toast } from '@/components/ui'
import { VehicleArt } from '@/components/vehicles/VehicleArt'
import { customersById, matchReplacement, placeOf, useDemo, useVehicle, useVehicles } from '@/store'
import { documentsFor, serviceHistory } from '@/data/seed'
import { COMPLIANCE_LABEL, DEPOTS, TYPE_LABEL, isHGV } from '@/data/catalog'
import type { ComplianceKind } from '@/data/types'
import { cn, fmtKm, fmtNum } from '@/lib/format'
import { dayOffset, daysUntil, fmtDate, fmtDay, fmtDayLong, fmtTime, relDays } from '@/lib/time'

const statusGlow: Record<string, string> = {
  ok: 'from-[rgba(92,184,138,0.38)]',
  warn: 'from-[rgba(226,170,76,0.36)]',
  bad: 'from-[rgba(226,104,94,0.40)]',
  neutral: 'from-[rgba(120,150,200,0.30)]',
  accent: 'from-[rgba(255,205,0,0.3)]',
}

function Section({ title, children, right }: { title: string; children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <section className="card rounded-xl p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">{title}</h2>
        {right}
      </div>
      {children}
    </section>
  )
}

export default function VehicleDetail() {
  const { id } = useParams()
  const v = useVehicle(id)
  const navigate = useNavigate()
  const vehicles = useVehicles()
  const swaps = useDemo((s) => s.swaps)
  const jobs = useDemo((s) => s.jobs)
  const threads = useDemo((s) => s.threads)
  const bookings = useDemo((s) => s.bookings)
  const [sheet, setSheet] = useState<null | 'service' | 'vor' | 'swap'>(null)
  const [svcDay, setSvcDay] = useState(2)
  const [vorReason, setVorReason] = useState('Engine warning, diagnostics')

  const match = useMemo(() => (v ? matchReplacement(v, placeOf(v), vehicles) : undefined), [v, vehicles])
  if (!v) return <div className="p-8 text-muted">Vehicle not found.</div>

  const tone = STATUS_TONE[v.status]
  const cust = v.customerId ? customersById[v.customerId] : undefined
  const history = serviceHistory(v)
  const docs = documentsFor(v)
  const dues = (Object.entries(v.due) as [ComplianceKind, string][]).sort((a, b) => a[1].localeCompare(b[1]))
  const swap = swaps.find((s) => s.forVehicleId === v.id)
  const coveringFor = swaps.find((s) => s.replacementId === v.id)
  const vJobs = jobs.filter((j) => j.vehicleId === v.id)
  const allowanceUsed = v.contract ? 38 + ((v.idx * 37) % 55) : 0

  const bookService = () => {
    const jobId = useDemo.getState().createJob({ vehicleId: v.id, title: 'Service B', kind: 'Service', source: 'Workshop', bookedFor: dayOffset(svcDay) })
    setSheet(null)
    toast(`Service booked, job ${jobId}`)
  }
  const doVor = () => {
    useDemo.getState().markVOR(v.id, vorReason)
    setSheet(null)
    toast(`${v.reg} marked off road`)
  }
  const doSwap = () => {
    if (!match) return
    useDemo.getState().dispatchReplacement(v.id, match.vehicle.id, { place: v.site ?? DEPOTS[v.depot].site, reason: 'Swap', etaMin: match.etaMin })
    setSheet(null)
    toast(`${match.vehicle.reg} on the way to ${v.site ?? v.depot}`)
  }
  const message = () => {
    const t = threads.find((x) => x.customerId === v.customerId)
    navigate(t ? `/inbox/${t.id}` : '/inbox')
  }

  // timeline: next 12 months
  const span = 365

  return (
    <div className="pb-10">
      {/* Spotify-style header */}
      <div className={cn('relative overflow-hidden bg-gradient-to-b to-transparent', statusGlow[tone])}>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.08),transparent_60%)]" />
        <div className="relative mx-auto max-w-[1280px] px-4 pb-6 pt-4 md:px-8 md:pt-6">
          <button onClick={() => navigate(-1)} className="mb-2 inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <div className="flex flex-col items-start gap-4 md:flex-row md:items-end md:gap-8">
            <motion.div layoutId={`veh-${v.id}`} className="w-full max-w-[420px] md:w-[400px]">
              <VehicleArt type={v.type} className="w-full drop-shadow-[0_20px_30px_rgba(0,0,0,0.45)]" />
            </motion.div>
            <div className="min-w-0 pb-2">
              <div className="mb-2 flex items-center gap-2">
                <StatusPill status={v.status} />
                {v.vor && <Pill tone="bad">{v.vor.reason}</Pill>}
              </div>
              <h1 className="text-4xl font-bold tracking-tight md:text-[56px] md:leading-[60px]">{v.reg}</h1>
              <p className="mt-1 text-lg text-muted">
                {v.make} {v.model}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Pill>{TYPE_LABEL[v.type]}</Pill>
                <Pill>{v.year}</Pill>
                <Pill>{fmtKm(v.odometer)}</Pill>
                <Pill>{DEPOTS[v.depot].site}</Pill>
                {v.fridgeUnit && <Pill>{v.fridgeUnit}</Pill>}
                {v.tailLift && <Pill>Tail-lift</Pill>}
              </div>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            <Button variant="primary" onClick={() => setSheet('service')}>
              <CalendarPlus className="h-4 w-4" /> Book service
            </Button>
            <Button onClick={() => setSheet('vor')} disabled={v.status === 'VOR'}>
              <OctagonAlert className="h-4 w-4" /> Mark VOR
            </Button>
            <Button onClick={() => setSheet('swap')} disabled={!cust}>
              <Repeat className="h-4 w-4" /> Swap vehicle
            </Button>
            <Button onClick={message} disabled={!cust}>
              <MessageSquare className="h-4 w-4" /> Message customer
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-[1280px] gap-4 px-4 md:px-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4">
          <Section title="Compliance">
            <div className="relative mb-6 mt-8 h-14">
              <div className="absolute inset-x-0 top-6 h-px bg-white/[0.1]" />
              {[0, 90, 180, 270, 365].map((d) => (
                <div key={d} className={cn('absolute top-8 whitespace-nowrap text-2xs text-faint', d === 0 ? '' : d === 365 ? '-translate-x-full' : '-translate-x-1/2')} style={{ left: `${(d / span) * 100}%` }}>
                  {d === 0 ? 'Today' : fmtDay(dayOffset(d))}
                </div>
              ))}
              {dues.map(([k, date], i) => {
                const d = Math.max(0, Math.min(span, daysUntil(date)))
                const days = daysUntil(date)
                const c = days < 0 ? 'bg-bad' : days <= 14 ? 'bg-warn' : 'bg-ok'
                return (
                  <div key={k} className="group absolute -translate-x-1/2" style={{ left: `${(d / span) * 100}%`, top: i % 2 ? 0 : 12 }}>
                    <div className={cn('mx-auto h-3 w-3 rounded-full ring-4 ring-surface', c)} />
                    <div className="pointer-events-none absolute bottom-5 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-raised px-2 py-1 text-xs group-hover:block">
                      {COMPLIANCE_LABEL[k]}, {fmtDay(date)}
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="grid gap-x-6 sm:grid-cols-2">
              {dues.map(([k, date]) => {
                const days = daysUntil(date)
                const booked = bookings[`${v.id}:${k}`]
                return (
                  <div key={k} className="flex items-center justify-between gap-3 border-t border-white/[0.05] py-2.5">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{COMPLIANCE_LABEL[k]}</div>
                      <div className="text-xs text-faint">{fmtDate(date)}</div>
                    </div>
                    {booked ? <Pill tone="ok">Booked {fmtDay(booked.date)}</Pill> : <Pill tone={days < 0 ? 'bad' : days <= 14 ? 'warn' : 'neutral'}>{relDays(date)}</Pill>}
                  </div>
                )
              })}
            </div>
            {!isHGV(v.type) && <p className="mt-3 text-xs text-faint">13-week inspections and tacho calibration apply to HGVs only.</p>}
          </Section>

          <Section title="Open defects" right={<span className="text-sm text-muted">{v.defects.length}</span>}>
            {v.defects.length === 0 && <div className="text-sm text-muted">No open defects.</div>}
            {v.defects.map((d) => (
              <div key={d.id} className="flex items-start gap-3 border-t border-white/[0.05] py-3 first:border-0 first:pt-0">
                <AlertTriangle className={cn('mt-0.5 h-4 w-4 shrink-0', d.severity === 'Not safe to drive' ? 'text-bad' : 'text-warn')} />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium">
                    {d.fault} <span className="font-normal text-muted">· {d.item}</span>
                  </div>
                  <div className="text-xs text-faint">
                    {d.reportedBy}, {fmtDayLong(d.reportedAt)} {fmtTime(d.reportedAt)}
                    {d.photo ? ' · photo' : ''}
                  </div>
                </div>
                {d.jobId ? <Pill tone="ok">Job {d.jobId}</Pill> : <Pill tone={d.severity === 'Not safe to drive' ? 'bad' : 'warn'}>{d.severity}</Pill>}
              </div>
            ))}
          </Section>

          <Section title="Service history">
            <div className="space-y-0">
              {history.map((h, i) => (
                <div key={i} className="flex items-center gap-4 border-t border-white/[0.05] py-2.5 first:border-0 first:pt-0">
                  <div className="w-24 shrink-0 text-sm text-muted">{fmtDate(h.date)}</div>
                  <div className="min-w-0 flex-1 truncate text-sm font-medium">{h.title}</div>
                  <div className="hidden text-sm text-faint sm:block">{h.tech}</div>
                  <div className="num w-24 text-right text-sm text-muted">{fmtKm(h.km)}</div>
                </div>
              ))}
            </div>
          </Section>
        </div>

        <div className="space-y-4">
          <Section title={cust ? 'Customer and contract' : 'Availability'}>
            {cust ? (
              <div className="space-y-3 text-sm">
                <div>
                  <div className="text-base font-semibold">{cust.name}</div>
                  <div className="text-muted">
                    {cust.contact}, {cust.contactRole}
                  </div>
                </div>
                {v.contract && (
                  <dl className="grid grid-cols-2 gap-y-2">
                    <dt className="text-muted">Agreement</dt>
                    <dd className="text-right">{v.contract.kind}</dd>
                    <dt className="text-muted">Reference</dt>
                    <dd className="num text-right">{v.contract.ref}</dd>
                    <dt className="text-muted">Term</dt>
                    <dd className="text-right">
                      {fmtDay(v.contract.start)} to {fmtDate(v.contract.end)}
                    </dd>
                    <dt className="text-muted">Working at</dt>
                    <dd className="text-right">{v.site ?? cust.town}</dd>
                  </dl>
                )}
              </div>
            ) : (
              <div className="text-sm text-muted">
                {v.status === 'Available' ? `Ready at ${DEPOTS[v.depot].site}.` : v.status === 'Defleet' ? 'Marked for defleet.' : `${v.status}.`}
                {v.reservedFor && <div className="mt-2 text-ink">Allocated as a replacement.</div>}
              </div>
            )}
            {(swap || coveringFor) && (
              <div className="mt-4 rounded-lg bg-accent/[0.08] p-3 text-sm ring-1 ring-inset ring-accent/20">
                <Repeat className="mb-1 h-4 w-4 text-accent" />
                {swap && <>Replacement {vehicles.find((x) => x.id === swap.replacementId)?.reg} covering, arrived or due {fmtTime(swap.eta)}.</>}
                {coveringFor && <>Covering for {vehicles.find((x) => x.id === coveringFor.forVehicleId)?.reg} at {coveringFor.place}.</>}
              </div>
            )}
            {v.vor && (
              <div className="mt-4 rounded-lg bg-bad/[0.08] p-3 text-sm ring-1 ring-inset ring-bad/20">
                <div className="font-medium text-bad">Off road since {fmtDayLong(v.vor.since)}</div>
                <div className="text-muted">
                  {v.vor.location}. Back {fmtDayLong(v.vor.eta)} {fmtTime(v.vor.eta)}.
                </div>
              </div>
            )}
          </Section>

          <Section title="Mileage">
            <div className="num text-3xl font-semibold">{fmtNum(v.odometer)} <span className="text-base font-normal text-muted">km</span></div>
            <div className="mt-1 text-sm text-muted">
              Next service at {fmtKm(v.nextService.km)} or {fmtDate(v.nextService.date)}
            </div>
            {v.contract?.kind === 'Contract hire' && (
              <div className="mt-4">
                <div className="mb-1.5 flex justify-between text-xs text-muted">
                  <span>Annual allowance</span>
                  <span className="num">{fmtKm(v.contract.annualAllowanceKm)}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                  <div className={cn('h-full rounded-full', allowanceUsed > 85 ? 'bg-warn' : 'bg-ok')} style={{ width: `${allowanceUsed}%` }} />
                </div>
              </div>
            )}
          </Section>

          {vJobs.length > 0 && (
            <Section title="Workshop">
              {vJobs.map((j) => (
                <button key={j.id} onClick={() => navigate(`/workshop?depot=${j.depot}`)} className="flex w-full items-center justify-between border-t border-white/[0.05] py-2.5 text-left text-sm first:border-0 first:pt-0">
                  <span>
                    <span className="font-medium">{j.title}</span> <span className="text-muted">· {j.id}</span>
                  </span>
                  <Pill tone={j.stage === 'Awaiting parts' ? 'bad' : j.stage === 'Ready' ? 'ok' : 'warn'}>{j.stage}</Pill>
                </button>
              ))}
            </Section>
          )}

          <Section title="Documents">
            {docs.map((d) => (
              <button key={d.name} onClick={() => toast(`${d.name} downloaded`)} className="flex w-full items-center gap-3 border-t border-white/[0.05] py-2.5 text-left text-sm first:border-0 first:pt-0 hover:text-accent">
                <FileText className="h-4 w-4 shrink-0 text-muted" />
                <span className="min-w-0 flex-1 truncate">{d.name}</span>
                <span className="text-xs text-faint">{fmtDay(d.date)}</span>
                <Download className="h-4 w-4 text-faint" />
              </button>
            ))}
          </Section>
        </div>
      </div>

      <Sheet open={sheet === 'service'} onOpenChange={(o) => !o && setSheet(null)} title={`Book a service for ${v.reg}`} description={`${DEPOTS[v.depot].site} workshop. A technician and bay are assigned automatically.`} footer={<><Button variant="ghost" onClick={() => setSheet(null)}>Cancel</Button><Button variant="primary" onClick={bookService}>Book</Button></>}>
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5].map((d) => (
            <Chip key={d} active={svcDay === d} onClick={() => setSvcDay(d)}>
              {fmtDayLong(dayOffset(d))}
            </Chip>
          ))}
        </div>
      </Sheet>
      <Sheet open={sheet === 'vor'} onOpenChange={(o) => !o && setSheet(null)} title={`Mark ${v.reg} off road`} description="It moves onto the live board and the customer is offered a replacement." footer={<><Button variant="ghost" onClick={() => setSheet(null)}>Cancel</Button><Button variant="danger" onClick={doVor}>Mark VOR</Button></>}>
        <div className="flex flex-wrap gap-2">
          {['Engine warning, diagnostics', 'Accident damage', 'Tyre and wheel damage', 'Brake fault', 'Tail-lift fault', 'Fridge unit fault', 'Electrical fault'].map((r) => (
            <Chip key={r} active={vorReason === r} onClick={() => setVorReason(r)}>
              {r}
            </Chip>
          ))}
        </div>
      </Sheet>
      <Sheet open={sheet === 'swap'} onOpenChange={(o) => !o && setSheet(null)} title="Swap vehicle" description="Matched by spec first, then the nearest depot." footer={<><Button variant="ghost" onClick={() => setSheet(null)}>Cancel</Button><Button variant="primary" onClick={doSwap} disabled={!match}>Dispatch</Button></>}>
        {match ? (
          <div className="flex items-center gap-4 rounded-xl bg-white/[0.04] p-4">
            <VehicleArt type={match.vehicle.type} className="w-36" />
            <div className="min-w-0">
              <div className="text-lg font-semibold">{match.vehicle.reg}</div>
              <div className="text-sm text-muted">
                {match.vehicle.make} {match.vehicle.model}
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {match.reasons.map((r) => (
                  <Pill key={r} tone="ok">
                    {r}
                  </Pill>
                ))}
                <Pill>About {match.etaMin} min</Pill>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-sm text-muted">No matching vehicle is free right now.</div>
        )}
      </Sheet>
    </div>
  )
}
