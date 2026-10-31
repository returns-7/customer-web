import { ALLOWED_GRADE, RETURNS_DATA as RD } from '../../data/returns'
import { F } from '../../lib/calc'
import { pctInt } from './investAddLogic'
import { isSuitable, riskLabel } from './investHoldingData'
import { EXT_STOCK } from './investPkgLogic'
import type { PkgBase } from './investPkgLogic'

// ───── 새 패키지 만들기 창 — 원본 invest.dc.html의 nm 부분 ─────

export const NM_STEPS = ['이름', '시작 방법', '목표 비중', '만들기']
export type NmStep = 0 | 1 | 2 | 3

// 끼루 제안 한 번: 후보 표 + 말풍선 글(원본 exKK·propose의 반환값)
export interface NmKkRow {
  code: string
  w: number
  why: string
}
export interface NmKk {
  q?: string // 내가 보낸 말(말풍선)
  reply: string
  rows: NmKkRow[]
  w: Record<string, string> // 종목 → 시작 비중
  amt: number // 살 금액으로 넣어 둘 값(0이면 없음)
}

export interface NmChk {
  phase: 'loading' | 'done'
  snap?: string // 검사한 때의 구성(JSON)
}

export interface NewPkgState {
  step: NmStep
  name: string
  w: Record<string, string> // 종목 → 목표 비중 입력값
  amt: string // 살 금액(숫자만)
  kkIn: string // 끼루에게 보낼 말 입력
  kk: NmKk | null
  kkAlt: number // "다시 골라줘" 누른 횟수
  q2: string // 종목 검색어
  chk: NmChk | null
  ack: Record<string, string> // 내 성향보다 위험한 종목을 확인하고 담은 시각
}

// 원본 예시 제안 — 어떤 말을 보내도 같은 후보가 나옴(원본 exKK)
// TODO: 백엔드 연결 시 끼루 패키지 제안 API 응답으로 교체
export function exKK(q: string): NmKk {
  const rows: [string, number, string][] = [
    ['105560', 34, '분기 배당과 주주환원 계획을 공시했어요 · 연 변동성 28%'],
    ['900020', 33, '배당 성향이 높은 국내 주식에 나눠 투자하는 ETF · 연 변동성 15%'],
    ['005380', 33, '자동차 테마의 국내 대형주 · 연 변동성 41%']
  ]
  return {
    q,
    reply: '적극투자형(2등급까지)이고, RIA 계좌에서 살 수 있고, 위험등급이 계산된 종목 중에서 골랐어요. 비중은 같은 비중으로 시작하니 다음 단계에서 직접 바꿔 주세요. 500만 원은 살 금액에 넣어 둘게요.',
    rows: rows.map(([code, w, why]) => ({ code, w, why })),
    w: Object.fromEntries(rows.map(([c, w]) => [c, String(w)])),
    amt: 5000000
  }
}

export const openNewPkg = (): NewPkgState => {
  const k = exKK('배당을 주는 종목 위주로 500만 원')
  return { step: 0, name: '', w: k.w, amt: String(k.amt), kkIn: '', kk: k, kkAlt: 0, q2: '', chk: null, ack: {} }
}

// 끼루 제안(조건 키워드 → 후보). 성향·RIA 편입으로 다시 거르고 비중 합 100은 코드가 맞춤(원본 KK)
const KK: Record<string, [string, number, string][][]> = {
  div: [
    [['900020', 40, '배당 성향이 높은 종목에 나눠 투자'], ['105560', 30, '배당수익률 3.2%(예시)'], ['005380', 30, '3년 연속 배당 증가']],
    [['900020', 40, '배당 성향이 높은 종목에 나눠 투자'], ['055550', 30, '배당수익률 4.0%(예시)'], ['017670', 30, '배당수익률 6.8%(예시)']]
  ],
  semi: [
    [['005930', 40, '메모리·파운드리를 함께 하는 대형주'], ['000660', 35, 'HBM 매출 비중이 높아요'], ['042700', 25, '반도체 후공정 장비']],
    [['000660', 40, 'HBM 매출 비중이 높아요'], ['005930', 30, '메모리·파운드리를 함께 하는 대형주'], ['058470', 30, '반도체 검사용 부품']]
  ],
  etf: [
    [['900010', 40, '국내 대형주 200종목에 나눠 투자'], ['900020', 35, '배당 성향이 높은 종목 묶음'], ['900030', 25, '반도체 대형주 10종목 묶음']],
    [['900020', 50, '배당 성향이 높은 종목 묶음'], ['900010', 50, '국내 대형주 200종목에 나눠 투자']]
  ],
  auto: [[['005380', 40, '3년 연속 배당 증가'], ['000270', 35, '배당수익률 5.1%(예시)'], ['012330', 25, '부품·AS 매출이 꾸준해요']]]
}

// 말 속 키워드·금액으로 후보를 거르는 제안(원본 propose). 원본 화면의 보내기·다시 골라줘는 exKK를 쓰고, 주소로 여는 방식(P-9)에서 씀
export function propose(q: string, alt: number): NmKk {
  const prof = RD.CUSTOMER.profile
  const head = RD.PROFILES[prof].label + ' ' + F.allowedLabel(prof)
  const key = /배당/.test(q) ? 'div' : /반도체/.test(q) ? 'semi' : /ETF|이티에프/i.test(q) ? 'etf' : /자동차/.test(q) ? 'auto' : null
  const m = q.replace(/,/g, '').match(/(\d+(?:\.\d+)?)\s*(억|천만|만)/)
  const unit: Record<string, number> = { 억: 1e8, 천만: 1e7, 만: 1e4 }
  const amt = m ? Math.round(parseFloat(m[1]) * unit[m[2]]) : 0
  if (!key) return { reply: '조건을 알아듣지 못했어요. "배당 위주로 500만 원"처럼 말해 주세요.', rows: [], w: {}, amt: 0 }
  const sets = KK[key]
  const set = sets[alt % sets.length].filter(([c]) => F.meta(c).riaOk && F.suitable(F.meta(c).grade ?? null, prof))
  if (!set.length) return { reply: head + ' 안에서 RIA 계좌로 살 수 있는 종목이 없어요. 투자성향을 다시 확인해 보세요.', rows: [], w: {}, amt }
  const tot = set.reduce((a, r) => a + r[1], 0)
  const ws = set.map((r) => Math.floor((r[1] / tot) * 100))
  ws[0] += 100 - ws.reduce((a, b) => a + b, 0)
  const rows = set.map(([code, , why], i) => ({ code, w: ws[i], why }))
  return {
    reply: head + ', RIA 계좌에서 살 수 있는 종목 안에서 골랐어요.' + (amt ? ' ' + F.man(amt) + ' 원은 살 금액에 넣어 둘게요.' : ''),
    rows,
    w: Object.fromEntries(rows.map((r) => [r.code, String(r.w)])),
    amt
  }
}

// ───── 종목 이름·모양 ─────

// RD.SN에 없는 국내 종목 이름(원본 XN)
const XN: Record<string, string> = {
  '042700': '한미반도체',
  '058470': '리노공업',
  '240810': '원익IPS',
  '055550': '신한지주',
  '033780': 'KT&G',
  '017670': 'SK텔레콤',
  '012330': '현대모비스',
  '204320': 'HL만도',
  '018880': '한온시스템'
}
export const nameOf = (c: string): string => RD.SN[c] || XN[c] || c

// 등급이 아직 계산되지 않아 담을 수 없는 종목(원본 NOGRADE)
const NOGRADE = { code: '900060', name: '신규반도체장비 ETF', ini: 'N' }

export interface NmLab {
  code: string
  kn: boolean // 종목 라벨 컴포넌트로 보이는 종목(RD.KR·KR_ETF)
  name: string
  sector: string
  ic: string
  ini: string
}

export function labOf(c: string): NmLab {
  const k = RD.KR[c] || RD.KR_ETF[c]
  const x = EXT_STOCK[c]
  return { code: c, kn: !!k, name: nameOf(c), sector: k ? k[0] : x ? x[0] : '', ic: k ? k[1] : x ? x[1] : '#9AA4B2', ini: k ? k[2] : x ? x[2] : String(nameOf(c))[0] }
}

const gradeOf = (c: string): number | null => F.meta(c).grade ?? null
const okFor = (c: string): boolean => isSuitable(c)
// 위험 열 글자 — 등급이 없으면 '-'
export const gShort = (c: string): string => riskLabel(c)

export const profileCap = () => {
  const prof = RD.CUSTOMER.profile
  const allowL = F.allowedLabel(prof)
  return { prof, profL: RD.PROFILES[prof]?.label ?? '', allowL, maxG: (allowL.match(/\d+/) || ['-'])[0] + '등급까지' }
}

// ───── 목표 비중 단계 ─────

export interface NmRow extends NmLab {
  v: string
  risk: string
  warn: boolean // 내 성향 밖
}

export const rowsOf = (w: Record<string, string>): NmRow[] => Object.keys(w).map((c) => ({ ...labOf(c), v: w[c], risk: gShort(c), warn: !okFor(c) }))

export const sumOf = (w: Record<string, string>): number => Object.keys(w).reduce((a, c) => a + pctInt(w[c]), 0)

// ───── 종목 검색 ─────

export interface NmHit extends NmLab {
  meta: string
  metaTone: 'sub' | 'warn' | 'muted'
  nameMuted: boolean
  label: '담김' | '담기'
  disabled: boolean
  btnTone: 'navy' | 'muted' | 'faint'
  out: boolean // 담기 전에 확인이 필요한(내 성향보다 위험한) 종목
  grade: number | null
}

const NO_GRADE_META = '등급 없음 · 3년 산정 기준 미충족 · 담을 수 없음'

export function searchHits(q0: string, codes: string[]): NmHit[] {
  const q = q0.trim()
  if (!q) return []
  const ql = q.toLowerCase()
  const pool = Array.from(new Set(Object.keys(RD.KR).concat(Object.keys(EXT_STOCK), Object.keys(RD.KR_ETF))))
  const hits: NmHit[] = pool
    .filter((c) => nameOf(c).toLowerCase().includes(ql) || c.includes(q))
    .map((c) => {
      const g = gradeOf(c)
      const ria = F.meta(c).riaOk
      const has = codes.includes(c)
      const out = g != null && !okFor(c)
      const disabled = has || g == null || !ria
      return {
        ...labOf(c),
        meta: g == null ? NO_GRADE_META : !ria ? '위험 ' + gShort(c) + ' · RIA 계좌에서 살 수 없음' : '위험 ' + gShort(c),
        metaTone: g == null || !ria ? 'muted' : out ? 'warn' : 'sub',
        nameMuted: g == null,
        label: has ? '담김' : '담기',
        disabled,
        btnTone: disabled ? 'muted' : 'navy',
        out,
        grade: g
      }
    })
  if (NOGRADE.name.toLowerCase().includes(ql) || NOGRADE.code.includes(q)) {
    hits.push({ code: NOGRADE.code, kn: false, name: NOGRADE.name, sector: 'ETF', ic: '#9AA4B2', ini: NOGRADE.ini, meta: NO_GRADE_META, metaTone: 'muted', nameMuted: true, label: '담기', disabled: true, btnTone: 'faint', out: false, grade: null })
  }
  return hits.slice(0, 6)
}

// ───── 검사 ─────

// 테마(원본 THEMES): [이름, 종목]
const THEMES: [string, string[]][] = [
  ['반도체', ['005930', '000660', '042700', '058470', '240810']],
  ['2차전지', ['373220', '005490', '012330', '204320', '018880']],
  ['배당', ['105560', '055550', '033780', '017670', '900020']],
  ['자동차', ['005380', '000270', '012330', '204320', '018880']],
  ['금융', ['105560', '055550']]
]

// 과거 3년 연 변동성(%, 예시, 원본 VOL3) — 이 종목들로만 이뤄진 구성이어야 패키지 변동성을 계산
// TODO: 백엔드 연결 시 종목별 변동성 API 값으로 교체
const VOL3: Record<string, number> = { '105560': 28, '900020': 15, '005380': 41, '900030': 45, '000660': 34, '373220': 42, '900010': 21, '000270': 48 }

export type CkPhase = 'before' | 'loading' | 'stale' | 'full'

export function phaseOf(chk: NmChk | null, w: Record<string, string>): CkPhase {
  if (!chk) return 'before'
  if (chk.phase === 'loading') return 'loading'
  return chk.snap !== JSON.stringify(w) ? 'stale' : 'full'
}

export interface CkCard {
  k: string
  v: string
  n: string
  muted: boolean
}

export interface CkResult {
  band: boolean
  bandText: string
  cards: CkCard[]
  expl: string
}

// 검사 결과 — 구성이 바뀌어 '이전 구성 기준'이면 검사한 때의 구성(snap)으로 계산
export function checkOf(chk: NmChk | null, w: Record<string, string>): CkResult {
  const wSrc: Record<string, string> = phaseOf(chk, w) === 'stale' && chk?.snap ? JSON.parse(chk.snap) : w
  const { prof, maxG } = profileCap()
  const minG = (ALLOWED_GRADE[prof] || { min: 6 }).min
  const cS = Object.keys(wSrc)
  const W: [string, number][] = cS.map((c) => [c, pctInt(wSrc[c])])
  const gw = W.filter(([c]) => gradeOf(c) != null)
  const sw = gw.reduce((a, x) => a + x[1], 0)
  const wg = sw ? (Math.floor((gw.reduce((a, [c, v]) => a + (gradeOf(c) as number) * v, 0) * 100) / sw) / 100).toFixed(2) : '-'
  const outL = cS.filter((c) => gradeOf(c) != null && !okFor(c)).map(nameOf)
  const vol = cS.length && cS.every((c) => VOL3[c] != null) ? Math.round((0.8 * W.reduce((a, [c, v]) => a + VOL3[c] * v, 0)) / 100) + '%' : null
  const th = THEMES.map(([n, cs]): [string, number] => [n, W.filter(([c]) => cs.includes(c)).reduce((a, x) => a + x[1], 0)]).sort((a, b) => b[1] - a[1])[0]
  const tp = W.slice().sort((a, b) => b[1] - a[1])[0]
  const riskier = wg !== '-' && parseFloat(wg) < minG
  const thOk = !!(th && th[1])
  const tpS = tp ? nameOf(tp[0]) + ' ' + tp[1] + '%' : '-'
  return {
    band: riskier,
    bandText: '구성 종목 가중평균이 내 성향(' + maxG + ')보다 위험해요. 성향보다 위험한 종목 ' + outL.length + '개를 확인 후 담았어요.',
    expl:
      '구성 종목 위험등급 가중평균은 ' + wg + '등급으로 내 성향 범위(' + maxG + ')' + (riskier ? '보다 위험해요.' : ' 안이에요.') + (thOk ? ' ' + th[0] + ' 테마 비중이 ' + th[1] + '%이고,' : '') + ' 가장 큰 종목은 ' + tpS + '예요.' + (vol ? ' 과거 3년 기준 패키지 연 변동성은 ' + vol + '예요.' : ''),
    cards: [
      { k: '구성 종목 위험등급 가중평균', v: wg + '등급', n: '(참고 지표)', muted: false },
      { k: '내 성향 범위를 벗어난 종목', v: outL.length + '개', n: outL.join(', '), muted: false },
      { k: '패키지 연 변동성', v: vol || '계산 불가', n: vol ? '(과거 3년 기준, 예측 아님)' : '잠시 후 다시 검사해 주세요', muted: !vol },
      { k: '가장 큰 테마', v: thOk ? th[0] + ' ' + th[1] + '%' : '-', n: '', muted: false },
      { k: '가장 큰 종목', v: tpS, n: '', muted: false }
    ]
  }
}

// ───── 살 금액 단계 ─────

export interface NmBuyRow {
  code: string
  name: string
  q: number
  a: number
  amt: string
}

export interface NmBuyCalc {
  amt: number
  rows: NmBuyRow[]
  fee: number
  total: number
  err: string
  ok: boolean
}

// 살 금액 × 목표 비중 ÷ 현재가를 내림해 종목별 주 수를 정한다(원본 그대로)
export function buyCalc(w: Record<string, string>, amtStr: string, cash: number): NmBuyCalc {
  const FEE = RD.C.FEE_RATE
  const amt = pctInt(amtStr)
  const rows = Object.keys(w).map((c) => {
    const px = RD.PX[c]?.[0] ?? 0
    const q = px ? Math.floor((amt * pctInt(w[c])) / 100 / px) : 0
    return { code: c, name: nameOf(c), q, a: q * px, amt: F.won(q * px) }
  })
  const total = rows.reduce((a, r) => a + r.a + Math.round(r.a * FEE), 0)
  const fee = rows.reduce((a, r) => a + Math.round(r.a * FEE), 0)
  const err = total > cash ? '주문 가능 금액(₩' + F.won(cash) + ')을 넘었어요' : ''
  return { amt, rows, fee, total, err, ok: total > 0 && !err }
}

// ───── 만들기 ─────

// 새 패키지: 목표 비중만 정하고 보유는 0주(사는 건 만든 뒤 주문으로)
export function makePkgBase(id: string, name: string, w: Record<string, string>, created: number, seed: number): PkgBase {
  return { id, made: F.dot(F.biz()), name: name.trim(), seed, created, items: Object.keys(w).map((c) => ({ code: c, qty: 0, avg: 0, target: pctInt(w[c]) })) }
}
