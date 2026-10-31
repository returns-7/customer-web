import { useState } from 'react'
import '../../styles/tokens.css'
import { F } from '../../lib/calc'
import { Toast } from '../common/Toast'
import { cx } from '../common/cx'
import { useToast } from '../common/useToast'
import { InvestHoldings } from './InvestHoldings'
import { InvestPkgChart } from './InvestPkgChart'
import { InvestPkgWeight } from './InvestPkgWeight'
import type { RangeKey } from './investChartLogic'
import { detailOf, sign, toneOf } from './investPkgLogic'
import type { PkgView } from './investPkgLogic'
import styles from './InvestPkgDetail.module.css'

const signedWon = (n: number) => sign(n) + '₩' + F.won(Math.abs(n))

interface Props {
  className?: string
  pkg: PkgView
  onBuy?: () => void // TODO: P-7에서 패키지 한 번에 사기 창 연결
  onAdd?: () => void // TODO: P-7에서 종목 추가 창 연결
}

// 선택한 패키지 상세 — 머리 줄·수치 줄·위험 요약·종목 비중·수익률 차트·보유 종목 표
export function InvestPkgDetail({ className, pkg, onBuy, onAdd }: Props) {
  const [menu, setMenu] = useState(false)
  const [hov, setHov] = useState<string | null>(null) // 도넛·줄에서 마우스를 올린 종목(보유 종목 표 줄과 함께 강조)
  const [range, setRange] = useState<RangeKey>('1m') // 다른 패키지를 골라도 유지(원본과 같음)
  const { message, showToast } = useToast()
  const d = detailOf(pkg)
  const noItems = pkg.items.length === 0

  return (
    <section className={cx(styles.box, className)} data-pkg-detail="1">
      <div className={styles.head}>
        <div className={styles.titleWrap}>
          <h2 className={styles.name}>{pkg.name}</h2>
          {/* TODO: P-9에서 이름 바꾸기 연결 */}
          <button type="button" className={styles.pencil} aria-label="패키지 이름 바꾸기">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
            </svg>
          </button>
          <span className={styles.meta}>
            {pkg.items.length}종목 · 만든 날 {d.made}
          </span>
        </div>
        <div className={styles.btns}>
          <button type="button" className={styles.buy} onClick={onBuy}>
            패키지 한 번에 사기
          </button>
          <button type="button" className={styles.add} onClick={onAdd}>
            + 종목 추가
          </button>
          <span className={styles.menuWrap}>
            <button type="button" className={styles.more} aria-label="패키지 메뉴" aria-expanded={menu} onClick={() => setMenu(!menu)}>
              …
            </button>
            {menu && (
              <>
                <div className={styles.backdrop} onClick={() => setMenu(false)} />
                <div role="menu" className={styles.menu}>
                  {/* TODO: P-9에서 이름 바꾸기·삭제 동작 연결(지금은 메뉴만 닫음) */}
                  <button type="button" role="menuitem" className={styles.menuItem} onClick={() => setMenu(false)}>
                    이름 바꾸기
                  </button>
                  <button type="button" role="menuitem" className={styles.menuItem} onClick={() => setMenu(false)}>
                    삭제
                  </button>
                </div>
              </>
            )}
          </span>
        </div>
      </div>

      <div className={styles.sums}>
        <div className={styles.sum}>
          <span className={styles.k}>평가금액</span>
          <span className={styles.valRow}>
            <b className={styles.val}>₩{F.won(pkg.val)}</b>
            <span className={styles.cost}>원금 ₩{F.won(pkg.cost)}</span>
          </span>
        </div>
        <div className={cx(styles.sum, styles.sumLeft)}>
          <span className={styles.k}>평가손익</span>
          <b className={cx(styles.v, styles[toneOf(pkg.pnl)])}>{signedWon(pkg.pnl)}</b>
        </div>
        <div className={cx(styles.sum, styles.sumRet)}>
          <span className={styles.k}>수익률</span>
          <b className={cx(styles.v, styles[toneOf(pkg.pnl)])}>{F.pct(pkg.ret)}</b>
        </div>
        <div className={cx(styles.sum, styles.sumLeft, styles.sumToday)}>
          <span className={styles.k}>오늘 손익</span>
          <b className={cx(styles.v, styles[toneOf(pkg.today)])}>
            {signedWon(pkg.today)} ({F.pct(pkg.todayPct)})
          </b>
        </div>
      </div>

      <div className={styles.risk}>
        {noItems && <div className={styles.empty}>담은 종목이 없어요</div>}
        {!noItems && (
          <div className={styles.riskBox}>
            {/* 원본은 토스트만 띄움(결과가 같다는 안내) */}
            <button type="button" className={styles.recheck} onClick={() => showToast('다시 검사했어요 · 결과가 같아요', 2200)}>
              다시 검사
            </button>
            <div className={styles.riskGrid}>
              <div className={styles.riskCell}>
                <div className={styles.k}>구성 종목 위험등급 가중평균</div>
                <div className={styles.rv}>
                  {pkg.grade}등급 <span className={styles.note}>(참고 지표)</span>
                </div>
              </div>
              <div className={styles.riskCell}>
                <div className={styles.k}>패키지 연 변동성</div>
                <div className={styles.rv}>
                  {d.vol} <span className={styles.note}>(과거 3년 데이터 기준, 예측 아님)</span>
                </div>
              </div>
              <div className={styles.riskCell}>
                <div className={styles.k}>내 성향({d.profRange}) 범위를 벗어난 종목</div>
                <div className={cx(styles.rv, d.outCount > 0 && styles.warn)}>{d.outCount}개</div>
              </div>
            </div>
          </div>
        )}
        <div className={styles.guide}>
          위험등급은 금투협 가이드라인 VaR 방식을 참고한 리턴증권 자체 산정이에요.
          <br />
          교육용 프로젝트의 자체 분석 결과예요. 수익을 보장하지 않으며, 실제 금융상품 판매·권유 절차를 대체하지 않아요.
        </div>
      </div>

      {!noItems && (
        <div className={styles.charts}>
          <InvestPkgWeight pkg={pkg} hov={hov} onHov={setHov} />
          <InvestPkgChart className={styles.chartRight} pkg={pkg} range={range} onRange={setRange} />
        </div>
      )}
      <InvestHoldings pkg={pkg} hov={hov} onHov={setHov} onAdd={onAdd} />
      <Toast message={message} />
    </section>
  )
}
