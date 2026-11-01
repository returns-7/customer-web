import { useLayoutEffect } from 'react'

// 원본 landing-journey.html <head>의 폰트 주소 그대로
const FONT_LINKS = [
  { id: 'landing-font-preconnect-api', rel: 'preconnect', href: 'https://fonts.googleapis.com' },
  { id: 'landing-font-preconnect-static', rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: '' },
  {
    id: 'landing-font-css',
    rel: 'stylesheet',
    href: 'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Noto+Sans:wght@600&family=Roboto+Condensed:wght@500;700&display=swap',
  },
]

// 랜딩이 떠 있는 동안에만 html에 클래스를 붙인다(배경색은 landing.css의 html.landing-doc).
// 폰트 <link>는 다른 페이지 글꼴에 영향이 없고 다시 들어올 때 재사용되므로 언마운트 때 지우지 않는다.
export function useLandingDocument(): void {
  useLayoutEffect(() => {
    const root = document.documentElement
    root.classList.add('landing-doc')
    FONT_LINKS.forEach((f) => {
      if (document.getElementById(f.id)) return
      const el = document.createElement('link')
      el.id = f.id
      el.rel = f.rel
      el.href = f.href
      if (f.crossOrigin !== undefined) el.crossOrigin = f.crossOrigin
      document.head.appendChild(el)
    })
    return () => {
      root.classList.remove('landing-doc')
    }
  }, [])
}
