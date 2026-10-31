import { RETURNS_DATA as RD } from '../../data/returns'
import { F } from '../../lib/calc'
import { splitPercent } from './investChartLogic'
import type { OrderView } from './investHoldingData'
import type { PkgBase, PkgView } from './investPkgLogic'

// ───── 주문 창(매수·매도) 계산 — 원본 renderVals의 tr 부분 ─────

export type TradeSide = 'buy' | 'sell'
export type QtyMode = 'qty' | 'amt'

export interface TradeState {
  code: string
  side: TradeSide
  qtyMode: QtyMode
  input: string // 숫자만(최대 11자리)
}

export const openTradeState = (code: string, side: TradeSide): TradeState => ({ code, side, qtyMode: 'qty', input: '' })

// 입력 글자에서 숫자만, 최대 11자리
export const cleanInput = (v: string): string => v.replace(/\D/g, '').slice(0, 11)

const pInt = (v: string): number => parseInt(v.replace(/\D/g, ''), 10) || 0

export interface TradeCalc {
  price: number
  chg: number
  buy: boolean
  sellable: number
  maxBuy: number
  qty: number
  amount: number
  fee: number
  tax: number
  total: number
  err: string
  ok: boolean
  weightBefore: number
  weightAfter: number
  target: number
  cashAfter: number
  typed: number // 입력한 숫자(천 단위 표시용)
}

// 같은 종목·같은 입력이면 원본과 같은 값이 나오도록 계산 순서와 반올림을 그대로 따른다
export function tradeCalc(t: TradeState, pkg: PkgView, cash: number): TradeCalc {
  const FEE = RD.C.FEE_RATE
  const price = RD.PX[t.code]?.[0] ?? 0
  const chg = RD.PX[t.code]?.[1] ?? 0
  const buy = t.side === 'buy'
  const items = pkg.items
  const idx = items.findIndex((i) => i.code === t.code)
  const it = idx >= 0 ? items[idx] : { qty: 0, val: 0, target: 0 }
  const sellable = it.qty
  const n0 = pInt(t.input)
  const qty = t.qtyMode === 'qty' ? n0 : price ? Math.floor(n0 / price) : 0
  const amount = qty * price
  const fee = Math.round(amount * FEE)
  const tax = buy ? 0 : Math.round(amount * RD.C.SELL_TAX_RATE)
  const total = buy ? amount + fee : amount - fee - tax
  const maxBuy = price ? Math.floor(cash / (price * (1 + FEE))) : 0
  const err = !qty ? '' : buy ? (amount + fee > cash ? '주문 가능 금액을 넘었어요 · 최대 ' + maxBuy + '주까지 살 수 있어요' : '') : qty > sellable ? '매도 가능 수량을 넘었어요 · 최대 ' + sellable + '주까지 팔 수 있어요' : ''
  // 주문 후 이 종목 비중
  const dv = qty * price * (buy ? 1 : -1)
  const after = items.map((i) => (i.code === t.code ? Math.max(0, i.val + dv) : i.val))
  if (idx < 0) after.push(Math.max(0, dv))
  const wA = splitPercent(after)
  const wB = splitPercent(items.map((i) => i.val))
  return {
    price,
    chg,
    buy,
    sellable,
    maxBuy,
    qty,
    amount,
    fee,
    tax,
    total,
    err,
    ok: qty > 0 && !err && price > 0,
    weightBefore: idx >= 0 ? wB[idx] : 0,
    weightAfter: wA[idx >= 0 ? idx : wA.length - 1] || 0,
    target: it.target || 0,
    cashAfter: buy ? cash - total : cash + total,
    typed: n0
  }
}

// 빠른 선택(10% · 25% · 50% · 최대)이 채우는 입력값
export const QUICK: [number, string][] = [
  [10, '10%'],
  [25, '25%'],
  [50, '50%'],
  [100, '최대']
]

export function quickInput(t: TradeState, c: TradeCalc, percent: number): string {
  const base = c.buy ? c.maxBuy : c.sellable
  const q = Math.floor((base * percent) / 100)
  return t.qtyMode === 'qty' ? String(q) : String(q * c.price)
}

// ───── 주문 체결(원본 place) ─────

export interface NewOrder {
  code: string
  side: TradeSide
  qty: number
}

// 체결 시각 표시 'MM.DD HH:mm' — 날짜는 업무일, 시·분은 지금 시각(원본 clock)
export function orderClock(): string {
  const d = new Date()
  return F.short(F.today()) + ' ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0')
}

export interface FilledOrder {
  code: string
  side: TradeSide
  qty: number
  price: number
}

// 체결 한 건이 주문 가능 금액을 바꾸는 값: 매수는 금액+수수료만큼 줄고, 매도는 금액-수수료-세금만큼 늘어난다
export function cashDelta(o: FilledOrder): number {
  const amount = o.qty * o.price
  const fee = Math.round(amount * RD.C.FEE_RATE)
  return o.side === 'buy' ? -(amount + fee) : amount - fee - Math.round(amount * RD.C.SELL_TAX_RATE)
}

// 체결된 주문으로 보유 주 수·평균 매입가를 바꾼 새 목록(받은 값은 건드리지 않음). 매수는 평균 매입가를 반올림해 다시 계산
export function applyOrders(bases: PkgBase[], pkgId: string, list: FilledOrder[]): PkgBase[] {
  return bases.map((p) => {
    if (p.id !== pkgId) return p
    let items = p.items.slice()
    list.forEach((o) => {
      const amount = o.qty * o.price
      items = items.map((it) => {
        if (it.code !== o.code) return it
        if (o.side === 'buy') {
          const q = it.qty + o.qty
          return { ...it, qty: q, avg: Math.round((it.avg * it.qty + amount) / q) }
        }
        return { ...it, qty: Math.max(0, it.qty - o.qty) }
      })
      if (o.side === 'buy' && !items.some((it) => it.code === o.code)) items = items.concat([{ code: o.code, qty: o.qty, avg: o.price, target: 0 }])
    })
    return { ...p, items }
  })
}

// 주문 내역에 쌓을 줄(수량 0 이하는 만들지 않음, 가격은 주문 시점 현재가)
export function makeOrders(list: NewOrder[], pkg: string, nextId: () => string, rejected: boolean): OrderView[] {
  return list
    .filter((o) => o.qty > 0)
    .map((o) => ({ id: nextId(), pkg, time: orderClock(), code: o.code, side: o.side, qty: o.qty, price: RD.PX[o.code]?.[0] ?? 0, status: rejected ? 'reject' : 'done' }))
}

// ───── 패키지 한 번에 사기 — 원본 renderVals의 pl(bulk) 부분 ─────

export interface BulkRow {
  code: string
  target: number
  qty: number // 살 주 수(목표 비중대로 계산, 1주 미만은 0)
  amount: number
}

export interface BulkCalc {
  amt: number
  rows: BulkRow[]
  sum: number
  fee: number
  total: number
  left: number // 남는 금액
  err: string
  ok: boolean
  count: number // 주문 건수(살 주 수가 1 이상인 종목)
}

// 살 금액 × 목표 비중 ÷ 현재가를 내림해 종목별 주 수를 정한다(원본 그대로)
export function bulkCalc(pkg: PkgView, input: string, cash: number): BulkCalc {
  const FEE = RD.C.FEE_RATE
  const amt = pInt(input)
  const rows = pkg.items.map((it) => {
    const price = RD.PX[it.code]?.[0] ?? 0
    const qty = price ? Math.floor((amt * it.target) / 100 / price) : 0
    return { code: it.code, target: it.target, qty, amount: qty * price }
  })
  const sum = rows.reduce((a, r) => a + r.amount, 0)
  const fee = rows.reduce((a, r) => a + Math.round(r.amount * FEE), 0)
  const total = sum + fee
  const err = total > cash ? '주문 가능 금액(₩' + F.won(cash) + ')을 넘었어요' : ''
  return { amt, rows, sum, fee, total, left: Math.max(0, amt - sum), err, ok: total > 0 && !err, count: rows.filter((r) => r.qty > 0).length }
}

// "주문 가능 전부": 수수료까지 합쳐 주문 가능 금액을 넘지 않는 가장 큰 살 금액
export const bulkAll = (cash: number): string => String(Math.floor(cash / (1 + RD.C.FEE_RATE)))
