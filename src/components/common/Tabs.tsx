import { Link } from 'react-router-dom'
import '../../styles/tokens.css'
import { cx } from './cx'
import styles from './Tabs.module.css'

// page    : 화면 맨 위 탭(44px · 15px · 아래 줄 있음) — 계좌 현황 · 자금 흐름
// box     : 박스 머리줄 안 탭(47px · 14px) — 잔고, 거래·신청 내역
// compact : 40px · 14px — 커뮤니티 위쪽 탭
// login   : 48px · 16px, 탭 사이 24px — 로그인·회원가입
export type TabsVariant = 'page' | 'box' | 'compact' | 'login'

export interface TabItem {
  key: string
  label: string
  count?: string | number // 라벨 뒤 작은 숫자
  to?: string // 라우트로 이동하는 탭이면 주소(없으면 버튼)
}

interface TabsProps {
  items: TabItem[]
  value: string
  onChange?: (key: string) => void
  variant?: TabsVariant
  ariaLabel?: string
}

export function Tabs({ items, value, onChange, variant = 'box', ariaLabel }: TabsProps) {
  return (
    <div className={cx(styles.tabs, styles[variant])} role="tablist" aria-label={ariaLabel}>
      {items.map((t, i) => {
        const on = t.key === value
        const className = cx(styles.tab, on && styles.on)
        const content = (
          <>
            {t.label}
            {t.count != null && <span className={styles.count}>{t.count}</span>}
          </>
        )
        return (
          <span key={t.key} className={styles.item}>
            {i > 0 && variant !== 'login' && <span className={styles.sep}>·</span>}
            {t.to ? (
              <Link to={t.to} role="tab" aria-selected={on} className={className} onClick={() => onChange?.(t.key)}>
                {content}
              </Link>
            ) : (
              <button type="button" role="tab" aria-selected={on} className={className} onClick={() => onChange?.(t.key)}>
                {content}
              </button>
            )}
          </span>
        )
      })}
    </div>
  )
}
