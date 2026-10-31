import { RETURNS_DATA as RD, demo } from '../../data/returns'
import { F } from '../../lib/calc'
import { infoOf, isSuitable, riskLabel } from './investHoldingData'
import { series } from './investPkgLogic'

export type RecFilter = 'all' | 'stock' | 'etf'

export const REC_FILTERS: [RecFilter, string][] = [
  ['all', '전체'],
  ['stock', '주식'],
  ['etf', 'ETF']
]

// 성향별 추천 후보(원본 REC_EXT): 성향마다 6개. 화면에서 RIA 계좌에서 살 수 있고 성향 범위 안인 것만 다시 거름
// TODO: 백엔드 연결 시 성향별 추천 API 응답으로 교체
const REC_EXT: Record<string, string[]> = {
  active: ['005930', '900020', '005380', '900010', '000270', '105560'],
  aggressive: ['900030', '000660', '900020', '005930', '373220', '000270']
}

// 추천 이유 문구(원본 REC_TXT: 이 화면 우선 → 홈 추천 설명 → REC_WHY)
// TODO: 백엔드 연결 시 추천 이유 API 응답으로 교체
const REC_TXT: Record<string, string> = {
  '900030': '국내 반도체 대형주 10종목에 나눠 투자하는 ETF예요. 위험 1등급(매우 높은 위험) · 과거 3년 연 변동성 45%예요.',
  '000660': '메모리 반도체 매출 비중이 높은 회사예요. 위험 2등급(높은 위험) · 과거 3년 연 변동성 34%예요.',
  '373220': '2차전지 테마의 국내 대형주예요. 위험 2등급(높은 위험) · 과거 3년 연 변동성 42%예요.',
  '900020': '배당 성향이 높은 국내 주식에 나눠 투자하는 ETF예요. 위험 3등급(다소 높은 위험) · 과거 3년 연 변동성 15%예요.',
  '005380': '자동차 테마의 국내 대형주예요. 위험 2등급(높은 위험) · 과거 3년 연 변동성 41%예요.',
  '900010': '국내 대형주 200종목에 나눠 투자하는 ETF예요. 위험 2등급(높은 위험) · 과거 3년 연 변동성 21%예요.',
  '000270': '자동차 테마의 국내 대형주예요. 위험 2등급(높은 위험) · 과거 3년 연 변동성 48%예요.'
}
const REC_WHY: Record<string, string> = {
  '900010': '국내 대형주 200종목에 나눠 투자해서 한 종목 쏠림이 적어요.',
  '000270': '배당수익률이 높은 편(5.1%, 예시)이고 보유하신 해외 자동차주와 업종이 이어져요.',
  '105560': '분기 배당을 하고 주주환원 정책을 발표했어요. 관심 종목과 같은 배당 업종이에요.',
  '373220': '2차전지 테마의 국내 대형주예요. 위험 2등급(높은 위험) · 과거 3년 연 변동성 42%예요.'
}

// 홈 추천 설명(원본 REC[c].extra)
const homeExtra = (code: string): string | undefined => [...RD.recsFor('aggressive'), ...RD.recsFor('active')].find((r) => r.code === code)?.extra

export interface RecRow {
  code: string
  px: number
  chg: number
  risk: string
  reason: string
  facts: [string, string][]
  grade: string
  basis: string
  asOf: string
  points: string // 최근 30일 그래프 점들(300×96)
  r30: number
}

export interface RecState {
  profile: string
  sub: string // 제목 옆 안내
  emptyTitle: string
  off: boolean
  expired: boolean
  none: boolean // 진단 없음(미진단)
  hasAll: boolean // 성향 범위 안에서 살 수 있는 후보가 하나라도 있는지
  rows: RecRow[]
  profLine: string
  assess: string
  rules: string[]
  offMsg: string
  offBtn: string
}

function rowOf(code: string): RecRow {
  const chg = (RD.PX[code] || [0, 0])[1]
  const sr = series(parseInt(code.slice(-3), 10) || 7, chg * 4).slice(-30)
  const mn = Math.min(...sr)
  const mx = Math.max(...sr)
  const rg = mx - mn || 1
  const info = infoOf(code)
  return {
    code,
    px: (RD.PX[code] || [0, 0])[0],
    chg,
    risk: riskLabel(code),
    reason: REC_TXT[code] || homeExtra(code) || REC_WHY[code] || '',
    facts: info.facts,
    grade: info.grade,
    basis: info.basis,
    asOf: info.asOf,
    points: sr.map((y, i) => ((i / (sr.length - 1)) * 300).toFixed(1) + ',' + (90 - ((y - mn) / rg) * 84).toFixed(1)).join(' '),
    r30: sr[sr.length - 1] - sr[0]
  }
}

// 성향별 추천 화면 상태 — 내 성향(시연 설정)과 진단 상태에서 매번 계산(원본 rc)
export function recStateOf(filter: RecFilter): RecState {
  const profile = RD.CUSTOMER.profile
  const label = RD.PROFILES[profile].label
  const allow = F.allowedLabel(profile)
  const assess = demo().assess || 'ok'
  const off = assess === 'expired' || assess === 'none'
  const all = (REC_EXT[profile] || []).filter((c) => F.meta(c).riaOk && isSuitable(c))
  const list = all.filter((c) => filter === 'all' || (filter === 'etf') === !!RD.ETF[c])
  return {
    profile,
    sub: label + ' · ' + allow + ' 안에서',
    emptyTitle: label + '은 ' + allow + ' 상품을 추천받을 수 있어요.',
    off,
    expired: assess === 'expired',
    none: assess === 'none',
    hasAll: all.length > 0,
    rows: list.map(rowOf),
    profLine: assess === 'none' ? '미진단' : label + ' · ' + allow,
    assess: '진단일 ' + F.dot(RD.ASSESSMENT.date) + ' · ' + F.dot(RD.ASSESSMENT.validUntil) + '까지 유효',
    rules: ['내 성향 허용 등급(' + allow + ') 안', 'RIA 계좌에서 살 수 있는 상품', '보유 해외주식·관심 종목과 업종을 참고', '과거 3년 시세로 위험등급을 계산한 상품만'],
    offMsg: assess === 'none' ? '투자성향을 진단하면 성향에 맞는 범위 안에서 추천을 받을 수 있어요.' : '진단 유효기간이 지나 추천을 보여드릴 수 없어요.',
    offBtn: assess === 'none' ? '진단하기' : '다시 진단하기'
  }
}
