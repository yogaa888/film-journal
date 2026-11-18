import { useMemo, useState, useSyncExternalStore } from 'react'
import PosterStrip from '../components/PosterStrip'
import RecordCard from '../components/RecordCard'
import { getSnapshot, subscribe } from '../data/store'
import { MEDIA_LABEL, STATUS_LABEL, type MediaType, type WatchRecord, type WatchStatus } from '../types/record'

type StatusFilter = 'all' | WatchStatus
type MediaFilter = 'all' | MediaType
type SortBy = 'date' | 'score'

const STATUS_FILTERS: StatusFilter[] = ['all', 'watching', 'watched', 'wish', 'abandoned']
const MEDIA_FILTERS: MediaFilter[] = ['all', 'movie', 'series', 'episode']

/** 本周按最近 7 天计算（含今天），比自然周更符合观影记录习惯 */
function isRecent(dateString: string): boolean {
  if (!dateString) return false
  const date = new Date(`${dateString}T00:00:00`)
  if (Number.isNaN(date.getTime())) return false
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const diff = today.getTime() - date.getTime()
  return diff >= 0 && diff < 7 * 24 * 60 * 60 * 1000
}

export default function TimelinePage({
  onOpen,
  onNew,
}: {
  onOpen: (record: WatchRecord) => void
  onNew: () => void
}) {
  const data = useSyncExternalStore(subscribe, getSnapshot)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [mediaFilter, setMediaFilter] = useState<MediaFilter>('all')
  const [sortBy, setSortBy] = useState<SortBy>('date')

  const records = useMemo(
    () => [...data.records].sort((a, b) => {
      const aDate = a.watchedAt || a.createdAt.slice(0, 10)
      const bDate = b.watchedAt || b.createdAt.slice(0, 10)
      return bDate.localeCompare(aDate)
    }),
    [data.records],
  )

  const visibleRecords = useMemo(() => {
    const filtered = records.filter((record) => {
      if (statusFilter !== 'all' && record.status !== statusFilter) return false
      if (mediaFilter !== 'all' && record.mediaType !== mediaFilter) return false
      return true
    })
    if (sortBy === 'score') {
      return [...filtered].sort((a, b) => {
        if (b.overall !== a.overall) return b.overall - a.overall
        const aDate = a.watchedAt || a.createdAt.slice(0, 10)
        const bDate = b.watchedAt || b.createdAt.slice(0, 10)
        return bDate.localeCompare(aDate)
      })
    }
    return filtered
  }, [records, statusFilter, mediaFilter, sortBy])

  const week = records.filter((record) => isRecent(record.watchedAt))
  const scored = week.filter((record) => record.overall > 0)
  const average = scored.length
    ? (scored.reduce((sum, record) => sum + record.overall, 0) / scored.length).toFixed(1)
    : '—'

  return (
    <main className="page">
      <header className="app-header">
        <div className="brand serif">观影手账</div>
        <div className="brand-sub">FILM JOURNAL</div>
      </header>

      <div className="week-summary">
        <span>本周 <b>{week.length}</b> 部</span>
        <span className="dot">·</span>
        <span>平均 <b>{average}</b> 分</span>
      </div>

      <div className="section-label">最近看过</div>
      <PosterStrip records={records.slice(0, 8)} onSelect={onOpen} />

      <div className="section-label">时间线</div>

      <div className="filter-bar">
        <div className="filter-row">
          <span className="filter-label">状态</span>
          <div className="filter-chips">
            {STATUS_FILTERS.map((value) => (
              <button
                type="button"
                key={value}
                className={`filter-chip${statusFilter === value ? ' active' : ''}`}
                onClick={() => setStatusFilter(value)}
              >
                {value === 'all' ? '全部' : STATUS_LABEL[value]}
              </button>
            ))}
          </div>
        </div>
        <div className="filter-row">
          <span className="filter-label">类型</span>
          <div className="filter-chips">
            {MEDIA_FILTERS.map((value) => (
              <button
                type="button"
                key={value}
                className={`filter-chip${mediaFilter === value ? ' active' : ''}`}
                onClick={() => setMediaFilter(value)}
              >
                {value === 'all' ? '全部' : MEDIA_LABEL[value]}
              </button>
            ))}
          </div>
        </div>
        <div className="filter-row filter-sort-row">
          <span className="filter-label">排序</span>
          <div className="filter-chips">
            <button type="button" className={`filter-chip${sortBy === 'date' ? ' active' : ''}`} onClick={() => setSortBy('date')}>按日期</button>
            <button type="button" className={`filter-chip${sortBy === 'score' ? ' active' : ''}`} onClick={() => setSortBy('score')}>按评分</button>
          </div>
          <span className="filter-count">{visibleRecords.length} 条</span>
        </div>
      </div>

      {visibleRecords.length === 0 ? (
        <div className="empty-state">
          {records.length === 0 ? (
            <>还没有记录。<button type="button" className="ghost-button" onClick={onNew}>新增第一条</button></>
          ) : (
            <>没有符合筛选条件的记录。<button type="button" className="ghost-button" onClick={() => { setStatusFilter('all'); setMediaFilter('all') }}>清除筛选</button></>
          )}
        </div>
      ) : (
        <div className="record-list">
          {visibleRecords.map((record) => (
            <RecordCard key={record.id} record={record} onClick={onOpen} />
          ))}
          <div className="list-end">— 到底了 —</div>
        </div>
      )}
    </main>
  )
}
