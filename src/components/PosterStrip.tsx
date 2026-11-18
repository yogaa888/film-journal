import { placeholderPoster } from '../data/seed'
import type { WatchRecord } from '../types/record'

const FALLBACK = placeholderPoster('未命名', null, 'amber')

export default function PosterStrip({
  records,
  onSelect,
}: {
  records: WatchRecord[]
  onSelect: (record: WatchRecord) => void
}) {
  if (records.length === 0) {
    return <div className="empty-inline">暂无海报，记录一部片试试。</div>
  }

  return (
    <div className="poster-strip">
      {records.map((record) => (
        <button key={record.id} type="button" className="poster-item" onClick={() => onSelect(record)}>
          <img src={record.posterUrl || FALLBACK} alt={record.title} loading="lazy" />
          <span className="poster-caption">{record.title}</span>
        </button>
      ))}
    </div>
  )
}
