import { chromium } from 'playwright-core'

const executablePath = process.env.BROWSER_PATH
  ?? 'C:/Users/Administrator/AppData/Local/ms-playwright/chromium-1255/chrome-win64/chrome.exe'
const base = 'http://127.0.0.1:5173/'
const dir = 'C:/Users/Administrator/WorkBuddy/2026-11-16-20-03-18/film-journal/'

const browser = await chromium.launch({
  executablePath,
  headless: true,
  args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
})
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })

function log(label, value) {
  console.log(`${label}: ${value}`)
}

try {
  await page.goto(`${base}#/me`, { waitUntil: 'networkidle' })

  const cells = page.locator('.heat-grid .heat-cell')
  log('热力图格子数', await cells.count())

  const lit = page.locator('.heat-grid .heat-cell.heat-lv1, .heat-grid .heat-cell.heat-lv2, .heat-grid .heat-cell.heat-lv3, .heat-grid .heat-cell.heat-lv4')
  log('已点亮的格子数', await lit.count())

  log('有记录天数文案', (await page.locator('.heat-summary').innerText()).replace(/\s+/g, ' '))

  // 无横向滚动
  const { scrollWidth, innerWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }))
  log('页面横向滚动', scrollWidth <= innerWidth ? `正常 (${scrollWidth} <= ${innerWidth})` : `异常 (${scrollWidth} > ${innerWidth})`)

  // 热力图容器本身宽度不溢出
  const gridBox = await page.locator('.heat-scroll').boundingBox()
  log('热力图容器宽度', gridBox ? `${Math.round(gridBox.width)}px` : '无')

  await page.screenshot({ path: `${dir}screenshot-heatmap.png` })

  // 点亮一个格子看详情
  await lit.first().click()
  log('点击后出现详情', (await page.locator('.heat-detail').count()) > 0 ? '是' : '否')
  log('详情日期', await page.locator('.heat-detail-head .serif').innerText())
  log('详情里的片名', await page.locator('.heat-detail-title').first().innerText())
  await page.screenshot({ path: `${dir}screenshot-heatmap-detail.png` })

  log('RESULT: PASS')
} catch (error) {
  console.error('RESULT: FAIL', error)
  process.exitCode = 1
} finally {
  await browser.close()
}
