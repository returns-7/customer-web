import { useState } from 'react'
import '../../styles/tokens.css'
import { demo } from '../../data/returns'
import { cx } from '../common/cx'
import { DEV_ASSESS } from '../home/homeDevData'
import styles from '../home/HomeDevPanel.module.css'

interface Props {
  onChange: (assess: string) => void
}

// 왼쪽 아래 "시연 설정" — 원본 내 정보는 "성향 상태" 한 줄뿐. 값은 홈·내 계좌·주식 패키지와 같은 데모 상태(returns-demo)에 저장
export function MyInfoDevPanel({ onChange }: Props) {
  const [open, setOpen] = useState(false)
  const cur = demo().assess || 'ok'
  return (
    <div className={styles.dev}>
      {open && (
        <div className={styles.panel}>
          <div>
            <div className={styles.label}>성향 상태</div>
            <div className={styles.row}>
              {DEV_ASSESS.map(([v, label]) => (
                <button key={v} type="button" className={cx(styles.seg, cur === v && styles.segOn)} onClick={() => onChange(v)}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      <button type="button" className={styles.toggle} onClick={() => setOpen((o) => !o)}>
        시연 설정
      </button>
    </div>
  )
}
