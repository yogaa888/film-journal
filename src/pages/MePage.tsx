import { useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { exportJSON, getSnapshot, importJSON, subscribe } from '../data/store'
import { STATUS_LABEL, type WatchRecord, type WatchStatus } from '../types/record'

const STATUSES: WatchStatus[] = ['wish', 'watching', 'watched', 'abandoned']
const HEAT_WEEKS = 18
const WEEK_LABELS = ['一', '', '三', '', '五', '', '日']

function today(): string {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

interface HeatCell {
  key: string
  records: WatchRecord[]
  future: boolean
}

function buildHeatmap(records: WatchRecord[]): HeatCell[] {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const mondayOffset = (now.getDay() + 6) % 7
  const weekEnd = new Date(now)
  weekEnd.setDate(now.getDate() + (6 - mondayOffset))
  const start = new Date(weekEnd)
  start.setDate(weekEnd.getDate() - (HEAT_WEEKS * 7 - 1))

  const buckets = new Map<string, WatchRecord[]>()
  for (const record of records) {
    const parsed = new Date(`${record.watchedAt}T00:00:00`)
    if (!Number.isFinite(parsed.getTime())) continue
    const key = dateKey(parsed)
    const list = buckets.get(key) ?? []
    list.push(record)
    buckets.set(key, list)
  }

  const cells: HeatCell[] = []
  for (let index = 0; index < HEAT_WEEKS * 7; index += 1) {
    const day = new Date(start)
    day.setDate(start.getDate() + index)
    const key = dateKey(day)
    cells.push({ key, records: buckets.get(key) ?? [], future: day.getTime() > now.getTime() })
  }
  return cells
}

function heatLevel(count: number): number {
  if (count <= 0) return 0
  if (count === 1) return 1
  if (count === 2) return 2
  if (count <= 4) return 3
  return 4
}

export default function MePage({ onToast }: { onToast: (message: string) => void }) {
  const data = useSyncExternalStore(subscribe, getSnapshot)
  const fileInput = useRef<HTMLInputElement>(null)
  const [selectedDay, setSelectedDay] = useState<string | null>(null)

  const heatCells = useMemo(() => buildHeatmap(data.records), [data.records])
  const activeDays = heatCells.filter((cell) => cell.records.length > 0).length

  const stats = useMemo(() => {
    const scored = data.records.filter((record) => record.overall > 0)
    const average = scored.length
      ? (scored.reduce((sum, record) => sum + record.overall, 0) / scored.length).toFixed(1)
      : '—'
    const counts = STATUSES.map((status) => ({
      status,
      count: data.records.filter((record) => record.status === status).length,
    }))
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7).getTime()
    const week = data.records.filter((record) => {
      const date = new Date(`${record.watchedAt}T00:00:00`).getTime()
      return Number.isFinite(date) && date >= start && date <= now.getTime()
    }).length
    return { average, counts, week, total: data.records.length, playlists: data.playlists.length }
  }, [data.records, data.playlists])

  function handleExport() {
    const blob = new Blob([exportJSON()], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `观影手账-${today()}.json`
    anchor.click()
    URL.revokeObjectURL(url)
    onToast('已导出 JSON')
  }

  async function handleImport(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      const { added, skipped } = importJSON(await file.text())
      onToast(`已导入 ${added} 条${skipped ? `，跳过 ${skipped} 条` : ''}`)
    } catch {
      onToast('导入失败：文件格式不对')
    }
    event.target.value = ''
  }

  return (
    <main className="page">
      <header className="app-header">
        <div className="brand serif">我的</div>
        <div className="brand-sub">PROFILE</div>
      </header>

      <section className="me-stats">
        <div className="me-stat-main">
          <span className="me-stat-value serif">{stats.total}</span>
          <span className="me-stat-label">条观影记录</span>
        </div>
        <div className="me-stat-grid">
          <div><strong className="serif">{stats.average}</strong><span>平均评分</span></div>
          <div><strong className="serif">{stats.week}</strong><span>最近 7 天</span></div>
          <div><strong className="serif">{stats.playlists}</strong><span>个片单</span></div>
        </div>
      </section>

      <section className="me-section heat-section">
        <div className="me-section-title">观影日历</div>
        <div className="heat-summary">
          <span className="serif">{activeDays}</span> 天有记录 · 最近 {HEAT_WEEKS} 周
        </div>
        <div className="heat-scroll">
          <div className="heat-grid">
            {heatCells.map((cell) => {
              const level = heatLevel(cell.records.length)
              const selected = selectedDay === cell.key
              const label = `${cell.key} · ${cell.records.length} 条记录`
              return (
                <button
                  type="button"
                  key={cell.key}
                  className={`heat-cell heat-lv${level}${cell.future ? ' heat-future' : ''}${selected ? ' heat-selected' : ''}`}
                  title={label}
                  aria-label={label}
                  disabled={cell.future}
                  onClick={() => setSelectedDay(selected ? null : cell.key)}
                />
              )
            })}
          </div>
        </div>
        <div className="heat-legend">
          <span>少</span>
          {[0, 1, 2, 3, 4].map((level) => (
            <span key={level} className={`heat-cell heat-lv${level}`} />
          ))}
          <span>多</span>
        </div>
        {selectedDay && (
          <div className="heat-detail">
            <div className="heat-detail-head">
              <span className="serif">{selectedDay}</span>
              <button type="button" aria-label="关闭" onClick={() => setSelectedDay(null)}>×</button>
            </div>
            {(() => {
              const dayRecords = heatCells.find((cell) => cell.key === selectedDay)?.records ?? []
              if (!dayRecords.length) return <p className="heat-detail-empty">这天没有观影记录。</p>
              return (
                <ul className="heat-detail-list">
                  {dayRecords.map((record) => (
                    <li key={record.id}>
                      <span className="heat-detail-title">{record.title}</span>
                      <span className="heat-detail-meta">{STATUS_LABEL[record.status]}{record.overall > 0 ? ` · ${record.overall.toFixed(1)}` : ''}</span>
                    </li>
                  ))}
                </ul>
              )
            })()}
          </div>
        )}
      </section>

      <section className="me-section">
        <div className="me-section-title">状态分布</div>
        <div className="status-distribution">
          {stats.counts.map(({ status, count }) => (
            <div className="status-dist-row" key={status}>
              <span className="status-dist-label">{STATUS_LABEL[status]}</span>
              <span className="status-dist-track">
                <span style={{ width: stats.total ? `${(count / stats.total) * 100}%` : '0%' }} />
              </span>
              <span className="status-dist-value">{count}</span>
            </div>
          ))}
        </div>
      </section>

      <button type="button" className="me-feature" onClick={() => onToast('观影人格报告在第二批 AI 能力中交付')}>
        <span>
          <strong className="serif">观影人格报告</strong>
          <small>基于全部打分，生成一页偏好可视化报告</small>
        </span>
        <span className="me-feature-arrow">›</span>
      </button>

      <section className="me-section">
        <div className="me-section-title">数据</div>
        <div className="me-data-actions">
          <button type="button" className="ghost-button" onClick={handleExport}>导出 JSON</button>
          <button type="button" className="ghost-button" onClick={() => fileInput.current?.click()}>导入 JSON</button>
          <input
            ref={fileInput}
            type="file"
            accept="application/json,.json"
            onChange={handleImport}
            hidden
          />
        </div>
        <p className="me-data-note">数据只存在这台设备的浏览器里。导出的文件包含全部记录和片单，可用于备份或迁移。</p>
      </section>
    </main>
  )
}
