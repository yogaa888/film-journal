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

async function noHorizontalScroll(where) {
  const { scrollWidth, innerWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }))
  log(`${where} 横向滚动`, scrollWidth <= innerWidth ? `正常 (${scrollWidth} <= ${innerWidth})` : `异常 (${scrollWidth} > ${innerWidth})`)
}

try {
  await page.goto(base, { waitUntil: 'networkidle' })
  await page.locator('.record-title', { hasText: '花样年华' }).click()
  await page.waitForTimeout(250)
  log('详情页标题', await page.locator('.detail-hero-title h1').innerText())
  log('雷达图存在', (await page.locator('.radar-chart').count()) > 0 ? '是' : '否')
  log('综合分', await page.locator('.detail-overall strong').innerText())
  log('同导演/同演员区块', (await page.getByText('同导演或同演员').count()) > 0 ? '是' : '否')
  await page.screenshot({ path: `${dir}screenshot-layer3-detail.png` })
  await page.evaluate(() => window.scrollTo(0, 520))
  await page.waitForTimeout(150)
  await page.screenshot({ path: `${dir}screenshot-layer3-detail-lower.png` })
  await noHorizontalScroll('详情页')

  await page.getByRole('button', { name: '编辑这条记录' }).click()
  await page.waitForTimeout(200)
  log('详情→编辑', await page.locator('.editor-header .serif').innerText())

  await page.goto(`${base}#/detail/seed-episode`, { waitUntil: 'networkidle' })
  log('弃剧信息显示', (await page.locator('.detail-abandon').count()) > 0 ? '是' : '否')

  await page.goto(`${base}#/detail/seed-movie`, { waitUntil: 'networkidle' })
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await page.waitForTimeout(150)
  await page.screenshot({ path: `${dir}screenshot-layer3-detail-bottom.png` })
  const bottomGap = await page.evaluate(() => {
    const sections = document.querySelectorAll('.detail-section')
    const last = sections[sections.length - 1]
    return last ? Math.round(window.innerHeight - last.getBoundingClientRect().bottom) : -1
  })
  log('滚到底部时最后区块距屏幕底部', `${bottomGap}px（操作栏约 72px）`)

  await page.goto(base, { waitUntil: 'networkidle' })
  await page.locator('.poster-item').first().click()
  await page.waitForTimeout(200)
  log('海报条点击进详情', (await page.locator('.detail-hero-title h1').count()) > 0 ? '是' : '否')
} finally {
  await browser.close()
}
