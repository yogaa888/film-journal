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

async function titles() {
  return page.locator('.record-list .record-card .record-title').allInnerTexts()
}

try {
  await page.goto(`${base}#/timeline`, { waitUntil: 'networkidle' })

  log('初始记录数', await page.locator('.record-list .record-card').count())
  log('初始计数文案', (await page.locator('.filter-count').innerText()))

  // 状态筛选：在看
  await page.locator('.filter-row').nth(0).getByRole('button', { name: '在看' }).click()
  log('筛选[在看]记录数', await page.locator('.record-list .record-card').count())
  log('筛选[在看]标题', (await titles()).join(', '))

  // 叠加类型筛选：剧集
  await page.locator('.filter-row').nth(1).getByRole('button', { name: '剧集' }).click()
  log('筛选[在看+剧集]记录数', await page.locator('.record-list .record-card').count())

  // 制造空结果：在看 + 单集
  await page.locator('.filter-row').nth(1).getByRole('button', { name: '单集' }).click()
  log('空结果提示', (await page.locator('.empty-state').count()) > 0 ? '有' : '无')
  log('清除筛选按钮', (await page.getByRole('button', { name: '清除筛选' }).count()) > 0 ? '有' : '无')

  await page.screenshot({ path: `${dir}screenshot-filter-empty.png` })

  // 清除筛选
  await page.getByRole('button', { name: '清除筛选' }).click()
  log('清除后记录数', await page.locator('.record-list .record-card').count())

  // 排序：按评分（花样年华 4.8 应排第一）
  await page.getByRole('button', { name: '按评分' }).click()
  const scoreOrder = await titles()
  log('按评分排序首个', scoreOrder[0])
  log('按评分排序列表', scoreOrder.join(', '))

  await page.getByRole('button', { name: '按日期' }).click()
  const dateOrder = await titles()
  log('按日期排序首个', dateOrder[0])

  await page.screenshot({ path: `${dir}screenshot-filter.png` })

  // 无横向滚动
  const { scrollWidth, innerWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }))
  log('页面横向滚动', scrollWidth <= innerWidth ? `正常 (${scrollWidth} <= ${innerWidth})` : `异常 (${scrollWidth} > ${innerWidth})`)

  log('RESULT: PASS')
} catch (error) {
  console.error('RESULT: FAIL', error)
  process.exitCode = 1
} finally {
  await browser.close()
}
