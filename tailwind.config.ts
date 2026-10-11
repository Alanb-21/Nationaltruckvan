import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: 'rgb(var(--canvas) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        raised: 'rgb(var(--raised) / <alpha-value>)',
        line: 'rgb(var(--line) / <alpha-value>)',
        ink: 'rgb(var(--ink) / <alpha-value>)',
        muted: 'rgb(var(--muted) / <alpha-value>)',
        faint: 'rgb(var(--faint) / <alpha-value>)',
        accent: 'rgb(var(--accent) / <alpha-value>)',
        'accent-ink': 'rgb(var(--accent-ink) / <alpha-value>)',
        ok: 'rgb(var(--ok) / <alpha-value>)',
        warn: 'rgb(var(--warn) / <alpha-value>)',
        bad: 'rgb(var(--bad) / <alpha-value>)',
        navy: '#071b3a',
      },
      fontFamily: {
        sans: ['"Inter Variable"', 'Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['11px', { lineHeight: '14px', letterSpacing: '0.02em' }],
        xs: ['12px', { lineHeight: '16px' }],
        sm: ['13px', { lineHeight: '19px' }],
        base: ['15px', { lineHeight: '22px' }],
        lg: ['17px', { lineHeight: '24px', letterSpacing: '-0.01em' }],
        xl: ['22px', { lineHeight: '28px', letterSpacing: '-0.02em' }],
        '2xl': ['28px', { lineHeight: '34px', letterSpacing: '-0.025em' }],
        '3xl': ['40px', { lineHeight: '44px', letterSpacing: '-0.03em' }],
        '4xl': ['56px', { lineHeight: '58px', letterSpacing: '-0.035em' }],
      },
      borderRadius: {
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '20px',
        '2xl': '28px',
      },
      boxShadow: {
        glass: 'inset 0 1px 0 0 rgba(255,255,255,0.08), 0 20px 50px -20px rgba(0,0,0,0.6)',
        card: 'inset 0 1px 0 0 rgba(255,255,255,0.04), 0 1px 2px rgba(0,0,0,0.3)',
        glow: '0 0 0 1px rgb(var(--accent) / 0.4), 0 0 24px -4px rgb(var(--accent) / 0.45)',
      },
    },
  },
  plugins: [],
} satisfies Config
