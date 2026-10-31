import { useState } from 'react'
import type { MouseEvent } from 'react'
import { cx } from '../common/cx'
import { CHART_H, CHART_W, RANGES, chartOf } from './investChartLogic'
import type { RangeKey } from './investChartLogic'
import type { PkgView } from './investPkgLogic'
import styles from './InvestPkgChart.module.css'

interface Props {
  className?: string
  pkg: PkgView
  range: RangeKey
  onRange: (r: RangeKey) => void
}

// 패키지 수익률 — 기간 버튼, 세로축 3칸, 선, 가로축 날짜, 마우스 올림 표시
export function InvestPkgChart({ className, pkg, range, onRange }: Props) {
  const [idx, setIdx] = useState<number | null>(null)
  const ch = chartOf(pkg, range)
  const hi = idx != null && idx < ch.count ? idx : null
  const tip = hi != null ? ch.at(hi) : null

  const move = (e: MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    const i = Math.round(((e.clientX - r.left) / r.width) * (ch.count - 1))
    setIdx(Math.max(0, Math.min(ch.count - 1, i)))
  }

  return (
    <div className={cx(styles.box, className)}>
      <div className={styles.head}>
        <span className={styles.title}>패키지 수익률</span>
        <span className={styles.ranges}>
          {RANGES.map(([k, label], i) => (
            <span key={k} className={styles.rangeItem}>
              {i > 0 && <span className={styles.sep}>·</span>}
              <button
                type="button"
                className={cx(styles.range, range === k && styles.on)}
                onClick={() => {
                  onRange(k)
                  setIdx(null)
                }}
              >
                {label}
              </button>
            </span>
          ))}
        </span>
      </div>
      <div className={styles.plot}>
        <div className={styles.yAxis}>
          <span className={styles.yTop}>{ch.yTop}</span>
          <span className={styles.yMid}>{ch.yMid}</span>
          <span className={styles.yBot}>{ch.yBot}</span>
        </div>
        <div className={styles.area} onMouseMove={move} onMouseLeave={() => setIdx(null)}>
          <div className={styles.midLine} />
          <svg viewBox={`0 0 ${CHART_W} ${CHART_H}`} preserveAspectRatio="none" className={styles.svg} aria-hidden="true">
            <line x1="0" x2={CHART_W} y1={ch.y0} y2={ch.y0} className={styles.zero} vectorEffect="non-scaling-stroke" />
            <polyline points={ch.pts} className={styles.line} vectorEffect="non-scaling-stroke" />
          </svg>
          {tip && (
            <>
              <div className={styles.guide} style={{ left: tip.x }} />
              <div className={styles.dot} style={{ left: tip.x, top: tip.y }} />
              <div className={styles.tip} style={{ left: tip.x, transform: `translateX(${tip.shift})` }}>
                {tip.date} · <b className={styles.tipVal}>{tip.val}</b>
              </div>
            </>
          )}
        </div>
        <div />
        <div className={styles.xAxis}>
          {ch.xs.map((x) => (
            <span key={x.left + x.label} className={styles.xLabel} style={{ left: x.left, transform: `translateX(${x.shift})` }}>
              {x.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
