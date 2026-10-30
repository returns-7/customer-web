import { useEffect, useId } from 'react'
import type { MouseEvent } from 'react'
import { createPortal } from 'react-dom'
import '../../styles/tokens.css'
import { cx } from '../common/cx'
import { calcRows } from './accountTaxData'
import styles from './TaxCalcModal.module.css'

interface TaxCalcModalProps {
  open: boolean
  onClose: () => void
}

// 세액 계산 근거 창 — 단계·계산식·값 표. 공통 Modal은 폭·바닥 줄이 달라서 같은 토큰으로 따로 만듦
export function TaxCalcModal({ open, onClose }: TaxCalcModalProps) {
  const titleId = useId()

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  // 어두운 막을 눌렀을 때만 닫음(창 안쪽 클릭은 닫지 않음)
  const onBackdrop = (e: MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose()
  }
  const rows = calcRows()

  return createPortal(
    <div className={styles.backdrop} onClick={onBackdrop}>
      <div className={styles.panel} role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <div className={styles.head}>
          <h2 id={titleId} className={styles.title}>세액 계산 근거</h2>
          <span className={styles.sub}>매일 오전 7시 다시 계산 · 2027년 5월 신고 때 확정</span>
          <button type="button" className={styles.close} onClick={onClose} aria-label="닫기">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>
        <div className={styles.body}>
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
        </div>
        <div className={styles.foot}>
          <span className={styles.footText}>참고용 정보이며 실제 세액은 신고 시 확정돼요 · 근거: RIA 상품 가이드라인</span>
          <button type="button" className={styles.ok} onClick={onClose}>닫기</button>
        </div>
      </div>
    </div>,
    document.body
  )
}
