import { SCORE_DIMENSIONS } from '../config/scoring'
import type { Scores } from '../types/record'

const CENTER = 120
const RADIUS = 76

function point(index: number, value: number, radius = RADIUS): [number, number] {
  const angle = -Math.PI / 2 + (index * 2 * Math.PI) / SCORE_DIMENSIONS.length
  const r = (value / 5) * radius
  return [CENTER + r * Math.cos(angle), CENTER + r * Math.sin(angle)]
}

function polygon(values: number[]): string {
  return values.map((value, index) => point(index, value).join(',')).join(' ')
}

export default function RadarChart({ scores }: { scores: Scores }) {
  const values = SCORE_DIMENSIONS.map(({ key }) => scores[key] || 0)
  const hasData = values.some((value) => value > 0)

  return (
    <div className="radar-wrap">
      <svg viewBox="0 0 240 240" className="radar-chart" role="img" aria-label="五维评分雷达图">
        {[1, 2, 3, 4, 5].map((level) => (
          <polygon
            key={level}
            points={polygon(SCORE_DIMENSIONS.map(() => level))}
            fill="none"
            stroke="rgba(237, 232, 225, 0.10)"
            strokeWidth="1"
          />
        ))}
        {SCORE_DIMENSIONS.map((_, index) => {
          const [x, y] = point(index, 5)
          return (
            <line key={index} x1={CENTER} y1={CENTER} x2={x} y2={y} stroke="rgba(237, 232, 225, 0.10)" strokeWidth="1" />
          )
        })}
        {hasData && (
          <>
            <polygon points={polygon(values)} fill="rgba(200, 162, 91, 0.18)" stroke="#C8A25B" strokeWidth="1.5" />
            {values.map((value, index) => {
              const [x, y] = point(index, value)
              return <circle key={index} cx={x} cy={y} r="3" fill="#C8A25B" />
            })}
          </>
        )}
        {SCORE_DIMENSIONS.map(({ label }, index) => {
          const [x, y] = point(index, 5, RADIUS + 22)
          const anchor = x < CENTER - 8 ? 'end' : x > CENTER + 8 ? 'start' : 'middle'
          return (
            <text key={label} x={x} y={y + 4} textAnchor={anchor} fill="#8C8378" fontSize="11">
              {label}
            </text>
          )
        })}
      </svg>
      {!hasData && <div className="radar-empty">还没有评分</div>}
    </div>
  )
}
