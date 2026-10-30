import { createPortal } from 'react-dom'
import '../../styles/tokens.css'
import styles from './Toast.module.css'

interface ToastProps {
  message: string | null
}

// 화면 아래 가운데 알림. 보이고 사라지는 시간은 useToast가 관리
export function Toast({ message }: ToastProps) {
  if (!message) return null
  return createPortal(
    <div className={styles.toast} role="status">
      {message}
    </div>,
    document.body
  )
}
