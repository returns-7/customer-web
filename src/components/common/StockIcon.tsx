import '../../styles/tokens.css'
import { assetUrl } from './assetUrl'
import styles from './StockIcon.module.css'

interface StockIconProps {
  color?: string
  initial?: string
  size?: number
  logo?: string
}

// 종목 아이콘 — 대표색 원 + 흰 이니셜. logo를 넘기면 원형 이미지로 표시
export function StockIcon({ color, initial, size, logo }: StockIconProps) {
  const px = Number(size) || 28
  const ini = String(initial || '?')

  if (logo) {
    return <img className={styles.logo} src={assetUrl(logo)} alt="" style={{ width: px, height: px }} />
  }

  const fontSize = Math.round(px * (ini.length > 1 ? 0.36 : 0.46))
  return (
    <span className={styles.initial} aria-hidden="true" style={{ width: px, height: px, background: color || 'var(--color-muted)', fontSize }}>
      {ini}
    </span>
  )
}
