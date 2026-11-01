import { LandingNavLinks } from './LandingNavLinks'

export function LandingHdr2({ loggedIn }: { loggedIn: boolean }) {
  return (
    <header id="hdr2" aria-label="상단 메뉴">
      <a className="lo" href="#" aria-label="Returns. 맨 위로">
        <img className="wm-dk" src="/assets/wordmark-white.png" alt="Returns." />
        <img className="wm-lk" src="/assets/wordmark.png" alt="" />
      </a>
      <nav>
        <LandingNavLinks loggedIn={loggedIn} />
      </nav>
    </header>
  )
}

export function LandingHdr({ loggedIn }: { loggedIn: boolean }) {
  return (
    <header id="hdr">
      <img src="/assets/wordmark-white.png" alt="Returns." />
      <nav>
        <LandingNavLinks loggedIn={loggedIn} />
      </nav>
    </header>
  )
}
