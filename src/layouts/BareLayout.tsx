import { Outlet } from 'react-router-dom'
import styles from './BareLayout.module.css'

// 랜딩·로그인용 — 상단 바·푸터·챗봇 없이 화면만
export function BareLayout() {
  return (
    <div className={styles.shell}>
      <Outlet />
    </div>
  )
}
