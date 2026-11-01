import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from '../layouts/AppLayout'
import { BareLayout } from '../layouts/BareLayout'
import { AccountPage } from '../pages/AccountPage'
import { CommunityPage } from '../pages/CommunityPage'
import { HomePage } from '../pages/HomePage'
import { InvestPage } from '../pages/InvestPage'
import { LoginPage } from '../pages/LoginPage'
import { MyInfoPage } from '../pages/MyInfoPage'

// 랜딩은 gsap·d3 등이 붙는 큰 화면이라 따로 불러온다(다른 페이지 번들에 영향 없음)
const LandingPage = lazy(() => import('../pages/LandingPage').then((m) => ({ default: m.LandingPage })))

// 불러오는 동안은 랜딩 첫 화면 배경색(--color-photo-base)과 같은 빈 화면
const landingFallback = <div style={{ minHeight: '100vh', background: 'var(--color-photo-base)' }} />

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<BareLayout />}>
          <Route
            path="/"
            element={
              <Suspense fallback={landingFallback}>
                <LandingPage />
              </Suspense>
            }
          />
          <Route path="/login" element={<LoginPage />} />
        </Route>
        <Route element={<AppLayout />}>
          <Route path="/home" element={<HomePage />} />
          <Route path="/account" element={<AccountPage />} />
          <Route path="/invest" element={<InvestPage />} />
          <Route path="/community" element={<CommunityPage />} />
          <Route path="/myinfo" element={<MyInfoPage />} />
        </Route>
        <Route path="/mypage" element={<Navigate to="/myinfo" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
