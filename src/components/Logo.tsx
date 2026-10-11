import { cn } from '@/lib/format'

/**
 * National Truck & Van Rental wordmark. The official logo files could not be
 * downloaded in this build, so this is a faithful stand-in in their navy and yellow.
 * Drop logo-white.webp into src/assets and swap the import to use the original.
 */
export function Logo({ className, compact }: { className?: string; compact?: boolean }) {
  if (compact) {
    return (
      <svg viewBox="0 0 40 40" className={cn('h-9 w-9', className)} aria-label="National Truck & Van Rental">
        <rect width="40" height="40" rx="11" fill="#FFCD00" />
        <path d="M10.5 28V12h4.2l8.6 10.2V12h4.2v16h-4.1l-8.7-10.3V28z" fill="#071b3a" />
        <rect x="29.5" y="24" width="4" height="4" rx="1.2" fill="#071b3a" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 196 44" className={cn('h-9', className)} aria-label="National Truck & Van Rental">
      <rect width="44" height="44" rx="12" fill="#FFCD00" />
      <path d="M11.5 31V13h4.6l9.5 11.3V13h4.6v18h-4.5l-9.6-11.4V31z" fill="#071b3a" />
      <rect x="32.5" y="26.6" width="4.4" height="4.4" rx="1.3" fill="#071b3a" />
      <text x="56" y="21" fill="#ffffff" fontFamily="Inter Variable, Inter, sans-serif" fontWeight="800" fontSize="19" letterSpacing="0.6">
        NATIONAL
      </text>
      <text x="56.5" y="36" fill="#FFCD00" fontFamily="Inter Variable, Inter, sans-serif" fontWeight="600" fontSize="9.6" letterSpacing="1.55">
        TRUCK &amp; VAN RENTAL
      </text>
    </svg>
  )
}
