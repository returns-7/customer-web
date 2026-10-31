import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CommunityTop10 } from '../components/community/CommunityTop10'
import { BAR_H_FALLBACK, FIXED_MIN_HEIGHT, MID_MIN, WIDE_MIN, rowHeight, stockFromUrl } from '../components/community/communityData'
import { cx } from '../components/common/cx'
import styles from '../components/community/CommunityLayout.module.css'

const viewport = () => ({ w: window.innerWidth, h: window.innerHeight })

// 커뮤니티 — 1번째 부분: 열 배치(넓은 3열·중간 2열·좁은 1열·화면 고정) + 많이 이야기하는 종목. 가운데·오른쪽 열은 C-2부터
export function CommunityPage() {
  const [params] = useSearchParams()
  const [code, setCode] = useState(() => stockFromUrl(params.get('stock')))
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

  const select = (c: string) => {
    setCode(c)
    // TODO: C-2에서 가운데 피드를 바꾸고 최근 본 종목도 갱신
    try { history.replaceState(null, '', '?stock=' + c) } catch { /* 주소 갱신 실패는 무시 */ }
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
          <CommunityTop10 code={code} fixed={fixed} rowH={rowHeight(fixed, colH)} onSelect={select} />
        </div>
        <div data-col="center" className={styles.center} />
        <div data-col="right" className={styles.right} />
      </div>
    </>
  )
}
