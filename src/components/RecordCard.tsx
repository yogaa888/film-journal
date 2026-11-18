import { placeholderPoster } from '../data/seed'
import { MEDIA_LABEL, STATUS_LABEL, type WatchRecord } from '../types/record'

const FALLBACK = placeholderPoster('未命名', null, 'amber')

function subtitle(record: WatchRecord): string {
  const base = record.mediaType === 'movie'
    ? MEDIA_LABEL.movie
    : `${record.seriesName || record.title} S${record.season ?? '-'}E${record.episode ?? '-'}`
  return record.year ? `${base} · ${record.year}` : base
}

export default function RecordCard({
  record,
  onClick,
}: {
  record: WatchRecord
  onClick: (record: WatchRecord) => void
}) {
  return (
    <button type="button" className="record-card" onClick={() => onClick(record)}>
      <img className="record-poster" src={record.posterUrl || FALLBACK} alt="" loading="lazy" />
      <span className="record-body">
        <span className="record-top">
          <span className="record-title serif">{record.title}</span>
          <span className={`status-badge status-${record.status}`}>{STATUS_LABEL[record.status]}</span>
        </span>
        <span className="record-meta">{subtitle(record)}</span>
        {record.shortReview && <span className="record-review">{record.shortReview}</span>}
        <span className="record-foot">
          <span className="record-date">{record.watchedAt || '未记日期'}</span>
          <span className="record-score">{record.overall > 0 ? record.overall.toFixed(1) : '—'}<small> 分</small></span>
        </span>
      </span>
    </button>
  )
}
