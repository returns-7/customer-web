import { Icon } from './LandingIcon'
import { LandingBoardRows, LandingBoardRowsSmall } from './LandingLists'
import { useLandingClock } from './useLandingClock'
import type { LandingTexts } from './landingTexts'

export function LandingBoard({ t }: { t: LandingTexts }) {
  const clk = useLandingClock()
  return (
    <div id="board">
      <div className="rod" style={{ left: '16%' }} />
      <div className="rod" style={{ left: '58%' }} />
      <div className="frm">
        <div className="pnl pbig">
          <div className="ph">
            <span className="pic">
              <Icon name="plane" />
            </span>
            <span className="ptl">
              매도
              <em>Sell</em>
            </span>
          </div>
          <div className="br th">
            <span>
              주문 시각
              <small>Order</small>
            </span>
            <span data-c="f">
              체결 시각
              <small>Filled</small>
            </span>
            <span>
              종목
              <small>Stock</small>
            </span>
            <span data-c="m">
              시장
              <small>Market</small>
            </span>
            <span data-c="q">
              수량
              <small>Qty</small>
            </span>
            <span className="r">
              원화 금액
              <small>KRW</small>
            </span>
            <span>
              현황
              <small>Remarks</small>
            </span>
          </div>
          <div className="rows" id="rows">
            <LandingBoardRows />
          </div>
          <div className="pf">
            <span>1</span>
            <b>
              <span id="clkH">
                {clk.h}
              </span>
              <i>:</i>
              <span id="clkM">
                {clk.m}
              </span>
            </b>
          </div>
        </div>
        <div className="pnl psm">
          <div className="ph" />
          <div className="br th">
            <span>
              주문 시각
              <small>Order</small>
            </span>
            <span>
              종목
              <small>Stock</small>
            </span>
          </div>
          <div className="rows" id="rowsS">
            <LandingBoardRowsSmall />
          </div>
        </div>
        <div className="bstrip">
          <span>남은 매도 한도</span>
          <b data-n="remain">
            {t.n.remain}
          </b>
          <span className="ex">예시</span>
        </div>
      </div>
      <div className="bsh" />
    </div>
  )
}
