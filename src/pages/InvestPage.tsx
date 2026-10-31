import { useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { Tabs } from '../components/common/Tabs'
import type { BotMessage } from '../components/common/ChatbotFab'
import { Toast } from '../components/common/Toast'
import { useToast } from '../components/common/useToast'
import { RETURNS_DATA as RD } from '../data/returns'
import type { DemoSettings } from '../data/returns'
import { F } from '../lib/calc'
import { useAppShell } from '../layouts/appShell'
import { InvestAssetsBox } from '../components/invest/InvestAssetsBox'
import { InvestDevPanel } from '../components/invest/InvestDevPanel'
import { InvestDialog } from '../components/invest/InvestDialog'
import type { DialogState } from '../components/invest/InvestDialog'
import { InvestOrders } from '../components/invest/InvestOrders'
import { InvestAddPanel } from '../components/invest/InvestAddPanel'
import { InvestBulkPanel } from '../components/invest/InvestBulkPanel'
import { InvestPkgDetail } from '../components/invest/InvestPkgDetail'
import { InvestNewPkg } from '../components/invest/InvestNewPkg'
import { InvestPkgList } from '../components/invest/InvestPkgList'
import { InvestRec } from '../components/invest/InvestRec'
import { InvestTradePanel } from '../components/invest/InvestTradePanel'
import { InvestUnsuitDialog } from '../components/invest/InvestUnsuitDialog'
import type { UnsuitState } from '../components/invest/InvestUnsuitDialog'
import { BOT_CHIPS, botGreeting, botTurn } from '../components/invest/investBotLogic'
import type { ChkDemo, RejectReason } from '../components/invest/investDevData'
import { emptyAdd, pctInt } from '../components/invest/investAddLogic'
import type { AddState } from '../components/invest/investAddLogic'
import type { RecFilter } from '../components/invest/investRecData'
import { isSuitable, seedOrders } from '../components/invest/investHoldingData'
import type { OrderView } from '../components/invest/investHoldingData'
import { applyOrders, cashDelta, makeOrders, openTradeState } from '../components/invest/investOrderLogic'
import type { BulkCalc, NewOrder, TradeCalc, TradeSide, TradeState } from '../components/invest/investOrderLogic'
import { buyCalc, makePkgBase, nmFromUrl, openNewPkg } from '../components/invest/investNewPkgLogic'
import type { NewPkgState, NmBuyRow } from '../components/invest/investNewPkgLogic'
import { buildPkgBases, sortViews, viewOf } from '../components/invest/investPkgLogic'
import type { PkgSort } from '../components/invest/investPkgLogic'
import styles from '../components/invest/InvestLayout.module.css'

type InvestTab = 'mine' | 'rec'

// 거부 창 문구에 들어가는 값: 필요한 금액 · 팔 수 있는 최대 주 수
interface PlaceCtx {
  need?: number
  max?: number
}

const TABS = [
  { key: 'mine', label: '나만의 주식 패키지' },
  { key: 'rec', label: '성향별 추천' }
]

// 주식 패키지 — 1~9번째 부분: 페이지 틀·탭 + 패키지 자산 + 내 패키지 목록 + 패키지 상세(머리·수치·위험 요약·종목 비중·수익률 차트·보유 종목 표) + 주문 내역 + 성향별 추천 탭 + 매수·매도 주문 창·성향 초과 확인 창 + 패키지 한 번에 사기·종목 추가 창·패키지 고르기 + 새 패키지 만들기 창 + 이름 바꾸기·삭제·상담 창·시연 설정·주문 거부 사유·주소로 열기
export function InvestPage() {
  const { hash, search } = useLocation()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const tab: InvestTab = hash === '#recommend' ? 'rec' : 'mine'

  const shell = useAppShell()
  const { message, showToast } = useToast()

  // 시연 설정(성향·성향 상태)이 바뀌면 다시 그림(원본 returns-demo 이벤트)
  const [, redraw] = useReducer((n: number) => n + 1, 0)
  useEffect(() => {
    window.addEventListener('returns-demo', redraw)
    return () => window.removeEventListener('returns-demo', redraw)
  }, [])

  // 보유·주문 상태는 원본처럼 이 페이지 안에서만 유지(새로고침하면 처음 값). TODO: 백엔드 연결 시 패키지·주문 가능 금액·주문 내역 API로 교체
  const [bases, setBases] = useState(buildPkgBases)
  const [cash, setCash] = useState(RD.ASSETS.cash)
  const [orders, setOrders] = useState<OrderView[]>(seedOrders)
  const [ordOpen, setOrdOpen] = useState(true)
  const [alertN, setAlertN] = useState(0)
  const [unsuit, setUnsuit] = useState<Record<string, string>>({}) // 내 성향보다 위험한 종목을 확인한 날짜
  // 오른쪽 창은 한 번에 하나만(원본 panel): 주문 · 패키지 한 번에 사기(살 금액) · 종목 추가
  const [trade, setTrade] = useState<TradeState | null>(null)
  const [bulk, setBulk] = useState<string | null>(null)
  // 주소로 열기(원본 init): ?new=1(&ask=말)이면 새 패키지 창, 아니고 ?add=1이면 종목 추가 창. 이 화면에 들어올 때 한 번만 봄
  const [nm, setNm] = useState<NewPkgState | null>(() => (params.get('new') === '1' ? nmFromUrl(params.get('ask')) : null)) // 새 패키지 창
  const [add, setAdd] = useState<AddState | null>(() => (params.get('new') !== '1' && params.get('add') === '1' ? emptyAdd() : null))
  // 시연 설정 중 이 화면 안에서만 쓰는 값
  const [noCand, setNoCand] = useState(false)
  const [chkDemo, setChkDemo] = useState<ChkDemo | null>(null)
  const [rejNext, setRejNext] = useState<RejectReason | null>(null)
  const rejRef = useRef(rejNext) // 다시 시도할 때 이미 지워진 값을 읽도록 가장 최근 값을 들고 있음
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

  // 끼루 AI 상담 창 — 내용은 AppLayout의 챗봇 버튼에 넘기고, 이 페이지를 떠나면 비움
  const [bot, setBot] = useState<BotMessage[]>(() => [botGreeting()])
  const chat = useMemo(
    () => ({ simple: true, listMaxHeight: 320, messages: bot, chips: BOT_CHIPS.map((label) => ({ label, onClick: () => setBot((b) => b.concat(botTurn(label, views, cur, cash))) })), onSend: () => {} }),
    [bot, views, cur, cash]
  )
  useEffect(() => {
    shell.setChat(chat)
  }, [shell, chat])
  useEffect(() => {
    rejRef.current = rejNext
  })
  useEffect(
    () => () => {
      shell.setChat(null)
      shell.setBotOpen(false)
      shell.setTopBar({})
    },
    [shell]
  )

  const closePanel = () => {
    setTrade(null)
    setBulk(null)
    setAdd(null)
  }
  const openAdd = (patch?: Partial<AddState>) => {
    closePanel()
    setAdd({ ...emptyAdd(), ...patch })
  }

  // Esc: 가장 위에 있는 창부터 하나씩 닫음(성향 확인 → 확인 창 → 주문 창)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (uf) setUf(null)
      else if (dlg) setDlg(null)
      else if (trade || bulk !== null || add) closePanel()
      else if (nm) setNm(null)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [uf, dlg, trade, bulk, add, nm])

  // 내 성향보다 위험한 종목이면 한 번 확인받고 이어감(이미 확인한 종목·성향 안 종목은 바로 이어감)
  const gate = (codes: string[], then: () => void) => {
    const need = codes.filter((c) => !isSuitable(c) && !unsuit[c])
    if (!need.length) then()
    else setUf({ codes: need, agree: false, then })
  }

  // 거부 창(원본 rejDlg): 사유마다 문구와 링크가 다름. 링크는 창을 닫고 이어서 할 일을 함
  const rejectDialog = (rj: RejectReason, ctx: PlaceCtx, retry: () => void): DialogState => {
    const R: Record<RejectReason, [string, string, () => void]> = {
      NOT_ELIGIBLE: [
        'RIA 계좌에서 살 수 없는 상품이에요 · 국내주식 비중 40% (80% 이상 필요)',
        '살 수 있는 ETF 보기 ›',
        () => {
          setDlg(null)
          navigate({ pathname: '/invest', search, hash: '' }, { replace: true })
          openAdd({ q: 'ETF' })
        }
      ],
      INSUFFICIENT_CASH: ['주문 가능 금액이 부족해요 · 필요 ₩' + F.won(ctx.need || 0) + ' / 주문 가능 ₩' + F.won(cash), '수량 줄이기 ›', () => setDlg(null)],
      INSUFFICIENT_QTY: ['매도 가능 수량보다 많아요 · 최대 ' + (ctx.max || 0) + '주', '수량 줄이기 ›', () => setDlg(null)],
      ACCOUNT_NOT_OPEN: ['계좌가 개설된 뒤 주문할 수 있어요', '내 계좌 ›', () => navigate('/account')],
      PRICE_UNAVAILABLE: [
        '지금은 가격을 불러올 수 없어요 · 잠시 후 다시 시도해 주세요',
        '다시 시도',
        () => {
          setDlg(null)
          retry()
        }
      ]
    }
    const [body, linkLabel, onLink] = R[rj]
    return { title: '주문이 거부됐어요', reject: { linkLabel, onLink }, body }
  }

  // 주문은 시장가로 바로 체결(체결 완료 / 거부). 거부(시연 '다음 주문 거부 사유' 또는 계좌 미개설)면 주문 내역에 '거부'로 남기고 거부 창을 띄운 뒤 false
  // TODO: 백엔드 연결 시 주문 API 호출로 교체
  const place = (list: NewOrder[], pkgId: string, ctx: PlaceCtx = {}): boolean => {
    const rj: RejectReason | null = rejRef.current || (RD.ACCOUNT_STATE !== 'opened' ? 'ACCOUNT_NOT_OPEN' : null)
    const made = makeOrders(list, pkgId, () => 'o' + ++nextId.current, rj !== null)
    if (!made.length) return true
    setOrders((o) => made.concat(o))
    setOrdOpen(true)
    if (rj) {
      setRejNext(null)
      rejRef.current = null
      setAlertN((n) => n + 1)
      setDlg(
        rejectDialog(rj, ctx, () => {
          if (place(list, pkgId, ctx)) closePanel()
        })
      )
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
          if (place([{ code: t.code, side: t.side, qty: c.qty }], cur.id, { need: c.total, max: c.sellable })) closePanel()
        }
      })
    if (buy) gate([t.code], confirm)
    else confirm()
  }

  const openTrade = (code: string, side: TradeSide) => {
    closePanel()
    setTrade(openTradeState(code, side))
  }

  // 패키지 한 번에 사기: 주문 버튼 → (성향 밖 종목이 있으면 확인) → 주문 확인 창
  const submitBulk = (c: BulkCalc) => {
    const buys = c.rows.filter((r) => r.qty > 0)
    gate(
      buys.map((r) => r.code),
      () =>
        setDlg({
          title: '패키지를 한 번에 살까요?',
          rows: buys.map((r): [string, string] => [RD.SN[r.code] || r.code, r.qty + '주 · ₩' + F.won(r.amount)]).concat([
            ['수수료', '₩' + F.won(c.fee)],
            ['합계', '₩' + F.won(c.total)]
          ]),
          okLabel: c.count + '건 주문',
          okTone: 'navy',
          onOk: () => {
            if (place(buys.map((r) => ({ code: r.code, side: 'buy', qty: r.qty })), cur.id, { need: c.total })) closePanel()
          }
        })
    )
  }

  // 종목 추가: 사지 않고 목표 비중만 정해 패키지에 담음(보유 0주). 비중 맞추기 단계면 다른 종목 목표도 함께 바뀜
  const addItem = (code: string, target: number, adj: Record<string, string> | null) => {
    setBases((b) =>
      b.map((p) => (p.id !== cur.id ? p : { ...p, items: p.items.map((i) => ({ ...i, target: adj ? pctInt(adj[i.code]) : i.target })).concat([{ code, qty: 0, avg: 0, target }]) }))
    )
    setAdd((a) => (a ? { ...a, pick: null, pct: '', adj: null } : a))
    showToast((RD.SN[code] || code) + '을(를) 담았어요 · 표의 [매수]로 살 수 있어요', 2200)
  }

  // 새 패키지 만들기: 목표 비중만 정해 보유 0주로 만들고(맨 앞·최신순·선택), 사기로 이어졌으면 바로 주문
  // TODO: 백엔드 연결 시 패키지 생성 API 호출로 교체
  const makePkg = (buy: NmBuyRow[] | null) => {
    if (!nm) return
    const id = 'p' + Date.now()
    const created = Math.max(0, ...bases.map((p) => p.created)) + 1
    setBases((b) => [makePkgBase(id, nm.name, nm.w, created, 3 + Math.floor(Math.random() * 40))].concat(b))
    setSort('new')
    setParams({ pkg: id }, { replace: true })
    setNm(null)
    if (buy) place(buy.filter((r) => r.q > 0).map((r): NewOrder => ({ code: r.code, side: 'buy', qty: r.q })), id, { need: buyCalc(nm.w, nm.amt, cash).total })
    else showToast('패키지를 만들었어요', 2200)
  }

  // 이름 바꾸기: 비어 있으면 그대로 두고, 20자까지(입력칸에서 이미 자름)
  const renamePkg = (name: string) => setBases((b) => b.map((p) => (p.id === cur.id ? { ...p, name } : p)))

  // 삭제: 하나뿐이면 막고, 아니면 확인 후 지움(보유 종목은 계좌에 남음). 지운 뒤에는 남은 첫 패키지가 선택됨
  const askDelete = () => {
    if (views.length <= 1) {
      showToast('패키지가 하나뿐이라 삭제할 수 없어요', 2200)
      return
    }
    const id = cur.id
    setDlg({
      title: '"' + cur.name + '" 패키지를 삭제할까요?',
      body: '패키지를 삭제해도 보유 종목은 계좌에 그대로 남아요',
      okLabel: '삭제',
      okTone: 'navy',
      onOk: () => {
        setBases((b) => b.filter((p) => p.id !== id))
        showToast('패키지를 삭제했어요', 2200)
      }
    })
  }

  const changeDemo = (patch: Partial<DemoSettings>) => {
    RD.setDemo(patch)
    redraw()
  }

  // 추천 탭 "패키지에 담기": 성향 밖이면 확인 → 어느 패키지에 담을지 → 그 패키지의 종목 추가 창(이미 담긴 패키지면 고르기 없이 검색만)
  const pickPackage = (code: string) =>
    gate([code], () =>
      setDlg({
        title: '어느 패키지에 담을까요?',
        body: (RD.SN[code] || code) + ' · 목표 비중은 다음 화면에서 정해요',
        choices: views.map((v) => {
          const has = v.items.some((i) => i.code === code)
          return {
            name: v.name,
            sub: v.items.length + '종목 · 최고 ' + (F.pkgGrade(v.items) || '-') + '등급',
            act: has ? '담겨 있음' : '담기 ›',
            go: () => {
              setDlg(null)
              navigate({ pathname: '/invest', search: '?pkg=' + v.id, hash: '' }, { replace: true })
              openAdd({ q: RD.SN[code] || code, pick: has ? null : code })
            }
          }
        })
      })
    )

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
            <InvestPkgList className={styles.list} rows={rows} sort={sort} onSort={setSort} selected={selected} onSelect={(id) => setParams({ pkg: id }, { replace: true })} onNew={() => setNm(openNewPkg())} />
          </div>
          <div className={styles.colRight}>
            <InvestPkgDetail pkg={cur} unsuit={unsuit} onTrade={openTrade} onBuy={() => { closePanel(); setBulk('') }} onAdd={() => openAdd()} onRename={renamePkg} onDelete={askDelete} />
            <InvestOrders orders={orders.filter((o) => o.pkg === cur.id)} open={ordOpen} onOpen={setOrdOpen} />
          </div>
        </div>
      )}

      {tab === 'rec' && <InvestRec filter={recFilter} onFilter={setRecFilter} open={recOpen} onOpen={setRecOpen} onAdd={pickPackage} />}

      {trade && <InvestTradePanel trade={trade} pkg={cur} cash={cash} onChange={(patch) => setTrade({ ...trade, ...patch })} onClose={closePanel} onSubmit={(c) => submitTrade(trade, c)} />}
      {bulk !== null && <InvestBulkPanel pkg={cur} cash={cash} amt={bulk} onAmt={setBulk} onClose={closePanel} onSubmit={submitBulk} />}
      {add && (
        <InvestAddPanel
          pkg={cur}
          add={add}
          onChange={(patch) => setAdd({ ...add, ...patch })}
          onClose={closePanel}
          onPick={(code) => gate([code], () => setAdd((a) => (a ? { ...a, pick: code, pct: '', adj: null } : a)))}
          onAdd={addItem}
        />
      )}
      {nm && (
        <InvestNewPkg
          nm={nm}
          cash={cash}
          onPatch={(p) => setNm((n) => (n ? { ...n, ...(typeof p === 'function' ? p(n) : p) } : n))}
          onClose={() => setNm(null)}
          onMake={makePkg}
          onDialog={setDlg}
          noCand={noCand}
          chkDemo={chkDemo}
        />
      )}
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
      <InvestDevPanel onChange={changeDemo} noCand={noCand} onNoCand={setNoCand} chk={chkDemo} onChk={setChkDemo} rej={rejNext} onRej={setRejNext} />
      <Toast message={message} />
    </>
  )
}
