import { calcOverall } from '../config/scoring'
import type { JournalData, Playlist, Scores, WatchRecord } from '../types/record'
import { seedRecords } from './seed'

const STORAGE_KEY = 'film-journal:v1'
const DATA_VERSION = 1

let cache: JournalData | null = null
const listeners = new Set<() => void>()

function createId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function normalizeRecord(input: any): WatchRecord {
  const raw = input?.scores ?? {}
  const scores: Scores = {
    plot: Number(raw.plot) || 0,
    acting: Number(raw.acting) || 0,
    visuals: Number(raw.visuals) || 0,
    impact: Number(raw.impact) || 0,
    rewatch: Number(raw.rewatch) || 0,
  }
  const mediaType = ['movie', 'series', 'episode'].includes(input?.mediaType) ? input.mediaType : 'movie'
  const status = ['wish', 'watching', 'watched', 'abandoned'].includes(input?.status) ? input.status : 'watched'
  return {
    id: String(input?.id ?? createId()),
    title: String(input?.title ?? '未命名'),
    originalTitle: String(input?.originalTitle ?? ''),
    year: input?.year ? Number(input.year) : null,
    mediaType,
    seriesName: String(input?.seriesName ?? ''),
    season: input?.season ? Number(input.season) : null,
    episode: input?.episode ? Number(input.episode) : null,
    director: String(input?.director ?? ''),
    cast: Array.isArray(input?.cast) ? input.cast.map(String) : [],
    posterUrl: String(input?.posterUrl ?? ''),
    status,
    watchedAt: String(input?.watchedAt ?? ''),
    abandonEpisode: input?.abandonEpisode ? Number(input.abandonEpisode) : null,
    abandonReason: String(input?.abandonReason ?? ''),
    scores,
    overall: calcOverall(scores),
    shortReview: String(input?.shortReview ?? ''),
    longReview: String(input?.longReview ?? ''),
    tags: Array.isArray(input?.tags) ? input.tags.map(String) : [],
    createdAt: String(input?.createdAt ?? new Date().toISOString()),
    updatedAt: String(input?.updatedAt ?? new Date().toISOString()),
  }
}

function read(): JournalData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed && Array.isArray(parsed.records)) {
        return {
          version: DATA_VERSION,
          records: parsed.records.map(normalizeRecord),
          playlists: Array.isArray(parsed.playlists) ? parsed.playlists : [],
        }
      }
    }
  } catch {
    // 数据损坏时回退到示例数据，不让界面白屏
  }
  const seeded: JournalData = { version: DATA_VERSION, records: seedRecords(), playlists: [] }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded))
  } catch {
    // 隐私模式下可能写不进去，内存里仍可用
  }
  return seeded
}

function commit(next: JournalData): void {
  cache = next
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    throw new Error('本地存储写入失败，请检查浏览器存储空间')
  }
  listeners.forEach((listener) => listener())
}

/** React 用 useSyncExternalStore 订阅，所有读写都经过这里 */
export function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getSnapshot(): JournalData {
  if (cache === null) cache = read()
  return cache
}

export function listRecords(): WatchRecord[] {
  return getSnapshot().records
}

export function getById(id: string): WatchRecord | undefined {
  return getSnapshot().records.find((record) => record.id === id)
}

export function upsert(input: Partial<WatchRecord>): WatchRecord {
  const data = getSnapshot()
  const id = input.id || createId()
  const existing = data.records.find((record) => record.id === id)
  const now = new Date().toISOString()
  const next = normalizeRecord({
    ...(existing ?? {}),
    ...input,
    id,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  })
  commit({
    ...data,
    records: existing ? data.records.map((record) => (record.id === id ? next : record)) : [next, ...data.records],
  })
  return next
}

export function remove(id: string): void {
  const data = getSnapshot()
  commit({ ...data, records: data.records.filter((record) => record.id !== id) })
}

export function exportJSON(): string {
  return JSON.stringify({ ...getSnapshot(), exportedAt: new Date().toISOString() }, null, 2)
}

export function importJSON(text: string): { added: number; skipped: number; playlistsAdded: number } {
  const parsed = JSON.parse(text)
  const incoming = Array.isArray(parsed) ? parsed : parsed?.records
  if (!Array.isArray(incoming)) throw new Error('文件里找不到记录数组')
  const data = getSnapshot()
  const now = new Date().toISOString()
  const newRecords: WatchRecord[] = []
  let skipped = 0

  for (const item of incoming) {
    if (!item || typeof item !== 'object' || !String(item.title ?? '').trim()) {
      skipped += 1
      continue
    }
    const record = normalizeRecord({ ...item, id: createId(), createdAt: now, updatedAt: now })
    if (record.status === 'abandoned' && (!record.abandonEpisode || !record.abandonReason)) {
      skipped += 1
      continue
    }
    newRecords.push(record)
  }

  const incomingPlaylists = Array.isArray(parsed?.playlists) ? parsed.playlists : []
  const newPlaylists: Playlist[] = incomingPlaylists.map((playlist: any) => ({
    id: createId(),
    name: String(playlist?.name ?? '未命名片单'),
    recordIds: Array.isArray(playlist?.recordIds) ? playlist.recordIds.map(String) : [],
    createdAt: now,
    updatedAt: now,
  }))

  commit({
    ...data,
    records: [...newRecords, ...data.records],
    playlists: [...newPlaylists, ...data.playlists],
  })
  return { added: newRecords.length, skipped, playlistsAdded: newPlaylists.length }
}

export function listPlaylists(): Playlist[] {
  return getSnapshot().playlists
}

export function upsertPlaylist(input: Partial<Playlist> & { name: string }): Playlist {
  const data = getSnapshot()
  const id = input.id || createId()
  const existing = data.playlists.find((playlist) => playlist.id === id)
  const now = new Date().toISOString()
  const next: Playlist = {
    id,
    name: input.name,
    recordIds: input.recordIds ?? existing?.recordIds ?? [],
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  }
  commit({
    ...data,
    playlists: existing
      ? data.playlists.map((playlist) => (playlist.id === id ? next : playlist))
      : [...data.playlists, next],
  })
  return next
}

export function removePlaylist(id: string): void {
  const data = getSnapshot()
  commit({ ...data, playlists: data.playlists.filter((playlist) => playlist.id !== id) })
}

/** 调试用：恢复到首次进入的 3 条示例 */
export function resetToSeed(): void {
  commit({ version: DATA_VERSION, records: seedRecords(), playlists: [] })
}
