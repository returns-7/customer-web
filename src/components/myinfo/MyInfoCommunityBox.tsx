import { useState } from 'react'
import { Link } from 'react-router-dom'
import { RETURNS_DATA as RD } from '../../data/returns'
import { Box } from '../common/Box'
import { cx } from '../common/cx'
import { NICK_MAX } from '../community/communityData'
import { checkNick, type NickCheck } from '../community/communityNick'
import { MyInfoPubDialog } from './MyInfoDialogs'
import { MyInfoSwitch } from './MyInfoSwitch'
import row from './MyInfoToggleRow.module.css'
import styles from './MyInfoCommunityBox.module.css'

interface Props {
  className?: string
  onToast: (msg: string) => void
}

const MSG: Record<NickCheck, string> = {
  ok: '사용할 수 있어요',
  dup: '이미 쓰고 있는 닉네임이에요',
  bad: '2~10자, 한글·영문·숫자로 써 주세요'
}

// 커뮤니티 — 닉네임 바꾸기(커뮤니티 페이지와 같은 규칙) + 투자성향 공개 켜고 끄기
// 원본은 이 화면 안에서만 값을 들고 있고(처음 값은 RD.COMMUNITY) 커뮤니티 화면과 공유하지 않음 — 그대로 따름.
// TODO: 백엔드 연결 시 서버의 닉네임·성향 공개 저장·조회로 대체(그때 커뮤니티 화면과도 같은 값을 봄)
export function MyInfoCommunityBox({ className, onToast }: Props) {
  const [nick, setNick] = useState(RD.COMMUNITY.nickname || '리아')
  const [edit, setEdit] = useState(false)
  const [v, setV] = useState('')
  const [res, setRes] = useState<NickCheck | null>(null)
  const [pubOn, setPubOn] = useState(!!RD.COMMUNITY.profilePublic)
  const [pd, setPd] = useState<{ agree: boolean } | null>(null)
  const t = v.trim()

  const check = () => setRes(checkNick(t))
  const close = () => {
    setEdit(false)
    setV('')
    setRes(null)
  }
  const save = () => {
    if (res !== 'ok') return
    setNick(t)
    close()
    onToast('닉네임을 바꿨어요')
  }
  const togglePub = () => {
    if (pubOn) {
      setPubOn(false)
      onToast('내 성향을 비공개로 바꿨어요')
    } else setPd({ agree: false })
  }

  return (
    <Box data-box="community" className={className} title="커뮤니티" actions={<Link to="/community" className={styles.go}>커뮤니티 ›</Link>}>
      <div className={styles.body}>
        <div className={styles.nickRow}>
          <span className={styles.label}>닉네임</span>
          <span className={styles.nick}>{nick}</span>
          {!edit && (
            <button type="button" className={styles.edit} onClick={() => { setEdit(true); setV(nick); setRes(null) }}>
              수정
            </button>
          )}
        </div>
        {edit && (
          <div className={styles.form}>
            <div className={styles.inputs}>
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
              <button type="button" className={cx(styles.save, res === 'ok' && styles.saveOn)} disabled={res !== 'ok'} onClick={save}>저장</button>
            </div>
            <div className={styles.foot}>
              {res && <span className={cx(styles.msg, res === 'ok' ? styles.msgOk : styles.msgBad)}>{MSG[res]}</span>}
              <button type="button" className={styles.cancel} onClick={close}>취소</button>
            </div>
          </div>
        )}
        <div className={styles.pubRow}>
          <span className={row.label}>
            <span id="pubLabel" className={row.name}>성향 공개</span>
            <span className={row.desc}>기본은 비공개예요. 공개하면 내 글에 성향 이름이 보여요.</span>
          </span>
          <MyInfoSwitch on={pubOn} labelId="pubLabel" onToggle={togglePub} />
        </div>
      </div>
      {pd && (
        <MyInfoPubDialog
          agree={pd.agree}
          onToggle={() => setPd({ agree: !pd.agree })}
          onCancel={() => setPd(null)}
          onOk={() => {
            if (!pd.agree) return
            setPd(null)
            setPubOn(true)
            onToast('내 성향을 공개해요')
          }}
        />
      )}
    </Box>
  )
}
