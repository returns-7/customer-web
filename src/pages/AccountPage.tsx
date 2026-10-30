import { useEffect, useReducer, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ApplyModal } from '../components/account/ApplyModal'
import { SellModal } from '../components/account/SellModal'
import { AccountBalanceBox } from '../components/account/AccountBalanceBox'
import { AccountDocsBox } from '../components/account/AccountDocsBox'
import { AccountHistBox } from '../components/account/AccountHistBox'
import { AccountHoldBox } from '../components/account/AccountHoldBox'
import { AccountLimitBox } from '../components/account/AccountLimitBox'
import { AccountTaxBox } from '../components/account/AccountTaxBox'
import { TaxCalcModal } from '../components/account/TaxCalcModal'
import { initialIssued } from '../components/account/accountTaxData'
import type { IssueRecord } from '../components/account/accountTaxData'
import { AccountStateBox } from '../components/account/AccountStateBox'
import { AccountSummaryBox } from '../components/account/AccountSummaryBox'
import { FOOT_FLOW, FOOT_STATUS, PAGE_TABS } from '../components/account/accountData'
import type { PageKey } from '../components/account/accountData'
import type { AddedIn, AddedOut, ApplyKind } from '../components/account/accountApplyData'
import type { AddedSell, AddedSettle } from '../components/account/accountSellData'
import { isHistTab } from '../components/account/accountHistData'
import type { HistTab } from '../components/account/accountHistData'
import styles from '../components/account/AccountLayout.module.css'
import { FlowAllocBox, FlowCutBox, FlowMonthlyBox, FlowStepsBox } from '../components/account/AccountFlowBoxes'
import { Tabs } from '../components/common/Tabs'
import { Toast } from '../components/common/Toast'
import { useToast } from '../components/common/useToast'
import { RETURNS_DATA as RD } from '../data/returns'
import { F } from '../lib/calc'

// 내 계좌 — 1~7번째 부분: 뼈대·페이지 탭·계좌 요약·계좌 상태 + 매도 한도·세액·원금 유지·증빙서류 + 잔고 + 거래·신청 내역 + 자금 흐름 탭 박스 4개 + 입고·인출·계좌 개설 신청 창 + 매도 신청 창
export function AccountPage() {
  const { hash, pathname } = useLocation()
  const navigate = useNavigate()
  const { message: toast, showToast } = useToast()

  // 시연 설정(계좌 상태 등)이 바뀌면 다시 그림(원본 returns-demo 이벤트)
  const [, redraw] = useReducer((n: number) => n + 1, 0)
  useEffect(() => {
    window.addEventListener('returns-demo', redraw)
    return () => window.removeEventListener('returns-demo', redraw)
  }, [])

  const [calcOpen, setCalcOpen] = useState(false)

  // 신청 창 — 입고 / 인출 / 계좌 개설. 주소 끝이 #open이고 계좌가 없거나 반려일 때도 열림(원본 onHash)
  const canOpenAcct = () => RD.ACCOUNT_STATE !== 'opened' && RD.ACCOUNT_STATE !== 'reviewing'
  const [applyKind, setApplyKind] = useState<ApplyKind | null>(() => (hash === '#open' && canOpenAcct() ? 'open' : null))
  // 접수한 신청 — 거래·신청 내역 해당 탭 맨 위에 '심사 중' 줄로 보임
  const [addedIn, setAddedIn] = useState<AddedIn[]>([])
  const [addedOut, setAddedOut] = useState<AddedOut[]>([])
  // 매도 신청 창 — 접수한 매도는 매도 내역·정산 상태 맨 위에 '심사 중' 줄로 보임
  const [sellOpen, setSellOpen] = useState(false)
  const [addedSell, setAddedSell] = useState<AddedSell[]>([])
  const [addedSettle, setAddedSettle] = useState<AddedSettle[]>([])
  const [issued, setIssued] = useState<IssueRecord[]>(initialIssued)

  // 거래·신청 내역 탭 — 주소 끝(#deposits 등)이 탭 이름이면 그 탭을 연다(원본 onHash). 자금 흐름 화면에 다녀와도 유지
  const [histTab, setHistTab] = useState<HistTab>(() => (isHistTab(hash.slice(1)) ? (hash.slice(1) as HistTab) : 'deposits'))
  const ownHash = useRef(false) // 탭을 눌러 우리가 바꾼 주소 — 이때는 스크롤하지 않음
  const [seenHash, setSeenHash] = useState(hash)
  if (seenHash !== hash) {
    setSeenHash(hash)
    if (isHistTab(hash.slice(1))) setHistTab(hash.slice(1) as HistTab)
    if (hash === '#open' && canOpenAcct()) setApplyKind('open')
  }

  const opened = RD.ACCOUNT_STATE === 'opened'
  const page: PageKey = opened && hash === '#flow' ? 'flow' : 'status'

  const scrollToHist = () =>
    setTimeout(() => {
      const el = document.querySelector('[data-box="hist"]')
      if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 80, behavior: 'smooth' })
    }, 30)

  // 주소로 들어오거나 주소 끝이 바뀌어 탭 이름이 되면 그 탭의 박스로 스크롤
  useEffect(() => {
    if (ownHash.current) {
      ownHash.current = false
      return
    }
    if (opened && isHistTab(hash.slice(1))) {
      const t = scrollToHist()
      return () => clearTimeout(t)
    }
  }, [hash, opened])

  // 탭을 누르면 주소 끝(#flow)만 바꾸고 기록은 남기지 않음(원본의 replaceState)
  const setPage = (key: string) => {
    navigate({ pathname, hash: key === 'flow' ? '#flow' : '' }, { replace: true })
    window.scrollTo(0, 0)
  }

  const copyAcct = () => {
    try {
      navigator.clipboard.writeText(RD.ACCOUNT.no)
    } catch {
      // 클립보드를 못 쓰는 환경에서도 안내는 보여 준다(원본과 동일)
    }
    showToast('계좌번호를 복사했어요')
  }

  // 탭을 누르면 주소 끝만 바꿈(원본 setTab의 replaceState)
  const pickHistTab = (k: HistTab) => {
    ownHash.current = '#' + k !== hash
    navigate({ pathname, hash: '#' + k }, { replace: true })
    setHistTab(k)
  }
  // 원금 유지의 '인출 내역 ›' — 인출 탭을 열고 거래·신청 내역 박스로 부드럽게 스크롤(원본 goHist)
  const goWithdraw = () => {
    pickHistTab('withdraw')
    scrollToHist()
  }

  // 신청 창 — 접수 결과를 내역에 올리고, 계좌 개설은 시연 상태를 '심사 중'으로 바꿈
  // TODO: 8번째 부분에서 상단 종 알림에 '입고 신청 · …' / '매도 신청 · …' / '인출 신청 · …' 1건 추가(내역 보기로 해당 탭 이동)
  const goHist = (tab: HistTab) => {
    setApplyKind(null)
    setSellOpen(false)
    pickHistTab(tab)
    scrollToHist()
  }
  const finishOpen = () => {
    setApplyKind(null)
    RD.setDemo({ account: 'reviewing' })
    showToast('계좌 개설 신청이 접수됐어요')
  }
  const cancelOpen = () => {
    RD.setDemo({ account: 'none' })
    showToast('계좌 개설 신청을 취소했어요')
  }

  // PDF 받기 — 발급 기록 맨 앞에 오늘 날짜로 추가
  const issue = (name: string) => {
    setIssued((prev) => [[F.short(RD.C.BUSINESS_DATE), name], ...prev])
    showToast(name + ' PDF를 받았어요 · 발급 기록에 추가했어요')
  }
  const reissue = (name: string) => showToast(name + ' PDF를 다시 받았어요')

  return (
    <>
      <h1 className={styles.srOnly}>내 계좌</h1>
      {opened && <Tabs variant="page" ariaLabel="내 계좌 화면" items={PAGE_TABS} value={page} onChange={setPage} />}

      {!opened && <AccountStateBox onOpen={() => setApplyKind('open')} onCancel={cancelOpen} />}

      {opened && page === 'status' && (
        <div className={styles.status}>
          <div className={styles.colLeft}>
            <AccountSummaryBox className={styles.summary} onCopy={copyAcct} onApply={(k) => (k === 'sell' ? setSellOpen(true) : setApplyKind(k))} />
            <AccountLimitBox className={styles.limit} onApply={() => setSellOpen(true)} />
            {/* TODO: 8번째 부분에서 챗봇 창이 생기면, 계산 근거를 열 때 챗봇 창을 닫기(원본 openCalc) */}
            <AccountTaxBox className={styles.tax} onOpenCalc={() => setCalcOpen(true)} />
            <AccountHoldBox className={styles.hold} onHistory={goWithdraw} />
            <AccountDocsBox className={styles.docs} issued={issued} onIssue={issue} onReissue={reissue} />
          </div>
          <div className={styles.colRight}>
            <AccountBalanceBox className={styles.balance} onSell={() => setSellOpen(true)} />
            <AccountHistBox className={styles.hist} tab={histTab} onTab={pickHistTab} onApplyIn={() => setApplyKind('in')} onApplyOut={() => setApplyKind('out')} addedIn={addedIn} addedOut={addedOut} addedSell={addedSell} addedSettle={addedSettle} />
          </div>
        </div>
      )}

      {opened && page === 'flow' && (
        <div className={styles.flow}>
          <div className={styles.asOf}>{F.asOf(RD.C.BUSINESS_DATE)} · 매일 새벽 집계</div>
          <FlowStepsBox />
          <div className={styles.flowGrid}>
            <FlowMonthlyBox />
            <div className={styles.flowSide}>
              <FlowAllocBox />
              <FlowCutBox />
            </div>
          </div>
        </div>
      )}

      <p className={styles.foot}>{opened && page === 'flow' ? FOOT_FLOW : FOOT_STATUS}</p>
      {applyKind && (
        <ApplyModal
          kind={applyKind}
          onClose={() => setApplyKind(null)}
          onGoHist={goHist}
          onSubmitIn={(rows) => setAddedIn((prev) => [...rows, ...prev])}
          onSubmitOut={(amt) => setAddedOut((prev) => [{ amt }, ...prev])}
          onFinishOpen={finishOpen}
        />
      )}
      {sellOpen && (
        <SellModal
          onClose={() => setSellOpen(false)}
          onGoHist={() => goHist('sells')}
          onSubmit={(sells, settle) => {
            setAddedSell((prev) => [...sells, ...prev])
            setAddedSettle((prev) => [settle, ...prev])
          }}
        />
      )}
      <TaxCalcModal open={calcOpen} onClose={() => setCalcOpen(false)} />
      <Toast message={toast} />
    </>
  )
}
