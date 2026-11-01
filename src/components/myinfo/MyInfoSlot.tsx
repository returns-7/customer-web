import { cx } from '../common/cx'
import styles from './MyInfoLayout.module.css'

interface Props {
  box: string // data-box 이름
  id?: string // 주소 해시로 이동하는 박스(notify·theme)
  flashing?: boolean
  className?: string
}

// 아직 만들지 않은 박스 자리. 이후 부분(M-2~M-4)에서 실제 박스로 바뀜
export function MyInfoSlot({ box, id, flashing = false, className }: Props) {
  return <section id={id} data-box={box} className={cx(styles.slot, id && styles.flashable, flashing && styles.flashOn, className)} />
}
