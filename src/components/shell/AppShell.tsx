import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import * as Dialog from '@radix-ui/react-dialog'
import * as Menu from '@radix-ui/react-dropdown-menu'
import { AnimatePresence, motion } from 'framer-motion'
import {
  BarChart3,
  CalendarClock,
  CircleHelp,
  Inbox,
  MapPinned,
  MoreHorizontal,
  RotateCcw,
  Search,
  Sparkles,
  Sun,
  Truck,
  Undo2,
  Wrench,
} from 'lucide-react'
import { Logo } from '@/components/Logo'
import { Avatar, Segmented, Sheet, toast } from '@/components/ui'
import { VehicleThumb } from '@/components/vehicles/VehicleArt'
import { useBadges } from '@/store/derived'
import { customersById, seed, useDemo, useVehicles } from '@/store'
import { useTour, useDriver } from '@/tour/tourStore'
import { cn } from '@/lib/format'
import { TYPE_LABEL } from '@/data/catalog'

export const OPS_NAV = [
  { to: '/today', label: 'Today', icon: Sun, badge: 'today' as const },
  { to: '/fleet', label: 'Fleet', icon: Truck },
  { to: '/compliance', label: 'Compliance', icon: CalendarClock },
  { to: '/workshop', label: 'Workshop', icon: Wrench },
  { to: '/live', label: 'Live', icon: MapPinned },
  { to: '/returns', label: 'Returns', icon: Undo2, badge: 'returns' as const },
  { to: '/inbox', label: 'Inbox', icon: Inbox, badge: 'inbox' as const },
  { to: '/insights', label: 'Insights', icon: BarChart3 },
]

export type LensKey = 'ops' | 'driver' | 'customer'
export function lensOf(path: string): LensKey {
  if (path.startsWith('/driver')) return 'driver'
  if (path.startsWith('/portal')) return 'customer'
  return 'ops'
}

function useResetDemo() {
  const navigate = useNavigate()
  return () => {
    useTour.getState().stop()
    useDriver.getState().reset()
    useDemo.getState().resetDemo()
    navigate('/today')
    toast('Demo reset to this morning')
  }
}

export function LensSwitcher({ className }: { className?: string }) {
  const loc = useLocation()
  const navigate = useNavigate()
  const lens = lensOf(loc.pathname)
  return (
    <Segmented
      layoutId="lens"
      data-tour="lens"
      className={className}
      value={lens}
      onChange={(v) => navigate(v === 'ops' ? '/today' : v === 'driver' ? '/driver' : '/portal')}
      options={[
        { value: 'ops', label: 'Operations', tour: 'lens-ops' },
        { value: 'driver', label: 'Driver', tour: 'lens-driver' },
        { value: 'customer', label: 'Customer', tour: 'lens-customer' },
      ]}
    />
  )
}

function ProfileMenu() {
  const reset = useResetDemo()
  const showWelcome = useTour((s) => s.showWelcome)
  return (
    <Menu.Root modal={false}>
      <Menu.Trigger asChild>
        <button className="focus-ring rounded-full" aria-label="Profile menu" data-tour="profile">
          <Avatar name="Martin Brannock" size={34} />
        </button>
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Content align="end" sideOffset={10} className="glass-strong z-[70] w-64 rounded-xl p-1.5 text-sm">
          <div className="flex items-center gap-3 px-3 py-2.5">
            <Avatar name="Martin Brannock" size={36} />
            <div className="min-w-0">
              <div className="font-semibold">Martin Brannock</div>
              <div className="truncate text-xs text-muted">Head of Fleet Operations</div>
            </div>
          </div>
          <div className="my-1 h-px bg-white/[0.07]" />
          <Menu.Item onSelect={() => showWelcome(true)} className="flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2.5 outline-none data-[highlighted]:bg-white/[0.07]">
            <Sparkles className="h-4 w-4 text-muted" /> Show welcome
          </Menu.Item>
          <Menu.Item onSelect={reset} className="flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2.5 outline-none data-[highlighted]:bg-white/[0.07]" data-tour="reset">
            <RotateCcw className="h-4 w-4 text-muted" /> Reset demo
          </Menu.Item>
        </Menu.Content>
      </Menu.Portal>
    </Menu.Root>
  )
}

function SearchDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [q, setQ] = useState('')
  const vehicles = useVehicles()
  const jobs = useDemo((s) => s.jobs)
  const navigate = useNavigate()
  useEffect(() => {
    if (!open) setQ('')
  }, [open])
  const results = useMemo(() => {
    const t = q.trim().toLowerCase().replace(/\s+/g, '')
    if (!t) return { vehicles: [], customers: [], jobs: [] }
    return {
      vehicles: vehicles.filter((v) => v.reg.toLowerCase().replace(/-/g, '').includes(t.replace(/-/g, '')) || v.reg.toLowerCase().includes(t)).slice(0, 6),
      customers: seed.customers.filter((c) => c.name.toLowerCase().replace(/\s+/g, '').includes(t)).slice(0, 4),
      jobs: jobs.filter((j) => j.id.toLowerCase().includes(t) || j.title.toLowerCase().replace(/\s+/g, '').includes(t)).slice(0, 4),
    }
  }, [q, vehicles, jobs])
  const go = (to: string) => {
    onOpenChange(false)
    navigate(to)
  }
  const vById = useMemo(() => new Map(vehicles.map((v) => [v.id, v])), [vehicles])
  const none = q && !results.vehicles.length && !results.customers.length && !results.jobs.length
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <motion.div className="fixed inset-0 z-[60] bg-black/50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
            </Dialog.Overlay>
            <Dialog.Content asChild forceMount aria-describedby={undefined}>
              <motion.div className="glass-strong fixed left-1/2 top-[12vh] z-[61] w-[min(620px,calc(100vw-24px))] -translate-x-1/2 overflow-hidden rounded-2xl" initial={{ opacity: 0, y: -12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.98 }} transition={{ type: 'spring', stiffness: 500, damping: 38 }}>
                <Dialog.Title className="sr-only">Search</Dialog.Title>
                <div className="flex items-center gap-3 border-b border-white/[0.07] px-5">
                  <Search className="h-5 w-5 text-muted" />
                  <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search registrations, customers and jobs" className="h-14 flex-1 bg-transparent text-lg outline-none placeholder:text-faint" />
                  <kbd className="rounded-md bg-white/[0.07] px-2 py-1 text-xs text-muted">Esc</kbd>
                </div>
                <div className="max-h-[60vh] overflow-y-auto p-2">
                  {!q && <div className="px-3 py-8 text-center text-sm text-muted">Try 221-D-30418, Slaney or Tail-lift</div>}
                  {none && <div className="px-3 py-8 text-center text-sm text-muted">Nothing matches "{q}"</div>}
                  {results.vehicles.length > 0 && <div className="label px-3 pb-1 pt-2">Vehicles</div>}
                  {results.vehicles.map((v) => (
                    <button key={v.id} onClick={() => go(`/fleet/${v.id}`)} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-white/[0.06]">
                      <VehicleThumb type={v.type} className="h-9 w-12" />
                      <div className="min-w-0 flex-1">
                        <div className="font-medium">{v.reg}</div>
                        <div className="truncate text-sm text-muted">
                          {TYPE_LABEL[v.type]} · {v.customerId ? customersById[v.customerId].name : `${v.depot} depot`}
                        </div>
                      </div>
                    </button>
                  ))}
                  {results.customers.length > 0 && <div className="label px-3 pb-1 pt-3">Customers</div>}
                  {results.customers.map((c) => (
                    <button key={c.id} onClick={() => go(`/fleet?customer=${c.id}`)} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-white/[0.06]">
                      <Avatar name={c.name} size={36} />
                      <div className="min-w-0">
                        <div className="font-medium">{c.name}</div>
                        <div className="text-sm text-muted">
                          {c.sector} · {c.town}
                        </div>
                      </div>
                    </button>
                  ))}
                  {results.jobs.length > 0 && <div className="label px-3 pb-1 pt-3">Workshop jobs</div>}
                  {results.jobs.map((j) => (
                    <button key={j.id} onClick={() => go(`/workshop?depot=${j.depot}`)} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-white/[0.06]">
                      <div className="flex h-9 w-12 items-center justify-center rounded-[10px] bg-white/[0.06] text-xs font-semibold text-muted">{j.id.replace('J-', '')}</div>
                      <div className="min-w-0">
                        <div className="font-medium">{j.title}</div>
                        <div className="text-sm text-muted">
                          {vById.get(j.vehicleId)?.reg} · {j.depot} · {j.stage}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  )
}

function Badge({ n }: { n: number }) {
  if (!n) return null
  return <span className="num ml-auto min-w-[20px] rounded-full bg-accent px-1.5 text-center text-2xs font-semibold leading-5 text-accent-ink">{n}</span>
}

function Sidebar() {
  const badges = useBadges()
  return (
    <aside className="glass relative z-20 m-3 mr-0 hidden w-[232px] shrink-0 flex-col rounded-2xl lg:flex">
      <div className="px-5 pb-6 pt-5">
        <Logo />
      </div>
      <nav className="flex flex-col gap-0.5 px-3" data-tour="sidebar">
        {OPS_NAV.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            data-tour={`nav-${n.label.toLowerCase()}`}
            className={({ isActive }) =>
              cn('focus-ring group relative flex h-10 items-center gap-3 rounded-[12px] px-3 text-[15px] font-medium transition-colors', isActive ? 'text-ink' : 'text-muted hover:bg-white/[0.04] hover:text-ink')
            }
          >
            {({ isActive }) => (
              <>
                {isActive && <motion.span layoutId="nav-active" className="absolute inset-0 rounded-[12px] bg-white/[0.09] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]" transition={{ type: 'spring', stiffness: 500, damping: 40 }} />}
                <n.icon className={cn('relative h-[18px] w-[18px]', isActive ? 'text-accent' : '')} strokeWidth={2} />
                <span className="relative">{n.label}</span>
                {n.badge && (
                  <span className="relative ml-auto">
                    <Badge n={badges[n.badge]} />
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="mt-auto p-3">
        <div className="rounded-xl bg-white/[0.04] p-3 text-xs leading-5 text-muted">
          <div className="font-medium text-ink">Ballycoolin and Douglas</div>
          Two depots, one live view.
        </div>
      </div>
    </aside>
  )
}

function TopBar({ onSearch }: { onSearch: () => void }) {
  const start = useTour((s) => s.start)
  const loc = useLocation()
  const lens = lensOf(loc.pathname)
  return (
    <header className="glass relative z-30 mx-3 mt-3 flex h-14 shrink-0 items-center gap-2 rounded-2xl px-3 md:gap-3 md:px-4 lg:ml-3">
      <div className="lg:hidden">
        <Logo compact className="h-8 w-8" />
      </div>
      <LensSwitcher className="max-md:[&_button]:px-2.5 max-md:[&_button]:text-xs" />
      <div className="ml-auto flex items-center gap-1 md:gap-2">
        {lens === 'ops' && (
          <button onClick={onSearch} className="focus-ring hidden h-9 items-center gap-2 rounded-[12px] bg-white/[0.06] pl-3 pr-2 text-sm text-muted ring-1 ring-inset ring-white/[0.06] hover:text-ink md:flex" data-tour="search">
            <Search className="h-4 w-4" />
            <span className="w-40 text-left lg:w-52">Search regs, customers, jobs</span>
            <kbd className="rounded-md bg-white/[0.08] px-1.5 py-0.5 text-2xs">⌘K</kbd>
          </button>
        )}
        {lens === 'ops' && (
          <button onClick={onSearch} className="focus-ring flex h-9 w-9 items-center justify-center rounded-full text-muted hover:text-ink md:hidden" aria-label="Search">
            <Search className="h-5 w-5" />
          </button>
        )}
        <button onClick={start} className="focus-ring flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-white/[0.06] hover:text-ink" aria-label="Start the walkthrough" data-tour="help">
          <CircleHelp className="h-5 w-5" />
        </button>
        <ProfileMenu />
      </div>
    </header>
  )
}

function BottomTabs() {
  const badges = useBadges()
  const [more, setMore] = useState(false)
  const loc = useLocation()
  const tabs = [OPS_NAV[0], OPS_NAV[1], OPS_NAV[3], OPS_NAV[6]]
  const moreItems = [OPS_NAV[2], OPS_NAV[4], OPS_NAV[5], OPS_NAV[7]]
  const moreActive = moreItems.some((m) => loc.pathname.startsWith(m.to))
  const navigate = useNavigate()
  return (
    <>
      <nav className="glass fixed inset-x-3 bottom-3 z-40 flex h-16 items-center justify-around rounded-2xl px-1 pb-[env(safe-area-inset-bottom)] lg:hidden">
        {tabs.map((t) => (
          <NavLink key={t.to} to={t.to} className={({ isActive }) => cn('relative flex flex-1 flex-col items-center gap-1 py-2 text-2xs font-medium', isActive ? 'text-accent' : 'text-muted')} data-tour={`tab-${t.label.toLowerCase()}`}>
            <t.icon className="h-[22px] w-[22px]" />
            {t.label}
            {t.badge && badges[t.badge] > 0 && <span className="num absolute right-[calc(50%-20px)] top-1 min-w-[18px] rounded-full bg-accent px-1 text-center text-[10px] font-semibold leading-[18px] text-accent-ink">{badges[t.badge]}</span>}
          </NavLink>
        ))}
        <button onClick={() => setMore(true)} className={cn('flex flex-1 flex-col items-center gap-1 py-2 text-2xs font-medium', moreActive ? 'text-accent' : 'text-muted')}>
          <MoreHorizontal className="h-[22px] w-[22px]" />
          More
        </button>
      </nav>
      <Sheet open={more} onOpenChange={setMore} title="More">
        <div className="grid grid-cols-2 gap-3">
          {moreItems.map((m) => (
            <button
              key={m.to}
              onClick={() => {
                setMore(false)
                navigate(m.to)
              }}
              className="card flex items-center gap-3 rounded-xl p-4 text-left"
            >
              <m.icon className="h-5 w-5 text-accent" />
              <span className="font-medium">{m.label}</span>
              {m.badge && <Badge n={badges[m.badge]} />}
            </button>
          ))}
        </div>
      </Sheet>
    </>
  )
}

export function AppShell({ children }: { children: ReactNode }) {
  const [search, setSearch] = useState(false)
  const loc = useLocation()
  const lens = lensOf(loc.pathname)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setSearch((s) => !s)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
  return (
    <div className="relative z-10 flex h-full">
      {lens === 'ops' && <Sidebar />}
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar onSearch={() => setSearch(true)} />
        <main id="main" className={cn('relative min-h-0 flex-1 overflow-y-auto overflow-x-hidden', lens === 'ops' && 'pb-24 lg:pb-0')}>
          {children}
        </main>
      </div>
      {lens === 'ops' && <BottomTabs />}
      <SearchDialog open={search} onOpenChange={setSearch} />
    </div>
  )
}

