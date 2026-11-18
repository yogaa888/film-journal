import { useSyncExternalStore } from 'react'
import RadarChart from '../components/RadarChart'
import ScoreBar from '../components/ScoreBar'
import { calcOverall } from '../config/scoring'
import { placeholderPoster } from '../data/seed'
import { getSnapshot, subscribe } from '../data/store'
import { MEDIA_LABEL, STATUS_LABEL, type WatchRecord } from '../types/record'

function occurrence(record: WatchRecord): string {
  if (record.mediaType === 'movie') return MEDIA_LABEL.movie
  return `${record.seriesName || record.title} · 第 ${record.season ?? '-'} 季第 ${record.episode ?? '-'} 集`
}

function relationOf(base: WatchRecord, other: WatchRecord): string {
  if (base.director && other.director === base.director) return `同导演 · ${base.director}`
  const shared = base.cast.find((name) => name && other.cast.includes(name))
  return shared ? `同演员 · ${shared}` : ''
}

export default function DetailPage({
  id,
  onBack,
  onEdit,
  onSelect,
}: {
  id: string
  onBack: () => void
  onEdit: () => void
  onSelect: (id: string) => void
}) {
  const data = useSyncExternalStore(subscribe, getSnapshot)
  const record = data.records.find((item) => item.id === id)

  if (!record) {
    return (
      <div className="detail-page">
        <header className="editor-header">
          <button type="button" className="back-button" onClick={onBack}>‹ 返回</button>
        </header>
        <div className="empty-state">这条记录不存在或已被删除。</div>
      </div>
    )
  }

  const related = data.records
    .filter((item) => item.id !== record.id && Boolean(relationOf(record, item)))
    .map((item) => ({ record: item, relation: relationOf(record, item) }))
  const overall = calcOverall(record.scores)

  return (
    <div className="detail-page">
      <div className="detail-hero">
        <img src={record.posterUrl || placeholderPoster(record.title, record.year, 'amber')} alt="" />
        <div className="detail-hero-fade" />
        <button type="button" className="detail-back" onClick={onBack}>‹ 返回</button>
        <div className="detail-hero-title">
          <h1 className="serif">{record.title}</h1>
          {record.originalTitle && <div className="detail-original">{record.originalTitle}</div>}
        </div>
      </div>

      <div className="detail-body">
        <div className="detail-facts">
          <span className={`status-badge status-${record.status}`}>{STATUS_LABEL[record.status]}</span>
          <span>{record.year ?? '年份未知'}</span>
          <span>{occurrence(record)}</span>
          <span>{record.watchedAt || '未记日期'}</span>
          {record.director && <span>导演 {record.director}</span>}
          {record.cast.length > 0 && <span>主演 {record.cast.join(' / ')}</span>}
        </div>

        {record.status === 'abandoned' && (
          <div className="detail-abandon">
            <strong>第 {record.abandonEpisode ?? '-'} 集弃</strong>
            <span>{record.abandonReason || '没有写原因'}</span>
          </div>
        )}

        <section className="detail-section">
          <div className="detail-section-title">观感评分</div>
          <RadarChart scores={record.scores} />
          <div className="detail-score-bottom">
            <ScoreBar scores={record.scores} />
            <div className="detail-overall">
              <span>综合分 · 自动计算</span>
              <strong className="serif">{overall > 0 ? overall.toFixed(1) : '—'}</strong>
            </div>
          </div>
        </section>

        <section className="detail-section">
          <div className="detail-section-title">短评</div>
          {record.shortReview ? (
            <div className="detail-quote">{record.shortReview}</div>
          ) : (
            <div className="detail-empty-text">还没写短评。</div>
          )}
        </section>

        <section className="detail-section">
          <div className="detail-section-title">长评</div>
          {record.longReview ? (
            <div className="detail-long">{record.longReview}</div>
          ) : (
            <div className="detail-empty-text">还没写长评。</div>
          )}
        </section>

        {record.tags.length > 0 && (
          <section className="detail-section">
            <div className="detail-section-title">标签</div>
            <div className="detail-tags">
              {record.tags.map((tag) => <span className="detail-tag" key={tag}>{tag}</span>)}
            </div>
          </section>
        )}

        <section className="detail-section">
          <div className="detail-section-title">同导演或同演员</div>
          {related.length === 0 ? (
            <div className="detail-empty-text">暂时没有关联的其他记录。</div>
          ) : (
            <div className="related-list">
              {related.map(({ record: item, relation }) => (
                <button key={item.id} type="button" className="related-item" onClick={() => onSelect(item.id)}>
                  <img src={item.posterUrl || placeholderPoster(item.title, item.year, 'amber')} alt="" />
                  <span className="related-info">
                    <span className="related-title serif">{item.title}</span>
                    <span className="related-reason">{relation}</span>
                    <span className="related-meta">{item.overall > 0 ? `${item.overall.toFixed(1)} 分` : '未评分'} · {item.watchedAt}</span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>

      <div className="detail-actions">
        <button type="button" className="primary-button" onClick={onEdit}>编辑这条记录</button>
      </div>
    </div>
  )
}
