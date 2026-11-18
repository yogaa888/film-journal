import type { Scores } from '../types/record'

export const SCORE_DIMENSIONS = [
  { key: 'plot', label: '剧情' },
  { key: 'acting', label: '表演' },
  { key: 'visuals', label: '画面' },
  { key: 'impact', label: '后劲' },
  { key: 'rewatch', label: '重看意愿' },
] as const

/** 想调整综合分权重，只改这里。默认五维等权。 */
export const SCORE_WEIGHTS: Record<keyof Scores, number> = {
  plot: 1,
  acting: 1,
  visuals: 1,
  impact: 1,
  rewatch: 1,
}

export function calcOverall(scores: Scores): number {
  const keys = Object.keys(SCORE_WEIGHTS) as (keyof Scores)[]
  let sum = 0
  let weight = 0
  for (const key of keys) {
    const value = Number(scores[key])
    if (Number.isFinite(value) && value > 0) {
      sum += value * SCORE_WEIGHTS[key]
      weight += SCORE_WEIGHTS[key]
    }
  }
  return weight === 0 ? 0 : Math.round((sum / weight) * 10) / 10
}
