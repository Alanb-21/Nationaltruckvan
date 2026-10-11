import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, CalendarCheck, Camera, Globe, Send, Truck, User, Wrench } from 'lucide-react'
import { Avatar, Button, Chip, Pill, toast } from '@/components/ui'
import { ListRow } from '@/components/ListRow'
import { useDemo, useVehicles } from '@/store'
import type { Thread, ThreadKind } from '@/data/types'
import { cn } from '@/lib/format'
import { fmtTime, fmtWhen } from '@/lib/time'

const KIND_ICON: Record<ThreadKind, typeof User> = { Customer: User, Driver: Truck, 'Website form': Globe }

function suggestions(t: Thread): string[] {
  switch (t.tag) {
    case 'Defect':
      return ['Thanks, job raised. Keep it off the road if it gets worse.', 'Thanks. A mobile tech will call you within the hour.']
    case 'Breakdown':
      return ['Recovery is on the way. Stay with the vehicle.', 'Replacement dispatched. ETA to follow.']
    case 'Extra vehicles':
    case 'Request an extra vehicle':
      return ['Yes, we can hold them. Confirming by end of day.', 'We have them from 3 November.', 'Can we call you this morning to go through numbers?']
    case 'Book a Service':
    case 'CVRT':
    case 'Tail Lift Inspection':
      return ['Booked in. We will send the slot shortly.', 'Wednesday works. A replacement will be there before you drop off.', 'Can you send the registrations?']
    case 'Parts Enquiry':
      return ['Yes, we hold those at Ballycoolin.', 'Checking stock now, back to you within the hour.']
    case 'Documents':
      return ['All in your portal under Documents.', 'Sending the compliance pack now.']
    default:
      return ['Thanks, on it.', 'I will call you shortly.']
  }
}

function Chat({ t }: { t: Thread }) {
  const vehicles = useVehicles()
  const navigate = useNavigate()
  const [text, setText] = useState('')
  const v = t.vehicleId ? vehicles.find((x) => x.id === t.vehicleId) : undefined
  const endRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (t.unread) useDemo.getState().markThreadRead(t.id)
  }, [t.id, t.unread])
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' })
  }, [t.messages.length])
  const send = (msg: string) => {
    if (!msg.trim()) return
    useDemo.getState().sendMessage(t.id, msg.trim())
    setText('')
  }
  const convert = (to: 'job' | 'booking') => {
    const label = useDemo.getState().convertThread(t.id, to)
    if (label) toast(label)
  }
  const canJob = !!t.vehicleId
  const canBook = ['Book a Service', 'CVRT', 'Tail Lift Inspection', 'Extra vehicles', 'Request an extra vehicle', 'Request a Call Back'].includes(t.tag)
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center gap-3 border-b border-white/[0.06] px-4 py-3 md:px-5">
        <button onClick={() => navigate('/inbox')} className="text-muted md:hidden" aria-label="Back">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <Avatar name={t.name} size={40} />
        <div className="min-w-0 flex-1">
          <div className="truncate font-semibold">{t.name}</div>
          <div className="flex items-center gap-2 text-xs text-muted">
            <span>{t.kind}</span>
            {v && (
              <button onClick={() => navigate(`/fleet/${v.id}`)} className="text-accent">
                {v.reg}
              </button>
            )}
          </div>
        </div>
        <Pill tone="accent">{t.tag}</Pill>
      </div>
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-5 md:px-6">
        {t.messages.map((m) => (
          <motion.div key={m.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={cn('flex', m.from === 'us' ? 'justify-end' : 'justify-start')}>
            <div className={cn('max-w-[80%] rounded-2xl px-4 py-2.5 text-[15px] leading-6', m.from === 'us' ? 'rounded-br-md bg-accent text-accent-ink' : 'rounded-bl-md bg-raised')}>
              {m.text}
              {m.from === 'them' && /photo attached/i.test(m.text) && (
                <div className="mt-2 flex h-28 w-44 items-center justify-center rounded-lg bg-gradient-to-br from-[#2b3f5f] to-[#14233c] text-muted">
                  <Camera className="h-6 w-6" />
                </div>
              )}
              <div className={cn('num mt-1 text-right text-2xs', m.from === 'us' ? 'text-accent-ink/60' : 'text-faint')}>{fmtTime(m.at)}</div>
            </div>
          </motion.div>
        ))}
        {t.converted && <div className="mx-auto w-fit rounded-full bg-ok/10 px-3 py-1 text-xs text-ok">{t.converted}</div>}
        <div ref={endRef} />
      </div>
      <div className="border-t border-white/[0.06] p-3 md:p-4">
        {!t.converted && (canJob || canBook) && (
          <div className="mb-3 flex flex-wrap gap-2">
            {canJob && (
              <Button size="sm" variant="quiet" onClick={() => convert('job')}>
                <Wrench className="h-4 w-4" /> Create workshop job
              </Button>
            )}
            {canBook && (
              <Button size="sm" variant="quiet" onClick={() => convert('booking')}>
                <CalendarCheck className="h-4 w-4" /> {t.tag.includes('vehicle') ? 'Hold vehicles' : 'Create booking'}
              </Button>
            )}
          </div>
        )}
        <div className="-mx-1 mb-3 flex gap-2 overflow-x-auto px-1">
          {suggestions(t).map((s) => (
            <button key={s} onClick={() => send(s)} className="shrink-0 rounded-full bg-white/[0.06] px-3 py-1.5 text-sm text-muted ring-1 ring-inset ring-white/[0.06] hover:text-ink">
              {s}
            </button>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            send(text)
          }}
          className="flex items-center gap-2"
        >
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Write a reply" className="focus-ring h-11 flex-1 rounded-full bg-white/[0.05] px-4 text-[15px] ring-1 ring-inset ring-white/[0.08] placeholder:text-faint" />
          <Button type="submit" variant="primary" size="icon" className="h-11 w-11 rounded-full" aria-label="Send">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}

export default function InboxScreen() {
  const { id } = useParams()
  const threads = useDemo((s) => s.threads)
  const navigate = useNavigate()
  const [filter, setFilter] = useState<ThreadKind | 'All'>('All')
  const sorted = useMemo(() => [...threads].sort((a, b) => b.messages[b.messages.length - 1].at.localeCompare(a.messages[a.messages.length - 1].at)), [threads])
  const list = sorted.filter((t) => filter === 'All' || t.kind === filter)
  const current = id ? threads.find((t) => t.id === id) : undefined
  const unread = threads.filter((t) => t.unread).length

  return (
    <div className="mx-auto h-full max-w-[1280px] px-0 md:px-8 md:py-8">
      <div className="card flex h-full min-h-[560px] overflow-hidden md:h-[calc(100dvh-140px)] md:rounded-xl">
        <div className={cn('flex w-full flex-col border-white/[0.06] md:w-[380px] md:shrink-0 md:border-r', current && 'hidden md:flex')}>
          <div className="px-4 pb-3 pt-5 md:px-5">
            <h1 className="text-2xl font-semibold">Inbox</h1>
            <p className="mt-1 text-sm text-muted">{unread ? `${unread} unread` : 'All read'}. Customers, drivers and the website form in one place.</p>
            <div className="-mx-1 mt-4 flex gap-2 overflow-x-auto px-1">
              {(['All', 'Customer', 'Driver', 'Website form'] as const).map((k) => (
                <Chip key={k} active={filter === k} onClick={() => setFilter(k)} count={k === 'All' ? threads.length : threads.filter((t) => t.kind === k).length}>
                  {k}
                </Chip>
              ))}
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto" data-tour="inbox-list">
            <AnimatePresence initial={false}>
              {list.map((t) => {
                const last = t.messages[t.messages.length - 1]
                const Icon = KIND_ICON[t.kind]
                return (
                  <motion.div key={t.id} layout initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="border-t border-white/[0.05] first:border-0">
                    <ListRow
                      onClick={() => navigate(`/inbox/${t.id}`)}
                      highlight={t.isNew}
                      className={cn(current?.id === t.id && 'bg-white/[0.05]')}
                      unread={t.unread}
                      leading={
                        <div className="relative">
                          <Avatar name={t.name} size={44} />
                          <span className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-raised ring-2 ring-surface">
                            <Icon className="h-3 w-3 text-muted" />
                          </span>
                        </div>
                      }
                      title={t.name}
                      time={fmtWhen(last.at)}
                      context={(last.from === 'us' ? 'You: ' : '') + last.text}
                      status={t.unread ? <span className="block h-2.5 w-2.5 rounded-full bg-accent" /> : <span className="text-2xs text-faint">{t.tag}</span>}
                    />
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        </div>
        <div className={cn('min-w-0 flex-1', !current && 'hidden md:block')}>
          {current ? (
            <Chat key={current.id} t={current} />
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-center text-muted">
              <Globe className="mb-3 h-8 w-8 text-faint" />
              <div className="font-medium text-ink">Pick a conversation</div>
              <div className="text-sm">Requests turn into jobs or bookings in one tap.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
