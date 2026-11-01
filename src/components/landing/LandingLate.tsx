import { LandingS5 } from './LandingS5'
import { LandingS6 } from './LandingS6'
import { LandingS7 } from './LandingS7'
import { LandingS8 } from './LandingS8'
import { LandingS9 } from './LandingS9'
import type { LandingTexts } from './landingTexts'

export function LandingLate({ t }: { t: LandingTexts }) {
  return (
    <div id="late">
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
        <filter id="duoA" colorInterpolationFilters="sRGB">
          <feColorMatrix type="saturate" values="0" />
          <feComponentTransfer>
            <feFuncR type="table" tableValues=".0235 .4706" />
            <feFuncG type="table" tableValues=".0706 .6667" />
            <feFuncB type="table" tableValues=".0784 .6667" />
          </feComponentTransfer>
        </filter>
        <filter id="duoB" colorInterpolationFilters="sRGB">
          <feColorMatrix type="saturate" values="0" />
          <feComponentTransfer>
            <feFuncR type="table" tableValues=".4706 .0235" />
            <feFuncG type="table" tableValues=".6667 .0706" />
            <feFuncB type="table" tableValues=".6667 .0784" />
          </feComponentTransfer>
        </filter>
      </svg>
      <div id="lbg">
        <i id="lb5" />
        <i id="lb6" />
        <i id="lb7" />
        <i id="lb8" />
        <i id="lb9" />
      </div>
      <LandingS5 t={t} />
      <LandingS6 />
      <div className="beam" id="beam6b" />
      <LandingS7 t={t} />
      <LandingS8 t={t} />
      <LandingS9 t={t} />
    </div>
  )
}
