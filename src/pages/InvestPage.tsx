import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { Tabs } from '../components/common/Tabs'
import { Toast } from '../components/common/Toast'
import { useToast } from '../components/common/useToast'
import { RETURNS_DATA as RD } from '../data/returns'
import type { PackageId } from '../data/returns'
import { F } from '../lib/calc'
import { useAppShell } from '../layouts/appShell'
import { InvestAssetsBox } from '../components/invest/InvestAssetsBox'
import { InvestDialog } from '../components/invest/InvestDialog'
import type { DialogState } from '../components/invest/InvestDialog'
import { InvestOrders } from '../components/invest/InvestOrders'
import { InvestPkgDetail } from '../components/invest/InvestPkgDetail'
import { InvestPkgList } from '../components/invest/InvestPkgList'
import { InvestRec } from '../components/invest/InvestRec'
import { InvestTradePanel } from '../components/invest/InvestTradePanel'
import { InvestUnsuitDialog } from '../components/invest/InvestUnsuitDialog'
import type { UnsuitState } from '../components/invest/InvestUnsuitDialog'
import type { RecFilter } from '../components/invest/investRecData'
import { isSuitable, seedOrders } from '../components/invest/investHoldingData'
import type { OrderView } from '../components/invest/investHoldingData'
import { applyOrders, cashDelta, makeOrders, openTradeState } from '../components/invest/investOrderLogic'
import type { NewOrder, TradeCalc, TradeSide, TradeState } from '../components/invest/investOrderLogic'
import { buildPkgBases, sortViews, viewOf } from '../components/invest/investPkgLogic'
import type { PkgSort } from '../components/invest/investPkgLogic'
import styles from '../components/invest/InvestLayout.module.css'

type InvestTab = 'mine' | 'rec'

const TABS = [
  { key: 'mine', label: '나만의 주식 패키지' },
  { key: 'rec', label: '성향별 추천' }
]

// 주식 패키지 — 1~6번째 부분: 페이지 틀·탭 + 패키지 자산 + 내 패키지 목록 + 패키지 상세(머리·수치·위험 요약·종목 비중·수익률 차트·보유 종목 표) + 주문 내역 + 성향별 추천 탭 + 매수·매도 주문 창과 성향 초과 확인 창
export function InvestPage() {
  const { hash, search } = useLocation()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const tab: InvestTab = hash === '#recommend' ? 'rec' : 'mine'

  const shell = useAppShell()
  const { message, showToast } = useToast()

  // 보유·주문 상태는 원본처럼 이 페이지 안에서만 유지(새로고침하면 처음 값). TODO: 백엔드 연결 시 패키지·주문 가능 금액·주문 내역 API로 교체
  const [bases, setBases] = useState(buildPkgBases)
  const [cash, setCash] = useState(RD.ASSETS.cash)
  const [orders, setOrders] = useState<OrderView[]>(seedOrders)
  const [ordOpen, setOrdOpen] = useState(true)
  const [alertN, setAlertN] = useState(0)
  const [unsuit, setUnsuit] = useState<Record<string, string>>({}) // 내 성향보다 위험한 종목을 확인한 날짜
  const [trade, setTrade] = useState<TradeState | null>(null)
  const [dlg, setDlg] = useState<DialogState | null>(null)
  const [uf, setUf] = useState<UnsuitState | null>(null)
  const nextId = useRef(orders.length)

  const views = useMemo(() => bases.map(viewOf), [bases])
  const [sort, setSort] = useState<PkgSort>('ret')
  const rows = useMemo(() => sortViews(views, sort), [views, sort])

  // 선택한 패키지는 주소(?pkg=)에 남김 — 없거나 모르는 값이면 첫 패키지
  const pkgParam = params.get('pkg')
  const selected = views.some((v) => v.id === pkgParam) ? (pkgParam as string) : views[0].id

  // 성향별 추천: 분류·펼친 종목은 탭을 오가도 유지(원본 state)
  const [recFilter, setRecFilter] = useState<RecFilter>('all')
  const [recOpen, setRecOpen] = useState<string | null>(null)

  const cur = views.find((v) => v.id === selected) ?? views[0]

  // 상단 바 종 알림: 주문(체결·거부)마다 1씩 늘어남. 이 화면을 떠나면 비움
  const profLabel = RD.PROFILES[RD.CUSTOMER.profile]?.label
  useEffect(() => {
    shell.setTopBar({ todoAlert: alertN, profLabel })
  }, [alertN, profLabel, shell])
  useEffect(() => () => shell.setTopBar({}), [shell])

  // Esc: 가장 위에 있는 창부터 하나씩 닫음(성향 확인 → 확인 창 → 주문 창)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (uf) setUf(null)
      else if (dlg) setDlg(null)
      else if (trade) setTrade(null)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [uf, dlg, trade])

  // 내 성향보다 위험한 종목이면 한 번 확인받고 이어감(이미 확인한 종목·성향 안 종목은 바로 이어감)
  const gate = (codes: string[], then: () => void) => {
    const need = codes.filter((c) => !isSuitable(c) && !unsuit[c])
    if (!need.length) then()
    else setUf({ codes: need, agree: false, then })
  }

  // 주문은 시장가로 바로 체결(체결 완료 / 거부). 거부(계좌 미개설)면 주문 내역에 '거부'로 남기고 거부 창을 띄운 뒤 false
  // TODO: 백엔드 연결 시 주문 API 호출로 교체
  const place = (list: NewOrder[], pkgId: PackageId): boolean => {
    const rejected = RD.ACCOUNT_STATE !== 'opened'
    const made = makeOrders(list, pkgId, () => 'o' + ++nextId.current, rejected)
    if (!made.length) return true
    setOrders((o) => made.concat(o))
    setOrdOpen(true)
    if (rejected) {
      setAlertN((n) => n + 1)
      setDlg({
        title: '주문이 거부됐어요',
        reject: { linkLabel: '내 계좌 ›', onLink: () => navigate('/account') },
        body: '계좌가 개설된 뒤 주문할 수 있어요'
      })
      return false
    }
    setBases((b) => applyOrders(b, pkgId, made))
    setCash((c) => c + made.reduce((sum, o) => sum + cashDelta(o), 0))
    setAlertN((n) => n + made.length)
    showToast(made.length > 1 ? made.length + '건 체결 완료' : (RD.SN[made[0].code] || made[0].code) + ' ' + made[0].qty + '주 ' + (made[0].side === 'buy' ? '매수' : '매도') + ' 체결 완료', 2200)
    return true
  }

  // 주문 버튼 → 주문 확인 창(매수는 그 전에 성향 확인)
  const submitTrade = (t: TradeState, c: TradeCalc) => {
    const buy = t.side === 'buy'
    const label = buy ? '매수' : '매도'
    const confirm = () =>
      setDlg({
        title: label + ' 주문을 넣을까요?',
        rows: [
          ['종목', (RD.SN[t.code] || t.code) + ' ' + t.code],
          ['구분', label + ' · 시장가'],
          ['수량', c.qty + '주'],
          ['예상 체결가', '₩' + F.won(c.price)],
          ['수수료', '₩' + F.won(c.fee)],
          ['세금', buy ? '₩0' : '₩' + F.won(c.tax) + ' · ' + RD.C.SELL_TAX_LABEL],
          ['합계', '₩' + F.won(c.total)]
        ],
        okLabel: label + ' 주문',
        okTone: buy ? 'up' : 'down',
        onOk: () => {
          if (place([{ code: t.code, side: t.side, qty: c.qty }], cur.id)) setTrade(null)
        }
      })
    if (buy) gate([t.code], confirm)
    else confirm()
  }

  const openTrade = useCallback((code: string, side: TradeSide) => setTrade(openTradeState(code, side)), [])

  // 탭 전환은 기록을 쌓지 않고 바꿈(원본 replaceState): 추천은 #recommend, 나만의 패키지는 해시 없이 현재 쿼리 유지
  const pickTab = (key: string) => navigate({ pathname: '/invest', search, hash: key === 'rec' ? '#recommend' : '' }, { replace: true })

  return (
    <>
      <h1 className={styles.srOnly}>주식 패키지</h1>
      <Tabs variant="page" ariaLabel="주식 패키지 화면" items={TABS} value={tab} onChange={pickTab} />

      {tab === 'mine' && (
        <div className={styles.mine}>
          <div className={styles.colLeft}>
            <InvestAssetsBox className={styles.assets} views={views} cash={cash} />
            <InvestPkgList className={styles.list} rows={rows} sort={sort} onSort={setSort} selected={selected} onSelect={(id) => setParams({ pkg: id }, { replace: true })} />
          </div>
          <div className={styles.colRight}>
            <InvestPkgDetail pkg={cur} unsuit={unsuit} onTrade={openTrade} />
            <InvestOrders orders={orders.filter((o) => o.pkg === cur.id)} open={ordOpen} onOpen={setOrdOpen} />
          </div>
        </div>
      )}

      {tab === 'rec' && <InvestRec filter={recFilter} onFilter={setRecFilter} open={recOpen} onOpen={setRecOpen} />}

      {trade && <InvestTradePanel trade={trade} pkg={cur} cash={cash} onChange={(patch) => setTrade({ ...trade, ...patch })} onClose={() => setTrade(null)} onSubmit={(c) => submitTrade(trade, c)} />}
      {dlg && <InvestDialog dialog={dlg} onClose={() => setDlg(null)} />}
      {uf && (
        <InvestUnsuitDialog
          state={uf}
          onToggle={() => setUf({ ...uf, agree: !uf.agree })}
          onCancel={() => setUf(null)}
          onOk={() => {
            if (!uf.agree) return
            const d = F.today()
            setUnsuit((u) => ({ ...u, ...Object.fromEntries(uf.codes.map((c) => [c, d])) }))
            setUf(null)
            uf.then()
          }}
        />
      )}
      <Toast message={message} />
    </>
  )
}
