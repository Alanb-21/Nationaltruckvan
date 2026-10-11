import { chromium } from 'playwright'
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell' })
const p = await b.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 2 })
await p.goto('http://localhost:5173/'); await p.waitForTimeout(800)
const cards = await p.$$('.card')
await cards[+process.argv[2]].screenshot({ path: process.argv[3] })
await b.close()
