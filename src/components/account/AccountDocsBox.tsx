import { useEffect, useRef, useState } from 'react'
import '../../styles/tokens.css'
import { Box } from '../common/Box'
import { cx } from '../common/cx'
import { docItems } from './accountTaxData'
import type { IssueRecord } from './accountTaxData'
import styles from './AccountDocsBox.module.css'

interface AccountDocsBoxProps {
  className?: string
  issued: IssueRecord[] // 발급 기록(최근 것이 앞) — 탭을 오가도 남도록 페이지가 들고 있음
  onIssue: (name: string) => void // PDF 받기
  onReissue: (name: string) => void // 발급 기록의 다시 받기
}

// 증빙서류 박스(data-box="docs") — 서류 줄(PDF 받기) + 머리줄의 발급 기록 드롭다운(최근 5건)
export function AccountDocsBox({ className, issued, onIssue, onReissue }: AccountDocsBoxProps) {
  const [open, setOpen] = useState(false)
  const headRef = useRef<HTMLSpanElement>(null)
  const docs = docItems()

  // 바깥을 누르거나 Esc를 누르면 닫힘. 머리줄 전체(제목 글자 포함)는 안쪽으로 봄(원본과 같음)
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      const head = headRef.current?.parentElement?.parentElement // 발급 기록 묶음 → 오른쪽 끝 칸 → 머리줄
      if (head && !head.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <Box
      data-box="docs"
      className={cx(styles.box, className)}
      title="증빙서류"
      head={<span className={styles.scope}>2027년 5월 신고용</span>}
      actions={
        <span ref={headRef} className={styles.head}>
          <button type="button" className={styles.issueBtn} aria-expanded={open} aria-haspopup="true" onClick={() => setOpen(!open)}>
            발급 기록 {open ? '▴' : '▾'}
          </button>
          {open && (
            <div role="menu" aria-label="발급 기록" className={styles.menu}>
              {issued.length === 0 && <div className={styles.empty}>발급 기록이 없어요</div>}
              {issued.slice(0, 5).map(([date, name], i) => (
                <div key={i} className={cx(styles.issue, i > 0 && styles.issueTop)}>
                  <span className={styles.issueDate}>{date}</span>
                  <span className={styles.issueName}>{name}</span>
                  <button type="button" role="menuitem" className={styles.again} onClick={() => onReissue(name)}>
                    다시 받기
                  </button>
                </div>
              ))}
            </div>
          )}
        </span>
      }
    >
      {docs.map((d, i) => (
        <div key={d.name} className={cx(styles.doc, i < docs.length - 1 && styles.docLine)}>
          <div className={styles.docText}>
            <div className={styles.docName}>{d.name}</div>
            <div className={styles.docDesc}>{d.desc}</div>
          </div>
          {d.ready ? (
            <button type="button" className={styles.get} onClick={() => onIssue(d.name)}>
              PDF 받기
            </button>
          ) : (
            <span className={styles.later}>2027년 1월부터</span>
          )}
        </div>
      ))}
    </Box>
  )
}
