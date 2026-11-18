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

const page = await browser.newPage({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
})

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
  await page.goto(`${base}#/new`, { waitUntil: 'networkidle' })
  await page.screenshot({ path: `${dir}screenshot-layer2-new.png` })
  await noHorizontalScroll('新增页')
  log('新增页标题', await page.locator('.editor-header .serif').innerText())

  await page.getByPlaceholder('片名或剧名').fill('测试弃剧')
  await page.getByRole('button', { name: '弃剧', exact: true }).click()
  await page.getByRole('button', { name: '保存记录' }).click()
  const errorText = await page.locator('.form-error').innerText()
  log('弃剧校验', errorText)
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.screenshot({ path: `${dir}screenshot-layer2-error.png` })

  await page.locator('input[placeholder="1"]').fill('3')
  await page.getByPlaceholder('为什么没看下去').fill('节奏太慢，第三集弃。')
  await page.getByRole('button', { name: '剧情 5 分' }).click()
  await page.getByRole('button', { name: '后劲 4 分' }).click()
  await page.getByRole('button', { name: '保存记录' }).click()
  await page.waitForTimeout(300)
  log('保存后提示', await page.locator('.toast').innerText())
  const savedCount = await page.getByText('测试弃剧').count()
  log('新记录出现在时间线', savedCount > 0 ? '是' : '否')
  await page.screenshot({ path: `${dir}screenshot-layer2-saved.png` })
  await noHorizontalScroll('时间线')

  await page.reload({ waitUntil: 'networkidle' })
  log('刷新后记录仍在', (await page.getByText('测试弃剧').count()) > 0 ? '是' : '否')

  await page.locator('.record-title', { hasText: '测试弃剧' }).click()
  await page.waitForTimeout(200)
  log('编辑页标题', await page.locator('.editor-header .serif').innerText())
  log('编辑页预填标题', await page.getByPlaceholder('片名或剧名').inputValue())
  await page.screenshot({ path: `${dir}screenshot-layer2-edit.png` })
  await noHorizontalScroll('编辑页')

  await page.getByRole('button', { name: '删除' }).click()
  await page.getByRole('button', { name: '确认删除？' }).click()
  await page.waitForTimeout(200)
  log('删除后记录消失', (await page.getByText('测试弃剧').count()) === 0 ? '是' : '否')
  log('删除后提示', await page.locator('.toast').innerText())
} finally {
  await browser.close()
}
