import { Link } from 'react-router-dom'
import { RETURNS_DATA as RD } from '../../data/returns'
import { F } from '../../lib/calc'
import { Box } from '../common/Box'
import { cx } from '../common/cx'
import rows from './MyInfoRows.module.css'
import styles from './MyInfoAccountBox.module.css'

interface Props {
  className?: string
  onToast: (msg: string) => void
}

// 계좌 — 시연 설정(returns-demo)의 계좌 상태를 따름. 계좌 없음이면 개설 안내만
export function MyInfoAccountBox({ className, onToast }: Props) {
  const ac = RD.ACCOUNT
  const copy = () => {
    try {
      navigator.clipboard.writeText(ac.no)
    } catch {
      // 클립보드를 못 쓰는 환경에서도 안내는 보여 준다(원본과 동일)
    }
    onToast('계좌번호를 복사했어요')
  }

  return (
    <Box data-box="account" className={className} title="계좌">
      {RD.ACCOUNT_STATE !== 'none' ? (
        <div className={rows.grid}>
          <span className={rows.label}>RIA 계좌</span>
          <span className={cx(rows.value, rows.nowrap)}>
            {`${ac.name} ${ac.no}`}
          </span>
          <span className={cx(rows.label, styles.copyCell)}>
            <button type="button" className={styles.copy} onClick={copy}>
              복사
            </button>
          </span>
          <span className={rows.label}>상태</span>
          <span className={cx(rows.value, rows.span2)}>{ac.status}</span>
          <span className={rows.label}>개설일</span>
          <span className={cx(rows.value, rows.span2)}>{ac.opened ? F.dot(ac.opened) : ''}</span>
          <span className={cx(rows.label, rows.last)}>연결 일반계좌</span>
          <span className={styles.linked}>
            <span className={rows.nowrap}>
              {`${RD.LINKED.name} ${RD.LINKED.no}`}
            </span>
            <span className={styles.linkedNote}>{RD.LINKED.note || '입고·인출은 이 계좌로만'}</span>
          </span>
        </div>
      ) : (
        <div className={styles.none}>
          RIA 계좌가 없어요 · <Link to="/account#open">계좌 개설하기 ›</Link>
        </div>
      )}
    </Box>
  )
}
