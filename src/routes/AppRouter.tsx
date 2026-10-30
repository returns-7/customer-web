import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from '../layouts/AppLayout'
import { BareLayout } from '../layouts/BareLayout'
import { AccountPage } from '../pages/AccountPage'
import { CommunityPage } from '../pages/CommunityPage'
import { HomePage } from '../pages/HomePage'
import { InvestPage } from '../pages/InvestPage'
import { LandingPage } from '../pages/LandingPage'
import { LoginPage } from '../pages/LoginPage'
import { MyInfoPage } from '../pages/MyInfoPage'

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<BareLayout />}>
          <Route path="/" element={<LandingPage />} />
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
