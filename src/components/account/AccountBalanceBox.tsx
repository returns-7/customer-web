import { useState } from 'react'
import { Link } from 'react-router-dom'
import '../../styles/tokens.css'
import { Box } from '../common/Box'
import { cx } from '../common/cx'
import { StockLabel } from '../common/StockLabel'
import { Tabs } from '../common/Tabs'
import { DEFAULT_SORT, RISK_TIP, frBalance, krBalance } from './accountBalanceData'
import type { BalTab, KrSort, SortKey } from './accountBalanceData'
import styles from './AccountBalanceBox.module.css'

interface AccountBalanceBoxProps {
  className?: string
  onSell: () => void // 입고 해외주식 매도 신청 ›
}

const SORT_COLS: [SortKey, string, string][] = [
  ['val', '평가금액', '평가금액으로 정렬'],
  ['pnl', '평가손익', '평가손익으로 정렬'],
  ['ret', '수익률', '수익률로 정렬']
]

const toneClass = (t: 'up' | 'down' | 'flat') => (t === 'up' ? styles.up : t === 'down' ? styles.down : styles.flat)

// 잔고 박스(data-box="balance") — 국내 주식 / 입고 해외주식 두 탭. 탭을 바꿔도 위치·폭은 그대로, 높이만 내용만큼
export function AccountBalanceBox({ className, onSell }: AccountBalanceBoxProps) {
  const [tab, setTab] = useState<BalTab>('kr')
  const [sort, setSort] = useState<KrSort>(DEFAULT_SORT)
  const [tipOn, setTipOn] = useState(false)

  const kr = krBalance(sort)
  const fr = frBalance()

  // 같은 열을 다시 누르면 방향이 뒤집히고, 다른 열은 내림차순부터
  const sortBy = (k: SortKey) => setSort((s) => ({ k, d: s.k === k ? (s.d === 1 ? -1 : 1) : -1 }))

  return (
    <Box
      data-box="balance"
      className={className}
      headScroll
      head={
        <Tabs
          ariaLabel="잔고"
          value={tab}
          onChange={(k) => setTab(k as BalTab)}
          items={[
            { key: 'kr', label: '국내 주식', count: kr.rows.length },
            { key: 'fr', label: '입고 해외주식', count: fr.rows.length }
          ]}
        />
      }
      actions={
        <>
          <span className={styles.evalTxt}>평가 ₩{tab === 'kr' ? kr.sum : fr.sum}</span>
          {tab === 'kr' && (
            <Link to="/invest" className={styles.link}>
              패키지별로 보기 ›
            </Link>
          )}
        </>
      }
    >
      {tab === 'kr' && (
        <div className={styles.scroll}>
          <div className={styles.krTable}>
            <div className={cx(styles.row, styles.krCols, styles.thead)}>
              <span>종목</span>
              <span className={styles.right}>보유 주 수</span>
              <span className={styles.right}>매도 가능 주 수</span>
              <span className={styles.right}>평균 매입가</span>
              <span className={styles.right}>현재가</span>
              {SORT_COLS.map(([k, label, aria]) => {
                const on = sort.k === k
                return (
                  <button key={k} type="button" className={cx(styles.sortBtn, on && styles.sortOn)} aria-label={aria} onClick={() => sortBy(k)}>
                    {label}
                    <span className={styles.arrow}>{on ? (sort.d < 0 ? '▼' : '▲') : ''}</span>
                  </button>
                )
              })}
              <span className={styles.riskHead}>
                위험
                <button
                  type="button"
                  className={styles.tipBtn}
                  aria-label="위험등급 안내"
                  aria-expanded={tipOn}
                  onClick={() => setTipOn(!tipOn)}
                  onMouseEnter={() => setTipOn(true)}
                  onMouseLeave={() => setTipOn(false)}
                  onFocus={() => setTipOn(true)}
                  onBlur={() => setTipOn(false)}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 16v-4" />
                    <path d="M12 8h.01" />
                  </svg>
                </button>
                {tipOn && (
                  <span role="tooltip" className={styles.tip}>
                    {RISK_TIP}
                  </span>
                )}
              </span>
            </div>
            {kr.rows.map((r) => (
              <div key={r.code} data-kr-row="1" className={cx(styles.row, styles.krCols, styles.body)}>
                <span className={styles.stock}>
                  <StockLabel sym={r.code} size="sm" />
                </span>
                <span className={styles.right}>{r.qty}주</span>
                <span className={cx(styles.right, r.sellLess && styles.sellLess)}>{r.sell}주</span>
                <span className={styles.right}>{r.avg}</span>
                <span className={styles.px}>
                  <span>{r.px}</span>
                  <span className={cx(styles.chg, toneClass(r.chgTone))}>{r.chg}</span>
                </span>
                <b className={cx(styles.right, styles.strong)}>{r.val}</b>
                <span className={cx(styles.right, toneClass(r.pnlTone))}>{r.pnl}</span>
                <span className={cx(styles.right, toneClass(r.pnlTone))}>{r.ret}</span>
                <span className={styles.risk}>{r.risk}</span>
              </div>
            ))}
            <div data-kr-sum="1" className={cx(styles.row, styles.krCols, styles.sum)}>
              <span>합계</span>
              <span />
              <span />
              <span />
              <span />
              <span className={styles.right}>{kr.tot.val}</span>
              <span className={cx(styles.right, toneClass(kr.tot.tone))}>{kr.tot.pnl}</span>
              <span className={cx(styles.right, toneClass(kr.tot.tone))}>{kr.tot.ret}</span>
              <span />
            </div>
          </div>
        </div>
      )}

      {tab === 'fr' && (
        <div className={styles.scroll}>
          <div className={styles.frTable}>
            <div className={cx(styles.row, styles.frCols, styles.thead)}>
              <span>종목</span>
              <span className={styles.right}>수량</span>
              <span className={styles.right}>현재가</span>
              <span className={styles.right}>평가금액</span>
              <span className={styles.right}>차익률</span>
              <span />
            </div>
            {fr.rows.map((r, i) => (
              <div key={r.t} className={cx(styles.row, styles.frCols, styles.body, i === fr.rows.length - 1 && styles.noLine)}>
                <span className={styles.stock}>
                  <StockLabel sym={r.t} size="sm" />
                </span>
                <span className={styles.right}>{r.qty}주</span>
                <span className={styles.right}>{r.px}</span>
                <b className={cx(styles.right, styles.strong)}>{r.val}</b>
                <span className={cx(styles.right, styles.up)}>{r.rate}</span>
                <button type="button" className={styles.sellBtn} onClick={onSell}>
                  매도 신청 ›
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </Box>
  )
}
