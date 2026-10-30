import '../../styles/tokens.css'
import { RETURNS_DATA as RD } from '../../data/returns'
import { Box } from '../common/Box'
import { cx } from '../common/cx'
import { accountSummary } from './accountData'
import styles from './AccountSummaryBox.module.css'

interface AccountSummaryBoxProps {
  className?: string
  onCopy: () => void
  onApply: (kind: 'in' | 'sell' | 'out') => void // 신청 창은 다음 단계에서 연결
}

// 계좌 요약 박스(data-box="summary") — 총자산·예수금·국내 주식·입고 해외주식·손익·개설일·신청 버튼
export function AccountSummaryBox({ className, onCopy, onApply }: AccountSummaryBoxProps) {
  const a = accountSummary()
  const acct = RD.ACCOUNT

  return (
    <Box
      data-box="summary"
      className={className}
      title={acct.name}
      head={
        <>
          <span className={styles.no}>{acct.no}</span>
          <button type="button" className={styles.copy} aria-label="계좌번호 복사" onClick={onCopy}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="14" height="14" x="8" y="8" rx="2" />
              <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
            </svg>
          </button>
          <b className={styles.status}>{acct.status}</b>
        </>
      }
      actions={<span className={styles.asOf}>{a.bizShort} 기준</span>}
    >
      <div className={styles.totalBlock}>
        <div className={styles.totalLabel}>총자산</div>
        <b className={styles.total}>₩{a.total}</b>
      </div>
      <div className={styles.rows}>
        <div className={styles.row}>
          <span className={styles.label}>예수금(주문 가능)</span>
          <span className={styles.value}>₩{a.cash}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>국내 주식 평가금액</span>
          <span className={styles.value}>₩{a.invest}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>입고 해외주식</span>
          <span className={styles.value}>₩{a.foreign}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>평가손익(국내)</span>
          <span className={cx(styles.value, styles[a.pnlTone])}>{a.pnlTxt}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>전일 대비(국내)</span>
          <span className={styles.todayValue}>
            <span className={cx(styles.value, styles[a.todayTone])}>{a.todayTxt}</span>
            <span className={styles.basis}>{a.todayBasis}</span>
          </span>
        </div>
      </div>
      <div className={styles.meta}>
        개설 {a.opened} · 연결 일반계좌 {a.linked}
      </div>
      <div className={styles.actions}>
        <button type="button" className={cx(styles.btn, styles.outline)} onClick={() => onApply('in')}>
          입고 신청
        </button>
        <button type="button" className={cx(styles.btn, styles.primary)} onClick={() => onApply('sell')}>
          매도 신청
        </button>
        <button type="button" className={cx(styles.btn, styles.outline)} onClick={() => onApply('out')}>
          인출 신청
        </button>
      </div>
    </Box>
  )
}
