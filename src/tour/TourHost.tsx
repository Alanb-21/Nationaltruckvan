import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, X } from 'lucide-react'
import { Button } from '@/components/ui'
import { Logo } from '@/components/Logo'
import { useDemo } from '@/store'
import { STEPS, type TourCtx } from './steps'
import { useTour } from './tourStore'
import { cn } from '@/lib/format'

type Rect = { x: number; y: number; w: number; h: number }
const PAD = 10

function rectOf(sel: string | null): Rect | null {
  if (!sel) return null
  const el = document.querySelector(sel)
  if (!el) return null
  const r = el.getBoundingClientRect()
  if (r.width === 0 && r.height === 0) return null
  const vw = window.innerWidth
  const vh = window.innerHeight
  const x = Math.max(6, r.left - PAD)
  const y = Math.max(6, r.top - PAD)
  const x2 = Math.min(vw - 6, r.right + PAD)
  const y2 = Math.min(vh - 6, r.bottom + PAD)
  return { x, y, w: Math.max(0, x2 - x), h: Math.max(0, y2 - y) }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export function TourHost() {
  const { active, step, finger } = useTour()
  const navigate = useNavigate()
  const [focusSel, setFocusSel] = useState<string | null>(null)
  const [rect, setRect] = useState<Rect | null>(null)
  const [vw, setVw] = useState(window.innerWidth)
  const [vh, setVh] = useState(window.innerHeight)
  const runId = useRef(0)
  const cardRef = useRef<HTMLDivElement>(null)
  const [cardH, setCardH] = useState(220)
  const s = STEPS[step]
  const isClose = step === STEPS.length - 1

  // track the focused element continuously (handles scroll, layout shifts, animations)
  useEffect(() => {
    if (!active) return
    const t = setInterval(() => {
      setRect((prev) => {
        const r = rectOf(focusSel)
        if (!r && !prev) return prev
        if (r && prev && Math.abs(r.x - prev.x) < 0.5 && Math.abs(r.y - prev.y) < 0.5 && Math.abs(r.w - prev.w) < 0.5 && Math.abs(r.h - prev.h) < 0.5) return prev
        return r
      })
      setVw(window.innerWidth)
      setVh(window.innerHeight)
    }, 60)
    return () => clearInterval(t)
  }, [active, focusSel])

  useLayoutEffect(() => {
    if (cardRef.current) setCardH(cardRef.current.offsetHeight)
  })

  const makeCtx = useCallback((id: number): TourCtx => {
    const cancelled = () => runId.current !== id || !useTour.getState().active
    const wait = async (ms: number) => {
      const end = Date.now() + ms
      while (Date.now() < end) {
        if (cancelled()) throw new Error('cancelled')
        await sleep(Math.min(50, end - Date.now()))
      }
    }
    const waitFor = async (sel: string, timeout = 4000) => {
      const end = Date.now() + timeout
      while (Date.now() < end) {
        if (cancelled()) throw new Error('cancelled')
        const el = document.querySelector(sel)
        if (el && (el as HTMLElement).offsetParent !== null) return el
        await sleep(60)
      }
      return null
    }
    const scrollIntoView = async (el: Element) => {
      const r = el.getBoundingClientRect()
      if (r.top < 70 || r.bottom > window.innerHeight - 90) {
        el.scrollIntoView({ block: 'center', behavior: 'smooth' })
        await wait(550)
      }
    }
    return {
      cancelled,
      wait,
      waitFor,
      focus: async (sel) => {
        if (sel) {
          const el = await waitFor(sel)
          if (el) await scrollIntoView(el)
        }
        if (!cancelled()) setFocusSel(sel)
      },
      tap: async (sel, opts) => {
        const el = (await waitFor(sel)) as HTMLElement | null
        if (!el) return
        await scrollIntoView(el)
        const r = el.getBoundingClientRect()
        useTour.getState().setFinger({ x: r.left + r.width / 2, y: r.top + r.height / 2 })
        await wait(opts?.pause ?? 560)
        el.click()
        await wait(opts?.pause ? 120 : 260)
      },
    }
  }, [])

  // enter a step: navigate, wait for target, run script
  useEffect(() => {
    if (!active) return
    const id = ++runId.current
    const ctx = makeCtx(id)
    const st = STEPS[step]
    setFocusSel(null)
    useTour.getState().setFinger(null)
    navigate(st.route)
    ;(async () => {
      try {
        if (st.target) {
          await ctx.wait(350)
          await ctx.focus(st.target)
        }
        if (st.run) {
          useTour.getState().setBusy(true)
          await st.run(ctx)
        }
      } catch {
        /* cancelled */
      } finally {
        if (runId.current === id) {
          useTour.getState().setBusy(false)
          useTour.getState().setFinger(null)
        }
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, step])

  const go = useCallback(
    (n: number) => {
      const cur = STEPS[useTour.getState().step]
      if (n > useTour.getState().step) {
        // finish the current step's state instantly so the story stays consistent
        runId.current++
        try {
          cur.ensure?.()
        } catch {
          /* ignore */
        }
      }
      useTour.getState().go(Math.max(0, Math.min(STEPS.length - 1, n)))
    },
    [],
  )
  const stop = useCallback(() => {
    runId.current++
    useTour.getState().stop()
    useDemo.getState().clearNewFlags()
  }, [])

  useEffect(() => {
    if (!active) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') go(useTour.getState().step + 1)
      else if (e.key === 'ArrowLeft') go(useTour.getState().step - 1)
      else if (e.key === 'Escape') stop()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [active, go, stop])

  if (!active) return null

  // card placement
  const mobile = vw < 768
  const cardW = Math.min(380, vw - 24)
  let cx = (vw - cardW) / 2
  let cy = (vh - cardH) / 2
  if (rect && !isClose) {
    if (mobile) {
      const below = vh - (rect.y + rect.h)
      cy = below > cardH + 24 ? rect.y + rect.h + 12 : rect.y > cardH + 24 ? rect.y - cardH - 12 : vh - cardH - 12
      cx = 12
    } else if (vw - (rect.x + rect.w) > cardW + 32) {
      cx = rect.x + rect.w + 16
      cy = Math.min(Math.max(16, rect.y), vh - cardH - 16)
    } else if (rect.x > cardW + 32) {
      cx = rect.x - cardW - 16
      cy = Math.min(Math.max(16, rect.y), vh - cardH - 16)
    } else if (vh - (rect.y + rect.h) > cardH + 32) {
      cy = rect.y + rect.h + 16
      cx = Math.min(Math.max(16, rect.x + rect.w / 2 - cardW / 2), vw - cardW - 16)
    } else if (rect.y > cardH + 32) {
      cy = rect.y - cardH - 16
      cx = Math.min(Math.max(16, rect.x + rect.w / 2 - cardW / 2), vw - cardW - 16)
    } else {
      cx = vw - cardW - 24
      cy = vh - cardH - 24
    }
  }

  const spot = rect && !isClose ? rect : null

  return (
    <div className="fixed inset-0 z-[100]" aria-live="polite">
      {/* dim with a soft rounded cutout */}
      <svg className="pointer-events-none absolute inset-0 h-full w-full">
        <defs>
          <mask id="tour-mask">
            <rect width="100%" height="100%" fill="white" />
            {spot && <motion.rect initial={false} animate={{ x: spot.x, y: spot.y, width: spot.w, height: spot.h }} transition={{ type: 'spring', stiffness: 260, damping: 32 }} rx={18} fill="black" />}
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="rgba(2,8,20,0.66)" mask="url(#tour-mask)" />
        {spot && <motion.rect initial={false} animate={{ x: spot.x, y: spot.y, width: spot.w, height: spot.h }} transition={{ type: 'spring', stiffness: 260, damping: 32 }} rx={18} fill="none" stroke="rgba(255,205,0,0.55)" strokeWidth={1.5} />}
      </svg>
      {/* click blockers around the cutout; the spotlit area stays interactive */}
      {spot ? (
        <>
          <div className="absolute left-0 right-0 top-0" style={{ height: spot.y }} />
          <div className="absolute left-0 right-0" style={{ top: spot.y + spot.h, bottom: 0 }} />
          <div className="absolute left-0" style={{ top: spot.y, height: spot.h, width: spot.x }} />
          <div className="absolute right-0" style={{ top: spot.y, height: spot.h, left: spot.x + spot.w }} />
        </>
      ) : (
        <div className="absolute inset-0" />
      )}

      {/* scripted tap indicator */}
      <AnimatePresence>
        {finger && (
          <motion.div key="finger" className="pointer-events-none absolute z-10" initial={{ opacity: 0, x: finger.x, y: finger.y }} animate={{ opacity: 1, x: finger.x, y: finger.y }} exit={{ opacity: 0 }} transition={{ type: 'spring', stiffness: 220, damping: 26 }} style={{ left: 0, top: 0 }}>
            <div className="-translate-x-1/2 -translate-y-1/2">
              <div className="h-9 w-9 rounded-full border-2 border-white/90 bg-white/25 shadow-[0_0_24px_rgba(255,255,255,0.5)]" />
              <motion.div key={finger.tap} className="absolute inset-0 rounded-full border-2 border-accent" initial={{ scale: 0.6, opacity: 1 }} animate={{ scale: 2.2, opacity: 0 }} transition={{ duration: 0.7, delay: 0.35 }} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* tour card */}
      <motion.div
        ref={cardRef}
        data-tour-card
        className={cn('glass-strong absolute rounded-2xl p-5', isClose && 'text-center')}
        style={{ width: isClose ? Math.min(460, vw - 24) : cardW }}
        initial={false}
        animate={{ left: isClose ? (vw - Math.min(460, vw - 24)) / 2 : cx, top: isClose ? (vh - cardH) / 2 : cy, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 30 }}
      >
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}>
            {isClose ? (
              <>
                <div className="flex justify-center">
                  <Logo className="h-10" />
                </div>
                <h2 className="mt-6 text-2xl font-semibold leading-8">{s.title}, built around how National already works.</h2>
                <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
                  <Button variant="secondary" onClick={() => useTour.getState().start()} data-tour="restart">
                    Restart walkthrough
                  </Button>
                  <Button variant="primary" onClick={stop} data-tour="explore">
                    Explore freely
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="mb-2 flex items-center justify-between">
                  <span className="num text-xs font-medium text-accent">
                    {step + 1} of {STEPS.length}
                  </span>
                  <button onClick={stop} className="-mr-1 rounded-md p-1 text-faint hover:text-ink" aria-label="Skip walkthrough">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <h2 className="text-xl font-semibold">{s.title}</h2>
                <p className="mt-1.5 text-[15px] leading-6 text-muted">{s.body}</p>
                <div className="mt-5 flex items-center justify-between gap-3">
                  <div className="flex gap-1.5">
                    {STEPS.map((_, i) => (
                      <button key={i} onClick={() => go(i)} aria-label={`Step ${i + 1}`} className={cn('h-1.5 rounded-full transition-all', i === step ? 'w-5 bg-accent' : i < step ? 'w-1.5 bg-white/50' : 'w-1.5 bg-white/20')} />
                    ))}
                  </div>
                  <div className="flex gap-2">
                    {step > 0 && (
                      <Button size="sm" variant="ghost" onClick={() => go(step - 1)} aria-label="Back">
                        <ArrowLeft className="h-4 w-4" />
                      </Button>
                    )}
                    <Button size="sm" variant="primary" onClick={() => go(step + 1)} data-tour="tour-next">
                      Next <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between text-2xs text-faint">
                  <button onClick={stop} className="hover:text-ink">
                    Skip walkthrough
                  </button>
                  <span className="hidden md:inline">Arrow keys and Esc work</span>
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
