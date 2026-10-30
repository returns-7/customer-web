import { RETURNS_DATA as RD } from '../../data/returns'
import { F } from '../../lib/calc'
import { currentAdj } from './accountTaxData'
import type { Tone } from './accountData'

// 자금 흐름 탭 네 박스의 숫자 — 원본 renderVals의 fl 계산 그대로(값은 src/data·src/lib에서, 주식 패키지·계좌 현황과 같은 데이터)

const tone = (n: number): Tone => (n > 0 ? 'up' : n < 0 ? 'down' : 'flat')

// 업종 이름을 데이터(RD.KR)에서 못 찾는 국내 패키지 종목 9개의 업종 — 원본 account 화면 안의 예시 값
// TODO: 백엔드 연결 시 종목 마스터(DOMESTIC_PRODUCT)에서 업종 받아오기
const EXT_SECTOR: Record<string, string> = {
  '042700': '반도체',
  '058470': '반도체',
  '240810': '반도체',
  '055550': '금융',
  '033780': '음식료',
  '017670': '통신',
  '012330': '자동차',
  '204320': '자동차',
  '018880': '자동차'
}

// ---- 돌아온 돈의 흐름 ----
export interface FlowStep {
  name: string
  amt: string
  note: string
  noteTone: Tone
}

export function flowSteps(): { steps: FlowStep[]; cash: string; formula: string } {
  const FL = RD.FLOW
  const DT = RD.DATES
  const won = F.won
  const plain = (name: string, v: number, note: string): FlowStep => ({ name, amt: '₩' + won(v), note, noteTone: 'flat' })
  return {
    steps: [
      plain('해외주식 매도', FL.inflow, F.short(DT.filled) + ' 체결'),
      plain('원화 확정', FL.inflow, F.short(DT.confirmed) + ' · 1년 유지 시작'),
      plain('국내 매수', FL.buyCost, '누적 원가'),
      { name: '국내 운용 중', amt: '₩' + won(FL.evalAmt), note: '평가 · ' + (FL.pnl >= 0 ? '+' : '-') + won(Math.abs(FL.pnl)), noteTone: tone(FL.pnl) },
      plain('인출', FL.withdrawn, '인출 가능일 ' + F.dot(RD.WITHDRAW.availableDate))
    ],
    cash: won(FL.cash),
    formula: '원화 확정 ' + won(FL.inflow) + ' − 국내 매수 ' + won(FL.buyCost) + ' + 국내 매도 ' + won(FL.sold) + ' − 인출 ' + won(FL.withdrawn)
  }
}

// ---- 월별 흐름 ----
// 막대 네 종류(이름, 색 토큰) — 원본 SER 순서
export const MONTH_SERIES: { key: 'inflow' | 'buy' | 'sell' | 'out'; label: string; color: string }[] = [
  { key: 'inflow', label: '원화 유입', color: 'var(--color-navy)' },
  { key: 'buy', label: '국내 매수', color: 'var(--color-gold)' },
  { key: 'sell', label: '국내 매도', color: 'var(--color-muted)' },
  { key: 'out', label: '인출', color: 'var(--color-line-strong)' }
]

export interface MonthBar {
  color: string
  h: string // 막대 높이(퍼센트 또는 값이 0일 때 2px)
  v: string
}

export interface MonthView {
  label: string
  inflow: string
  buy: string
  sell: string
  out: string
  bars: MonthBar[]
}

export function monthlyFlow(): MonthView[] {
  const monthly = RD.FLOW.monthly
  const mx = Math.max(1, ...monthly.map((m) => Math.max(m.inflow, m.buy)))
  return monthly.map((m) => {
    // TODO: 백엔드 연결 시 국내 매도·인출 월별 값 받아오기(지금은 매도·인출 내역이 없어 0)
    const v = { inflow: m.inflow, buy: m.buy, sell: 0, out: 0 }
    return {
      label: m.month.replace('-', '.'),
      inflow: F.won(v.inflow),
      buy: F.won(v.buy),
      sell: '0',
      out: '0',
      bars: MONTH_SERIES.map((s) => ({ color: s.color, h: v[s.key] ? ((v[s.key] / mx) * 88).toFixed(2) + '%' : '2px', v: v[s.key] ? F.man(v[s.key]) : '0' }))
    }
  })
}

// ---- 어디에 운용하고 있나 ----
export interface AllocItem {
  label: string
  color: string
  amt: string
  pct: string
}

export interface AllocView {
  donut: string
  total: string
  items: AllocItem[]
  sectors: { n: number; label: string; amt: string; pct: string }[]
}

export function allocValues(): AllocView {
  const FL = RD.FLOW
  const isEtf = (c: string) => !!RD.KR_ETF[c]
  const rows = RD.KR_HOLDINGS.map((h) => ({ code: h.code, v: (RD.PX[h.code] || [0, 0])[0] * h.qty }))
  const etfV = rows.filter((r) => isEtf(r.code)).reduce((a, r) => a + r.v, 0)
  const krSum = rows.reduce((a, r) => a + r.v, 0)
  const stockV = krSum - etfV
  const allocT = stockV + etfV + FL.cash
  const AL: [string, number, string][] = [
    ['국내 주식', stockV, 'var(--color-navy)'],
    ['국내 ETF', etfV, 'var(--color-gold)'],
    ['예수금', FL.cash, 'var(--color-line-strong)']
  ]
  let acc = 0
  const donut =
    'conic-gradient(' +
    AL.map(([, v, c]) => {
      const a0 = acc
      acc += (v / allocT) * 100
      return c + ' ' + a0.toFixed(2) + '% ' + acc.toFixed(2) + '%'
    }).join(', ') +
    ')'

  const sectorOf = (c: string) => (isEtf(c) ? '배당 ETF' : RD.KR[c] ? RD.KR[c][0] : EXT_SECTOR[c] || '기타')
  const bySector: Record<string, number> = {}
  rows.forEach((r) => {
    const k = sectorOf(r.code)
    bySector[k] = (bySector[k] || 0) + r.v
  })
  const top = Object.entries(bySector)
    .sort((x, y) => y[1] - x[1])
    .slice(0, 3)

  return {
    donut,
    total: F.man(allocT),
    items: AL.map(([label, v, color]) => ({ label, color, amt: F.won(v), pct: Math.round((v / allocT) * 100) + '%' })),
    sectors: top.map(([label, v], i) => ({ n: i + 1, label, amt: F.man(v), pct: Math.round((v / FL.evalAmt) * 100) + '%' }))
  }
}

// ---- 감면과 국내 운용 ----
export function cutVsInvest(): { cut: string; evalAmt: string; ratio: string } {
  const benX = RD.BENEFIT_STATE === 'IMPOSSIBLE'
  const t0 = F.tax(0, RD.C.BUSINESS_DATE, currentAdj())
  return {
    cut: F.won(benX ? 0 : t0.cut),
    evalAmt: F.won(RD.FLOW.evalAmt),
    ratio: benX || !t0.cut ? '-' : String(Math.round(RD.FLOW.evalAmt / t0.cut))
  }
}
