import { RETURNS_DATA as RD } from '../../data/returns'
import { F } from '../../lib/calc'
import type { Tone } from './accountData'

export type BalTab = 'kr' | 'fr'
export type SortKey = 'val' | 'pnl' | 'ret'
export interface KrSort {
  k: SortKey
  d: 1 | -1 // -1 내림차순(▼), 1 오름차순(▲)
}

export const DEFAULT_SORT: KrSort = { k: 'val', d: -1 }
export const RISK_TIP = '1 매우 높은 위험 ~ 6 매우 낮은 위험 · 리턴증권 자체 산정'

// 표에 보이는 위험 등급 짧은 이름(원본 그대로)
const RISK_SHORT: Record<number, string> = { 1: '매우 높음', 2: '높음', 3: '다소 높음', 4: '보통', 5: '낮음', 6: '매우 낮음' }

const tone = (n: number): Tone => (n > 0 ? 'up' : n < 0 ? 'down' : 'flat')
const sg = (n: number): string => (n > 0 ? '+' : n < 0 ? '-' : '')

export interface KrRow {
  code: string
  qty: number
  sell: number
  sellLess: boolean // 매도 가능이 보유보다 적으면 강조
  avg: string
  px: string
  chg: string
  chgTone: Tone
  val: string
  v: number
  pnlN: number
  retN: number
  pnl: string
  ret: string
  pnlTone: Tone
  risk: string
}

export interface KrBalance {
  rows: KrRow[]
  sum: string
  tot: { val: string; pnl: string; ret: string; tone: Tone }
}

// 국내 주식 탭 — 원본 renderVals의 krAll·krTot 계산 그대로(주식 패키지와 같은 RD.KR_HOLDINGS·RD.PX)
export function krBalance(sort: KrSort): KrBalance {
  const all = RD.KR_HOLDINGS.map((h): KrRow => {
    const [px, ch] = RD.PX[h.code] || [0, 0]
    const v = px * h.qty
    const pnlN = v - h.cost
    const retN = h.cost ? (pnlN / h.cost) * 100 : 0
    const gr = F.meta(h.code).grade
    // 원본은 매도 가능 주 수를 보유 주 수 그대로 둠(데이터에 미체결 매도 주문이 없음)
    // TODO: 백엔드 연결 시 미체결 매도 수량을 빼기
    const sell = h.qty
    return {
      code: h.code,
      qty: h.qty,
      sell,
      sellLess: sell < h.qty,
      avg: F.won(h.avg),
      px: F.won(px),
      chg: F.pct(ch),
      chgTone: tone(ch),
      val: F.won(v),
      v,
      pnlN,
      retN,
      pnl: sg(pnlN) + F.won(Math.abs(pnlN)),
      ret: F.pct(retN),
      pnlTone: tone(pnlN),
      risk: gr == null ? '-' : gr + ' ' + RISK_SHORT[gr]
    }
  })
  const field = { val: 'v', pnl: 'pnlN', ret: 'retN' } as const
  const rows = all.slice().sort((x, y) => (x[field[sort.k]] - y[field[sort.k]]) * sort.d)
  const val = all.reduce((a, r) => a + r.v, 0)
  const cost = RD.KR_HOLDINGS.reduce((a, h) => a + h.cost, 0)
  const pnl = all.reduce((a, r) => a + r.pnlN, 0)
  return {
    rows,
    sum: F.won(val),
    tot: { val: F.won(val), pnl: sg(pnl) + F.won(Math.abs(pnl)), ret: F.pct(cost ? (pnl / cost) * 100 : 0), tone: tone(pnl) }
  }
}

export interface FrRow {
  t: string
  qty: number
  px: string
  val: string
  rate: string
}

// 입고 해외주식 탭
export function frBalance(): { rows: FrRow[]; sum: string } {
  return {
    rows: RD.C.HOLDINGS.map((h) => ({ t: h.t, qty: h.qty, px: F.won(h.price), val: F.won(h.price * h.qty), rate: F.pct(h.rate * 100).replace('.00', '') })),
    sum: F.won(RD.ASSETS.foreignHeld)
  }
}
