import { createPortal } from 'react-dom'
import '../../styles/tokens.css'
import { cx } from '../common/cx'
import { REPORT_ETC, REPORT_MAX, REPORT_REASONS } from './communityData'
import type { useCommunityFeed } from './useCommunityFeed'
import styles from './CommunityDialogs.module.css'

type Feed = ReturnType<typeof useCommunityFeed>

// 글 삭제 확인 창 + 신고 사유 창. 뒤의 어두운 막을 눌러도 닫히지 않고, 취소·Esc로만 닫힘(원본 그대로)
export function CommunityDialogs({ feed }: { feed: Feed }) {
  const { delId, report } = feed
  return createPortal(
    <>
      {delId && (
        <div className={styles.backdrop}>
          <div className={styles.panel} role="alertdialog" aria-modal="true" aria-label="글 삭제">
            <h3 className={styles.title}>글을 삭제할까요?</h3>
            <p className={styles.desc}>삭제한 글은 되돌릴 수 없어요.</p>
            <div className={styles.actions}>
              <button type="button" className={styles.cancel} onClick={feed.cancelDelete}>취소</button>
              <button type="button" className={styles.ok} onClick={feed.confirmDelete}>삭제</button>
            </div>
          </div>
        </div>
      )}
      {report && (
        <div className={styles.backdrop}>
          <div className={styles.panel} role="dialog" aria-modal="true" aria-label="신고 사유">
            <h3 className={styles.title}>신고 사유를 골라 주세요</h3>
            <div role="radiogroup" className={styles.list}>
              {REPORT_REASONS.map((label) => (
                <button key={label} type="button" role="radio" aria-checked={report.reason === label} className={styles.opt} onClick={() => feed.pickReason(label)}>
                  <span className={cx(styles.ring, report.reason === label && styles.ringOn)} />
                  {label}
                </button>
              ))}
            </div>
            {report.reason === REPORT_ETC && (
              <div>
                <input className={styles.etc} value={report.text} onChange={(e) => feed.typeReport(e.target.value)} maxLength={REPORT_MAX} placeholder="신고 사유를 적어 주세요" aria-label="기타 신고 사유" />
                <div className={styles.etcCount}>{report.text.length}/{REPORT_MAX}</div>
              </div>
            )}
            <div className={styles.actions}>
              <button type="button" className={styles.cancel} onClick={feed.cancelReport}>취소</button>
              <button type="button" className={styles.ok} disabled={!report.reason} onClick={feed.submitReport}>신고</button>
            </div>
          </div>
        </div>
      )}
    </>,
    document.body
  )
}
