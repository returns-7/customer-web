import { RETURNS_DATA as RD } from '../../data/returns'
import { F } from '../../lib/calc'
import { isSuitable, riskLabel } from './investHoldingData'
import { EXT_STOCK } from './investPkgLogic'
import type { PkgView } from './investPkgLogic'

// ───── 종목 추가 창 — 원본 renderVals의 ad 부분 ─────

export interface AddState {
  q: string // 검색어
  pick: string | null // 담으려고 고른 종목
  pct: string // 목표 비중 입력
  adj: Record<string, string> | null // 합계가 100%를 넘을 때 종목별 비중 다시 맞추기
}

export const emptyAdd = (): AddState => ({ q: '', pick: null, pct: '', adj: null })

// 숫자만, 최대 3자리
export const cleanPct = (v: string): string => v.replace(/\D/g, '').slice(0, 3)
export const pctInt = (v: string | undefined): number => parseInt(String(v ?? '').replace(/\D/g, ''), 10) || 0

export interface AddRow {
  code: string
  name: string
  sector: string
  ini: string
  blocked: boolean // RIA 계좌에서 살 수 없는 종목
  blockWhy: string
  risk: string
  riskWarn: boolean // 내 성향 밖
  px: number
  chg: number
  why: string
  has: boolean // 이미 담겨 있음
  can: boolean
}

export interface AddGroup {
  title: string
  emptyMsg: string
  rows: AddRow[]
}

// 업종·이니셜(원본 lab): RD.KR·KR_ETF에 없으면 EXT_STOCK
function labOf(code: string): { sector: string; ini: string } {
  const k = RD.KR[code] || RD.KR_ETF[code] || EXT_STOCK[code]
  return k ? { sector: k[0], ini: k[2] } : { sector: '', ini: String(RD.SN[code] || code)[0] }
}

// 못 사는 이유: ETF는 국내주식 비중이 80% 미만이면 비중, 아니면 설정 1개월 미경과
function blockWhy(code: string): string {
  const e = RD.ETF[code]
  const n = e ? parseInt((e.mix.match(/(\d+)%/) || [0, 100])[1] as string, 10) : 100
  return n < 80 ? '국내주식 비중 ' + n + '%' : '설정 1개월 미경과 · ' + F.short(F.addMonths(RD.DATES.newEtfSince, 1)) + '부터'
}

function rowOf(code: string, inPkg: Set<string>, why?: string): AddRow {
  const blocked = !F.meta(code).riaOk
  const has = inPkg.has(code)
  const l = labOf(code)
  return {
    code,
    name: RD.SN[code] || code,
    sector: l.sector,
    ini: l.ini,
    blocked,
    blockWhy: blocked ? blockWhy(code) : '',
    risk: F.meta(code).grade == null ? '위험 등급 없음' : '위험 ' + riskLabel(code),
    riskWarn: !isSuitable(code),
    px: RD.PX[code]?.[0] ?? 0,
    chg: RD.PX[code]?.[1] ?? 0,
    why: blocked ? '' : why || '',
    has,
    can: !has && !blocked
  }
}

// TODO: 백엔드 연결 시 종목 검색·추천·인기 종목 API 응답으로 교체
export function addGroups(pkg: PkgView, q0: string): AddGroup[] {
  const q = q0.trim()
  const inPkg = new Set(pkg.items.map((i) => i.code))
  if (q) {
    const universe = Object.keys(RD.KR).concat(Object.keys(EXT_STOCK), Object.keys(RD.KR_ETF))
    return [{ title: '검색 결과', emptyMsg: '검색 결과가 없어요', rows: universe.filter((c) => (RD.SN[c] || c).toLowerCase().includes(q.toLowerCase()) || c.includes(q)).map((c) => rowOf(c, inPkg)) }]
  }
  return [
    { title: (RD.PROFILES[RD.CUSTOMER.profile]?.label ?? '') + ' 맞춤 추천', emptyMsg: '성향 범위 안에서 추천할 상품이 없어요', rows: RD.RECS.map((r) => rowOf(r.code, inPkg, r.extra)) },
    { title: '많이 담는 종목', emptyMsg: '', rows: RD.RANK.slice(0, 5).map((r) => rowOf(r[0], inPkg)) }
  ]
}
