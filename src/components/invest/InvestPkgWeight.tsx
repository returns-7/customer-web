import { cx } from '../common/cx'
import { weightRowsOf } from './investChartLogic'
import type { PkgView } from './investPkgLogic'
import styles from './InvestPkgWeight.module.css'

interface Props {
  className?: string
  pkg: PkgView
  hov: string | null // 마우스를 올린 종목 코드(조각·줄이 함께 강조됨)
  onHov: (code: string | null) => void
}

const R = 68
const CIRC = 2 * Math.PI * R

// 종목 비중 — 도넛(가운데 종목 수)과 종목별 줄(지금 비중 / 목표 비중)
export function InvestPkgWeight({ className, pkg, hov, onHov }: Props) {
  const rows = weightRowsOf(pkg)
  const n = rows.length
  const segs = rows.map((r, i) => ({
    row: r,
    len: r.frac * CIRC,
    off: -rows.slice(0, i).reduce((a, x) => a + x.frac, 0) * CIRC // 앞 조각들의 비율 합 = 시작 각도
  }))

  return (
    <div className={cx(styles.box, className)}>
      <div className={styles.title}>종목 비중</div>
      <div className={styles.body}>
        <div className={styles.donut}>
          <svg width="160" height="160" viewBox="0 0 160 160" className={styles.svg} aria-hidden="true">
            <g transform="rotate(-90 80 80)">
              <circle cx="80" cy="80" r={R} fill="none" className={styles.track} strokeWidth="24" />
              {segs.map(({ row, len, off }) => (
                <circle
                  key={row.code}
                  cx="80"
                  cy="80"
                  r={R}
                  fill="none"
                  strokeWidth="24"
                  className={styles.seg}
                  style={{ stroke: hov === row.code ? 'var(--color-gold)' : row.shade }}
                  strokeDasharray={Math.max(0, len - (n > 1 ? 1.5 : 0)).toFixed(2) + ' ' + CIRC.toFixed(2)}
                  strokeDashoffset={off.toFixed(2)}
                  onMouseEnter={() => onHov(row.code)}
                  onMouseLeave={() => onHov(null)}
                />
              ))}
            </g>
          </svg>
          <span className={styles.count}>{`${pkg.items.length}종목`}</span>
        </div>
        <div className={styles.legend}>
          {rows.map((r) => (
            <div key={r.code} className={styles.row} onMouseEnter={() => onHov(r.code)} onMouseLeave={() => onHov(null)}>
              <span className={styles.dot} style={{ background: hov === r.code ? 'var(--color-gold)' : r.shade }} />
              <span className={cx(styles.name, hov === r.code && styles.nameOn)}>{r.name}</span>
              <b className={styles.w}>{`${r.w.toFixed(1)}%`}</b>
              <span className={cx(styles.target, r.tone !== 'flat' && styles.gap, styles[r.tone])}>/ {r.target}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
