import { Box } from '../common/Box'
import { cx } from '../common/cx'
import styles from './MyInfoThemeBox.module.css'

interface Props {
  className?: string
  id?: string
  onToast: (msg: string) => void
}

// 테마 — 지금은 기본(밝게)만 쓸 수 있고, 다크·시스템 설정은 눌러도 준비 중 안내만 나옴(실제 다크 모드는 아직 없음)
export function MyInfoThemeBox({ className, id, onToast }: Props) {
  return (
    <Box id={id} data-box="theme" className={cx(styles.box, className)} title="테마">
      <div role="radiogroup" aria-label="테마">
        <button type="button" role="radio" aria-checked="true" className={cx(styles.item, styles.current)}>
          <span className={cx(styles.radio, styles.radioOn)} />
          <span className={styles.name}>기본(밝게)</span>
          <span className={styles.state}>사용 중</span>
        </button>
        <button type="button" role="radio" aria-checked="false" aria-disabled="true" className={cx(styles.item, styles.soon)} onClick={() => onToast('다크 테마는 준비 중이에요')}>
          <span className={styles.radio} />
          <span className={styles.name}>다크</span>
          <span className={styles.state}>준비 중</span>
        </button>
        <button type="button" role="radio" aria-checked="false" aria-disabled="true" className={cx(styles.item, styles.soon, styles.lastItem)} onClick={() => onToast('시스템 설정 따르기는 준비 중이에요')}>
          <span className={styles.radio} />
          <span className={styles.name}>시스템 설정 따르기</span>
          <span className={styles.state}>준비 중</span>
        </button>
      </div>
    </Box>
  )
}
