import { useState } from 'react'
import { Link } from 'react-router-dom'
import { RETURNS_DATA as RD } from '../../data/returns'
import { F } from '../../lib/calc'
import { StockLabel } from '../common/StockLabel'
import { cx } from '../common/cx'
import { infoOf, isSuitable, riskLabel } from './investHoldingData'
import { splitPercent } from './investChartLogic'
import { sign, toneOf } from './investPkgLogic'
import type { PkgView } from './investPkgLogic'
import styles from './InvestHoldings.module.css'

interface Props {
  pkg: PkgView
  hov: string | null // 도넛·비중 줄과 함께 강조되는 종목 코드
  onHov: (code: string | null) => void
  unsuit?: Record<string, string> // 내 성향보다 위험한 종목을 담을 때 확인한 날짜(P-7에서 채움)
  onAdd?: () => void // TODO: P-7에서 종목 추가 창 연결
  onBuy?: (code: string) => void // TODO: P-6에서 매수 창 연결
  onSell?: (code: string) => void // TODO: P-6에서 매도 창 연결
}

// 보유 종목 표 — 종목별 줄(누르면 종목 정보 펼침)과 합계 줄. 좁은 화면은 가로 스크롤(원본과 같음)
export function InvestHoldings({ pkg, hov, onHov, unsuit = {}, onAdd, onBuy, onSell }: Props) {
  const [open, setOpen] = useState<string | null>(null) // 펼친 종목(다른 패키지를 골라도 유지)
  const [tip, setTip] = useState(false) // 위험 열 안내
  const noItems = pkg.items.length === 0
  const w = splitPercent(pkg.items.map((i) => i.val))

  return (
    <div className={styles.wrap}>
      <div className={styles.inner}>
        <div className={cx(styles.grid, styles.head)}>
          <span>종목</span>
          <span className={styles.r}>보유 주 수</span>
          <span className={styles.r}>평균 매입가</span>
          <span className={styles.r}>현재가</span>
          <span className={styles.r}>평가금액</span>
          <span className={styles.r}>평가손익</span>
          <span className={styles.r}>수익률</span>
          <span className={styles.riskHead}>
            위험
            <button
              type="button"
              className={styles.tipBtn}
              aria-label="위험등급 안내"
              aria-expanded={tip}
              onClick={() => setTip(!tip)}
              onMouseEnter={() => setTip(true)}
              onMouseLeave={() => setTip(false)}
              onFocus={() => setTip(true)}
              onBlur={() => setTip(false)}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4" />
                <path d="M12 8h.01" />
              </svg>
            </button>
            {tip && (
              <span role="tooltip" className={styles.tip}>
                1 매우 높은 위험 ~ 6 매우 낮은 위험 · 리턴증권 자체 산정
              </span>
            )}
          </span>
          <span className={styles.r}>비중 / 목표</span>
          <span className={styles.c}>주문</span>
        </div>

        {noItems && (
          <div className={styles.empty}>
            <span className={styles.emptyText}>아직 담은 종목이 없어요</span>
            <button type="button" className={styles.emptyAdd} onClick={onAdd}>
              + 종목 추가
            </button>
          </div>
        )}

        {pkg.items.map((it, i) => {
          const px = RD.PX[it.code] ?? [0, 0]
          const chg = px[1]
          const avg = it.qty ? it.cost / it.qty : 0
          const ret = it.cost ? ((it.val - it.cost) / it.cost) * 100 : 0
          const isOpen = open === it.code
          const info = isOpen ? infoOf(it.code) : null
          const out = !isSuitable(it.code)
          const ack = unsuit[it.code]
          return (
            <div key={it.code} className={styles.rowBox}>
              <div
                data-hold-row="1"
                role="button"
                aria-expanded={isOpen}
                className={cx(styles.grid, styles.row, (isOpen || hov === it.code) && styles.rowOn)}
                onClick={() => setOpen(isOpen ? null : it.code)}
                onMouseEnter={() => onHov(it.code)}
                onMouseLeave={() => onHov(null)}
              >
                <span className={styles.stock}>
                  <StockLabel sym={it.code} size="sm" />
                </span>
                <span className={styles.r}>{`${it.qty}주`}</span>
                <span className={styles.r}>{avg ? F.won(avg) : '-'}</span>
                <span className={styles.px}>
                  <span>{F.won(px[0])}</span>
                  <span className={cx(styles.chg, styles[toneOf(chg)])}>{F.pct(chg)}</span>
                </span>
                <b className={styles.val}>{F.won(it.val)}</b>
                <span className={cx(styles.r, styles[toneOf(ret)])}>{it.qty && avg ? sign(it.val - it.cost) + F.won(Math.abs(it.val - it.cost)) : '-'}</span>
                <span className={cx(styles.r, styles[toneOf(ret)])}>{it.qty ? F.pct(ret) : '-'}</span>
                <span className={styles.risk}>
                  <span className={cx(styles.riskText, out && styles.warn)}>{riskLabel(it.code)}</span>
                  {out && ack && <span className={cx(styles.riskText, styles.warn)}>{`부적합 확인함 · ${F.short(ack)}`}</span>}
                </span>
                <span className={styles.weight}>
                  {`${w[i].toFixed(1)}% `}
                  <span className={styles.target}>/ {it.target}%</span>
                </span>
                <span className={styles.orders}>
                  {/* 누른 뒤 동작은 P-6에서 연결 */}
                  <button
                    type="button"
                    className={styles.buy}
                    onClick={(e) => {
                      e.stopPropagation()
                      onBuy?.(it.code)
                    }}
                  >
                    매수
                  </button>
                  <span className={styles.dot}>·</span>
                  <button
                    type="button"
                    className={styles.sell}
                    onClick={(e) => {
                      e.stopPropagation()
                      onSell?.(it.code)
                    }}
                  >
                    매도
                  </button>
                </span>
              </div>
              {info && (
                <div className={styles.more}>
                  <div className={styles.moreHead}>
                    종목 정보
                    <Link to={'/community?stock=' + it.code} className={styles.chat}>
                      종목 채팅방 ›
                    </Link>
                  </div>
                  <div className={styles.facts}>
                    {info.facts.map(([k, v], x) => (
                      <FactCell key={k} k={k} v={v} first={x === 0} />
                    ))}
                  </div>
                  <div className={styles.gradeLine}>
                    위험등급 <b className={styles.gradeB}>{info.grade}</b> · 근거 {info.basis}
                  </div>
                  <div className={styles.asOf}>{info.asOf}</div>
                </div>
              )}
            </div>
          )
        })}

        {!noItems && (
          <div className={cx(styles.grid, styles.total)}>
            <span>합계</span>
            <span />
            <span />
            <span className={cx(styles.todaySum, styles[toneOf(pkg.today)])}>{`오늘 ${sign(pkg.today)}${F.won(Math.abs(pkg.today))}`}</span>
            <span className={styles.r}>{F.won(pkg.val)}</span>
            <span className={cx(styles.r, styles[toneOf(pkg.pnl)])}>{sign(pkg.pnl) + F.won(Math.abs(pkg.pnl))}</span>
            <span className={cx(styles.r, styles[toneOf(pkg.pnl)])}>{F.pct(pkg.ret)}</span>
            <span className={styles.avgGrade}>{`가중평균 ${pkg.grade}등급`}</span>
            <span className={styles.r}>100%</span>
            <span />
          </div>
        )}
      </div>
    </div>
  )
}

function FactCell({ k, v, first }: { k: string; v: string; first: boolean }) {
  return (
    <>
      <span className={cx(styles.fk, !first && styles.fkLine)}>{k}</span>
      <b className={styles.fv}>{v}</b>
    </>
  )
}
