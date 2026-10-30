import '../../styles/tokens.css'
import { Box } from '../common/Box'
import { limitValues } from './accountTaxData'
import styles from './AccountLimitBox.module.css'

interface AccountLimitBoxProps {
  className?: string
  onApply: () => void // 매도 신청 창은 다음 단계에서 연결
}

// 매도 한도 박스(data-box="limit") — 남은 한도·사용액·지금 공제율 구간·구간 마감
export function AccountLimitBox({ className, onApply }: AccountLimitBoxProps) {
  const v = limitValues()

  return (
    <Box
      data-box="limit"
      className={className}
      title="매도 한도"
      head={<span className={styles.scope}>전 증권사 합산</span>}
      actions={
        <button type="button" className={styles.link} onClick={onApply}>
          매도 신청 ›
        </button>
      }
    >
      <div className={styles.body}>
        <div className={styles.remainRow}>
          <span className={styles.remainLabel}>남은 한도</span>
          <b className={styles.remain}>{v.remain} 원</b>
          <span className={styles.of}>/ {v.limitMan}</span>
        </div>
        <div className={styles.track}>
          <div className={styles.fill} style={{ width: v.usedPct }} />
        </div>
        <div className={styles.used}>
          {v.used} 원 사용 · {v.soldShort} 매도
        </div>
        <div className={styles.row}>
          <span className={styles.key}>지금 공제율 구간</span>
          <span className={styles.val}>{v.bandLabel}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.key}>구간 마감</span>
          <span className={styles.val}>
            {v.bandEnd} (<span className={styles.dday}>D-{v.bandD}</span>)
          </span>
        </div>
        <div className={styles.guide}>
          <span className={styles.guideText}>{v.guideLine}</span>
          <button type="button" className={styles.guideLink} onClick={onApply}>
            매도 신청에서 보기 ›
          </button>
        </div>
      </div>
    </Box>
  )
}
