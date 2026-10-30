import { RETURNS_DATA as RD } from '../../data/returns'
import { F } from '../../lib/calc'
import { NO_REC_TEXT, RISK_NOTE } from './homeRecData'

const SN = RD.SN

// 30일 그래프 선(원본 spark 그대로: seed로 정해지는 예시 곡선)
export function spark(seed: number, up: boolean): string {
  let x = seed * 9301 + 49297
  const r = () => {
    x = (x * 9301 + 49297) % 233280
    return x / 233280
  }
  let v = 50
  const pts: number[] = []
  for (let i = 0; i < 30; i++) {
    v += (r() - 0.48 + (up ? 0.04 : -0.02)) * 8
    pts.push(v)
  }
  const mn = Math.min(...pts)
  const mx = Math.max(...pts)
  return pts.map((p, i) => (i ? 'L' : 'M') + ((i * 200) / 29).toFixed(1) + ' ' + (44 - ((p - mn) / (mx - mn || 1)) * 40).toFixed(1)).join(' ')
}

// 받침 있으면 a, 없으면 b (은/는, 이/가, 을/를)
export function josa(word: string, a: string, b: string): string {
  const w = word.replace(/\)$/, '').replace(/\([^)]*$/, '')
  const ch = w.charCodeAt(w.length - 1)
  if (ch >= 0xac00 && ch <= 0xd7a3) return (ch - 0xac00) % 28 ? a : b
  return /[LMNR]$/i.test(w) || w === 'AAPL' ? a : b
}

// 종목 이름 표기: 국내는 이름(코드), 해외는 티커(이름)
export const lbl = (sym: string): string => {
  const n = SN[sym] || sym
  return /^\d{6}$/.test(sym) ? n + '(' + sym + ')' : sym + '(' + n + ')'
}

const pctS = (n: number) => (Math.round(n * 10) / 10).toFixed(1).replace(/\.0$/, '') + '%'

export interface RecAnswer {
  text: string
  pkg?: string // "패키지에 담기" 버튼을 붙일 종목 코드
}

// 끼루는 추천(RECS)·패키지(PKGS) 데이터 안에서 사실만 답한다(원본 recAnswer 그대로)
export function recAnswer(q: string, focus: string | null): RecAnswer {
  const profile = RD.CUSTOMER.profile
  const R = RD.recsFor(profile)
  const prof = RD.PROFILES[profile].label
  if (!R.length) {
    if (/등급/.test(q)) return { text: RISK_NOTE }
    return { text: prof + '은 ' + F.allowedLabel(profile) + ' 상품을 추천받을 수 있어요. ' + NO_REC_TEXT }
  }
  const hit = R.find((r) => q.includes(SN[r.code]) || q.includes(r.code))
  if (/밸류체인|비중/.test(q)) {
    const p = RD.PKGS.find((x) => x.id === 'semi-chain')
    const items = p?.items ?? []
    const add = 1000000
    const tgt = (hit && hit.code) || focus || '005930'
    const tot = items.reduce((a, b) => a + b.amt, 0)
    const tot2 = tot + add
    const after = items.map((i) => ({ ...i }))
    const f = after.find((i) => i.c === tgt)
    if (f) f.amt += add
    else after.push({ n: SN[tgt], c: tgt, amt: add })
    const fmt = (arr: typeof items, t: number) => arr.map((i) => i.n + ' ' + pctS((i.amt / t) * 100)).join(' · ')
    const nm = lbl(tgt)
    return {
      text:
        (p?.name ?? '') + ' 지금 비중 (' + F.man(tot) + ' 원 · ' + items.length + '종목)\n' + fmt(items, tot) + '\n' +
        nm + josa(nm, '을', '를') + ' ' + F.man(add) + ' 원 담은 뒤 (' + F.man(tot2) + ' 원 · ' + after.length + '종목)\n' + fmt(after, tot2),
      pkg: tgt
    }
  }
  if (/위험등급|등급은/.test(q)) {
    return {
      text:
        RISK_NOTE + '\n' + R.map((r) => SN[r.code] + ' ' + r.grade + '등급(' + r.gradeBasis + ')').join(' · ') + '\n' +
        prof + '은 ' + F.allowedLabel(profile) + ' 상품만 추천받을 수 있어요.'
    }
  }
  if (/ETF|주식 차이/.test(q)) {
    return { text: '주식은 한 회사에, ETF는 여러 종목을 묶은 상품 하나에 투자해요. ETF는 한 종목 쏠림이 적고, 위험등급은 최근 3년 가격 변동으로 정해요. RIA 계좌에서는 국내주식 비중이 80% 이상이고 설정 1개월이 지난 ETF만 살 수 있어요.' }
  }
  if (/변동성/.test(q)) {
    return { text: '과거 3년 기준 연 변동성은 삼성전자 49%, 현대차 41%, 국내고배당 ETF 15%예요. 숫자가 클수록 가격이 크게 오르내렸다는 뜻이고, 앞으로의 수익을 예측하는 값은 아니에요.' }
  }
  if (/비교/.test(q)) {
    return { text: R.map((r) => SN[r.code]).join(' · ') + ' 순서로\n시가총액 ' + R.map((r) => r.cap).join(' · ') + '\nPER ' + R.map((r) => r.per).join(' · ') + '\n배당수익률 ' + R.map((r) => r.div).join(' · ') + '예요.' }
  }
  if (/배당/.test(q)) {
    const o = R.slice().sort((a, b) => parseFloat(b.div) - parseFloat(a.div))
    const top = SN[o[0].code]
    return {
      text:
        '세 종목 중 배당수익률은 ' + top + josa(top, '이', '가') + ' ' + o[0].div + '로 가장 높아요. ' +
        o.slice(1).map((r) => SN[r.code] + josa(SN[r.code], '은', '는') + ' ' + r.div).join(', ') + '예요.'
    }
  }
  if (hit) {
    const nm = lbl(hit.code)
    let t =
      nm + josa(nm, '은', '는') + ' ' + prof + ' 허용 범위(' + F.allowedLabel(profile) + ') 안의 ' + hit.grade + '등급(' + F.gradeName(hit.grade ?? 0) +
      ') 상품이에요. RIA 자금으로 투자할 수 있고, ' + hit.extra
    if (!/왜/.test(q)) t += '\n시가총액 ' + hit.cap + ' · PER ' + hit.per + ' · 배당수익률 ' + hit.div + '예요.'
    return { text: t, pkg: hit.code }
  }
  return { text: '추천한 세 종목(' + R.map((r) => SN[r.code]).join(' · ') + ')의 추천 이유, 비교, 배당, 패키지 비중에 대해 물어봐 주세요.' }
}
