import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CommunityCenter, type FeedTab, type HotScope } from '../components/community/CommunityCenter'
import { CommunityTop10 } from '../components/community/CommunityTop10'
import { BAR_H_FALLBACK, FIXED_MIN_HEIGHT, KR_ALL, MID_MIN, RECENT_KEY, TOAST_MS, WIDE_MIN, rowHeight, stockFromUrl } from '../components/community/communityData'
import { loadRecent, pushRecent } from '../components/community/communityLogic'
import { Toast } from '../components/common/Toast'
import { useToast } from '../components/common/useToast'
import { cx } from '../components/common/cx'
import styles from '../components/community/CommunityLayout.module.css'
import { RETURNS_DATA as RD } from '../data/returns'

const viewport = () => ({ w: window.innerWidth, h: window.innerHeight })

// 커뮤니티 — 1~3번째 부분: 열 배치 + 많이 이야기하는 종목 + 가운데 열(종목 정보·종목 고르기·탭·글 검색·글 목록) + 아래 안내 문구. 글쓰기는 C-5, 오른쪽 열은 C-6
export function CommunityPage() {
  const [params] = useSearchParams()
  const [code, setCode] = useState(() => stockFromUrl(params.get('stock')))
  const [thread] = useState(() => params.get('thread')) // 주소 ?thread= 로 들어온 글(처음 한 번만 쓰임)
  const [tab, setTab] = useState<FeedTab>(() => (!params.get('thread') && params.get('tab') === 'mine' ? 'mine' : 'live'))
  const [scope, setScope] = useState<HotScope>('stock')
  const [recent, setRecent] = useState(() => loadRecent(stockFromUrl(params.get('stock'))))
  // TODO: 관심 종목은 백엔드 연결 시 서버 값. 오른쪽 열(C-4)에서 목록을 보여 줌
  const [watch, setWatch] = useState(() => RD.WATCH.filter((c) => KR_ALL[c]))
  // TODO: 닉네임·성향 공개 여부는 C-5·C-6에서 바꿀 수 있게 만들 때 상태로 바꿈. 지금은 홈과 같은 RD 값
  const nick = RD.COMMUNITY.nickname || '리아'
  const pubOn = RD.COMMUNITY.profilePublic
  const { message: toast, showToast } = useToast()
  const [view, setView] = useState(viewport)
  const [barH, setBarH] = useState(BAR_H_FALLBACK)
  const [colH, setColH] = useState(0)
  const gridRef = useRef<HTMLDivElement>(null)
  const leftRef = useRef<HTMLDivElement>(null)

  const wide = view.w >= WIDE_MIN
  const mid = view.w >= MID_MIN && !wide
  const fixed = wide && view.h >= FIXED_MIN_HEIGHT

  // 창 크기 + 상단 바 높이(원본: main 윗쪽 위치)를 다시 잼
  const measure = useCallback(() => {
    setView(viewport())
    const main = gridRef.current?.closest('main')
    if (main) setBarH(Math.round(main.getBoundingClientRect().top + window.scrollY))
  }, [])
  useLayoutEffect(() => {
    const t0 = setTimeout(measure, 0)
    const t = setTimeout(measure, 200)
    window.addEventListener('resize', measure)
    return () => {
      clearTimeout(t0)
      clearTimeout(t)
      window.removeEventListener('resize', measure)
    }
  }, [measure])

  // 왼쪽 칸 높이를 지켜봄 → 고정일 때 행 높이에 반영
  useEffect(() => {
    const el = leftRef.current
    if (!el || !window.ResizeObserver) return
    const ro = new ResizeObserver(() => setColH(Math.round(el.getBoundingClientRect().height)))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // 최근 본 종목은 탭을 닫기 전까지 기억(원본 sessionStorage)
  useEffect(() => {
    try { sessionStorage.setItem(RECENT_KEY, JSON.stringify(recent)) } catch { /* 저장 못 해도 화면은 그대로 */ }
  }, [recent])

  const url = (c: string, t: FeedTab) => '?stock=' + c + (t === 'mine' ? '&tab=mine' : '')
  const replaceUrl = (c: string, t: FeedTab) => {
    try { history.replaceState(null, '', url(c, t)) } catch { /* 주소 갱신 실패는 무시 */ }
  }
  // 왼쪽 목록·가운데 종목 고르기 모두 여기로: 선택 종목 + 최근 본 + 주소가 같이 바뀜
  const selectCode = (c: string) => {
    setCode(c)
    setRecent((r) => pushRecent(r, c))
    replaceUrl(c, tab)
  }
  const selectTab = (t: FeedTab) => {
    setTab(t)
    replaceUrl(code, t)
  }
  const toggleStar = () => {
    const on = watch.includes(code)
    setWatch((w) => (on ? w.filter((c) => c !== code) : w.concat(code)))
    showToast(RD.SN[code] + (on ? ' 관심 종목에서 뺐어요' : ' 관심 종목에 추가했어요'), TOAST_MS)
  }

  return (
    <>
      <h1 className={styles.srOnly}>커뮤니티</h1>
      <div
        ref={gridRef}
        data-grid3="1"
        className={cx(styles.grid, wide && styles.wide, mid && styles.mid, fixed && styles.fixed)}
        style={{ '--bar-h': barH + 'px' } as CSSProperties}
      >
        <div ref={leftRef} data-col="left" className={styles.left}>
          <CommunityTop10 code={code} fixed={fixed} rowH={rowHeight(fixed, colH)} onSelect={selectCode} />
        </div>
        <CommunityCenter
          code={code}
          recent={recent}
          starred={watch.includes(code)}
          tab={tab}
          scope={scope}
          onCode={selectCode}
          onTab={selectTab}
          onScope={setScope}
          onStar={toggleStar}
          fixed={fixed}
          nick={nick}
          pubOn={pubOn}
          onToast={(t) => showToast(t, TOAST_MS)}
          thread={thread}
        />
        <div data-col="right" className={styles.right} />
      </div>
      <p className={styles.notice}>끼루 AI는 정보를 안내하며 투자 판단은 고객님께 있어요 · 금액은 다른 계좌의 해외주식 순매수가 없다고 가정한 예시예요</p>
      <Toast message={toast} />
    </>
  )
}
