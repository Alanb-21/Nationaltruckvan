import type { ReactNode } from 'react'
import { cn } from '@/lib/format'

/** WhatsApp-style row: leading visual, title + one line of context, time and status on the right. */
export function ListRow({
  leading,
  title,
  context,
  time,
  status,
  actions,
  onClick,
  className,
  unread,
  highlight,
  ...rest
}: {
  leading: ReactNode
  title: ReactNode
  context?: ReactNode
  time?: ReactNode
  status?: ReactNode
  actions?: ReactNode
  onClick?: () => void
  className?: string
  unread?: boolean
  highlight?: boolean
} & { 'data-tour'?: string }) {
  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => onClick && (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onClick())}
      className={cn(
        'group relative flex items-center gap-3.5 px-4 py-3 transition-colors md:px-5',
        onClick && 'focus-ring cursor-pointer hover:bg-white/[0.035]',
        highlight && 'bg-accent/[0.06]',
        className,
      )}
      {...rest}
    >
      {highlight && <span className="pointer-events-none absolute inset-y-2 left-0 w-[3px] rounded-r-full bg-accent shadow-[0_0_12px_rgb(var(--accent)/0.8)]" />}
      <div className="shrink-0">{leading}</div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-3">
          <div className={cn('min-w-0 flex-1 truncate text-[15px] leading-6', unread ? 'font-semibold' : 'font-medium')}>{title}</div>
          {time && <div className={cn('num shrink-0 text-xs', unread ? 'font-semibold text-accent' : 'text-faint')}>{time}</div>}
        </div>
        <div className="flex items-center gap-3">
          {context && <div className="min-w-0 flex-1 truncate text-sm text-muted">{context}</div>}
          {status && <div className="shrink-0">{status}</div>}
        </div>
        {actions && <div className="mt-2.5 flex flex-wrap gap-2 md:hidden">{actions}</div>}
      </div>
      {actions && <div className="hidden shrink-0 items-center gap-2 md:flex">{actions}</div>}
    </div>
  )
}

export function IconBubble({ icon, tone = 'neutral', size = 44 }: { icon: ReactNode; tone?: 'ok' | 'warn' | 'bad' | 'neutral' | 'accent'; size?: number }) {
  const map = {
    ok: 'bg-ok/15 text-ok',
    warn: 'bg-warn/15 text-warn',
    bad: 'bg-bad/15 text-bad',
    neutral: 'bg-white/[0.07] text-muted',
    accent: 'bg-accent/15 text-accent',
  }
  return (
    <div className={cn('flex items-center justify-center rounded-full', map[tone])} style={{ width: size, height: size }}>
      {icon}
    </div>
  )
}
