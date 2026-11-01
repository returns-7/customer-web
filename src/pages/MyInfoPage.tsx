import { useEffect, useReducer, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Toast } from '../components/common/Toast'
import { cx } from '../components/common/cx'
import { useToast } from '../components/common/useToast'
import styles from '../components/myinfo/MyInfoLayout.module.css'
import { MyInfoAccountBox } from '../components/myinfo/MyInfoAccountBox'
import { MyInfoBasicBox } from '../components/myinfo/MyInfoBasicBox'
import { MyInfoRiskyNotice } from '../components/myinfo/MyInfoRiskyNotice'
import { MyInfoProfileBox } from '../components/myinfo/MyInfoProfileBox'
import { MyInfoSlot } from '../components/myinfo/MyInfoSlot'
import { MyInfoTradeBox } from '../components/myinfo/MyInfoTradeBox'
import { assessState, readHist } from '../components/myinfo/myinfoProfile'
import { useAppShell } from '../layouts/appShell'
import { RETURNS_DATA as RD } from '../data/returns'

const HASH_BOXES = ['assess', 'notify', 'theme']

// 내 정보 — M-1: 틀(박스 10개 자리) + 내 프로필 · 투자성향 + 거래로 본 성향 + 주소 해시 이동
export function MyInfoPage() {
  const shell = useAppShell()
  const { hash } = useLocation()
  const { message: toast, showToast } = useToast()
  const [, refresh] = useReducer((n: number) => n + 1, 0)
  const [riskyHide, setRiskyHide] = useState(false)
  const [hist] = useState(readHist)
  const [flash, setFlash] = useState<string | null>(null)
  const flashTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const firstHash = useRef(true)
  const profLabel = RD.PROFILES[RD.CUSTOMER.profile]?.label

  // 시연 설정(성향 상태 등)이 바뀌면 다시 그림
  useEffect(() => {
    const onDemo = () => {
      setRiskyHide(false) // 원본: 시연 설정이 바뀌면 '30일 동안 보지 않기'도 풀림
      refresh()
    }
    window.addEventListener('returns-demo', onDemo)
    return () => window.removeEventListener('returns-demo', onDemo)
  }, [])

  useEffect(() => {
    shell.setTopBar({ profLabel })
    return () => shell.setTopBar({})
  }, [shell, profLabel])

  // 원본 goHash: 80px 아래로 부드럽게 스크롤 + 테두리 1.5초 강조. 처음 들어올 때는 0.3초 뒤, 같은 화면에서 해시만 바뀌면 바로
  useEffect(() => {
    const id = hash.slice(1)
    if (!HASH_BOXES.includes(id)) return
    const go = () => {
      const el = document.getElementById(id)
      if (!el) return
      window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 80, behavior: 'smooth' })
      setFlash(id)
      clearTimeout(flashTimer.current)
      flashTimer.current = setTimeout(() => setFlash(null), 1500)
    }
    if (firstHash.current) {
      firstHash.current = false
      const t = setTimeout(go, 300)
      return () => clearTimeout(t)
    }
    go()
  }, [hash])
  useEffect(() => () => clearTimeout(flashTimer.current), [])

  // 다시 진단하기 창은 M-5에서 연결 (지금은 모양만)
  const openAssess = () => {}

  return (
    <>
      <h1 className={styles.srOnly}>내 정보</h1>
      <div className={styles.page}>
        <div className={styles.col}>
          <MyInfoProfileBox className={cx(styles.profile, styles.flashable, flash === 'assess' && styles.flashOn)} hist={hist} onOpenAssess={openAssess} />
          {assessState() === 'risky' && !riskyHide && (
            <MyInfoRiskyNotice
              className={styles.trade}
              onOpenAssess={openAssess}
              onSnooze={() => {
                setRiskyHide(true)
                showToast('30일 동안 이 안내를 보지 않아요')
              }}
            />
          )}
          {assessState() !== 'none' && <MyInfoTradeBox className={styles.trade} onOpenAssess={openAssess} />}
          <MyInfoBasicBox className={styles.basic} onToast={showToast} />
          <MyInfoAccountBox className={styles.account} onToast={showToast} />
          <MyInfoSlot box="community" className={cx(styles.community, styles.hCommunity)} />
        </div>
        <div className={styles.col}>
          <MyInfoSlot box="notify" id="notify" flashing={flash === 'notify'} className={cx(styles.notify, styles.hNotify)} />
          <div className={styles.pair}>
            <MyInfoSlot box="consent" className={cx(styles.consent, styles.hConsent)} />
            <MyInfoSlot box="theme" id="theme" flashing={flash === 'theme'} className={cx(styles.theme, styles.hTheme)} />
          </div>
          <MyInfoSlot box="security" className={cx(styles.security, styles.hSecurity)} />
          <MyInfoSlot box="logins" className={cx(styles.logins, styles.hLogins)} />
        </div>
      </div>
      <p className={styles.note}>개인정보는 화면에 일부만 보여드려요 · 리턴증권은 교육용 프로젝트의 가상 증권사입니다</p>
      <Toast message={toast} />
    </>
  )
}
