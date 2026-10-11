// Screenshot every screen. Usage: node qa/screens.mjs <outdir> [width] [height] [routes...]
import { chromium } from 'playwright'
const [out = 'qa/shots', w = '1440', h = '900', ...only] = process.argv.slice(2)
const routes = only.length ? only : ['/today', '/fleet', '/fleet/v-0000', '/compliance', '/workshop', '/workshop?depot=Cork', '/live', '/live?b=b-2', '/returns', '/returns/r-tour', '/inbox', '/inbox/t-1', '/insights', '/driver', '/portal', '/portal/bookings', '/portal/requests', '/portal/documents']
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell' })
const page = await browser.newPage({ viewport: { width: +w, height: +h } })
const errs = []
page.on('console', (m) => m.type() === 'error' && errs.push(m.text()))
page.on('pageerror', (e) => errs.push(e.message))
await page.goto('http://localhost:5173/today', { waitUntil: 'networkidle' })
await page.getByText('Explore on my own').click().catch(() => {})
await page.waitForTimeout(400)
for (const r of routes) {
  await page.goto('http://localhost:5173' + r, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1300)
  const name = r.replace(/[/?=]/g, '_').replace(/^_/, '') || 'root'
  await page.screenshot({ path: `${out}/${name}-${w}.png` })
}
if (errs.length) console.log('ERRORS:\n' + [...new Set(errs)].join('\n'))
await browser.close()
