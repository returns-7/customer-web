import { LoginScreen } from '../components/login/LoginScreen'
import { useDocumentTitle } from '../components/common/useDocumentTitle'

export function LoginPage() {
  useDocumentTitle('Returns 로그인')
  return <LoginScreen />
}
