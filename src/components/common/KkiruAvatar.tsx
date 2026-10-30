import '../../styles/tokens.css'
import { assetUrl } from './assetUrl'
import { cx } from './cx'
import styles from './KkiruAvatar.module.css'

// 고객 아바타 = 성향별 원형 이미지 그대로. 성향 이름은 12px 보조 글자색
const PROFILES: Record<string, { label: string; img: string }> = {
  stable: { label: '안정형', img: 'assets/kkiru-avatar-stable.png' },
  stableSeek: { label: '안정추구형', img: 'assets/kkiru-avatar-stable-seek.png' },
  neutral: { label: '위험중립형', img: 'assets/kkiru-avatar-neutral.png' },
  active: { label: '적극투자형', img: 'assets/kkiru-avatar-active.png' },
  aggressive: { label: '공격투자형', img: 'assets/kkiru-avatar-aggressive.png' },
  private: { label: '비공개', img: 'assets/kkiru-avatar-private.png' }
}

interface KkiruAvatarProps {
  profile?: string
  size?: number
  label?: 'none' | 'below' | 'right'
}

export function KkiruAvatar({ profile, size, label = 'none' }: KkiruAvatarProps) {
  const c = (profile && PROFILES[profile]) || PROFILES.private
  const px = Number(size) || 32

  return (
    <div className={cx(styles.avatar, label === 'below' && styles.below)}>
      <img className={styles.image} src={assetUrl(c.img)} alt={c.label + ' 끼루'} style={{ width: px, height: px }} />
      {label !== 'none' && <span className={styles.label}>{c.label}</span>}
    </div>
  )
}
