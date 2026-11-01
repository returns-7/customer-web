import { useState } from 'react'
import '../components/landing/landing.css'
import { LandingClosing } from '../components/landing/LandingClosing'
import { LandingFaq } from '../components/landing/LandingFaq'
import { LandingFooter } from '../components/landing/LandingFooter'
import { LandingHdr2 } from '../components/landing/LandingHeader'
import { LandingPass } from '../components/landing/LandingPass'
import { LandingStage } from '../components/landing/LandingStage'
import { readLandingLoggedIn } from '../components/landing/landingSession'
import { buildLandingTexts } from '../components/landing/landingTexts'
import { useLandingDocument } from '../components/landing/useLandingDocument'

// 랜딩(/) — 원본 landing-journey.html의 정적 뼈대. 애니메이션·스크롤 엔진은 아직 없음(L-2부터).
export function LandingPage() {
  // 글자·로그인 여부는 처음 한 번만 정한다(스크립트가 바꾸는 요소를 React가 다시 그리지 않도록)
  const [t] = useState(buildLandingTexts)
  const [loggedIn] = useState(readLandingLoggedIn)
  useLandingDocument()
  return (
    <div className="landing">
      <LandingHdr2 loggedIn={loggedIn} />
      <LandingStage t={t} loggedIn={loggedIn} />
      <LandingFaq />
      <LandingClosing t={t} loggedIn={loggedIn} />
      <LandingFooter />
      <LandingPass t={t} />
    </div>
  )
}
