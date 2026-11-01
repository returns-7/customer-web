import { lazy, Suspense } from 'react'
import type { ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from '../layouts/AppLayout'
import { BareLayout } from '../layouts/BareLayout'

// 페이지는 모두 따로 불러온다(레이아웃·상단 바·푸터·챗봇은 메인에 남음)
const LandingPage = lazy(() => import('../pages/LandingPage').then((m) => ({ default: m.LandingPage })))
const LoginPage = lazy(() => import('../pages/LoginPage').then((m) => ({ default: m.LoginPage })))
const HomePage = lazy(() => import('../pages/HomePage').then((m) => ({ default: m.HomePage })))
const AccountPage = lazy(() => import('../pages/AccountPage').then((m) => ({ default: m.AccountPage })))
const InvestPage = lazy(() => import('../pages/InvestPage').then((m) => ({ default: m.InvestPage })))
const CommunityPage = lazy(() => import('../pages/CommunityPage').then((m) => ({ default: m.CommunityPage })))
const MyInfoPage = lazy(() => import('../pages/MyInfoPage').then((m) => ({ default: m.MyInfoPage })))

// Suspense를 레이아웃 안쪽(페이지 자리)에 둬서 불러오는 동안에도 상단 바·푸터·챗봇은 그대로 있다.
// 불러오는 동안은 각 레이아웃 배경색과 같은 빈 화면: 랜딩은 첫 화면 배경(--color-photo-base),
// 로그인은 배경 없음(body), 앱 화면은 AppLayout 배경(--color-bg)이 그대로 보인다.
const blank = (background?: string) => <div style={{ minHeight: '100vh', background }} />
const appBlank = <div style={{ flex: 1 }} />

function page(element: ReactNode, fallback: ReactNode) {
  return <Suspense fallback={fallback}>{element}</Suspense>
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<BareLayout />}>
          <Route path="/" element={page(<LandingPage />, blank('var(--color-photo-base)'))} />
          <Route path="/login" element={page(<LoginPage />, blank())} />
        </Route>
        <Route element={<AppLayout />}>
          <Route path="/home" element={page(<HomePage />, appBlank)} />
          <Route path="/account" element={page(<AccountPage />, appBlank)} />
          <Route path="/invest" element={page(<InvestPage />, appBlank)} />
          <Route path="/community" element={page(<CommunityPage />, appBlank)} />
          <Route path="/myinfo" element={page(<MyInfoPage />, appBlank)} />
        </Route>
        <Route path="/mypage" element={<Navigate to="/myinfo" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
