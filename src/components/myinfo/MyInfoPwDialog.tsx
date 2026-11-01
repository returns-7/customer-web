import { useState } from 'react'
import { Modal } from '../common/Modal'
import { cx } from '../common/cx'
import styles from './MyInfoPwDialog.module.css'

interface Props {
  onClose: () => void
  onDone: () => void
}

// 비밀번호 변경 창 — 현재 비밀번호 + 새 비밀번호(8~20자, 영문·숫자·특수문자 중 2가지 이상) + 확인이 모두 맞아야 "변경"이 눌림
// 규칙 안내 색과 빨간 테두리는 새 비밀번호를 한 글자라도 쓴 뒤부터, "서로 달라요"는 확인 칸에 쓴 뒤부터 보임
// TODO: 백엔드 연결 시 서버가 현재 비밀번호를 검증하고 변경(지금은 입력 형식만 확인)
export function MyInfoPwDialog({ onClose, onDone }: Props) {
  const [cur, setCur] = useState('')
  const [n1, setN1] = useState('')
  const [n2, setN2] = useState('')

  const kinds = [/[A-Za-z]/.test(n1), /\d/.test(n1), /[^A-Za-z0-9]/.test(n1)].filter(Boolean).length
  const ruleOk = n1.length >= 8 && n1.length <= 20 && kinds >= 2
  const mis = !!n2 && n2 !== n1
  const ok = !!cur && ruleOk && n2 === n1

  return (
    <Modal open title="비밀번호 변경" onClose={onClose} okLabel="변경" okDisabled={!ok} onOk={() => ok && onDone()}>
      <label className={styles.field}>
        현재 비밀번호
        <input type="password" className={styles.input} value={cur} onChange={(e) => setCur(e.target.value)} autoComplete="current-password" />
      </label>
      <label className={styles.field}>
        새 비밀번호
        <input type="password" className={cx(styles.input, n1 && !ruleOk && styles.bad)} value={n1} onChange={(e) => setN1(e.target.value.slice(0, 20))} autoComplete="new-password" />
        <span className={cx(styles.rule, n1 && (ruleOk ? styles.ruleOk : styles.ruleBad))}>8~20자, 영문·숫자·특수문자 중 2가지 이상</span>
      </label>
      <label className={styles.field}>
        새 비밀번호 확인
        <input type="password" className={cx(styles.input, mis && styles.bad)} value={n2} onChange={(e) => setN2(e.target.value.slice(0, 20))} autoComplete="new-password" />
        {mis && <span className={styles.mis}>새 비밀번호가 서로 달라요</span>}
      </label>
    </Modal>
  )
}
