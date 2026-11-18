import { useMemo, useState, useSyncExternalStore } from 'react'
import RecordCard from '../components/RecordCard'
import { getSnapshot, subscribe } from '../data/store'

type Mode = 'keyword' | 'natural'

export default function SearchPage({ onOpen }: { onOpen: (id: string) => void }) {
  const data = useSyncExternalStore(subscribe, getSnapshot)
  const [mode, setMode] = useState<Mode>('keyword')
  const [query, setQuery] = useState('')

  const results = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    if (!keyword) return []
    return [...data.records]
      .filter((record) => {
        const fields = [
          record.title,
          record.originalTitle,
          record.seriesName,
          record.director,
          ...record.cast,
          ...record.tags,
          record.shortReview,
          record.longReview,
        ]
        return fields.some((field) => field.toLowerCase().includes(keyword))
      })
      .sort((a, b) => (b.watchedAt || b.createdAt).localeCompare(a.watchedAt || a.createdAt))
  }, [data.records, query])

  return (
    <main className="page">
      <header className="app-header">
        <div className="brand serif">搜索</div>
        <div className="brand-sub">SEARCH</div>
      </header>

      <div className="search-modes">
        <button type="button" className={mode === 'keyword' ? 'is-active' : ''} onClick={() => setMode('keyword')}>关键词</button>
        <button type="button" className={mode === 'natural' ? 'is-active' : ''} onClick={() => setMode('natural')}>自然语言</button>
      </div>

      {mode === 'keyword' ? (
        <>
          <div className="search-box">
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="片名、导演、演员、标签或短评"
            />
            {query && <button type="button" onClick={() => setQuery('')} aria-label="清空">×</button>}
          </div>

          {!query.trim() ? (
            <div className="empty-state">输入关键词，搜一搜你记过的片。</div>
          ) : results.length === 0 ? (
            <div className="empty-state">没有匹配的记录。</div>
          ) : (
            <>
              <div className="search-result-count">找到 {results.length} 条</div>
              <div className="record-list search-results">
                {results.map((record) => (
                  <RecordCard key={record.id} record={record} onClick={(item) => onOpen(item.id)} />
                ))}
              </div>
            </>
          )}
        </>
      ) : (
        <div className="search-coming">
          <div className="search-coming-mark">◌</div>
          <p>用一句话搜自己的片库，比如「主角很孤独但结尾治愈的」。</p>
          <p className="search-coming-note">语义搜索属于第二批 AI 能力，会在关键词搜索跑通后接入。</p>
          <button type="button" className="ghost-button" onClick={() => setMode('keyword')}>先用关键词搜索</button>
        </div>
      )}
    </main>
  )
}
