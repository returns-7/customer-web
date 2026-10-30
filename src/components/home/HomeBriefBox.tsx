import { useEffect, useRef, useState, type RefObject } from 'react'
import { Link } from 'react-router-dom'
import '../../styles/tokens.css'
import { RETURNS_DATA as RD } from '../../data/returns'
import { Box } from '../common/Box'
import { KkiruAvatar } from '../common/KkiruAvatar'
import { cx } from '../common/cx'
import { ASSET_FOOT_NOTE, RANGE_TIP } from './homeBriefData'
import { assetBrief, taxBrief } from './homeBriefLogic'
import styles from './HomeBriefBox.module.css'

type Tab = 'tax' | 'asset'

// 끼루 브리핑 박스: 절세 탭(세금 그래프·보유 기간) / 자산 탭. 계좌가 없으면 안내만(계좌 상태 전환은 시연 설정에서)
export function HomeBriefBox({ className }: { className?: string }) {
  const opened = RD.ACCOUNT_STATE === 'opened'
  const [tab, setTab] = useState<Tab>('tax')
  const [guide, setGuide] = useState(true) // 그래프 기준: 남은 한도까지 팔면
  const [tip, setTip] = useState(false)
  const [taxH, setTaxH] = useState(0) // 절세 탭 높이 — 자산 탭이 같은 높이를 유지하도록 기억
  const bodyRef = useRef<HTMLDivElement>(null)

  const cur: Tab = opened ? tab : 'tax'

  // 절세 탭 높이가 바뀔 때마다 기억(가로 폭·글꼴 로딩으로도 달라짐)
  useEffect(() => {
    const el = bodyRef.current
    if (cur !== 'tax' || !el) return
    const measure = () => {
      const h = el.offsetHeight
      if (h) setTaxH(h)
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [cur])

  const tabs: [Tab, string][] = opened ? [['tax', '절세'], ['asset', '자산']] : [['tax', '절세']]
  const head = (
    <div className={styles.tabs}>
      {tabs.map(([k, label], i) => (
        <span key={k} className={styles.tabItem}>
          {i > 0 && <span className={styles.sep}>·</span>}
          <button
            type="button"
            aria-pressed={cur === k}
            className={cx(styles.tab, cur === k && styles.tabOn)}
            onClick={() => { setTab(k); setTip(false) }}
          >
            {label}
          </button>
        </span>
      ))}
    </div>
  )

  return (
    <Box shadow className={className} title="끼루 브리핑" head={head}>
      {opened && cur === 'tax' && <TaxTab bodyRef={bodyRef} guide={guide} setGuide={setGuide} tip={tip} setTip={setTip} />}
      {opened && cur === 'asset' && <AssetTab minHeight={taxH} />}
      {!opened && (
        <div className={styles.noAcct}>
          <div className={styles.noAcctTitle}>계좌를 열면 얼마나 아낄 수 있는지 보여드려요</div>
          <div className={styles.noAcctSub}>{'보유 해외주식 ' + RD.C.HOLDINGS.length + '종목 · 2025.12.23 기준'}</div>
          <div className={styles.noAcctGo}>
            <Link to="/account#open">계좌 개설하기 ›</Link>
          </div>
        </div>
      )}
    </Box>
  )
}

interface TaxTabProps {
  bodyRef: RefObject<HTMLDivElement | null>
  guide: boolean
  setGuide: (v: boolean) => void
  tip: boolean
  setTip: (v: boolean) => void
}

function TaxTab({ bodyRef, guide, setGuide, tip, setTip }: TaxTabProps) {
  const t = taxBrief(guide)
  return (
    <div ref={bodyRef} className={styles.taxBody}>
      <div className={styles.topRow}>
        <div>
          <div className={styles.cutLabel}>RIA로 줄어드는 세금</div>
          <div className={styles.cutBig}>₩{t.cut}</div>
        </div>
        <span className={styles.asOf}>{t.asOf}</span>
      </div>

      {guide && (
        <div className={styles.rangeRow}>
          <span className={styles.rangeTxt}>{t.rangeTxt}</span>
          <button type="button" className={styles.tipBtn} aria-label="범위 계산 안내" aria-expanded={tip} onClick={() => setTip(!tip)}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4" />
              <path d="M12 8h.01" />
            </svg>
          </button>
          {tip && <div role="tooltip" className={styles.tip}>{RANGE_TIP}</div>}
        </div>
      )}
      <div className={styles.cutNote}>{t.cutNote}</div>

      <div role="group" aria-label="그래프 기준" className={styles.seg}>
        <button type="button" className={cx(styles.segBtn, !guide && styles.segOn)} onClick={() => setGuide(false)}>지금까지</button>
        <button type="button" className={cx(styles.segBtn, styles.segBtnSecond, guide && styles.segOn)} onClick={() => setGuide(true)}>남은 한도까지 팔면</button>
      </div>

      <div className={styles.chart}>
        <div className={styles.plot}>
          <div className={styles.barGeneral} style={{ height: t.gH }} />
          <div className={styles.generalLabel} style={{ bottom: t.gH }}>
            <div className={styles.barCaption}>원래 냈을 세금</div>
            {t.general}
          </div>
          <div className={styles.barRia} style={{ height: t.nH }}>
            <span className={styles.barCaption}>RIA로 낼 세금</span>
            {t.ria}
          </div>
          <div className={styles.barConfirm} style={{ bottom: t.nH, height: t.cH }}>
            <span>확정</span>
            <span>{t.conf}</span>
          </div>
          <div className={styles.barExpect} style={{ bottom: t.eB, height: t.eH }}>
            <span className={styles.expectTxt} style={{ opacity: t.eShow ? 1 : 0 }}>{'예상 ' + t.exp}</span>
          </div>
          <div className={styles.guideLine} style={{ bottom: t.gH }} />
          <div className={styles.bracket} style={{ bottom: t.nH, height: t.brH }} />
          <div className={styles.cutLabelChart} style={{ bottom: t.lblB }}>
            <div className={styles.cutLabelSmall}>줄어드는 세금</div>
            {'−' + t.cut}
          </div>
        </div>
        <div className={styles.axis}>
          <span className={styles.axisGeneral}>일반 계좌였다면</span>
          <span className={styles.axisRia}>RIA 계좌</span>
        </div>
      </div>

      <div className={styles.facts}>
        <div className={styles.factL}>
          <div className={styles.factKey}>국내 복귀 금액</div>
          <div className={styles.factVal}>₩{t.soldAmt}</div>
        </div>
        <div className={styles.factR}>
          <div className={styles.factKey}>이번 구간 공제율</div>
          <div className={styles.factVal}>
            {t.bandPct + ' '}
            <span className={styles.factSub}>{t.bandEnd + ' 마감 D-' + t.dl}</span>
          </div>
        </div>
      </div>

      <div className={styles.hold}>
        <div className={styles.holdDates}>
          <span>{'확정일 ' + t.soldDot}</span>
          <span>{'인출 가능일 ' + t.wdDot}</span>
        </div>
        <div className={styles.track}>
          <div className={styles.trackBg} />
          <div className={styles.trackFill} style={{ width: t.holdPct }} />
          <div className={styles.thumb} style={{ left: t.holdPct }} />
        </div>
        <div className={styles.holdLine}>
          <b>{'보유 ' + t.held + '일'}</b>{' '}
          <span className={styles.holdSub}>{'/ ' + t.holdTotal + '일 · 인출 가능'}</span>{' '}
          <b className={styles.holdD}>{'D-' + t.wdD}</b>
        </div>
        <div className={styles.warn}>1년 전에 원금을 인출하면 이 계좌의 세제 혜택이 모두 취소돼요.</div>
        {t.demoTrade && (
          <Link to="/account#sells" className={styles.progress}>
            <b className={styles.progressTag}>진행 중</b>
            <span className={styles.progressTxt}>{t.progressTxt}</span>
            <span className={styles.progressArrow}>›</span>
          </Link>
        )}
      </div>
    </div>
  )
}

function AssetTab({ minHeight }: { minHeight: number }) {
  const a = assetBrief()
  const pnlClass = a.pnlTone > 0 ? styles.up : a.pnlTone < 0 ? styles.down : styles.flat
  return (
    <div className={styles.assetBody} style={{ minHeight }}>
      <div className={styles.assetTop}>
        <div>
          <div className={styles.cutLabel}>국내 운용 자산</div>
          <div className={styles.assetBig}>₩{a.domestic}</div>
        </div>
        <span className={cx(styles.pnl, pnlClass)}>{'평가손익 ' + a.pnl}</span>
      </div>
      <div className={styles.summaryRow}>
        <KkiruAvatar profile={RD.CUSTOMER.profile} size={24} />
        <span className={styles.summary}>{a.summary}</span>
      </div>
      <div className={styles.flows}>
        {a.facts.map((f) => (
          <div key={f.link} className={styles.flow}>
            <span className={styles.flowTxt}>{f.text}</span>
            <Link to={f.to} className={styles.flowLink}>{f.link}</Link>
          </div>
        ))}
      </div>
      <div className={styles.assetFoot}>{a.foot + '까지 반영 · ' + ASSET_FOOT_NOTE}</div>
    </div>
  )
}
