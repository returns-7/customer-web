import { Icon } from './LandingIcon'
import { LandingPassNavItems } from './LandingLists'
import type { LandingTexts } from './landingTexts'

export function LandingPass({ t }: { t: LandingTexts }) {
  return (
    <div id="passWrap">
      <div id="pnav">
        <div className="pni">
          <button id="pnAmt">
            매도 예정
            {' '}
            <b data-l="Aman">
              {t.l.Aman}
            </b>
            <Icon name="pencil" />
          </button>
          <ol id="pnList">
            <LandingPassNavItems />
          </ol>
        </div>
      </div>
      <div id="passD" data-l="hold">
        {t.l.hold}
      </div>
      <div id="pass">
        <div className="pt">
          <img src="/assets/wordmark-white.png" alt="Returns." />
          <b id="pCount">0/5</b>
        </div>
        <div className="po">
          <img src="/assets/wordmark-white.png" alt="" />
          <div className="t">RIA PASSPORT</div>
          <div className="rule" />
          <div className="stamps">
            <div className="st">
              <i>1</i>
            </div>
            <div className="st">
              <i>2</i>
            </div>
            <div className="st">
              <i>3</i>
            </div>
            <div className="st">
              <i>4</i>
            </div>
            <div className="st">
              <i>5</i>
            </div>
          </div>
          <div className="sl" id="stLab" />
        </div>
      </div>
    </div>
  )
}
