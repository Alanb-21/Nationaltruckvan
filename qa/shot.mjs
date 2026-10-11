// Usage: node qa/shot.mjs <url> <out.png> [width] [height] [waitMs]
import { chromium } from 'playwright'
const [url, out, w = '1440', h = '900', wait = '800'] = process.argv.slice(2)
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell' })
const page = await browser.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: 1 })
const errs = []
page.on('console', (m) => m.type() === 'error' && errs.push(m.text()))
page.on('pageerror', (e) => errs.push(e.message))
await page.goto(url, { waitUntil: 'networkidle' })
await page.waitForTimeout(+wait)
await page.screenshot({ path: out })
if (errs.length) console.log('ERRORS:', errs.join('\n'))
await browser.close()
