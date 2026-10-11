import { forwardRef, useEffect, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Camera, Check, ChevronLeft, ChevronRight, LifeBuoy, MapPin, Phone, QrCode, Repeat, Truck, X } from 'lucide-react'
import { VehicleArt } from '@/components/vehicles/VehicleArt'
import { customersById, TOUR, useDemo, useVehicle } from '@/store'
import { useDriver } from '@/tour/tourStore'
import { COMMON_FAULTS, PLACES, TYPE_LABEL, WALKAROUND_ITEMS, isFridge } from '@/data/catalog'
import { cn } from '@/lib/format'
import { fmtTime } from '@/lib/time'

const slug = (s: string) => s.toLowerCase().replace(/[^a-z]+/g, '-').replace(/-$/, '')

function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-full items-center justify-center md:p-6">
      <div className="relative h-full w-full md:h-[min(844px,calc(100dvh-120px))] md:w-auto md:aspect-[390/844]">
        <div className="absolute inset-0 hidden rounded-[56px] bg-gradient-to-b from-[#2b3442] to-[#11161f] p-[3px] shadow-[0_40px_100px_-30px_rgba(0,0,0,0.9),inset_0_0_0_1px_rgba(255,255,255,0.08)] md:block">
          <div className="h-full w-full rounded-[53px] bg-black p-[10px]" />
        </div>
        <div className="absolute inset-0 overflow-hidden bg-[#040b17] md:inset-[13px] md:rounded-[44px]" data-tour="phone">
          <div className="pointer-events-none absolute left-1/2 top-[10px] z-30 hidden h-[30px] w-[110px] -translate-x-1/2 rounded-full bg-black md:block" />
          <div className="relative z-20 hidden h-[50px] items-center justify-between px-8 pt-1 text-[13px] font-semibold md:flex">
            <span className="num">07:42</span>
            <span className="flex items-center gap-1.5">
              <span className="flex items-end gap-[2px]">
                {[4, 6, 8, 10].map((h) => (
                  <span key={h} className="w-[3px] rounded-sm bg-white" style={{ height: h }} />
                ))}
              </span>
              <span className="ml-1 h-[11px] w-[22px] rounded-[3px] border border-white/60 p-[1.5px]">
                <span className="block h-full w-[75%] rounded-[1px] bg-white" />
              </span>
            </span>
          </div>
          <div className="absolute inset-x-0 bottom-0 top-0 md:top-[50px]">{children}</div>
          <div className="pointer-events-none absolute bottom-2 left-1/2 z-30 hidden h-[5px] w-[130px] -translate-x-1/2 rounded-full bg-white/70 md:block" />
        </div>
      </div>
    </div>
  )
}

const Screen = forwardRef<HTMLDivElement, { children: ReactNode; k: string }>(function Screen({ children, k }, ref) {
  return (
    <motion.div ref={ref} key={k} className="absolute inset-0 flex flex-col" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ type: 'spring', stiffness: 380, damping: 36 }}>
      {children}
    </motion.div>
  )
})

function BigButton({ children, onClick, variant = 'primary', tour, disabled, className }: { children: ReactNode; onClick: () => void; variant?: 'primary' | 'danger' | 'secondary'; tour?: string; disabled?: boolean; className?: string }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      data-tour={tour}
      className={cn(
        'flex h-16 w-full items-center justify-center gap-2 rounded-[20px] text-lg font-semibold transition-transform active:scale-[0.98] disabled:opacity-40',
        variant === 'primary' && 'bg-accent text-accent-ink',
        variant === 'danger' && 'bg-bad text-white',
        variant === 'secondary' && 'bg-white/[0.08] text-ink',
        className,
      )}
    >
      {children}
    </button>
  )
}

function FakeQR() {
  // deterministic QR-like pattern
  const cells = Array.from({ length: 21 * 21 }, (_, i) => {
    const x = i % 21
    const y = Math.floor(i / 21)
    const finder = (fx: number, fy: number) => x >= fx && x < fx + 7 && y >= fy && y < fy + 7 && (x === fx || x === fx + 6 || y === fy || y === fy + 6 || (x >= fx + 2 && x <= fx + 4 && y >= fy + 2 && y <= fy + 4))
    if (finder(0, 0) || finder(14, 0) || finder(0, 14)) return true
    if ((x < 8 && y < 8) || (x > 12 && y < 8) || (x < 8 && y > 12)) return false
    return ((x * 7 + y * 13 + x * y) % 5) < 2
  })
  return (
    <svg viewBox="0 0 21 21" className="h-full w-full" shapeRendering="crispEdges">
      {cells.map((on, i) => on && <rect key={i} x={i % 21} y={Math.floor(i / 21)} width={1} height={1} fill="#e8edf5" />)}
    </svg>
  )
}

export default function DriverApp() {
  const d = useDriver()
  const v = useVehicle(d.vehicleId ?? undefined)
  const cust = v?.customerId ? customersById[v.customerId] : undefined
  const swaps = useDemo((s) => s.swaps)
  const breakdowns = useDemo((s) => s.breakdowns)

  useEffect(() => {
    if (d.screen === 'scanning') {
      const t = setTimeout(() => useDriver.getState().set({ screen: 'vehicle', vehicleId: TOUR.driverVehicleId }), 1400)
      return () => clearTimeout(t)
    }
    if (d.screen === 'submitting') {
      const t = setTimeout(() => {
        const st = useDriver.getState()
        if (st.defect?.fault && st.vehicleId) {
          useDemo.getState().submitDriverReport({ vehicleId: st.vehicleId, driver: TOUR.driverName, item: st.defect.item, fault: st.defect.fault, severity: st.defect.severity ?? 'Safe to drive', photo: st.defect.photo, note: st.defect.note })
        }
        st.set({ screen: 'done' })
      }, 1100)
      return () => clearTimeout(t)
    }
  }, [d.screen])

  const items = v ? WALKAROUND_ITEMS.filter((i) => (i === 'Tail-lift' ? v.tailLift : i === 'Fridge unit and temperature' ? isFridge(v.type) : true)) : []
  const answered = items.filter((i) => d.answers[i]).length
  const defectItem = items.find((i) => d.answers[i] === 'defect')
  const bd = v ? breakdowns.find((b) => b.vehicleId === v.id && !b.steps.some((s) => s.step === 'Back on the road')) : undefined
  const swap = v ? swaps.find((s) => s.forVehicleId === v.id) : undefined

  const answer = (item: string, a: 'ok' | 'defect') => {
    d.set({ answers: { ...d.answers, [item]: a } })
    if (a === 'defect') d.set({ screen: 'defect', defect: { item } })
  }

  return (
    <PhoneFrame>
      <AnimatePresence mode="popLayout" initial={false}>
        {(d.screen === 'scan' || d.screen === 'scanning') && (
          <Screen k="scan">
            <div className="px-6 pt-8 md:pt-4">
              <div className="text-sm font-semibold text-accent">National Driver</div>
              <h1 className="mt-2 text-[28px] font-bold leading-tight">Scan the code on your dashboard</h1>
              <p className="mt-2 text-base text-muted">No login. The code tells us which vehicle you are in.</p>
            </div>
            <div className="flex flex-1 items-center justify-center">
              <div className="relative h-60 w-60">
                <div className="absolute inset-6 rounded-2xl bg-white/[0.04] p-6 opacity-90">
                  <FakeQR />
                </div>
                {['left-0 top-0 border-l-4 border-t-4 rounded-tl-3xl', 'right-0 top-0 border-r-4 border-t-4 rounded-tr-3xl', 'left-0 bottom-0 border-l-4 border-b-4 rounded-bl-3xl', 'right-0 bottom-0 border-r-4 border-b-4 rounded-br-3xl'].map((c) => (
                  <span key={c} className={cn('absolute h-12 w-12 border-accent', c)} />
                ))}
                <span className="scanline absolute inset-x-6 h-0.5 rounded-full bg-accent shadow-[0_0_16px_3px_rgba(255,205,0,0.6)]" />
              </div>
            </div>
            <div className="space-y-3 px-6 pb-10">
              <BigButton onClick={() => d.set({ screen: 'scanning' })} tour="driver-scan" disabled={d.screen === 'scanning'}>
                {d.screen === 'scanning' ? (
                  'Reading code'
                ) : (
                  <>
                    <QrCode className="h-5 w-5" /> Scan code
                  </>
                )}
              </BigButton>
            </div>
          </Screen>
        )}

        {d.screen === 'vehicle' && v && (
          <Screen k="vehicle">
            <div className="px-6 pt-8 md:pt-4">
              <div className="text-sm text-muted">Morning, {TOUR.driverName.split(' ')[0]}</div>
              <h1 className="mt-1 text-[34px] font-bold tracking-tight">{v.reg}</h1>
              <div className="text-base text-muted">
                {v.make} {v.model}
              </div>
            </div>
            <div className="relative mx-4 mt-4 rounded-3xl bg-gradient-to-b from-[rgba(92,184,138,0.18)] to-transparent px-2 pb-4 pt-6">
              <VehicleArt type={v.type} className="w-full" />
            </div>
            <div className="mx-6 mt-2 space-y-2 text-[15px]">
              <div className="flex justify-between border-b border-white/[0.06] pb-2">
                <span className="text-muted">Customer</span>
                <span>{cust?.name}</span>
              </div>
              <div className="flex justify-between border-b border-white/[0.06] pb-2">
                <span className="text-muted">Working at</span>
                <span>{v.site}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Type</span>
                <span>{TYPE_LABEL[v.type]}</span>
              </div>
            </div>
            <div className="mt-auto space-y-3 px-6 pb-10">
              <BigButton onClick={() => d.set({ screen: 'walkaround' })} tour="driver-start">
                Start daily walkaround <ChevronRight className="h-5 w-5" />
              </BigButton>
              <BigButton variant="danger" onClick={() => d.set({ screen: 'breakdown', breakdownStage: 0 })} tour="driver-breakdown">
                <LifeBuoy className="h-5 w-5" /> Breakdown
              </BigButton>
            </div>
          </Screen>
        )}

        {d.screen === 'walkaround' && v && (
          <Screen k="walk">
            <div className="flex items-center gap-2 px-4 pt-6 md:pt-2">
              <button onClick={() => d.set({ screen: 'vehicle' })} className="flex h-10 w-10 items-center justify-center rounded-full text-muted" aria-label="Back">
                <ChevronLeft className="h-6 w-6" />
              </button>
              <div className="flex-1">
                <div className="text-lg font-semibold">Daily walkaround</div>
                <div className="text-sm text-muted">{v.reg}</div>
              </div>
              <span className="num pr-2 text-sm text-muted">
                {answered}/{items.length}
              </span>
            </div>
            <div className="mx-6 mt-3 h-1 overflow-hidden rounded-full bg-white/[0.08]">
              <motion.div className="h-full bg-accent" animate={{ width: `${(answered / items.length) * 100}%` }} />
            </div>
            <div className="mt-4 flex-1 space-y-2 overflow-y-auto px-4 pb-4">
              {items.map((i) => {
                const a = d.answers[i]
                return (
                  <div key={i} className={cn('rounded-[18px] p-3.5 ring-1 ring-inset transition-colors', a === 'defect' ? 'bg-bad/10 ring-bad/30' : a === 'ok' ? 'bg-ok/[0.07] ring-ok/20' : 'bg-white/[0.04] ring-white/[0.06]')} data-tour={`walk-${slug(i)}`}>
                    <div className="mb-2.5 flex items-center justify-between">
                      <span className="text-base font-medium">{i}</span>
                      {a === 'defect' && d.defect?.item === i && d.defect.fault && <span className="text-xs text-bad">{d.defect.fault}</span>}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => answer(i, 'ok')} data-tour={`walk-${slug(i)}-ok`} className={cn('flex h-11 items-center justify-center gap-1.5 rounded-[12px] text-[15px] font-semibold', a === 'ok' ? 'bg-ok text-canvas' : 'bg-white/[0.06] text-muted')}>
                        <Check className="h-4 w-4" /> OK
                      </button>
                      <button onClick={() => answer(i, 'defect')} data-tour={`walk-${slug(i)}-defect`} className={cn('flex h-11 items-center justify-center gap-1.5 rounded-[12px] text-[15px] font-semibold', a === 'defect' ? 'bg-bad text-white' : 'bg-white/[0.06] text-muted')}>
                        <X className="h-4 w-4" /> Defect
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="border-t border-white/[0.06] px-6 pb-8 pt-3">
              <BigButton onClick={() => d.set({ screen: 'submitting' })} disabled={answered < items.length} tour="driver-submit">
                {defectItem ? 'Send report with 1 defect' : 'Send report'}
              </BigButton>
            </div>
          </Screen>
        )}

        {d.screen === 'defect' && d.defect && (
          <Screen k="defect">
            <div className="flex items-center gap-2 px-4 pt-6 md:pt-2">
              <button onClick={() => d.set({ screen: 'walkaround', answers: { ...d.answers, [d.defect!.item]: undefined as unknown as 'ok' } })} className="flex h-10 w-10 items-center justify-center rounded-full text-muted" aria-label="Back">
                <ChevronLeft className="h-6 w-6" />
              </button>
              <div className="text-lg font-semibold">{d.defect.item}</div>
            </div>
            <div className="flex-1 space-y-6 overflow-y-auto px-6 pb-4 pt-4">
              <div>
                <div className="mb-2.5 text-sm font-medium text-muted">What is wrong?</div>
                <div className="grid grid-cols-1 gap-2">
                  {COMMON_FAULTS[d.defect.item].map((f) => (
                    <button key={f} onClick={() => d.set({ defect: { ...d.defect!, fault: f } })} data-tour={`fault-${slug(f)}`} className={cn('flex h-12 items-center justify-between rounded-[14px] px-4 text-left text-[15px] font-medium ring-1 ring-inset', d.defect!.fault === f ? 'bg-accent/15 text-ink ring-accent' : 'bg-white/[0.04] ring-white/[0.06]')}>
                      {f}
                      {d.defect!.fault === f && <Check className="h-4 w-4 text-accent" />}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="mb-2.5 text-sm font-medium text-muted">Can it be driven?</div>
                <div className="grid grid-cols-2 gap-2">
                  {(['Safe to drive', 'Not safe to drive'] as const).map((s) => (
                    <button key={s} onClick={() => d.set({ defect: { ...d.defect!, severity: s } })} data-tour={`sev-${slug(s)}`} className={cn('h-14 rounded-[14px] text-[15px] font-semibold ring-1 ring-inset', d.defect!.severity === s ? (s === 'Safe to drive' ? 'bg-ok text-canvas ring-ok' : 'bg-bad text-white ring-bad') : 'bg-white/[0.04] ring-white/[0.06]')}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="mb-2.5 text-sm font-medium text-muted">Photo</div>
                {d.defect.photo ? (
                  <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative h-36 overflow-hidden rounded-[16px] bg-gradient-to-br from-[#33465f] via-[#1c2c44] to-[#0f1a2c]">
                    <svg viewBox="0 0 200 100" className="absolute inset-0 h-full w-full opacity-70">
                      <rect x="40" y="18" width="120" height="70" rx="4" fill="#5a6b84" />
                      <rect x="48" y="26" width="104" height="54" rx="2" fill="#8796ad" />
                      <path d="M 60 70 L 140 70" stroke="#2d3a50" strokeWidth="5" />
                      <circle cx="70" cy="50" r="6" fill="#e2685e" opacity="0.8" />
                    </svg>
                    <span className="absolute bottom-2 left-2 rounded-full bg-black/50 px-2 py-0.5 text-2xs">Tail-lift platform, 07:41</span>
                  </motion.div>
                ) : (
                  <button onClick={() => d.set({ screen: 'camera' })} data-tour="add-photo" className="flex h-24 w-full flex-col items-center justify-center gap-1 rounded-[16px] border border-dashed border-white/20 text-muted">
                    <Camera className="h-6 w-6" />
                    <span className="text-sm">Add a photo</span>
                  </button>
                )}
              </div>
            </div>
            <div className="border-t border-white/[0.06] px-6 pb-8 pt-3">
              <BigButton onClick={() => d.set({ screen: 'walkaround' })} disabled={!d.defect.fault || !d.defect.severity} tour="defect-save">
                Save defect
              </BigButton>
            </div>
          </Screen>
        )}

        {d.screen === 'camera' && (
          <Screen k="camera">
            <div className="relative flex-1 bg-gradient-to-b from-[#1b2535] to-[#0b111b]">
              <div className="absolute inset-8 rounded-2xl border border-white/20" />
              <svg viewBox="0 0 200 160" className="absolute inset-0 m-auto h-2/3 w-full opacity-60">
                <rect x="30" y="30" width="140" height="100" rx="6" fill="#4a5a72" />
                <rect x="40" y="40" width="120" height="80" rx="4" fill="#6f7f98" />
                <path d="M 50 110 L 150 110" stroke="#2d3a50" strokeWidth="6" />
              </svg>
              <button onClick={() => d.set({ screen: 'defect' })} className="absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-black/40" aria-label="Close camera">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex h-36 items-center justify-center bg-black">
              <button onClick={() => d.set({ screen: 'defect', defect: { ...d.defect!, photo: true } })} data-tour="shutter" className="flex h-[74px] w-[74px] items-center justify-center rounded-full border-4 border-white" aria-label="Take photo">
                <span className="h-[58px] w-[58px] rounded-full bg-white" />
              </button>
            </div>
          </Screen>
        )}

        {(d.screen === 'submitting' || d.screen === 'done') && v && (
          <Screen k="done">
            <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
              {d.screen === 'submitting' ? (
                <div className="h-14 w-14 animate-spin rounded-full border-4 border-white/10 border-t-accent" />
              ) : (
                <>
                  <motion.div initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 16 }} className="flex h-24 w-24 items-center justify-center rounded-full bg-ok text-canvas shadow-[0_0_60px_-10px_rgba(92,184,138,0.8)]">
                    <motion.svg viewBox="0 0 24 24" className="h-12 w-12" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                      <motion.path d="M5 12.5l4.5 4.5L19 7.5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.2, duration: 0.45 }} />
                    </motion.svg>
                  </motion.div>
                  <h2 className="mt-6 text-2xl font-bold">Report sent</h2>
                  <p className="mt-2 text-base text-muted">{defectItem ? 'National has the defect now. The workshop will be in touch about a replacement.' : 'All OK. Have a safe day.'}</p>
                  {defectItem && d.defect?.fault && (
                    <div className="mt-6 w-full rounded-2xl bg-white/[0.05] p-4 text-left text-sm">
                      <div className="text-muted">{d.defect.item}</div>
                      <div className="font-semibold">{d.defect.fault}</div>
                      <div className={d.defect.severity === 'Not safe to drive' ? 'text-bad' : 'text-ok'}>{d.defect.severity}</div>
                    </div>
                  )}
                  {swap && (
                    <div className="mt-3 flex w-full items-center gap-3 rounded-2xl bg-ok/10 p-4 text-left text-sm ring-1 ring-inset ring-ok/20">
                      <Repeat className="h-5 w-5 text-ok" />
                      <span>Replacement on the way. ETA {fmtTime(swap.eta)}.</span>
                    </div>
                  )}
                </>
              )}
            </div>
            {d.screen === 'done' && (
              <div className="px-6 pb-10">
                <BigButton variant="secondary" onClick={() => d.reset()}>
                  Done
                </BigButton>
              </div>
            )}
          </Screen>
        )}

        {d.screen === 'breakdown' && v && (
          <Screen k="bd">
            <div className="flex items-center gap-2 px-4 pt-6 md:pt-2">
              <button onClick={() => d.set({ screen: 'vehicle' })} className="flex h-10 w-10 items-center justify-center rounded-full text-muted" aria-label="Back">
                <ChevronLeft className="h-6 w-6" />
              </button>
              <div className="text-lg font-semibold">Breakdown</div>
            </div>
            {!bd ? (
              <div className="flex flex-1 flex-col px-6">
                <div className="flex flex-1 flex-col items-center justify-center text-center">
                  <div className="relative mb-6 flex h-28 w-28 items-center justify-center">
                    <span className="pulse-ring absolute inset-0 rounded-full bg-bad/40" />
                    <span className="relative flex h-20 w-20 items-center justify-center rounded-full bg-bad">
                      <MapPin className="h-9 w-9 text-white" />
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold">Share your location</h2>
                  <p className="mt-2 text-base text-muted">We send recovery and a matching replacement straight away. Stay with the vehicle with your hazards on.</p>
                </div>
                <div className="space-y-3 pb-10">
                  <BigButton
                    variant="danger"
                    tour="share-location"
                    onClick={() => {
                      useDemo.getState().reportBreakdown({ vehicleId: v.id, driver: TOUR.driverName, place: 'N7 near Naas', lat: PLACES.Naas.lat + 0.02, lon: PLACES.Naas.lon - 0.05, fault: 'Driver reported breakdown' })
                    }}
                  >
                    <MapPin className="h-5 w-5" /> Share location
                  </BigButton>
                  <BigButton variant="secondary" onClick={() => {}}>
                    <Phone className="h-5 w-5" /> Call 24/7 breakdown line
                  </BigButton>
                </div>
              </div>
            ) : (
              <div className="flex-1 space-y-3 px-6 pt-4">
                <div className="rounded-2xl bg-white/[0.05] p-4">
                  <div className="text-sm text-muted">Location shared</div>
                  <div className="text-lg font-semibold">{bd.place}</div>
                </div>
                <div className="rounded-2xl bg-white/[0.05] p-4">
                  <div className="flex items-center gap-2 text-sm text-muted">
                    <Truck className="h-4 w-4" /> Recovery
                  </div>
                  <div className="text-lg font-semibold">{bd.recovery?.by}</div>
                  <div className="text-accent">On scene by {bd.recovery ? fmtTime(bd.recovery.eta) : 'shortly'}</div>
                </div>
                {bd.replacementEta && (
                  <div className="rounded-2xl bg-ok/10 p-4 ring-1 ring-inset ring-ok/20">
                    <div className="flex items-center gap-2 text-sm text-ok">
                      <Repeat className="h-4 w-4" /> Replacement on the way
                    </div>
                    <div className="text-lg font-semibold">Same spec, arriving {fmtTime(bd.replacementEta)}</div>
                  </div>
                )}
                <p className="pt-2 text-center text-sm text-muted">Your customer has been told. Nothing else for you to do.</p>
              </div>
            )}
          </Screen>
        )}
      </AnimatePresence>
    </PhoneFrame>
  )
}
