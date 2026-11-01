import { useState } from 'react'
import '../../styles/tokens.css'
import { cx } from '../common/cx'
import { NICK_MAX } from './communityData'
import { checkNick, type NickCheck } from './communityNick'
import styles from './CommunityNickForm.module.css'

const MSG: Record<NickCheck, string> = {
  ok: '사용할 수 있어요',
  dup: '이미 쓰고 있는 닉네임이에요',
  bad: '2~10자, 한글·영문·숫자로 써 주세요'
}

interface CommunityNickFormProps {
  first: boolean // 처음 정하는 중이면 제목이 보이고 취소 없음
  initial?: string // 바꾸는 중이면 지금 닉네임
  onSave: (nick: string) => void
  onCancel?: () => void
  bare?: boolean // 오른쪽 프로필 카드 안에 넣을 때: 바깥 여백·밑줄 없이
}

// 닉네임 정하기: 입력 → 중복 확인 → 저장(확인 결과가 "사용할 수 있어요"일 때만). 오른쪽 프로필 카드에서도 같은 부품을 씀
export function CommunityNickForm({ first, initial = '', onSave, onCancel, bare = false }: CommunityNickFormProps) {
  const [v, setV] = useState(initial)
  const [res, setRes] = useState<NickCheck | null>(null)
  const t = v.trim()
  const check = () => setRes(checkNick(t))
  const save = () => { if (res === 'ok') onSave(t) }

  return (
    <div className={cx(styles.wrap, bare && styles.bare)}>
      <div className={styles.col}>
        {first && <div className={styles.title}>커뮤니티에서 쓸 닉네임을 정해 주세요</div>}
        <div className={styles.row}>
          <input
            className={cx(styles.input, (res === 'dup' || res === 'bad') && styles.inputBad)}
            value={v}
            onChange={(e) => { setV(e.target.value.slice(0, NICK_MAX)); setRes(null) }}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (res === 'ok') save(); else check() } }}
            maxLength={NICK_MAX}
            placeholder="2~10자 · 한글·영문·숫자"
            aria-label="닉네임"
          />
          <button type="button" className={styles.check} onClick={check}>중복 확인</button>
          <button type="button" className={styles.save} disabled={res !== 'ok'} onClick={save}>저장</button>
        </div>
        {res && <div className={cx(styles.msg, res === 'ok' ? styles.msgOk : styles.msgBad)}>{MSG[res]}</div>}
        <div className={styles.foot}>
          <span>내 정보에서도 바꿀 수 있어요</span>
          {!first && onCancel && <button type="button" className={styles.cancel} onClick={onCancel}>취소</button>}
        </div>
      </div>
    </div>
  )
}
