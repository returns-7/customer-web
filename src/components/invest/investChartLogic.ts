import { RETURNS_DATA as RD } from '../../data/returns'
import { getBusinessToday } from '../../lib/clock'
import { series } from './investPkgLogic'
import type { PkgView } from './investPkgLogic'

// ───── 종목 비중(도넛·줄) ─────

// 도넛 조각 색(원본 SHADES): 종목 수에 맞춰 5단계에서 고름
export const DONUT_SHADES = ['var(--color-navy)', 'var(--color-donut-2)', 'var(--color-donut-3)', 'var(--color-donut-4)', 'var(--color-line-strong)']
export const shadeOf = (i: number, n: number): string => DONUT_SHADES[n <= 1 ? 0 : Math.round((i * 4) / (n - 1))]

// 합이 정확히 100.0이 되도록 소수 첫째 자리로 나눔(원본 lr1: 큰 소수부부터 0.1씩 보탬)
function splitPercent(vals: number[]): number[] {
  const tot = vals.reduce((a, b) => a + b, 0)
  if (!tot) return vals.map(() => 0)
  const raw = vals.map((v) => (v / tot) * 1000)
  const fl = raw.map(Math.floor)
  let left = 1000 - fl.reduce((a, b) => a + b, 0)
  raw
    .map((x, i) => [x - fl[i], i] as const)
    .sort((a, b) => b[0] - a[0])
    .forEach(([, i]) => {
      if (left > 0) {
        fl[i]++
        left--
      }
    })
  return fl.map((v) => v / 10)
}

export interface WeightRow {
  code: string
  name: string
  frac: number // 평가금액 비율(도넛 각도용, 0~1)
  w: number // 지금 비중 %
  target: number // 목표 비중 %
  shade: string
  tone: 'up' | 'down' | 'flat' // 목표와 2%p 이상 벌어졌을 때 위(많음)·아래(적음)
}

// 평가금액이 있는 종목만, 목록 순서 그대로(원본 live/legend)
export function weightRowsOf(pkg: PkgView): WeightRow[] {
  const w = splitPercent(pkg.items.map((i) => i.val))
  const live = pkg.items.map((it, i) => ({ it, w: w[i] })).filter((x) => x.it.val > 0)
  return live.map(({ it, w: wi }, i) => ({
    code: it.code,
    name: RD.SN[it.code] || it.code,
    frac: it.val / (pkg.val || 1),
    w: wi,
    target: it.target,
    shade: shadeOf(i, live.length),
    tone: Math.abs(wi - it.target) >= 2 ? (wi > it.target ? 'up' : 'down') : 'flat'
  }))
}

// ───── 패키지 수익률 차트 ─────

export type RangeKey = '1w' | '1m' | '3m'
export const RANGES: [RangeKey, string][] = [
  ['1w', '1주'],
  ['1m', '1개월'],
  ['3m', '3개월']
]
const RANGE_DAYS: Record<RangeKey, number> = { '1w': 7, '1m': 30, '3m': 90 }

export const CHART_W = 600
export const CHART_H = 160

const fp1 = (v: number) => (v > 0 ? '+' : '') + v.toFixed(1) + '%'
const fp2 = (v: number) => (v > 0 ? '+' : '') + v.toFixed(2) + '%'

export interface ChartData {
  count: number
  pts: string
  y0: string
  yTop: string
  yMid: string
  yBot: string
  xs: { label: string; left: string; shift: string }[]
  at: (i: number) => { x: string; y: string; date: string; val: string; shift: string }
}

// 선택한 기간의 값들로 선·축·마우스 올림 표시를 계산(원본 renderVals의 수익률 선 부분)
export function chartOf(pkg: PkgView, range: RangeKey): ChartData {
  // TODO: 백엔드 연결 시 패키지 수익률 이력 API로 교체(지금은 원본처럼 seed로 정해지는 예시 값)
  const sl = series(pkg.seed || 7, pkg.ret).slice(-RANGE_DAYS[range])
  let mn = Math.min(0, ...sl)
  let mx = Math.max(0, ...sl)
  const pad = (mx - mn) * 0.12 || 1
  mn -= pad
  mx += pad
  const Y = (v: number) => CHART_H - ((v - mn) / (mx - mn)) * CHART_H
  const X = (i: number) => (i / (sl.length - 1)) * CHART_W
  const [yy, mm, dd] = getBusinessToday().split('-').map(Number)
  const base = Date.UTC(yy, mm - 1, dd)
  const dAt = (i: number) => {
    const d = new Date(base - (sl.length - 1 - i) * 864e5)
    return String(d.getUTCMonth() + 1).padStart(2, '0') + '.' + String(d.getUTCDate()).padStart(2, '0')
  }
  const last = sl.length - 1
  return {
    count: sl.length,
    pts: sl.map((v, i) => X(i).toFixed(1) + ',' + Y(v).toFixed(1)).join(' '),
    y0: Y(0).toFixed(1),
    yTop: fp1(mx),
    yMid: fp1((mx + mn) / 2),
    yBot: fp1(mn),
    xs: [0, Math.round(last / 3), Math.round((last * 2) / 3), last].map((i, k) => ({
      label: dAt(i),
      left: ((i / last) * 100).toFixed(1) + '%',
      shift: k === 0 ? '0' : k === 3 ? '-100%' : '-50%'
    })),
    at: (i) => ({
      x: ((i / last) * 100).toFixed(2) + '%',
      y: ((Y(sl[i]) / CHART_H) * 100).toFixed(2) + '%',
      date: dAt(i),
      val: fp2(sl[i]),
      shift: i / last > 0.7 ? 'calc(-100% - 8px)' : '8px'
    })
  }
}
