import { Fragment } from 'react'
import { BOARD_ROWS, BOARD_ROWS_SMALL, BOARD_STATES, MARKET_COLOR } from './landingBoardData'
import { FAQ_ITEMS } from './landingFaqData'
import { NAV_NAMES } from './landingScenes'
import type { LandingTexts } from './landingTexts'

// 원본에서 스크립트가 만들던 "정해진 목록"을 같은 순서·개수로 그린다.
// 상태(전광판 현황·금액, 눈금 켜짐 등)는 엔진이 붙기 전의 처음 모습(스크롤 0)이다.

// S3 큰 패널 12행
export function LandingBoardRows() {
  return (
    <>
      {BOARD_ROWS.map((r) => (
        <div className="br" key={r.n}>
          <span>{r.t}</span>
          <span className="fl" data-c="f"></span>
          <span className="ko nm">{r.n}</span>
          <span data-c="m">
            <b className="mk" style={{ background: MARKET_COLOR[r.m] }}>{r.m}</b>
          </span>
          <span data-c="q">{r.q}</span>
          <span className="kw r">-</span>
          <span>
            <b className="sx s0">{BOARD_STATES[0]}</b>
          </span>
        </div>
      ))}
    </>
  )
}

// S3 작은 패널 12행(앞 8행만 채움)
export function LandingBoardRowsSmall() {
  return (
    <>
      {BOARD_ROWS_SMALL.map((r, i) => (
        <div className="br" key={i}>
          {r && (
            <>
              <span>{r.t}</span>
              <span className="ko">{r.n}</span>
            </>
          )}
        </div>
      ))}
    </>
  )
}

// S5 1년 레일 눈금: 확정일, 1개월 ~ 12개월
export function LandingRailTicks() {
  return (
    <>
      {Array.from({ length: 13 }, (_, k) => (
        <i className="tk5" key={k} style={{ top: (k / 12) * 100 + '%' }}>
          <span>{k ? k + '개월' : '확정일'}</span>
        </i>
      ))}
    </>
  )
}

// S7 눈금자: 구간 3개(띠 + 라벨), 월 12개(눈금 + 라벨), 마지막 눈금
export function LandingRuler({ t }: { t: LandingTexts }) {
  const { zones, months } = t.ruler
  return (
    <>
      {zones.map((z) => (
        <Fragment key={z.label}>
          <i className={'rz' + (z.on ? ' on' : '')} style={{ left: z.left + '%', width: z.width + '%' }}></i>
          <span className={'rzl' + (z.on ? ' on' : '')} style={{ left: z.left + '%' }}>{z.label}</span>
        </Fragment>
      ))}
      {months.map((m) => (
        <Fragment key={m.label}>
          <i className="rt" style={{ left: m.left + '%' }}></i>
          <span className="rtl" style={{ left: m.mid + '%' }}>{m.label}</span>
        </Fragment>
      ))}
      <i className="rt" style={{ left: '100%' }}></i>
    </>
  )
}

// 패스포트 장면 이동 목록: 장면 이름 9개 + FAQ (클릭 동작은 L-8에서)
export function LandingPassNavItems() {
  return (
    <>
      {NAV_NAMES.map((n) => (
        <li key={n}>
          <button type="button">
            <i></i>
            {n}
          </button>
        </li>
      ))}
    </>
  )
}

// FAQ 8개 (열고 닫기는 L-8에서)
export function LandingFaqItems() {
  return (
    <>
      {FAQ_ITEMS.map((f) => (
        <div className="qa" key={f.q}>
          <button className="q" aria-expanded="false">
            <span>{f.q}</span>
            <i>+</i>
          </button>
          <div className="a">
            <div>
              <p>{f.a}</p>
            </div>
          </div>
        </div>
      ))}
    </>
  )
}
