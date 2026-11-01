import { Link } from 'react-router-dom'
import { RETURNS_DATA } from '../../data/returns'
import { Icon } from './LandingIcon'

// 상단 바(#hdr, #hdr2)의 로그인·시작하기. 로그인 상태면 홈으로 가는 링크 하나로 바뀐다(원본과 같음).
export function LandingNavLinks({ loggedIn }: { loggedIn: boolean }) {
  if (loggedIn) {
    return (
      <Link className="lg" to="/home" style={{ display: 'inline' }}>
        {RETURNS_DATA.CUSTOMER.name} 님 · 홈으로 ›
      </Link>
    )
  }
  return (
    <>
      <Link className="lg" to="/login">
        로그인
      </Link>
      <Link className="cta" to="/login#signup">
        시작하기
        <Icon name="arrow-right" />
      </Link>
    </>
  )
}
