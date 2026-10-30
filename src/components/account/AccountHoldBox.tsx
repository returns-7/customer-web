import { useState } from 'react'
import '../../styles/tokens.css'
import { Box } from '../common/Box'
import { HOLD_TIP, holdValues } from './accountTaxData'
import styles from './AccountHoldBox.module.css'

interface AccountHoldBoxProps {
  className?: string
  onHistory: () => void // 인출 내역 탭 이동은 다음 단계에서 연결
}

// 원금 유지 박스(data-box="hold") — 인출 가능일·D-day·진행 막대·유지 중인 원금·지금 인출 가능 금액
export function AccountHoldBox({ className, onHistory }: AccountHoldBoxProps) {
  const [tipOn, setTipOn] = useState(false)
  const h = holdValues()

  return (
    <Box
      data-box="hold"
      className={className}
      title="원금 유지"
      head={
        <span
          className={styles.tip}
          role="img"
          aria-label={HOLD_TIP}
          tabIndex={0}
          onMouseEnter={() => setTipOn(true)}
          onMouseLeave={() => setTipOn(false)}
          onFocus={() => setTipOn(true)}
          onBlur={() => setTipOn(false)}
        >
          i
          {tipOn && (
            <span role="tooltip" className={styles.tipText}>
              {HOLD_TIP}
            </span>
          )}
        </span>
      }
      actions={
        <button type="button" className={styles.link} onClick={onHistory}>
          인출 내역 ›
        </button>
      }
    >
      <div className={styles.body}>
        <div className={styles.dateRow}>
          <span className={styles.dateKey}>인출 가능일</span>
          <b className={styles.date}>
            {h.wdDate} (<span className={styles.dday}>D-{h.wdD}</span>)
          </b>
        </div>
        <div className={styles.confirm}>원화 확정일 {h.soldConf}(매도 체결 후 2영업일)부터 1년</div>
        <div className={styles.track}>
          <div className={styles.fill} style={{ width: h.pct }} />
        </div>
        <div className={styles.row}>
          <span className={styles.key}>유지 중인 원금</span>
          <span className={styles.val}>₩{h.paidAmt}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.keyClip}>지금 인출할 수 있는 금액(수익 초과분)</span>
          <span className={styles.val}>₩{h.wdNow}</span>
        </div>
      </div>
    </Box>
  )
}
