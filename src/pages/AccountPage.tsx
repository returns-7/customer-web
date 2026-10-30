import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { AccountBalanceBox } from '../components/account/AccountBalanceBox'
import { AccountDocsBox } from '../components/account/AccountDocsBox'
import { AccountHoldBox } from '../components/account/AccountHoldBox'
import { AccountLimitBox } from '../components/account/AccountLimitBox'
import { AccountTaxBox } from '../components/account/AccountTaxBox'
import { TaxCalcModal } from '../components/account/TaxCalcModal'
import { initialIssued } from '../components/account/accountTaxData'
import type { IssueRecord } from '../components/account/accountTaxData'
import { AccountStateBox } from '../components/account/AccountStateBox'
import { AccountSummaryBox } from '../components/account/AccountSummaryBox'
import { APPLY_TOAST, FOOT_FLOW, FOOT_STATUS, PAGE_TABS } from '../components/account/accountData'
import type { PageKey } from '../components/account/accountData'
import styles from '../components/account/AccountLayout.module.css'
import { Box } from '../components/common/Box'
import { Tabs } from '../components/common/Tabs'
import { Toast } from '../components/common/Toast'
import { useToast } from '../components/common/useToast'
import { RETURNS_DATA as RD } from '../data/returns'
import { F } from '../lib/calc'

// 내 계좌 — 1~3번째 부분: 뼈대·페이지 탭·계좌 요약·계좌 상태 + 매도 한도·세액·원금 유지·증빙서류 + 잔고. 나머지 박스는 머리줄 제목만 있는 자리
export function AccountPage() {
  const { hash, pathname } = useLocation()
  const navigate = useNavigate()
  const { message: toast, showToast } = useToast()

  const [calcOpen, setCalcOpen] = useState(false)
  const [issued, setIssued] = useState<IssueRecord[]>(initialIssued)

  const opened = RD.ACCOUNT_STATE === 'opened'
  const page: PageKey = opened && hash === '#flow' ? 'flow' : 'status'

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
  const later = () => showToast(APPLY_TOAST)

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

      {!opened && <AccountStateBox onOpen={later} onCancel={later} />}

      {opened && page === 'status' && (
        <div className={styles.status}>
          <div className={styles.colLeft}>
            <AccountSummaryBox className={styles.summary} onCopy={copyAcct} onApply={later} />
            <AccountLimitBox className={styles.limit} onApply={later} />
            {/* TODO: 8번째 부분에서 챗봇 창이 생기면, 계산 근거를 열 때 챗봇 창을 닫기(원본 openCalc) */}
            <AccountTaxBox className={styles.tax} onOpenCalc={() => setCalcOpen(true)} />
            <AccountHoldBox className={styles.hold} onHistory={later} />
            <AccountDocsBox className={styles.docs} issued={issued} onIssue={issue} onReissue={reissue} />
          </div>
          <div className={styles.colRight}>
            <AccountBalanceBox className={styles.balance} onSell={later} />
            <Box data-box="hist" className={styles.hist} title="거래·신청 내역" />
          </div>
        </div>
      )}

      {opened && page === 'flow' && (
        <div className={styles.flow}>
          <div className={styles.asOf}>{F.asOf(RD.C.BUSINESS_DATE)} · 매일 새벽 집계</div>
          <Box data-box="flow" title="돌아온 돈의 흐름" />
          <div className={styles.flowGrid}>
            <Box data-box="monthly" title="월별 흐름" />
            <div className={styles.flowSide}>
              <Box data-box="alloc" title="어디에 운용하고 있나" />
              <Box data-box="cut-vs-invest" title="감면과 국내 운용" />
            </div>
          </div>
        </div>
      )}

      <p className={styles.foot}>{opened && page === 'flow' ? FOOT_FLOW : FOOT_STATUS}</p>
      <TaxCalcModal open={calcOpen} onClose={() => setCalcOpen(false)} />
      <Toast message={toast} />
    </>
  )
}
