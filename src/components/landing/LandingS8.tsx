import type { LandingTexts } from './landingTexts'

export function LandingS8({ t }: { t: LandingTexts }) {
  return (
    <section className="sc" id="s8" data-screen-label="S8 Invest">
      <div className="ttl" id="tt8">
        <div className="h2">
          <span className="ml">
            <span>돌아온 자금은</span>
          </span>
          <span className="ml">
            <span>국내에서 운용해요</span>
          </span>
        </div>
        <p className="p2" id="p8">
          RIA 계좌에서는 국내 상장주식, 국내 주식형 펀드, 예탁금으로 운용할 수 있어요. 현금을 따로 입금할 수는 없어요. 주식 패키지로 국내 주식·ETF를 목표 비중대로 한 번에 살 수 있어요.
        </p>
      </div>
      <div id="fl8">
        <svg id="svg8">
          <path id="pm8" pathLength="1" />
          <path className="ln8" pathLength="1" />
          <path className="ln8" pathLength="1" />
          <path className="ln8" pathLength="1" />
        </svg>
        <div className="nlab" id="flyW">
          <b>
            <span id="fly8">
              {t.fly8}
            </span>
          </b>
          <small>이번 구간 예상 절세액</small>
        </div>
      </div>
      <div id="big8">
        <b data-l="A8">₩30,000,000</b>
        <div className="l1">국내에서 운용 중</div>
        <div className="l2">
          내 계좌 › 자금 흐름에서 매일 확인할 수 있어요
          <span className="ex">예시</span>
        </div>
      </div>
    </section>
  )
}
