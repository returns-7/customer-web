import { RETURNS_DATA as RD } from '../../data/returns'
import { F } from '../../lib/calc'

export type PkgSort = 'ret' | 'new'

export interface PkgItemView {
  code: string
  qty: number
  val: number
  cost: number
  today: number
  target: number // 목표 비중 %
}

// 패키지 한 개의 평가 결과(원본 view) — 숫자는 RD.PKG_HOLDINGS(보유 주 수 × 현재가)에서 계산
export interface PkgView {
  id: string
  made?: string // 새로 만든 패키지의 만든 날 'YYYY.MM.DD'(없으면 예시 데이터의 만든 날)
  name: string
  seed: number
  created: number // 클수록 최근에 만든 패키지
  items: PkgItemView[]
  val: number
  cost: number
  pnl: number
  ret: number
  today: number
  todayPct: number
  grade: string
}

// 부호 문자열(0은 빈 문자열)
export const sign = (n: number): string => (n > 0 ? '+' : n < 0 ? '-' : '')

// 값 부호에 따른 색 클래스 키(상승 up · 하락 down · 보합 flat)
export const toneOf = (n: number): 'up' | 'down' | 'flat' => (n > 0 ? 'up' : n < 0 ? 'down' : 'flat')

// 가중평균 위험등급: 평가금액 가중, 소수 셋째 자리 이하 버림(원본 wAvg)
function weightedGrade(items: PkgItemView[]): string {
  const total = items.reduce((a, i) => a + i.val, 0)
  if (!total) return '-'
  const sum = items.reduce((a, i) => a + (F.meta(i.code).grade ?? 0) * i.val, 0)
  return (Math.floor((sum / total) * 100) / 100).toFixed(2)
}

// 패키지 한 개의 보유 상태(원본 state.pkgs) — 주문이 체결되면 보유 주 수·평균 매입가가 바뀐다
export interface PkgBaseItem {
  code: string
  qty: number
  avg: number
  target: number
}

export interface PkgBase {
  id: string
  made?: string
  name: string
  seed: number
  created: number
  items: PkgBaseItem[]
}

// TODO: 백엔드 연결 시 패키지 목록 API 응답으로 교체(지금은 RD.PKGS 순서 = 최근 만든 순)
export function buildPkgBases(): PkgBase[] {
  return RD.PKGS.map((p, i) => ({
    id: p.id,
    name: p.name,
    seed: p.seed,
    created: RD.PKGS.length - i,
    items: RD.PKG_HOLDINGS[p.id].map((h) => ({ code: h.code, qty: h.qty, avg: h.avg, target: h.target }))
  }))
}

export function viewOf(b: PkgBase): PkgView {
  const items = b.items.map((h) => {
    const [px, chg] = RD.PX[h.code] ?? [0, 0]
    const val = h.qty * px
    return { code: h.code, qty: h.qty, val, cost: h.qty * h.avg, today: Math.round((val * chg) / (100 + chg)), target: h.target }
  })
  const val = items.reduce((a, i) => a + i.val, 0)
  const cost = items.reduce((a, i) => a + i.cost, 0)
  const today = items.reduce((a, i) => a + i.today, 0)
  return {
    id: b.id,
    made: b.made,
    name: b.name,
    seed: b.seed,
    created: b.created,
    items,
    val,
    cost,
    pnl: val - cost,
    ret: cost ? ((val - cost) / cost) * 100 : 0,
    today,
    todayPct: val - today ? (today / (val - today)) * 100 : 0,
    grade: weightedGrade(items)
  }
}

export function sortViews(views: PkgView[], sort: PkgSort): PkgView[] {
  return views.slice().sort(sort === 'ret' ? (a, b) => b.ret - a.ret : (a, b) => b.created - a.created)
}

// 패키지 자산 박스 합계(원본 as)
export function totalsOf(views: PkgView[]) {
  const val = views.reduce((a, v) => a + v.val, 0)
  const cost = views.reduce((a, v) => a + v.cost, 0)
  const today = views.reduce((a, v) => a + v.today, 0)
  return {
    val,
    cost,
    pnl: val - cost,
    ret: cost ? ((val - cost) / cost) * 100 : 0,
    today,
    todayPct: val - today ? (today / (val - today)) * 100 : 0
  }
}

// 예시 수익률 곡선(원본 series): seed로 정해지는 90일 값
export function series(seed: number, ret: number): number[] {
  let x = (seed * 7919 + 13) % 233280
  const rnd = () => (x = (x * 9301 + 49297) % 233280) / 233280
  const N = 90
  const w = [0]
  for (let i = 1; i <= N; i++) w.push(w[i - 1] + (rnd() - 0.5) * 0.9)
  return w.map((v, i) => (ret * i) / N + (v - (w[N] * i) / N))
}

// 목록 행의 64×22 작은 그래프 점들(최근 30일)
export function sparkPoints(seed: number, ret: number): string {
  const v = series(seed, ret).slice(-30)
  const mn = Math.min(...v)
  const mx = Math.max(...v)
  const r = mx - mn || 1
  return v.map((y, i) => ((i / (v.length - 1)) * 62 + 1).toFixed(1) + ',' + (21 - ((y - mn) / r) * 20).toFixed(1)).join(' ')
}

// RD.KR·KR_ETF에 없는 국내 종목의 [업종, 대표색, 이니셜](원본 EXT) — 값은 StockLabel 종목표와 같음
export const EXT_STOCK: Record<string, [string, string, string]> = {
  '042700': ['반도체', '#0B3D91', 'H'],
  '058470': ['반도체', '#1F6FB2', 'L'],
  '240810': ['반도체', '#00599C', 'W'],
  '055550': ['금융', '#0046FF', 'S'],
  '033780': ['음식료', '#C8102E', 'K'],
  '017670': ['통신', '#EA002C', 'SK'],
  '012330': ['자동차', '#002C5F', 'M'],
  '204320': ['자동차', '#00467F', 'HL'],
  '018880': ['자동차', '#E2231A', 'H']
}

// 목록 행의 겹친 종목 아이콘 3개 [대표색, 이니셜] — 색은 RD.KR·KR_ETF, 없으면 EXT_STOCK
export function iconsOf(v: PkgView): [string, string][] {
  return v.items.slice(0, 3).map((it) => {
    const k = RD.KR[it.code] || RD.KR_ETF[it.code]
    if (k) return [k[1], k[2]]
    const x = EXT_STOCK[it.code]
    return x ? [x[1], x[2]] : ['#9AA4B2', String(RD.SN[it.code] || it.code)[0]]
  })
}

// 패키지 상세 윗부분(P-2) 표시용 값
export interface PkgDetailInfo {
  made: string // 만든 날 'YYYY.MM.DD'
  vol: string // 패키지 연 변동성(없으면 '-')
  profRange: string // 예: '적극투자형, 2등급까지'
  outCount: number // 내 성향 범위를 벗어난 종목 수
}

// TODO: 백엔드 연결 시 패키지 응답의 생성일로 교체(지금은 원본 MADE_IDX — RD.DATES.buys 순번)
const MADE_IDX: Record<string, number> = { 'semi-chain': 0, 'steady-div': 2, 'auto-parts': 3 }

// TODO: 백엔드 연결 시 패키지 변동성 API 값으로 교체(지금은 원본 PKG_VOL 예시, 과거 3년)
const PKG_VOL: Record<string, string> = { 'semi-chain': '38%' }

export function detailOf(v: PkgView): PkgDetailInfo {
  const prof = RD.CUSTOMER.profile
  const allow = F.allowedLabel(prof)
  return {
    made: v.made ?? F.dot(RD.DATES.buys[MADE_IDX[v.id] || 0]),
    vol: PKG_VOL[v.id] || '-',
    profRange: RD.PROFILES[prof].label + ', ' + ((allow.match(/\d+/) || ['-'])[0]) + '등급까지',
    outCount: v.items.filter((i) => !F.suitable(F.meta(i.code).grade ?? null, prof)).length
  }
}
