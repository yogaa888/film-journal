import { chromium } from 'playwright-core'
import { readFile, unlink } from 'node:fs/promises'

const executablePath = process.env.BROWSER_PATH
  ?? 'C:/Users/Administrator/AppData/Local/ms-playwright/chromium-1255/chrome-win64/chrome.exe'
const base = 'http://127.0.0.1:5173/'
const dir = 'C:/Users/Administrator/WorkBuddy/2026-11-16-20-03-18/film-journal/'

const browser = await chromium.launch({
  executablePath,
  headless: true,
  args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
})
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, acceptDownloads: true })

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
  // 搜索页
  await page.goto(`${base}#/search`, { waitUntil: 'networkidle' })
  await page.getByPlaceholder('片名、导演、演员、标签或短评').fill('王家卫')
  log('关键词搜索命中数', await page.locator('.search-results .record-card').count())
  log('搜索结果标题', await page.locator('.search-results .record-title').first().innerText())
  await page.screenshot({ path: `${dir}screenshot-layer4-search.png` })
  await noHorizontalScroll('搜索页')
  await page.locator('.search-results .record-card').first().click()
  log('搜索结果进详情', (await page.locator('.detail-hero-title h1').count()) > 0 ? '是' : '否')

  await page.goto(`${base}#/search`, { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: '自然语言' }).click()
  log('自然语言模式入口', (await page.getByText('语义搜索属于第二批 AI 能力').count()) > 0 ? '是' : '否')
  await page.screenshot({ path: `${dir}screenshot-layer4-natural.png` })

  // 片单页
  await page.goto(`${base}#/playlists`, { waitUntil: 'networkidle' })
  await page.getByPlaceholder('给新片单起个名字').fill('周末重看')
  await page.getByRole('button', { name: '新建' }).click()
  log('片单创建', (await page.getByText('周末重看').count()) > 0 ? '是' : '否')
  await page.getByRole('button', { name: '+ 加片' }).click()
  await page.locator('.picker-item').first().click()
  log('片单加片后计数', await page.locator('.playlist-count').innerText())
  await page.getByRole('button', { name: '完成' }).click()
  await page.screenshot({ path: `${dir}screenshot-layer4-playlists.png` })
  await noHorizontalScroll('片单页')

  // 我的页
  await page.goto(`${base}#/me`, { waitUntil: 'networkidle' })
  log('总记录数', await page.locator('.me-stat-value').innerText())
  log('状态分布行数', await page.locator('.status-dist-row').count())
  await page.screenshot({ path: `${dir}screenshot-layer4-me.png` })
  await noHorizontalScroll('我的页')

  // 导出
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: '导出 JSON' }).click(),
  ])
  const exportPath = `${dir}test-export.json`
  await download.saveAs(exportPath)
  const exported = JSON.parse(await readFile(exportPath, 'utf-8'))
  log('导出文件记录数', exported.records.length)
  log('导出文件片单数', exported.playlists.length)

  // 清空后导入
  await page.evaluate(() => localStorage.removeItem('film-journal:v1'))
  await page.goto(base, { waitUntil: 'networkidle' })
  await page.goto(`${base}#/me`, { waitUntil: 'networkidle' })
  await page.locator('input[type="file"]').setInputFiles(exportPath)
  await page.waitForTimeout(300)
  log('导入提示', await page.locator('.toast').innerText())
  await page.goto(base, { waitUntil: 'networkidle' })
  log('导入后记录数', await page.locator('.record-card').count())
  await unlink(exportPath)
} finally {
  await browser.close()
}
