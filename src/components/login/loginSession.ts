const SESSION_MS = 30 * 60 * 1000 // 로그인 세션 30분(실제 경과 시간)

// 로그인 성공 표시: TopBar의 30분 세션이 이 키들을 읽음(로그인 폼의 setSession과 같은 키·값)
export const setLoginSession = () => {
  try {
    sessionStorage.setItem('returns-login', '1')
    sessionStorage.setItem('returns-session-exp', String(Date.now() + SESSION_MS))
    sessionStorage.removeItem('returns-session-warned')
  } catch {
    // 저장소를 못 쓰면 세션 표시 없이 이동
  }
}
