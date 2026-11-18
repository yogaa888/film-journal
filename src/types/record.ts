export type MediaType = 'movie' | 'series' | 'episode'
export type WatchStatus = 'wish' | 'watching' | 'watched' | 'abandoned'

export interface Scores {
  plot: number
  acting: number
  visuals: number
  impact: number
  rewatch: number
}

/** 单条观影记录：所有字段集中定义，数据层之外的代码只读这个类型 */
export interface WatchRecord {
  id: string
  title: string
  originalTitle: string
  year: number | null
  mediaType: MediaType
  seriesName: string
  season: number | null
  episode: number | null
  director: string
  cast: string[]
  posterUrl: string
  status: WatchStatus
  watchedAt: string
  abandonEpisode: number | null
  abandonReason: string
  scores: Scores
  overall: number
  shortReview: string
  longReview: string
  tags: string[]
  createdAt: string
  updatedAt: string
}

export interface Playlist {
  id: string
  name: string
  recordIds: string[]
  createdAt: string
  updatedAt: string
}

export interface JournalData {
  version: number
  records: WatchRecord[]
  playlists: Playlist[]
}

export const STATUS_LABEL: Record<WatchStatus, string> = {
  wish: '想看',
  watching: '在看',
  watched: '看过',
  abandoned: '弃剧',
}

export const MEDIA_LABEL: Record<MediaType, string> = {
  movie: '电影',
  series: '剧集',
  episode: '单集',
}
