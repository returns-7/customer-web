import { NavLink } from 'react-router-dom'

export function Header() {
  return (
    <header className="app-header">
      <NavLink to="/">MARIA</NavLink>
      <nav aria-label="주요 메뉴">
        <NavLink to="/">홈</NavLink>
        <NavLink to="/mypage">마이페이지</NavLink>
        <NavLink to="/login">로그인</NavLink>
      </nav>
    </header>
  )
}
