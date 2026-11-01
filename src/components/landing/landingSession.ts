// 로그인 표시(sessionStorage returns-login=1)를 읽는다 — 로그인 폼의 setLoginSession이 같은 키를 씀
export const readLandingLoggedIn = (): boolean => {
  try {
    return sessionStorage.getItem('returns-login') === '1'
  } catch {
    return false
  }
}
