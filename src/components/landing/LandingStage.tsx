import { LandingBackdrop } from './LandingBackdrop'
import { LandingBoard } from './LandingBoard'
import { LandingCopy } from './LandingCopy'
import { LandingHdr } from './LandingHeader'
import { LandingLate } from './LandingLate'
import { LandingHero, LandingMap, LandingMon, LandingMonUi } from './LandingMonitor'
import { LandingScene1 } from './LandingScene1'
import { LandingScene2 } from './LandingScene2'
import type { LandingTexts } from './landingTexts'

// 스크롤하는 동안 화면에 붙어 있는 무대(#pinA > #stage). 겹치는 순서는 원본 마크업의 순서 그대로다.
export function LandingStage({ t, loggedIn }: { t: LandingTexts; loggedIn: boolean }) {
  return (
    <div id="pinA">
      <div id="stage">
        <LandingBackdrop />
        <LandingBoard t={t} />
        <LandingMon />
        <LandingScene1 t={t} />
        <LandingScene2 />
        <LandingMap />
        <LandingMonUi t={t} />
        <LandingHero />
        <LandingCopy />
        <LandingLate t={t} />
        <LandingHdr loggedIn={loggedIn} />
      </div>
    </div>
  )
}
