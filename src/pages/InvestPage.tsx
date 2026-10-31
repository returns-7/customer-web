import { useMemo, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { Tabs } from '../components/common/Tabs'
import { InvestAssetsBox } from '../components/invest/InvestAssetsBox'
import { InvestOrders } from '../components/invest/InvestOrders'
import { InvestPkgDetail } from '../components/invest/InvestPkgDetail'
import { InvestPkgList } from '../components/invest/InvestPkgList'
import { InvestRec } from '../components/invest/InvestRec'
import type { RecFilter } from '../components/invest/investRecData'
import { seedOrders } from '../components/invest/investHoldingData'
import { buildPkgViews, sortViews } from '../components/invest/investPkgLogic'
import type { PkgSort } from '../components/invest/investPkgLogic'
import styles from '../components/invest/InvestLayout.module.css'

type InvestTab = 'mine' | 'rec'

const TABS = [
  { key: 'mine', label: '나만의 주식 패키지' },
  { key: 'rec', label: '성향별 추천' }
]

// 주식 패키지 — 1~4번째 부분: 페이지 틀·탭 + 패키지 자산 + 내 패키지 목록 + 패키지 상세(머리·수치·위험 요약·종목 비중·수익률 차트·보유 종목 표) + 주문 내역 + 성향별 추천 탭(추천 목록·내 추천 기준)
export function InvestPage() {
  const { hash, search } = useLocation()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const tab: InvestTab = hash === '#recommend' ? 'rec' : 'mine'

  const views = useMemo(() => buildPkgViews(), [])
  const [sort, setSort] = useState<PkgSort>('ret')
  const rows = useMemo(() => sortViews(views, sort), [views, sort])

  // 선택한 패키지는 주소(?pkg=)에 남김 — 없거나 모르는 값이면 첫 패키지
  const pkgParam = params.get('pkg')
  const selected = views.some((v) => v.id === pkgParam) ? (pkgParam as string) : views[0].id

  // 성향별 추천: 분류·펼친 종목은 탭을 오가도 유지(원본 state)
  const [recFilter, setRecFilter] = useState<RecFilter>('all')
  const [recOpen, setRecOpen] = useState<string | null>(null)

  const cur = views.find((v) => v.id === selected) ?? views[0]
  const orders = useMemo(() => seedOrders(), []) // TODO: P-6에서 새 주문이 쌓이는 상태로 교체

  // 탭 전환은 기록을 쌓지 않고 바꿈(원본 replaceState): 추천은 #recommend, 나만의 패키지는 해시 없이 현재 쿼리 유지
  const pickTab = (key: string) => navigate({ pathname: '/invest', search, hash: key === 'rec' ? '#recommend' : '' }, { replace: true })

  return (
    <>
      <h1 className={styles.srOnly}>주식 패키지</h1>
      <Tabs variant="page" ariaLabel="주식 패키지 화면" items={TABS} value={tab} onChange={pickTab} />

      {tab === 'mine' && (
        <div className={styles.mine}>
          <div className={styles.colLeft}>
            <InvestAssetsBox className={styles.assets} views={views} />
            <InvestPkgList className={styles.list} rows={rows} sort={sort} onSort={setSort} selected={selected} onSelect={(id) => setParams({ pkg: id }, { replace: true })} />
          </div>
          <div className={styles.colRight}>
            <InvestPkgDetail pkg={cur} />
            <InvestOrders orders={orders.filter((o) => o.pkg === cur.id)} />
          </div>
        </div>
      )}

      {tab === 'rec' && <InvestRec filter={recFilter} onFilter={setRecFilter} open={recOpen} onOpen={setRecOpen} />}
    </>
  )
}
