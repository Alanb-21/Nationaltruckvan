import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import * as Dialog from '@radix-ui/react-dialog'
import { cva, type VariantProps } from 'class-variance-authority'
import { AnimatePresence, animate, motion, useReducedMotion } from 'framer-motion'
import { X } from 'lucide-react'
import { cn, initials } from '@/lib/format'
import type { VehicleStatus } from '@/data/types'

/* ---------- Button (shadcn pattern, restyled) ---------- */
const buttonVariants = cva(
  'focus-ring inline-flex select-none items-center justify-center gap-2 whitespace-nowrap font-medium transition-[background,color,box-shadow,transform] duration-150 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40',
  {
    variants: {
      variant: {
        primary: 'bg-accent text-accent-ink hover:brightness-105 shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_6px_20px_-8px_rgb(var(--accent)/0.6)]',
        secondary: 'bg-white/[0.07] text-ink hover:bg-white/[0.11] border border-white/[0.08]',
        ghost: 'text-muted hover:text-ink hover:bg-white/[0.06]',
        danger: 'bg-bad text-white hover:brightness-110 shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]',
        quiet: 'bg-accent/10 text-accent hover:bg-accent/15',
      },
      size: {
        sm: 'h-8 rounded-[10px] px-3 text-sm',
        md: 'h-10 rounded-md px-4 text-sm',
        lg: 'h-12 rounded-lg px-5 text-base',
        xl: 'h-14 rounded-xl px-6 text-lg',
        icon: 'h-9 w-9 rounded-md',
      },
    },
    defaultVariants: { variant: 'secondary', size: 'md' },
  },
)
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean
}
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, asChild, ...props }, ref) => {
  const Comp = asChild ? Slot : 'button'
  return <Comp ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
})
Button.displayName = 'Button'

/* ---------- Status ---------- */
export type Tone = 'ok' | 'warn' | 'bad' | 'neutral' | 'accent'
export const STATUS_TONE: Record<VehicleStatus, Tone> = {
  'On hire': 'ok',
  Available: 'neutral',
  'In workshop': 'warn',
  VOR: 'bad',
  'Awaiting collection': 'neutral',
  Defleet: 'neutral',
}
const toneClass: Record<Tone, string> = {
  ok: 'text-ok bg-ok/15 ring-ok/20',
  warn: 'text-warn bg-warn/15 ring-warn/20',
  bad: 'text-bad bg-bad/15 ring-bad/25',
  neutral: 'text-muted bg-white/[0.06] ring-white/[0.08]',
  accent: 'text-accent bg-accent/15 ring-accent/25',
}
export const toneText: Record<Tone, string> = { ok: 'text-ok', warn: 'text-warn', bad: 'text-bad', neutral: 'text-muted', accent: 'text-accent' }
export const toneBg: Record<Tone, string> = { ok: 'bg-ok', warn: 'bg-warn', bad: 'bg-bad', neutral: 'bg-faint', accent: 'bg-accent' }

export function Pill({ tone = 'neutral', children, className, dot }: { tone?: Tone; children: React.ReactNode; className?: string; dot?: boolean }) {
  return (
    <span className={cn('inline-flex h-6 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 text-xs font-medium ring-1 ring-inset', toneClass[tone], className)}>
      {dot && <span className={cn('h-1.5 w-1.5 rounded-full', toneBg[tone])} />}
      {children}
    </span>
  )
}
export function StatusPill({ status, className }: { status: VehicleStatus; className?: string }) {
  return (
    <Pill tone={STATUS_TONE[status]} dot className={className}>
      {status}
    </Pill>
  )
}

/* ---------- Chip (filters) ---------- */
export function Chip({ active, children, onClick, count, className, ...rest }: { active?: boolean; children: React.ReactNode; onClick?: () => void; count?: number; className?: string } & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'>) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'focus-ring inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-sm font-medium transition-colors',
        active ? 'bg-ink text-canvas' : 'bg-white/[0.06] text-muted hover:bg-white/[0.1] hover:text-ink',
        className,
      )}
      {...rest}
    >
      {children}
      {count !== undefined && <span className={cn('num text-xs', active ? 'text-canvas/60' : 'text-faint')}>{count}</span>}
    </button>
  )
}

/* ---------- Avatar ---------- */
const avatarHues = ['#2c5aa0', '#3a7d6b', '#7a5aa6', '#a6683a', '#3a6fa6', '#8a4a5e', '#4f7a3a', '#5a5fa6']
export function Avatar({ name, size = 36, className, ring }: { name: string; size?: number; className?: string; ring?: boolean }) {
  const h = [...name].reduce((a, c) => a + c.charCodeAt(0), 0)
  return (
    <span
      className={cn('inline-flex shrink-0 select-none items-center justify-center rounded-full font-semibold text-white/95', ring && 'ring-2 ring-canvas', className)}
      style={{ width: size, height: size, fontSize: size * 0.36, background: `linear-gradient(145deg, ${avatarHues[h % avatarHues.length]}, ${avatarHues[(h + 3) % avatarHues.length]}cc)` }}
      aria-hidden
    >
      {initials(name)}
    </span>
  )
}

/* ---------- Count up ---------- */
export function CountUp({ value, format = (n: number) => Math.round(n).toLocaleString('en-IE'), className }: { value: number; format?: (n: number) => string; className?: string }) {
  const ref = React.useRef<HTMLSpanElement>(null)
  const prev = React.useRef(0)
  const reduce = useReducedMotion()
  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    if (reduce) {
      el.textContent = format(value)
      prev.current = value
      return
    }
    const c = animate(prev.current, value, {
      duration: 0.9,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => (el.textContent = format(v)),
    })
    prev.current = value
    return () => c.stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, reduce])
  return (
    <span ref={ref} className={cn('num', className)}>
      {format(prev.current)}
    </span>
  )
}

/* ---------- Section header ---------- */
export function SectionTitle({ children, right, className }: { children: React.ReactNode; right?: React.ReactNode; className?: string }) {
  return (
    <div className={cn('mb-3 flex items-center justify-between gap-3', className)}>
      <h2 className="text-lg font-semibold">{children}</h2>
      {right}
    </div>
  )
}

export function PageHeader({ title, sub, right }: { title: React.ReactNode; sub?: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold md:text-3xl">{title}</h1>
        {sub && <p className="mt-1.5 text-base text-muted">{sub}</p>}
      </div>
      {right}
    </div>
  )
}

/* ---------- Segmented control ---------- */
export function Segmented<T extends string>({ value, onChange, options, className, size = 'md', layoutId, ...rest }: { value: T; onChange: (v: T) => void; options: { value: T; label: React.ReactNode; tour?: string }[]; className?: string; size?: 'sm' | 'md'; layoutId: string } & { 'data-tour'?: string }) {
  return (
    <div className={cn('relative inline-flex rounded-[12px] bg-white/[0.06] p-[3px] ring-1 ring-inset ring-white/[0.06]', className)} role="tablist" {...rest}>
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            role="tab"
            aria-selected={active}
            data-tour={o.tour}
            onClick={() => onChange(o.value)}
            className={cn('focus-ring relative z-10 rounded-[9px] font-medium transition-colors', size === 'sm' ? 'h-7 px-3 text-xs' : 'h-8 px-3.5 text-sm', active ? 'text-ink' : 'text-muted hover:text-ink')}
          >
            {active && (
              <motion.span layoutId={layoutId} className="absolute inset-0 -z-10 rounded-[9px] bg-white/[0.13] shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_2px_8px_-2px_rgba(0,0,0,0.5)]" transition={{ type: 'spring', stiffness: 500, damping: 38 }} />
            )}
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

/* ---------- Sheet (iOS style) ---------- */
export function Sheet({ open, onOpenChange, title, description, children, footer, wide, side = 'bottom' }: { open: boolean; onOpenChange: (o: boolean) => void; title: React.ReactNode; description?: React.ReactNode; children: React.ReactNode; footer?: React.ReactNode; wide?: boolean; side?: 'bottom' | 'right' }) {
  const reduce = useReducedMotion()
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <motion.div className="fixed inset-0 z-[60] bg-black/50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} />
            </Dialog.Overlay>
            <Dialog.Content asChild forceMount aria-describedby={undefined}>
              <motion.div
                data-sheet
                className={cn(
                  'glass-strong fixed z-[61] flex max-h-[92dvh] flex-col overflow-hidden outline-none',
                  side === 'right'
                    ? 'inset-y-3 right-3 w-[min(520px,calc(100vw-24px))] rounded-2xl'
                    : cn('inset-x-0 bottom-0 rounded-t-2xl md:inset-x-auto md:bottom-auto md:left-1/2 md:top-1/2 md:w-[min(640px,calc(100vw-48px))] md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-2xl', wide && 'md:w-[min(920px,calc(100vw-48px))]'),
                )}
                initial={reduce ? { opacity: 0 } : side === 'right' ? { x: 40, opacity: 0 } : { y: 60, opacity: 0 }}
                animate={reduce ? { opacity: 1 } : side === 'right' ? { x: 0, opacity: 1 } : { y: 0, opacity: 1 }}
                exit={reduce ? { opacity: 0 } : side === 'right' ? { x: 40, opacity: 0 } : { y: 60, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 420, damping: 38 }}
              >
                <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-white/20 md:hidden" />
                <div className="flex items-start justify-between gap-4 px-6 pb-4 pt-5">
                  <div className="min-w-0">
                    <Dialog.Title className="text-xl font-semibold">{title}</Dialog.Title>
                    {description && <Dialog.Description className="mt-1 text-sm text-muted">{description}</Dialog.Description>}
                  </div>
                  <Dialog.Close asChild>
                    <Button variant="ghost" size="icon" aria-label="Close" className="-mr-2 -mt-1">
                      <X className="h-5 w-5" />
                    </Button>
                  </Dialog.Close>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6">{children}</div>
                {footer && <div className="flex items-center justify-end gap-2 border-t border-white/[0.07] px-6 py-4 pb-[max(16px,env(safe-area-inset-bottom))]">{footer}</div>}
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  )
}

/* ---------- Empty ---------- */
export function Empty({ icon, title, sub }: { icon?: React.ReactNode; title: string; sub?: string }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      {icon && <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.05] text-muted">{icon}</div>}
      <div className="text-base font-medium">{title}</div>
      {sub && <div className="mt-1 max-w-xs text-sm text-muted">{sub}</div>}
    </div>
  )
}

/* ---------- Toasts ---------- */
type ToastT = { id: number; text: string }
let pushToast: (t: string) => void = () => {}
export const toast = (t: string) => pushToast(t)
export function Toaster() {
  const [items, setItems] = React.useState<ToastT[]>([])
  React.useEffect(() => {
    pushToast = (text) => {
      const id = Date.now() + Math.random()
      setItems((s) => [...s.slice(-2), { id, text }])
      setTimeout(() => setItems((s) => s.filter((x) => x.id !== id)), 3200)
    }
  }, [])
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[80] flex flex-col items-center gap-2 md:bottom-6">
      <AnimatePresence>
        {items.map((t) => (
          <motion.div key={t.id} layout initial={{ opacity: 0, y: 16, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.97 }} transition={{ type: 'spring', stiffness: 500, damping: 36 }} className="glass-strong rounded-full px-4 py-2.5 text-sm font-medium">
            {t.text}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

/* ---------- Field ---------- */
export function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={cn('block', className)}>
      <span className="mb-1.5 block text-sm font-medium text-muted">{label}</span>
      {children}
    </label>
  )
}
export const inputClass = 'focus-ring h-11 w-full rounded-md bg-white/[0.05] px-3.5 text-base text-ink placeholder:text-faint ring-1 ring-inset ring-white/[0.08] focus:ring-accent/50'

export function Kpi({ label, value, sub, tone }: { label: string; value: React.ReactNode; sub?: React.ReactNode; tone?: Tone }) {
  return (
    <div className="card rounded-xl p-4">
      <div className="text-sm text-muted">{label}</div>
      <div className={cn('mt-1 text-2xl font-semibold', tone && toneText[tone])}>{value}</div>
      {sub && <div className="mt-0.5 text-xs text-faint">{sub}</div>}
    </div>
  )
}
