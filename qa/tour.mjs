// Runs the full walkthrough N times (with a Reset demo between runs) and screenshots every step.
// Usage: node qa/tour.mjs <outdir> [runs] [width] [height]
import { chromium } from 'playwright'
const [out = 'qa/shots/tour', runs = '1', w = '1440', h = '900'] = process.argv.slice(2)
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell' })
const page = await browser.newPage({ viewport: { width: +w, height: +h } })
const errs = []
page.on('console', (m) => m.type() === 'error' && errs.push(m.text()))
page.on('pageerror', (e) => errs.push(e.message))
await page.goto('http://localhost:5173/today', { waitUntil: 'networkidle' })
await page.evaluate(() => localStorage.clear())
await page.reload({ waitUntil: 'networkidle' })
await page.waitForTimeout(600)
const state = () => page.evaluate(() => { const t = window.__tour.getState(); return { active: t.active, step: t.step, busy: t.busy } })
for (let run = 1; run <= +runs; run++) {
  if (run === 1) await page.getByText('Start the walkthrough').click()
  else {
    // Reset demo from the profile menu, then restart from the ? button
    await page.click('[data-tour="profile"]'); await page.waitForTimeout(300)
    await page.click('[data-tour="reset"]'); await page.waitForTimeout(600)
    await page.click('[data-tour="help"]')
  }
  for (let i = 0; i < 10; i++) {
    const t0 = Date.now()
    await page.waitForTimeout(500)
    let s = await state()
    while (s.busy && Date.now() - t0 < 45000) { await page.waitForTimeout(250); s = await state() }
    await page.waitForTimeout(700)
    const info = await page.evaluate(() => {
      const card = document.querySelector('[data-tour-card]')
      return { card: !!card, title: card?.querySelector('h2')?.textContent, path: location.pathname + location.search }
    })
    console.log(`run ${run} step ${i + 1}: ${info.title} | ${info.path} | ${((Date.now() - t0) / 1000).toFixed(1)}s${s.busy ? ' STILL BUSY' : ''}${s.step !== i ? ' WRONG STEP ' + s.step : ''}`)
    if (run === 1) await page.screenshot({ path: `${out}/step-${String(i + 1).padStart(2, '0')}-${w}.png` })
    if (i < 9) await page.click('[data-tour="tour-next"]')
  }
  const checks = await page.evaluate(() => {
    const d = window.__demo.getState()
    return {
      defectFeed: d.feed.some((f) => f.kind === 'defect' && f.vehicleId === 'v-0000'),
      job: d.jobs.some((j) => j.vehicleId === 'v-0000'),
      swap: d.swaps.some((s) => s.forVehicleId === 'v-0000' && s.replacementId === 'v-0001'),
      notice: d.notices.some((n) => n.kind === 'replacement' && n.isNew),
      bookings: Object.keys(d.bookings).length,
      recharge: d.returns.find((r) => r.id === 'r-tour')?.status,
    }
  })
  console.log('state', JSON.stringify(checks))
  await page.click('[data-tour="explore"]')
  await page.waitForTimeout(500)
}
if (errs.length) console.log('ERRORS:\n' + [...new Set(errs)].join('\n'))
await browser.close()
