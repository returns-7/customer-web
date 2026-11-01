import { useEffect, useRef, useState } from 'react'
import { RETURNS_DATA as RD } from '../../data/returns'
import { Box } from '../common/Box'
import { cx } from '../common/cx'
import rows from './MyInfoRows.module.css'
import styles from './MyInfoBasicBox.module.css'

interface Props {
  className?: string
  onToast: (msg: string) => void
}

interface Edit {
  phone: string
  phone0: string
  email: string
  email0: string
  code: string
  sentAt: number | null
  verified: boolean
  emailTouched: boolean
}

const CODE_SECONDS = 180

const maskPhone = (v: string) => {
  const d = v.replace(/\D/g, '')
  return d.length >= 10 ? d.slice(0, 3) + '-****-' + d.slice(-4) : v
}
const maskEmail = (v: string) => {
  const [a, b] = v.split('@')
  return (a.length <= 2 ? a[0] + '*' : a.slice(0, 2) + '***') + '@' + b
}
const fmtPhone = (raw: string) => {
  const d = raw.replace(/\D/g, '').slice(0, 11)
  return d.length < 4 ? d : d.length < 8 ? d.slice(0, 3) + '-' + d.slice(3) : d.slice(0, 3) + '-' + d.slice(3, d.length - 4) + '-' + d.slice(-4)
}

// 기본 정보 — 보기 / 수정(휴대폰 인증번호 · 이메일). 저장한 값은 이 페이지 안에서만 바뀜(원본과 같음)
export function MyInfoBasicBox({ className, onToast }: Props) {
  const cu = RD.CUSTOMER
  const [phone, setPhone] = useState<string | null>(null)
  const [email, setEmail] = useState<string | null>(null)
  const [ed, setEd] = useState<Edit | null>(null)
  // 남은 시간 표시용 현재 시각 — 실제 시간(Date.now)으로 셈(로그인 30분 타이머와 같은 예외)
  const [now, setNow] = useState(() => Date.now())
  const timer = useRef<ReturnType<typeof setInterval> | undefined>(undefined)

  useEffect(() => () => clearInterval(timer.current), [])

  const curPhone = phone || cu.phone || '010-****-5678'
  const curEmail = email || cu.email || 'ri***@returns.co.kr'

  const editing = ed != null
  const e = ed ?? { phone: '', phone0: '', email: '', email0: '', code: '', sentAt: null, verified: false, emailTouched: false }
  const phoneChanged = editing && e.phone !== e.phone0
  const phoneValid = /^01[016789]\d{7,8}$/.test(e.phone.replace(/\D/g, ''))
  const left = e.sentAt ? Math.max(0, CODE_SECONDS - Math.floor((now - e.sentAt) / 1000)) : 0
  const emValid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e.email.trim())
  const emErr = editing && e.emailTouched && !emValid
  const phoneOk = !phoneChanged || e.verified
  const saveWhy = !editing ? '' : !phoneOk ? '바뀐 휴대폰 번호를 인증해야 저장할 수 있어요' : !emValid ? '이메일 형식을 확인해 주세요' : ''
  const saveOk = editing && phoneOk && emValid && (phoneChanged || e.email.trim() !== e.email0)
  const codeOk = e.code.length === 6 && left > 0
  const mmss = String(Math.floor(left / 60)).padStart(2, '0') + ':' + String(left % 60).padStart(2, '0')

  const patch = (p: Partial<Edit>) => setEd((s) => (s ? { ...s, ...p } : s))

  const startEdit = () => setEd({ phone: curPhone, phone0: curPhone, email: curEmail, email0: curEmail, code: '', sentAt: null, verified: false, emailTouched: false })
  const cancel = () => {
    clearInterval(timer.current)
    setEd(null)
  }
  const save = () => {
    if (!saveOk) return
    clearInterval(timer.current)
    if (phoneChanged) setPhone(maskPhone(e.phone))
    if (e.email.trim() !== e.email0) setEmail(maskEmail(e.email.trim()))
    setEd(null)
    onToast('회원정보를 저장했어요')
  }
  const sendCode = () => {
    const t = Date.now()
    patch({ sentAt: t, code: '' })
    setNow(t)
    clearInterval(timer.current)
    timer.current = setInterval(() => setNow(Date.now()), 1000)
    onToast('인증번호를 보냈어요 · 시연에서는 아무 6자리나 입력하세요')
  }
  const checkCode = () => {
    if (!codeOk) return
    clearInterval(timer.current)
    patch({ verified: true })
  }
  const onPhone = (v: string) => {
    patch({ phone: /\*/.test(v) ? v : fmtPhone(v), verified: false, sentAt: null, code: '' })
    clearInterval(timer.current)
  }

  const fixedNote = editing ? '변경은 고객센터에서' : ''

  return (
    <Box
      data-box="basic"
      className={className}
      title="기본 정보"
      actions={
        !editing ? (
          <button type="button" className={styles.edit} onClick={startEdit}>
            수정
          </button>
        ) : (
          <>
            {saveWhy && <span className={styles.why}>{saveWhy}</span>}
            <button type="button" className={styles.cancel} onClick={cancel}>
              취소
            </button>
            <span className={styles.dot}>·</span>
            <button type="button" className={cx(styles.save, saveOk && styles.saveOn)} disabled={!saveOk} onClick={save}>
              저장
            </button>
          </>
        )
      }
    >
      <div className={rows.grid}>
        <span className={rows.label}>이름</span>
        <span className={rows.value}>{cu.name}</span>
        <span className={rows.aux}>{fixedNote}</span>
        <span className={rows.label}>생년월일</span>
        <span className={rows.value}>{cu.birth || '1994.**.**'}</span>
        <span className={rows.aux}>{fixedNote}</span>
        <span className={rows.label}>휴대폰</span>
        <div className={cx(rows.cell, styles.phoneCell)}>
          {!editing ? (
            <span>{curPhone}</span>
          ) : (
            <>
              <div className={styles.inline}>
                <input
                  className={cx(styles.input, styles.phone)}
                  value={e.phone}
                  onChange={(ev) => onPhone(ev.target.value)}
                  inputMode="numeric"
                  aria-label="휴대폰 번호"
                  placeholder="010-0000-0000"
                />
                {phoneChanged && phoneValid && !e.verified && (
                  <button type="button" className={styles.send} onClick={sendCode}>
                    {e.sentAt ? '다시 받기' : '인증번호 받기'}
                  </button>
                )}
                {phoneChanged && e.verified && <span className={styles.ok}>인증됐어요</span>}
              </div>
              {phoneChanged && !!e.sentAt && !e.verified && (
                <div className={styles.inline}>
                  <input
                    className={cx(styles.input, styles.code)}
                    value={e.code}
                    onChange={(ev) => patch({ code: ev.target.value.replace(/\D/g, '').slice(0, 6) })}
                    inputMode="numeric"
                    maxLength={6}
                    aria-label="인증번호 6자리"
                    placeholder="인증번호 6자리"
                  />
                  <span role="timer" className={cx(styles.timer, left <= 30 && styles.timerLow)}>
                    {mmss}
                  </span>
                  <button type="button" className={cx(styles.check, codeOk && styles.checkOn)} disabled={!codeOk} onClick={checkCode}>
                    확인
                  </button>
                  {left === 0 && <span className={styles.err}>시간이 지났어요 · 다시 받아 주세요</span>}
                </div>
              )}
            </>
          )}
        </div>
        <span className={rows.label}>이메일</span>
        <div className={cx(rows.cell, styles.emailCell)}>
          {!editing ? (
            <span>{curEmail}</span>
          ) : (
            <>
              <input
                className={cx(styles.input, styles.email, emErr && styles.emailErr)}
                value={e.email}
                onChange={(ev) => patch({ email: ev.target.value, emailTouched: true })}
                type="email"
                aria-label="이메일"
                placeholder="name@example.com"
              />
              {emErr && <span className={styles.err}>이메일 형식을 확인해 주세요</span>}
            </>
          )}
        </div>
      </div>
    </Box>
  )
}
