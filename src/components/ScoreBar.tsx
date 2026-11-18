import { SCORE_DIMENSIONS } from '../config/scoring'
import type { Scores } from '../types/record'

export default function ScoreBar({
  scores,
  compact = false,
}: {
  scores: Scores
  compact?: boolean
}) {
  return (
    <div className={`score-bars${compact ? ' is-compact' : ''}`}>
      {SCORE_DIMENSIONS.map(({ key, label }) => {
        const value = scores[key] || 0
        return (
          <div className="score-bar-row" key={key}>
            <span className="score-bar-label">{label}</span>
            <span className="score-bar-track">
              <span className="score-bar-fill" style={{ width: `${value * 20}%` }} />
            </span>
            <span className="score-bar-value">{value || '—'}</span>
          </div>
        )
      })}
    </div>
  )
}
