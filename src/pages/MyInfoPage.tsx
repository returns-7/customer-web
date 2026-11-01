import { useEffect, useReducer, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Toast } from '../components/common/Toast'
import { cx } from '../components/common/cx'
import { useToast } from '../components/common/useToast'
import styles from '../components/myinfo/MyInfoLayout.module.css'
import { MyInfoAccountBox } from '../components/myinfo/MyInfoAccountBox'
import { MyInfoBasicBox } from '../components/myinfo/MyInfoBasicBox'
import { MyInfoCommunityBox } from '../components/myinfo/MyInfoCommunityBox'
import { MyInfoConsentBox } from '../components/myinfo/MyInfoConsentBox'
import { MyInfoNotifyBox } from '../components/myinfo/MyInfoNotifyBox'
import { MyInfoThemeBox } from '../components/myinfo/MyInfoThemeBox'
import { MyInfoRiskyNotice } from '../components/myinfo/MyInfoRiskyNotice'
import { MyInfoProfileBox } from '../components/myinfo/MyInfoProfileBox'
import { MyInfoSlot } from '../components/myinfo/MyInfoSlot'
import { MyInfoTradeBox } from '../components/myinfo/MyInfoTradeBox'
import { assessState, readHist } from '../components/myinfo/myinfoProfile'
import { useAppShell } from '../layouts/appShell'
import { RETURNS_DATA as RD } from '../data/returns'

const HASH_BOXES = ['assess', 'notify', 'theme']
const INPUTS = ['wheel', 'touchstart', 'keydown', 'pointerdown'] // 사용자가 직접 움직였다는 신호

// 내 정보 — 틀(박스 10개 자리) + 박스들 + 주소 해시 이동
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
  const fontWatch = useRef<(() => void) | undefined>(undefined)
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
      const toTop = () => window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 80, behavior: 'smooth' })
      toTop()
      // 글꼴이 이동 중에 들어오면 박스가 밀리므로, 글꼴 로딩이 끝날 때 한 번 더 맞춤(그 사이 사용자가 직접 움직였으면 하지 않음)
      fontWatch.current?.()
      if (document.fonts.status === 'loading') {
        const stop = () => {
          document.fonts.removeEventListener('loadingdone', again)
          INPUTS.forEach((ev) => window.removeEventListener(ev, stop, true))
          clearTimeout(limit)
          fontWatch.current = undefined
        }
        const again = () => {
          toTop()
          if (document.fonts.status !== 'loading') stop()
        }
        const limit = setTimeout(stop, 1500)
        document.fonts.addEventListener('loadingdone', again)
        INPUTS.forEach((ev) => window.addEventListener(ev, stop, true))
        fontWatch.current = stop
      }
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
  useEffect(() => () => {
    clearTimeout(flashTimer.current)
    fontWatch.current?.()
  }, [])

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
          <MyInfoCommunityBox className={styles.community} onToast={showToast} />
        </div>
        <div className={styles.col}>
          <MyInfoNotifyBox id="notify" className={cx(styles.notify, styles.flashable, flash === 'notify' && styles.flashOn)} onToast={showToast} />
          <div className={styles.pair}>
            <MyInfoConsentBox className={styles.consent} onToast={showToast} />
            <MyInfoThemeBox id="theme" className={cx(styles.theme, styles.flashable, flash === 'theme' && styles.flashOn)} onToast={showToast} />
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
