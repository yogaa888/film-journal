import { calcOverall } from '../config/scoring'
import type { Scores, WatchRecord } from '../types/record'

type Tone = 'amber' | 'slate' | 'rust'

const PALETTES: Record<Tone, [string, string]> = {
  amber: ['#2A2118', '#C8A25B'],
  slate: ['#1B232A', '#9FB4C4'],
  rust: ['#2A1A16', '#C4785B'],
}

/** 生成本地占位海报，不依赖外站、不抓豆瓣 */
export function placeholderPoster(title: string, year: number | null, tone: Tone = 'amber'): string {
  const [bg, accent] = PALETTES[tone]
  const safe = title.replace(/[<>&"']/g, '').slice(0, 8)
  const yearText = year ? String(year) : ''
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="600" viewBox="0 0 400 600">
  <rect width="400" height="600" fill="${bg}"/>
  <rect x="16" y="16" width="368" height="568" fill="none" stroke="${accent}" stroke-opacity="0.28"/>
  <line x1="56" y1="132" x2="344" y2="132" stroke="${accent}" stroke-opacity="0.45"/>
  <text x="200" y="306" text-anchor="middle" fill="#EDE8E1" font-family="Georgia, 'Songti SC', serif" font-size="40" letter-spacing="3">${safe}</text>
  <text x="200" y="358" text-anchor="middle" fill="${accent}" font-family="Georgia, serif" font-size="17" letter-spacing="5">${yearText}</text>
  <line x1="160" y1="468" x2="240" y2="468" stroke="${accent}" stroke-opacity="0.45"/>
  <text x="200" y="540" text-anchor="middle" fill="#EDE8E1" fill-opacity="0.3" font-family="Arial, sans-serif" font-size="11" letter-spacing="4">FILM JOURNAL</text>
</svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

function score(plot: number, acting: number, visuals: number, impact: number, rewatch: number): Scores {
  return { plot, acting, visuals, impact, rewatch }
}

function item(
  base: Pick<WatchRecord, 'id' | 'title' | 'mediaType' | 'watchedAt' | 'scores'>,
  rest: Partial<WatchRecord>,
): WatchRecord {
  const now = '2026-11-16T09:00:00.000Z'
  return {
    originalTitle: '',
    year: null,
    seriesName: '',
    season: null,
    episode: null,
    director: '',
    cast: [],
    posterUrl: '',
    status: 'watched',
    abandonEpisode: null,
    abandonReason: '',
    shortReview: '',
    longReview: '',
    tags: [],
    createdAt: now,
    updatedAt: now,
    ...rest,
    ...base,
    overall: calcOverall(base.scores),
  }
}

/** 首次进入写入 3 条示例：电影 / 剧 / 单集弃剧，覆盖三粒度和状态 */
export function seedRecords(): WatchRecord[] {
  return [
    item(
      { id: 'seed-movie', title: '花样年华', mediaType: 'movie', watchedAt: '2026-11-16', scores: score(5, 5, 5, 5, 4) },
      {
        originalTitle: 'In the Mood for Love',
        year: 2000,
        director: '王家卫',
        cast: ['梁朝伟', '张曼玉'],
        posterUrl: placeholderPoster('花样年华', 2000, 'amber'),
        shortReview: '那些没说出口的话，都留在了走廊的灯里。',
        tags: ['爱情', '文艺'],
      },
    ),
    item(
      { id: 'seed-series', title: '人生切割术', mediaType: 'series', watchedAt: '2026-11-14', scores: score(4, 4, 4, 5, 4) },
      {
        originalTitle: 'Severance',
        year: 2022,
        seriesName: '人生切割术',
        season: 2,
        episode: 3,
        director: '本·斯蒂勒',
        cast: ['亚当·斯科特', '布丽特·洛威尔'],
        posterUrl: placeholderPoster('人生切割术', 2022, 'slate'),
        status: 'watching',
        shortReview: '电梯门一关，我就跟着失忆了。',
        tags: ['科幻', '悬疑'],
      },
    ),
    item(
      { id: 'seed-episode', title: '黑镜：急转直下', mediaType: 'episode', watchedAt: '2026-11-11', scores: score(3, 3, 3, 2, 1) },
      {
        originalTitle: 'Nosedive',
        year: 2016,
        seriesName: '黑镜',
        season: 3,
        episode: 1,
        director: '乔·怀特',
        cast: ['布莱丝·达拉斯·霍华德'],
        posterUrl: placeholderPoster('黑镜', 2016, 'rust'),
        status: 'abandoned',
        abandonEpisode: 1,
        abandonReason: '社交评分的设定太用力，看到一半就腻了。',
        shortReview: '点子好，执行太满。',
        tags: ['科幻', '讽刺'],
      },
    ),
  ]
}
