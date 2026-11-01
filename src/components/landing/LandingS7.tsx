import { LandingRuler } from './LandingLists'
import type { LandingTexts } from './landingTexts'

export function LandingS7({ t }: { t: LandingTexts }) {
  return (
    <section className="sc" id="s7" data-screen-label="S7 Deduction">
      <div id="col7">
        <div id="tt7">
          <div className="h2">
            <span className="ml">
              <span>일찍 매도할수록</span>
            </span>
            <span className="ml">
              <span>공제율이 높아요</span>
            </span>
          </div>
        </div>
        <div id="big7">
          <b data-l="rate">
            {t.l.rate}
          </b>
          <p>
            지금 매도하면
            <span>
              <span data-l="zone">
                {t.l.zone}
              </span>
              {' '}
              구간 · 마감
              {' '}
              <span data-l="dday">
                {t.l.dday}
              </span>
            </span>
          </p>
        </div>
        <p id="note7">
          <span className="addl">
            홈의 끼루 브리핑이 지금까지 줄어든 세금과 남은 한도까지 팔면 줄어들 세금을 범위로 보여드리고, 증빙서류는 2027년부터 내 계좌에서 받을 수 있어요.
            {' '}
          </span>
          언제 매도할지는 고객님의 선택이에요.
        </p>
      </div>
      <div id="rul7">
        <div id="rul7in">
          <i id="today7" style={{ left: t.ruler.today + '%' }}>
            <span>오늘</span>
          </i>
          <LandingRuler t={t} />
        </div>
      </div>
      <div id="rc7">
        <div className="rates" id="rates7">
          <small>수익률</small>
          <button data-r="0.1">10%</button>
          <button data-r="0.3">30%</button>
          <button data-r="0.5" className="on">50%</button>
          <button data-r="1">100%</button>
        </div>
        <div id="paper">
          <div className="phd">
            <img src="/assets/wordmark.png" alt="Returns." />
            <span>세액 계산서 · 예시</span>
          </div>
          <div className="pr i7">
            <span>매도 금액</span>
            <b data-l="A">
              {t.l.A}
            </b>
          </div>
          <div className="pr i7">
            <span>양도차익</span>
            <b data-l="G">
              {t.l.G}
            </b>
          </div>
          <div className="pr i7">
            <span>기본공제</span>
            <b data-l="basic">
              {t.l.basic}
            </b>
          </div>
          <div className="pr i7">
            <span data-l="dedLab">
              {t.l.dedLab}
            </span>
            <b data-l="ded">
              {t.l.ded}
            </b>
          </div>
          <div className="pr i7">
            <span>과세표준</span>
            <b data-l="base">
              {t.l.base}
            </b>
          </div>
          <div className="pr i7">
            <span>세율</span>
            <b>22%</b>
          </div>
          <div className="pr gen i7">
            <span>일반 계좌 세액</span>
            <b>
              <span data-l="gen">
                {t.l.gen}
              </span>
              <i id="strike" />
            </b>
          </div>
          <div className="pr ria i7">
            <span>RIA 세액</span>
            <b data-l="ria">
              {t.l.ria}
            </b>
          </div>
          <div className="pr sv i7">
            <span>절세액</span>
            <b id="save7" />
          </div>
        </div>
        <p className="fn7" id="fn7">
          근거 · 세율·기본공제·계산 순서: RIA 상품 가이드라인
          <br />
          <span data-l="assume">
            {t.l.assume}
          </span>
        </p>
      </div>
    </section>
  )
}
