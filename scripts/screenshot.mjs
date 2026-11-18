import { chromium } from 'playwright-core'

const executablePath = process.env.BROWSER_PATH ?? 'C:/Users/Administrator/AppData/Local/ms-playwright/chromium-1255/chrome-win64/chrome.exe'
const url = process.argv[2] ?? 'http://127.0.0.1:5173/'
const output = process.argv[3] ?? 'screenshot.png'
const width = Number(process.argv[4] ?? 390)
const height = Number(process.argv[5] ?? 844)

const browser = await chromium.launch({
  executablePath,
  headless: true,
  args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
})

try {
  const page = await browser.newPage({
    viewport: { width, height },
    deviceScaleFactor: 2,
  })
  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 })
  await page.waitForTimeout(600)
  await page.screenshot({ path: output })
  console.log(`saved: ${output}`)
} finally {
  await browser.close()
}
