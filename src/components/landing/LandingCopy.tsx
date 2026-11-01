export function LandingCopy() {
  return (
    <>
      <div className="blk" id="c0">
        <div className="lab">RIA · RETURN TO DOMESTIC MARKET</div>
        <div className="h">
          <span className="ml">
            <span>해외주식으로 키운 수익,</span>
          </span>
          <span className="ml">
            <span>국내로 옮기면 세금이 달라집니다.</span>
          </span>
        </div>
      </div>
      <div className="blk" id="c2">
        <div className="h">
          <span className="ml">
            <span>입고 수량은</span>
          </span>
          <span className="ml">
            <span>세 수량 중</span>
          </span>
          <span className="ml">
            <span>가장 작은 값이에요</span>
          </span>
        </div>
        <div className="p" id="c2p">
          신청 수량, 2025.12.23 기준 보유 수량, 현재 보유 수량을 비교해요. 기준일 이후 새로 산 주식은 들어올 수 없어요.
          <span className="addl">
            {' '}
            입고 신청 화면이 세 수량을 자동으로 비교해 알려드려요.
          </span>
        </div>
      </div>
      <div className="blk" id="c3">
        <div className="row">
          <div className="h">
            <span className="ml">
              <span>RIA 계좌에서 매도하면, 대금은 원화로 자동 환전돼요</span>
            </span>
          </div>
          <div className="p" style={{ opacity: '.72' }}>
            매도 한도 안에서만 매도할 수 있어요.
            <span className="addl">
              {' '}
              매도 가이드가 남은 한도 안에서 공제가 가장 커지는 조합을 보여드려요.
            </span>
          </div>
        </div>
      </div>
      <div className="blk" id="c4">
        <i id="c4lab" hidden />
        <div className="stack">
          <div className="h" id="c4a">
            <span className="ml">
              <span>해외에 있던 자산이,</span>
            </span>
            <span className="ml">
              <span>국내로 돌아옵니다.</span>
            </span>
          </div>
          <div className="h" id="c4b">
            <span className="ml">
              <span>환전이 확정된 날부터</span>
            </span>
            <span className="ml">
              <span>1년이 시작돼요.</span>
            </span>
          </div>
        </div>
      </div>
      <i id="slogan" hidden />
    </>
  )
}
