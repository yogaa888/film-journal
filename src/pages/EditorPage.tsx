import { useState, type ReactNode } from 'react'
import ScoreBar from '../components/ScoreBar'
import { calcOverall, SCORE_DIMENSIONS } from '../config/scoring'
import { placeholderPoster } from '../data/seed'
import { getById, remove, upsert } from '../data/store'
import {
  MEDIA_LABEL,
  STATUS_LABEL,
  type MediaType,
  type Scores,
  type WatchRecord,
  type WatchStatus,
} from '../types/record'

const EMPTY_SCORES: Scores = { plot: 0, acting: 0, visuals: 0, impact: 0, rewatch: 0 }
const MEDIA_TYPES: MediaType[] = ['movie', 'series', 'episode']
const STATUSES: WatchStatus[] = ['wish', 'watching', 'watched', 'abandoned']

function today(): string {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function parseList(text: string): string[] {
  return text.split(/[,，、]/).map((item) => item.trim()).filter(Boolean)
}

function draftFor(id?: string | null): WatchRecord | null {
  if (id) {
    const found = getById(id)
    return found ? { ...found } : null
  }
  return {
    id: '',
    title: '',
    originalTitle: '',
    year: null,
    mediaType: 'movie',
    seriesName: '',
    season: null,
    episode: null,
    director: '',
    cast: [],
    posterUrl: '',
    status: 'watched',
    watchedAt: today(),
    abandonEpisode: null,
    abandonReason: '',
    scores: { ...EMPTY_SCORES },
    overall: 0,
    shortReview: '',
    longReview: '',
    tags: [],
    createdAt: '',
    updatedAt: '',
  }
}

function Field({
  label,
  required,
  hint,
  invalid,
  children,
}: {
  label: string
  required?: boolean
  hint?: string
  invalid?: boolean
  children: ReactNode
}) {
  return (
    <div className={`field${invalid ? ' has-error' : ''}`}>
      <div className="field-label">{label}{required && <span className="field-required">*</span>}</div>
      {children}
      {hint && <div className="field-hint">{hint}</div>}
    </div>
  )
}

function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
}) {
  return (
    <div className="segmented">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={option.value === value ? 'is-active' : ''}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

export default function EditorPage({
  id,
  onDone,
  onCancel,
}: {
  id?: string | null
  onDone: (message: string) => void
  onCancel: () => void
}) {
  const [draft, setDraft] = useState<WatchRecord | null>(() => draftFor(id))
  const [castText, setCastText] = useState(() => draft?.cast.join('、') ?? '')
  const [tagsText, setTagsText] = useState(() => draft?.tags.join('、') ?? '')
  const [error, setError] = useState('')
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  if (!draft) {
    return (
      <div className="editor-page">
        <header className="editor-header">
          <button type="button" className="back-button" onClick={onCancel}>‹ 返回</button>
        </header>
        <div className="empty-state">这条记录不存在或已被删除。</div>
        <div className="editor-body">
          <button type="button" className="ghost-button" onClick={onCancel}>回到时间线</button>
        </div>
      </div>
    )
  }

  const isEdit = Boolean(id)
  const overall = calcOverall(draft.scores)
  const isSeries = draft.mediaType !== 'movie'

  function patch<K extends keyof WatchRecord>(key: K, value: WatchRecord[K]) {
    setError('')
    setDraft((prev) => (prev ? { ...prev, [key]: value } : prev))
  }

  function setScore(key: keyof Scores, value: number) {
    setError('')
    setDraft((prev) => (prev ? { ...prev, scores: { ...prev.scores, [key]: value } } : prev))
  }

  function handleSave() {
    if (!draft) return
    if (!draft.title.trim()) {
      setError('标题不能为空。')
      return
    }
    if (draft.status === 'abandoned') {
      if (!draft.abandonEpisode || draft.abandonEpisode < 1) {
        setError('弃剧记录必须填写「第几集弃」。')
        return
      }
      if (!draft.abandonReason.trim()) {
        setError('弃剧记录必须填写「弃剧原因」。')
        return
      }
    }
    upsert({
      ...draft,
      title: draft.title.trim(),
      cast: parseList(castText),
      tags: parseList(tagsText),
      posterUrl: draft.posterUrl.trim() || placeholderPoster(draft.title.trim(), draft.year, 'amber'),
      overall: calcOverall(draft.scores),
    })
    onDone('已保存')
  }

  function handleDelete() {
    if (!id) return
    if (!confirmingDelete) {
      setConfirmingDelete(true)
      return
    }
    remove(id)
    onDone('已删除')
  }

  return (
    <div className="editor-page">
      <header className="editor-header">
        <button type="button" className="back-button" onClick={onCancel}>‹ 返回</button>
        <span className="serif">{isEdit ? '编辑记录' : '新增记录'}</span>
      </header>

      {error && <div className="form-error" role="alert">{error}</div>}

      <div className="editor-body">
        <section className="form-group">
          <div className="form-group-title">基本信息</div>
          <Field label="类型">
            <Segmented
              value={draft.mediaType}
              options={MEDIA_TYPES.map((type) => ({ value: type, label: MEDIA_LABEL[type] }))}
              onChange={(value) => patch('mediaType', value)}
            />
          </Field>
          <Field label="标题" required invalid={error.includes('标题')}>
            <input type="text" value={draft.title} onChange={(event) => patch('title', event.target.value)} placeholder="片名或剧名" />
          </Field>
          <Field label="原名">
            <input type="text" value={draft.originalTitle} onChange={(event) => patch('originalTitle', event.target.value)} placeholder="Original title" />
          </Field>
          <Field label="年份">
            <input type="number" value={draft.year ?? ''} onChange={(event) => patch('year', event.target.value ? Number(event.target.value) : null)} placeholder="2026" />
          </Field>
          {isSeries && (
            <>
              <Field label="所属剧名">
                <input type="text" value={draft.seriesName} onChange={(event) => patch('seriesName', event.target.value)} placeholder="例如：黑镜" />
              </Field>
              <div className="field-row">
                <Field label="季号">
                  <input type="number" value={draft.season ?? ''} onChange={(event) => patch('season', event.target.value ? Number(event.target.value) : null)} placeholder="1" />
                </Field>
                <Field label="集号">
                  <input type="number" value={draft.episode ?? ''} onChange={(event) => patch('episode', event.target.value ? Number(event.target.value) : null)} placeholder="1" />
                </Field>
              </div>
            </>
          )}
          <Field label="导演">
            <input type="text" value={draft.director} onChange={(event) => patch('director', event.target.value)} placeholder="导演姓名" />
          </Field>
          <Field label="演员" hint="多个名字用逗号或顿号隔开">
            <input type="text" value={castText} onChange={(event) => setCastText(event.target.value)} placeholder="主演一、主演二" />
          </Field>
          <Field
            label="海报地址"
            hint={draft.posterUrl.startsWith('data:') ? '当前是本地占位海报，点击输入框可更换' : '留空会自动生成一张本地占位海报'}
          >
            <div className="poster-input-row">
              <input
                type="text"
                value={draft.posterUrl.startsWith('data:') ? '本地占位海报' : draft.posterUrl}
                onFocus={() => { if (draft.posterUrl.startsWith('data:')) patch('posterUrl', '') }}
                onChange={(event) => patch('posterUrl', event.target.value)}
                placeholder="图片 URL"
              />
              <button type="button" className="inline-button" onClick={() => patch('posterUrl', '')}>清除</button>
            </div>
          </Field>
        </section>

        <section className="form-group">
          <div className="form-group-title">观看信息</div>
          <Field label="状态">
            <Segmented
              value={draft.status}
              options={STATUSES.map((status) => ({ value: status, label: STATUS_LABEL[status] }))}
              onChange={(value) => patch('status', value)}
            />
          </Field>
          <Field label="观看日期">
            <input type="date" value={draft.watchedAt} onChange={(event) => patch('watchedAt', event.target.value)} />
          </Field>
          {draft.status === 'abandoned' && (
            <>
              <Field label="第几集弃" required invalid={error.includes('第几集弃')}>
                <input type="number" value={draft.abandonEpisode ?? ''} onChange={(event) => patch('abandonEpisode', event.target.value ? Number(event.target.value) : null)} placeholder="1" />
              </Field>
              <Field label="弃剧原因" required invalid={error.includes('弃剧原因')}>
                <textarea value={draft.abandonReason} onChange={(event) => patch('abandonReason', event.target.value)} placeholder="为什么没看下去" />
              </Field>
            </>
          )}
        </section>

        <section className="form-group">
          <div className="form-group-title">五维评分</div>
          <div className="score-input-list">
            {SCORE_DIMENSIONS.map(({ key, label }) => {
              const value = draft.scores[key] || 0
              return (
                <div className="score-input-row" key={key}>
                  <span className="score-input-label">{label}</span>
                  <div className="score-segments">
                    {[1, 2, 3, 4, 5].map((point) => (
                      <button
                        key={point}
                        type="button"
                        className={`score-segment${value >= point ? ' is-on' : ''}`}
                        onClick={() => setScore(key, point)}
                        aria-label={`${label} ${point} 分`}
                        title={`${point} 分`}
                      />
                    ))}
                  </div>
                  <span className="score-input-value">{value || '—'}</span>
                </div>
              )
            })}
          </div>
          <div className="score-preview">
            <ScoreBar scores={draft.scores} compact />
            <div className="score-preview-total">
              <span>综合分 · 自动计算</span>
              <strong className="serif">{overall > 0 ? overall.toFixed(1) : '—'}</strong>
            </div>
          </div>
        </section>

        <section className="form-group">
          <div className="form-group-title">文字</div>
          <Field label="一句话短评">
            <input type="text" value={draft.shortReview} onChange={(event) => patch('shortReview', event.target.value)} placeholder="随口一句就够" />
          </Field>
          <Field label="长评">
            <textarea value={draft.longReview} onChange={(event) => patch('longReview', event.target.value)} placeholder="想多说几句的时候写在这里" />
          </Field>
          <Field label="标签" hint="多个标签用逗号或顿号隔开">
            <input type="text" value={tagsText} onChange={(event) => setTagsText(event.target.value)} placeholder="文艺、科幻、治愈" />
          </Field>
        </section>
      </div>

      <div className="editor-actions">
        <button type="button" className="primary-button" onClick={handleSave}>保存记录</button>
        {isEdit && (
          <button type="button" className="danger-button" onClick={handleDelete}>
            {confirmingDelete ? '确认删除？' : '删除'}
          </button>
        )}
      </div>
    </div>
  )
}
