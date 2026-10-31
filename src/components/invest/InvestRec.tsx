import { Link } from 'react-router-dom'
import '../../styles/tokens.css'
import { F } from '../../lib/calc'
import { KkiruAvatar } from '../common/KkiruAvatar'
import { StockLabel } from '../common/StockLabel'
import { cx } from '../common/cx'
import { REC_FILTERS, recStateOf } from './investRecData'
import type { RecFilter } from './investRecData'
import { toneOf } from './investPkgLogic'
import styles from './InvestRec.module.css'

interface Props {
  className?: string
  filter: RecFilter
  onFilter: (f: RecFilter) => void
  open: string | null // 펼친 종목 코드(하나만)
  onOpen: (code: string | null) => void
  onAdd?: (code: string) => void // TODO: P-7에서 "어느 패키지에 담을까요?" 창 연결
}

const ASSESS_PATH = '/myinfo#assess'

// 성향별 추천 탭 — 성향별 추천 박스 + 내 추천 기준 박스(넓은 화면 8 : 4, 좁은 화면 한 줄)
export function InvestRec({ className, filter, onFilter, open, onOpen, onAdd }: Props) {
  const rc = recStateOf(filter)
  const hasList = !rc.off && rc.rows.length > 0

  return (
    <div className={cx(styles.cols, className)}>
      <section className={styles.box} data-box="rec">
        <div className={styles.head}>
          <h2 className={styles.title}>성향별 추천</h2>
          <span className={styles.sub}>{rc.sub}</span>
          <span className={styles.filters}>
            {REC_FILTERS.map(([k, label], i) => (
              <span key={k} className={styles.filterItem}>
                {i > 0 && <span className={styles.sep}>·</span>}
                <button type="button" className={cx(styles.filter, filter === k && styles.filterOn)} onClick={() => { onFilter(k); onOpen(null) }}>
                  {label}
                </button>
              </span>
            ))}
          </span>
        </div>

        {hasList && (
          <div className={cx(styles.grid, styles.cols0)}>
            <span>종목</span>
            <span className={styles.r}>현재가</span>
            <span>위험</span>
            <span>추천 이유</span>
            <span />
          </div>
        )}

        {/* 원본은 진단 만료·미진단이어도 목록 줄은 그대로 보여 줌(머리 줄만 숨김) */}
        {rc.rows.map((r) => {
            const on = open === r.code
            return (
              <div key={r.code} className={styles.rowBox}>
                <button type="button" className={cx(styles.grid, styles.row, on && styles.rowOn)} aria-expanded={on} onClick={() => onOpen(on ? null : r.code)}>
                  <span className={styles.stock}>
                    <StockLabel sym={r.code} size="sm" />
                  </span>
                  <span className={styles.px}>
                    <span>{F.won(r.px)}</span>
                    <span className={cx(styles.chg, styles[toneOf(r.chg)])}>{F.pct(r.chg)}</span>
                  </span>
                  <span className={styles.risk}>{r.risk}</span>
                  <span className={styles.reason}>{r.reason}</span>
                  <span className={styles.chev}>
                    <svg className={cx(on && styles.chevOpen)} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </span>
                </button>
                {on && (
                  <div className={styles.more}>
                    <div className={styles.moreCol}>
                      <div className={styles.mk}>추천 이유</div>
                      <div className={styles.why}>{r.reason}</div>
                      <div className={cx(styles.mk, styles.mkGap)}>
                        종목 정보 <span className={styles.ai}>AI 요약</span>
                      </div>
                      <div className={styles.facts}>
                        {r.facts.map(([k, v], i) => (
                          <div key={k} className={cx(styles.fact, i > 0 && styles.factLine)}>
                            <span className={styles.fk}>{k}</span>
                            <b className={styles.fv}>{v}</b>
                          </div>
                        ))}
                      </div>
                      <div className={styles.gradeLine}>{`위험등급 `}<b className={styles.bold}>{r.grade}</b>{` · 근거 ${r.basis}`}</div>
                      <div className={styles.asOf}>{r.asOf}</div>
                    </div>
                    <div className={styles.moreCol}>
                      <div className={styles.r30Head}>
                        최근 30일
                        <span className={cx(styles.r30, styles[toneOf(r.r30)])}>{F.pct(r.r30)}</span>
                      </div>
                      <svg className={styles.spark} viewBox="0 0 300 96" preserveAspectRatio="none">
                        <polyline points={r.points} fill="none" className={styles.sparkLine} strokeWidth="1.5" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                      </svg>
                      <button type="button" className={styles.add} onClick={() => onAdd?.(r.code)}>
                        패키지에 담기
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}

        {!rc.off && rc.hasAll && rc.rows.length === 0 && <div className={styles.none}>이 분류에는 추천할 상품이 없어요</div>}

        {!rc.off && !rc.hasAll && (
          <div className={styles.emptyBox}>
            <KkiruAvatar profile={rc.profile} size={48} />
            <div className={styles.emptyBody}>
              <div className={styles.emptyT1}>{rc.emptyTitle}</div>
              <div className={styles.emptyT2}>RIA 계좌에서 살 수 있는 국내 주식·주식형 ETF는 대부분 2등급(높은 위험)이라 지금은 추천할 상품이 없어요.</div>
              <Link className={styles.emptyLink} to={ASSESS_PATH}>
                투자성향 다시 확인하기 ›
              </Link>
            </div>
          </div>
        )}

        {rc.off && (
          <div className={styles.offBox}>
            <p className={styles.offMsg}>{rc.offMsg}</p>
            <Link className={styles.offBtn} to={ASSESS_PATH}>
              {rc.offBtn}
            </Link>
          </div>
        )}

        <div className={styles.guide}>교육용 프로젝트의 자체 분석 결과예요. 수익을 보장하지 않으며, 실제 금융상품 판매·권유 절차를 대체하지 않아요.</div>
      </section>

      <section className={styles.box} data-box="rec-basis">
        <div className={styles.head}>
          <h2 className={styles.title}>내 추천 기준</h2>
        </div>
        <div className={styles.prof}>
          <KkiruAvatar profile={rc.profile} size={48} />
          <div className={styles.profText}>
            <b className={styles.profLine}>{rc.profLine}</b>
            <span className={styles.assess}>
              {rc.assess}
              {rc.expired && (
                <>
                  {' '}
                  <span className={styles.expired}>진단 만료</span>
                </>
              )}
            </span>
          </div>
        </div>
        <div className={styles.rules}>
          <div className={styles.rulesTitle}>추천 기준</div>
          {rc.rules.map((text, i) => (
            <div key={text} className={cx(styles.rule, i < rc.rules.length - 1 && styles.ruleLine)}>
              <b className={styles.ruleN}>{i + 1}</b>
              <span>{text}</span>
            </div>
          ))}
        </div>
        <div className={styles.again}>
          <Link className={styles.againLink} to={ASSESS_PATH}>
            투자성향 다시 확인하기 ›
          </Link>
        </div>
      </section>
    </div>
  )
}
