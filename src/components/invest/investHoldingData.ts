import { RETURNS_DATA as RD } from '../../data/returns'
import type { PackageId } from '../../data/returns'
import { F } from '../../lib/calc'

// 종목 펼침 정보용 예시 값(원본 INFO): [시가총액, PER, 배당수익률, 52주 최저, 52주 최고]
// TODO: 백엔드 연결 시 종목 시세·재무 API 응답으로 교체
const INFO: Record<string, [string, string, string, string, string]> = {
  '005380': ['52조 원', '5.1배', '4.8%', '196,000', '268,000'],
  '000270': ['47조 원', '4.6배', '5.1%', '89,400', '124,500'],
  '068270': ['40조 원', '38.2배', '0.3%', '161,000', '209,500'],
  '207940': ['76조 원', '61.4배', '-', '881,000', '1,104,000'],
  '373220': ['90조 원', '112.0배', '-', '312,000', '421,000'],
  '035420': ['34조 원', '18.9배', '0.6%', '158,000', '236,500'],
  '105560': ['39조 원', '6.3배', '3.2%', '68,200', '102,400'],
  '005490': ['28조 원', '17.5배', '2.9%', '286,000', '398,000'],
  '042700': ['10조 원', '35.4배', '0.4%', '68,900', '129,800'],
  '058470': ['2.8조 원', '24.1배', '1.6%', '148,200', '214,000'],
  '240810': ['1.6조 원', '29.7배', '0.3%', '24,850', '39,100'],
  '055550': ['29조 원', '5.9배', '4.0%', '44,300', '61,200'],
  '033780': ['13조 원', '11.8배', '4.6%', '89,700', '118,300'],
  '017670': ['10조 원', '9.4배', '6.8%', '46,250', '56,400'],
  '012330': ['25조 원', '6.2배', '1.9%', '208,000', '284,500'],
  '204320': ['1.8조 원', '8.7배', '1.3%', '29,100', '45,650'],
  '018880': ['2.8조 원', '-', '0.5%', '3,885', '6,120']
}

// ETF 구성 상위 3종목(예시, 원본 ETF_TOP)
const ETF_TOP: Record<string, string> = {
  '900010': '삼성전자 · SK하이닉스 · 현대차',
  '900020': 'KT&G · SK텔레콤 · 신한지주',
  '900030': 'SK하이닉스 · 삼성전자 · 한미반도체',
  '900040': '국고채 3년 · 삼성전자 · 통안채',
  '900050': 'LG에너지솔루션 · POSCO홀딩스 · 현대모비스'
}

const GRADE_WORD: Record<number, string> = { 1: '매우 높음', 2: '높음', 3: '다소 높음', 4: '보통', 5: '낮음', 6: '매우 낮음' }

// 위험 열 글자: '3 다소 높음'(등급 없으면 '-')
export const riskLabel = (code: string): string => {
  const g = F.meta(code).grade
  return g == null ? '-' : g + ' ' + GRADE_WORD[g]
}

// 내 투자성향에 맞는 종목인지
export const isSuitable = (code: string): boolean => F.suitable(F.meta(code).grade ?? null, RD.CUSTOMER.profile)

export interface HoldingInfo {
  facts: [string, string][] // 종목 정보 4칸 [이름, 값]
  grade: string
  basis: string
  asOf: string
}

// INFO에 없는 종목은 홈 추천 종목 정보(원본 REC)에서 가져옴
const recInfo = (code: string): [string, string, string, string, string] | undefined => {
  const x = [...RD.recsFor('aggressive'), ...RD.recsFor('active')].find((r) => r.code === code)
  return x ? [x.cap, x.per, x.div, x.lo, x.hi] : undefined
}

export function infoOf(code: string): HoldingInfo {
  const e = RD.ETF[code]
  const inf = INFO[code] ?? recInfo(code)
  const facts: [string, string][] = e
    ? [
        ['국내주식 비중', e.mix.replace('국내주식 ', '')],
        ['설정일', e.since],
        ['3년 VaR', (e.gradeBasis.match(/VaR\s*([\d.]+%)/) || [0, '-'])[1]],
        ['구성 상위 3종목(예시)', ETF_TOP[code] || '-']
      ]
    : [
        ['시가총액', inf ? inf[0] : '-'],
        ['PER', inf ? inf[1] : '-'],
        ['배당수익률', inf ? inf[2] : '-'],
        ['52주 범위', (inf ? inf[3] : '-') + ' ~ ' + (inf ? inf[4] : '-')]
      ]
  const m = F.meta(code)
  return {
    facts,
    grade: m.grade == null ? '-' : String(m.grade),
    basis: (m.gradeBasis || '').replace(/\(.*\)$/, ''),
    asOf: F.kday(F.prevBiz(F.biz())) + ' 기준 · 홈 추천 종목 정보와 같은 자료'
  }
}

// ───── 주문 내역 ─────

export interface OrderView {
  id: string
  pkg: PackageId
  time: string // 'MM.DD HH:mm'
  code: string
  side: 'buy' | 'sell'
  qty: number
  price: number
  status: 'done' | 'reject'
}

// 예시 주문: [패키지, 기준일로부터 영업일 전, 시각, 코드, 구분, 수량, 가격, 상태]
const SEED_ORD: [PackageId, number, string, string, 'buy' | 'sell', number, number, 'done' | 'reject'][] = [
  ['semi-chain', 1, '14:05', '005930', 'buy', 5, 97900, 'done'],
  ['semi-chain', 4, '09:31', '042700', 'buy', 3, 101500, 'done'],
  ['semi-chain', 9, '13:20', '000660', 'buy', 2, 405000, 'done'],
  ['semi-chain', 14, '10:02', '058470', 'buy', 1, 181000, 'reject'],
  ['steady-div', 2, '11:18', '017670', 'buy', 6, 48900, 'done'],
  ['steady-div', 8, '09:44', '055550', 'buy', 4, 57200, 'done'],
  ['steady-div', 15, '15:02', '105560', 'buy', 3, 99800, 'done'],
  ['auto-parts', 6, '10:20', '018880', 'buy', 46, 5120, 'done'],
  ['auto-parts', 16, '13:51', '000270', 'buy', 2, 116500, 'done']
]

// TODO: 백엔드 연결 시 주문 내역 API 응답으로 교체(P-6에서 새 주문이 앞에 쌓이는 상태로 바뀜)
export const seedOrders = (): OrderView[] =>
  SEED_ORD.map(([pkg, ago, hm, code, side, qty, price, status], i) => ({ id: 'o' + (i + 1), pkg, time: F.short(F.ago(ago)) + ' ' + hm, code, side, qty, price, status }))
