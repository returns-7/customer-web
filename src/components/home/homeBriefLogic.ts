import { RETURNS_DATA as RD, demo } from '../../data/returns'
import { F } from '../../lib/calc'
import { CHART_HEADROOM, CUT_LABEL_OFFSET_PX, EXPECT_LABEL_MIN_PCT, RANGE_HIGH, RANGE_LOW } from './homeBriefData'

const pc2 = (n: number) => n.toFixed(2) + '%'
const md = (d: string) => {
  const [, m, dd] = d.split('-').map(Number)
  return m + '/' + dd
}

// 절세 탭: 지금까지(확정) / 남은 한도까지 팔면(예상) 두 기준의 세액과 그래프 막대 높이
export function taxBrief(guide: boolean) {
  const C = RD.C, biz = F.biz()
  const plan = F.plan({ biz })
  const tNow = F.tax(0, biz), tGuide = F.tax(plan.gain, biz)
  const T = guide ? tGuide : tNow
  const maxV = Math.max(tGuide.general, tNow.general) * CHART_HEADROOM
  const pc = (v: number) => (v / maxV) * 100
  const gP = pc(T.general), nP = pc(T.ria), cP = pc(tNow.cut), eP = Math.max(0, gP - nP - cP)
  const be = F.bandEnd(biz), wd = F.addYears(C.SOLD.date, C.HOLD_YEARS)
  const held = F.days(C.SOLD.date, biz), holdTotal = F.days(C.SOLD.date, wd)
  const td = RD.TRADE_DEMO
  return {
    asOf: F.asOf(biz),
    cut: F.won(T.cut),
    rangeTxt: '변동 반영 약 ' + F.man(T.cut * RANGE_LOW) + '~' + F.man(T.cut * RANGE_HIGH) + ' 원(10번 중 8번 · 예시)',
    cutNote: guide ? '확정 ' + F.won(tNow.cut) + ' + 남은 한도까지 팔면 ' + F.won(tGuide.cut - tNow.cut) : '확정 ' + F.won(tNow.cut),
    general: F.won(T.general), ria: F.won(T.ria), conf: F.won(tNow.cut), exp: F.won(tGuide.cut - tNow.cut),
    gH: pc2(gP), nH: pc2(nP), cH: pc2(cP), eB: pc2(nP + cP), eH: pc2(eP), eShow: eP > EXPECT_LABEL_MIN_PCT,
    brH: pc2(gP - nP), lblB: 'calc(' + pc2(nP + (gP - nP) / 2) + ' - ' + CUT_LABEL_OFFSET_PX + 'px)',
    soldAmt: F.won(C.SOLD.amount), bandPct: Math.round(F.band(biz).rate * 100) + '%', bandEnd: md(be),
    dl: F.days(biz, be), soldDot: F.dot(C.SOLD.date), wdDot: F.dot(wd),
    held, holdTotal, wdD: F.days(biz, wd), holdPct: Math.min(100, (held / holdTotal) * 100).toFixed(1) + '%',
    demoTrade: demo().trade,
    progressTxt: td.text + ' 매도 · 원화 확정 예정 ' + F.short(td.confirmDate)
  }
}

// 자산 탭: 국내 운용 자산·평가손익·요약 문구·흐름 항목
export function assetBrief() {
  const FL = RD.FLOW, biz = F.biz()
  const sk = RD.PKG_HOLDINGS['semi-chain'], vals = sk.map((h) => h.qty * RD.PX[h.code][0]), tot = vals.reduce((a, b) => a + b, 0)
  const dev = sk.map((h, i) => ({ h, d: (vals[i] / tot) * 100 - h.target })).sort((a, b) => Math.abs(b.d) - Math.abs(a.d))[0]
  const mon = FL.monthly.filter((m) => m.buy).map((m) => +m.month.slice(5) + '월 ' + F.man(m.buy) + ' 원').join(' · ')
  return {
    domestic: F.won(RD.ASSETS.domestic),
    pnl: (FL.pnl >= 0 ? '+' : '-') + F.won(Math.abs(FL.pnl)) + '(' + F.pct((FL.pnl / FL.buyCost) * 100) + ')',
    pnlTone: FL.pnl,
    summary: '돌아온 ' + F.man(FL.inflow) + ' 원 중 ' + Math.round((FL.buyCost / FL.inflow) * 100) + '%를 국내 주식으로 운용하고 있어요.',
    facts: [
      { text: '주문 가능 예수금 ' + F.man(FL.cash) + ' 원 · 운용하지 않은 돈이에요', link: '주식 패키지 ›', to: '/invest' },
      { text: '반도체 밸류체인 패키지 · ' + dev.h.name + '가 목표보다 ' + Math.abs(dev.d).toFixed(1) + '%p ' + (dev.d > 0 ? '많아요' : '적어요'), link: '패키지 보기 ›', to: '/invest?pkg=semi-chain' },
      { text: '자금 흐름 · ' + mon + ' 국내 매수', link: '자금 흐름 ›', to: '/account#flow' }
    ],
    foot: F.short(F.prevBiz(biz))
  }
}
