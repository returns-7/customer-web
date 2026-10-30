import '../../styles/tokens.css'
import { Box } from '../common/Box'
import { taxValues } from './accountTaxData'
import styles from './AccountTaxBox.module.css'

interface AccountTaxBoxProps {
  className?: string
  onOpenCalc: () => void
}

// 세액 박스(data-box="tax") — 예상 감면액·RIA가 없었다면·최종 납부 예상 세액. 혜택 취소·조정비율 문구는 상태에 따라
export function AccountTaxBox({ className, onOpenCalc }: AccountTaxBoxProps) {
  const t = taxValues()

  return (
    <Box
      data-box="tax"
      className={className}
      title="세액"
      head={<span className={styles.scope}>{t.bizShort} 기준</span>}
      actions={
        <button type="button" className={styles.link} onClick={onOpenCalc}>
          계산 근거 ›
        </button>
      }
    >
      <div className={styles.body}>
        {t.benX && (
          <div className={styles.cancelled}>
            <div className={styles.cancelledHead}>{t.benXMsg}</div>
            <div className={styles.cancelledDesc}>1년이 지나지 않은 원금이 인출돼 이 계좌에서 매도한 금액 전체가 일반 해외주식처럼 과세돼요.</div>
          </div>
        )}
        <div className={styles.cutLabel}>예상 감면액</div>
        <div className={styles.cut}>₩{t.cut}</div>
        {t.rangeOn && <div className={styles.range}>남은 한도까지 팔 경우 · 주가·환율 변동 반영 약 {t.range}(10번 중 8번 · 예시)</div>}
        <div className={styles.row}>
          <span className={styles.key}>RIA가 없었다면</span>
          <span className={styles.val}>₩{t.general}</span>
        </div>
        <div className={styles.row}>
          <span>최종 납부 예상 세액</span>
          <b className={styles.valBold}>₩{t.ria}</b>
        </div>
        <div className={styles.row}>
          <span className={styles.key}>남은 한도까지 팔면 감면</span>
          <span className={styles.val}>₩{t.guide}</span>
        </div>
        {t.adjOn && <div className={styles.adj}>{t.adjMsg}</div>}
      </div>
    </Box>
  )
}
