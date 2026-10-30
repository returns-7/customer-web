import '../../styles/tokens.css'
import { cx } from '../common/cx'
import { ModalFrame } from './ModalFrame'
import { calcRows } from './accountTaxData'
import styles from './TaxCalcModal.module.css'

interface TaxCalcModalProps {
  open: boolean
  onClose: () => void
}

// 세액 계산 근거 창 — 단계·계산식·값 표. 창 틀은 신청 창과 같은 ModalFrame
export function TaxCalcModal({ open, onClose }: TaxCalcModalProps) {
  if (!open) return null

  const rows = calcRows()

  return (
    <ModalFrame
      title="세액 계산 근거"
      sub="매일 오전 7시 다시 계산 · 2027년 5월 신고 때 확정"
      onClose={onClose}
      bodyClassName={styles.body}
      footClassName={styles.foot}
      footer={
        <>
          <span className={styles.footText}>참고용 정보이며 실제 세액은 신고 시 확정돼요 · 근거: RIA 상품 가이드라인</span>
          <button type="button" className={styles.ok} onClick={onClose}>닫기</button>
        </>
      }
    >
      <div className={styles.thead}>
        <span>단계</span>
        <span>계산식</span>
        <span className={styles.right}>값</span>
      </div>
      {rows.map((r) => (
        <div key={r.n} className={cx(styles.row, r.last && styles.rowLast)}>
          <span className={styles.name}>{r.n}. {r.name}</span>
          <span className={styles.formula}>{r.formula}</span>
          <b className={cx(styles.value, r.last && styles.valueLast)}>{r.value}</b>
        </div>
      ))}
      <div className={styles.note}>범위는 참고용이에요. 매도 여부와 시점은 고객님이 결정해요.</div>
    </ModalFrame>
  )
}
