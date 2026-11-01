import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cx } from '../common/cx'
import styles from './MyInfoDialogs.module.css'

// 내 정보 화면의 작은 창들(원본 dlg·pd). 어두운 막을 눌러도 안 닫히고, 취소 버튼이나 Esc로만 닫힘.
// 공통 Modal은 막을 누르면 닫혀서 원본과 달라 따로 둠. 확인 창은 로그아웃 확인(M-6)에서도 같이 씀.
function useEsc(onClose: () => void) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])
}

interface FrameProps {
  role: 'dialog' | 'alertdialog'
  label?: string
  wide?: boolean
  children: ReactNode
}

function Frame({ role, label, wide = false, children }: FrameProps) {
  return createPortal(
    <div className={styles.backdrop}>
      <div className={cx(styles.panel, wide && styles.wide)} role={role} aria-modal="true" aria-label={label}>
        {children}
      </div>
    </div>,
    document.body
  )
}

interface ConfirmProps {
  title: string
  okLabel: string
  onCancel: () => void
  onOk: () => void
}

// 제목 + 취소·확인 버튼 두 개
export function MyInfoConfirm({ title, okLabel, onCancel, onOk }: ConfirmProps) {
  useEsc(onCancel)
  return (
    <Frame role="alertdialog">
      <h3 className={styles.title}>{title}</h3>
      <div className={cx(styles.actions, styles.actionsLoose)}>
        <button type="button" className={styles.cancel} onClick={onCancel}>취소</button>
        <button type="button" className={styles.ok} onClick={onOk}>{okLabel}</button>
      </div>
    </Frame>
  )
}

interface PubProps {
  agree: boolean
  onToggle: () => void
  onCancel: () => void
  onOk: () => void
}

// 내 투자성향 공개 창: 동의에 체크해야 "공개하기"가 눌림
export function MyInfoPubDialog({ agree, onToggle, onCancel, onOk }: PubProps) {
  useEsc(onCancel)
  return (
    <Frame role="dialog" label="성향 공개" wide>
      <h3 className={styles.title}>내 투자성향을 공개할까요?</h3>
      <p className={styles.desc}>공개하면 내 글과 답글에 성향 끼루와 성향 이름이 보여요. 투자성향은 개인정보라서 공개에 동의한 경우에만 보여드려요. 언제든 끌 수 있어요.</p>
      <button type="button" role="checkbox" aria-checked={agree} className={styles.agree} onClick={onToggle}>
        <span className={cx(styles.cb, agree && styles.cbOn)}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
        </span>
        공개에 동의해요
      </button>
      <div className={styles.actions}>
        <button type="button" className={styles.cancel} onClick={onCancel}>취소</button>
        <button type="button" className={cx(styles.ok, !agree && styles.okOff)} disabled={!agree} onClick={onOk}>공개하기</button>
      </div>
    </Frame>
  )
}
