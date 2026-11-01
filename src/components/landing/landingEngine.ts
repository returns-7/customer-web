// 랜딩(/) 스크롤 엔진 — 원본 landing-journey.html <script>의 구조를 그대로 옮긴 일반 TS 모듈.
// LandingPage의 useLayoutEffect 한 곳에서 mountLanding(root)을 부르고, 돌려받은 함수를 cleanup으로 쓴다.
// 이번 단계(L-2): Lenis·ScrollTrigger·마스터 타임라인 뼈대, build() 재빌드, #hdr2, 패스포트 장면 이동, 스크롤 복원.
// 장면 tween·캔버스·글자 갱신은 L-3부터 채운다(자리는 // L-n 주석으로 표시).
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import { clamp } from './landingCalc'
import { R, SCN, TOTAL } from './landingScenes'

export interface LandingMountOptions {
  /** 이 진입이 뒤로 가기(POP)인가 — 그때만 이전 스크롤 위치를 복원한다 */
  pop: boolean
  /** 현재 history 항목 키 — 저장해 둔 위치가 이 항목의 것일 때만 복원 */
  historyKey: string
}

const SCROLL_KEY = 'returns-landing-scroll'

function readSavedScroll(historyKey: string): number | null {
  try {
    const v = JSON.parse(sessionStorage.getItem(SCROLL_KEY) || 'null')
    return v && v.key === historyKey && Number.isFinite(v.y) ? v.y : null
  } catch {
    return null
  }
}

function writeSavedScroll(historyKey: string, y: number): void {
  try {
    sessionStorage.setItem(SCROLL_KEY, JSON.stringify({ key: historyKey, y }))
  } catch {
    /* 저장 불가 환경이면 복원만 건너뜀 */
  }
}

export function mountLanding(root: HTMLElement, opts: LandingMountOptions): () => void {
  const $ = <T extends HTMLElement = HTMLElement>(s: string): T => root.querySelector(s) as T
  const byId = (id: string) => root.querySelector<HTMLElement>('#' + id)!

  let dead = false
  const timers = new Set<ReturnType<typeof setTimeout>>()
  const cleanups: Array<() => void> = []
  const listen = <K extends keyof WindowEventMap>(type: K, fn: (e: WindowEventMap[K]) => void, o?: AddEventListenerOptions) => {
    window.addEventListener(type, fn, o)
    cleanups.push(() => window.removeEventListener(type, fn, o))
  }

  /* ===== time remap: 장면 tween 시간 → R() ===== */
  type Tweenish = { duration?: number }
  function wrapTL(tl: gsap.core.Timeline) {
    const t = tl as unknown as Record<string, (...a: unknown[]) => unknown>
    ;['to', 'fromTo', 'set'].forEach((m) => {
      const f = t[m].bind(tl)
      t[m] = (...a: unknown[]) => {
        const p = a[a.length - 1]
        if (typeof p === 'number') {
          const v = a[a.length - 2] as Tweenish | null
          if (v && typeof v.duration === 'number') v.duration = Math.max(0.01, R(p + v.duration) - R(p))
          a[a.length - 1] = R(p)
        }
        return f(...a)
      }
    })
  }

  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches

  /* ===== 상태 ===== */
  const LG: { pad?: number } = {}
  let GEO: { SCR: { x: number; y: number; w: number; h: number }; MOFF: number; vw: number; vh: number; T1x: number; T4: number; TX: number; dR: number; dX: number } | null = null
  let tl: gsap.core.Timeline | undefined, st: ScrollTrigger | undefined
  let tl2: gsap.core.Timeline | undefined, st2: ScrollTrigger | undefined

  const ctx = gsap.context(() => {}, root)

  /* ===== smooth scroll ===== */
  gsap.registerPlugin(ScrollTrigger)
  type LenisLike = Pick<Lenis, 'on' | 'raf' | 'scrollTo'> & { destroy?: () => void }
  const lenis: LenisLike = RM
    ? ({ on() {}, raf() {}, scrollTo(y: number) { window.scrollTo(0, y) } } as unknown as LenisLike)
    : new Lenis({ lerp: 0.1, wheelMultiplier: 1 })
  lenis.on('scroll', ScrollTrigger.update)
  const rafTick = (t: number) => lenis.raf(t * 1000)
  gsap.ticker.add(rafTick)
  gsap.ticker.lagSmoothing(0)
  cleanups.push(() => {
    gsap.ticker.remove(rafTick)
    gsap.ticker.lagSmoothing(500, 33) // gsap 기본값으로 복원
    lenis.destroy?.()
  })

  /* ===== 프레임 갱신 자리 ===== */
  function onTL() {
    // L-3 이후: monitorFrame, drawMap, renderLate, updBoard, 숫자·도장 갱신
  }
  function render11(_p: number) {
    // L-8: S11 마무리 장면 갱신
  }

  /* ===== master timeline (one take) ===== */
  function build() {
    const prog = st ? st.progress : 0
    if (st) st.kill()
    if (tl) tl.kill()
    const vw = innerWidth, vh = innerHeight, mob = vw <= 760
    $('#pinA').style.height = (TOTAL + 1) * vh + 'px'
    // L-3: 지도 캔버스 크기, buildGrid()
    // L-3~: gsap.set(clearProps) 와 장면 초기 autoAlpha

    /* seat-back monitor geometry */
    const mw = Math.min(1040, vw * (mob ? 0.92 : 0.78), ((vh * (mob ? 0.5 : 0.66)) - 28) * 16 / 9 + 28), mh = (mw - 28) * 9 / 16 + 28
    const mx = (vw - mw) / 2, my0 = vh - mh - Math.max(40, vh * 0.07)
    ;[$('#mon'), $('#monUI')].forEach((e) => Object.assign(e.style, { left: mx + 'px', top: my0 + 'px', width: mw + 'px', height: mh + 'px' }))
    Object.assign($('#c4').style, { left: mx + 'px', bottom: (vh - my0 + 32) + 'px' })
    const SCR = { x: mx + 14, y: my0 + 14, w: mw - 28, h: mh - 28 }, MOFF = vh - my0 + 80
    GEO = { SCR, MOFF, vw, vh, T1x: R(4.93), T4: R(8.7), TX: R(11.15), dR: R(9.15) - R(8.7), dX: R(11.6) - R(11.15) }
    // L-7: buildLate(vw, vh, PS)

    tl = gsap.timeline({ paused: true, defaults: { ease: 'none' }, onUpdate: onTL })
    wrapTL(tl)
    // L-3~L-5: S0~S4 장면 tween (REV / IN / OUT / FADE)
    tl.add(() => {}, TOTAL)

    st = ScrollTrigger.create({ trigger: '#pinA', start: 'top top', end: 'bottom bottom', scrub: RM ? true : 0.6, animation: tl,
      snap: RM ? { snapTo: SCN.map((s) => s.done / TOTAL), duration: 0.01, delay: 0.05 } : undefined })
    tl.progress(prog); onTL()
    build11(); updNav()
  }

  /* ===== S11 closing (own pinned section) ===== */
  function build11() {
    const prog = st2 ? st2.progress : 0
    if (st2) st2.kill()
    if (tl2) tl2.kill()
    const pinB = byId('pinB'), w11 = byId('w11'), sum11 = byId('sum11')
    pinB.style.height = innerHeight * 3 + 'px'
    const pad = LG.pad || 96, avail = innerWidth - pad * 2 - (innerWidth <= 760 ? 0 : (sum11.offsetWidth || 380) + 40)
    w11.style.fontSize = ''
    const fs = parseFloat(getComputedStyle(w11).fontSize), tw = w11.scrollWidth
    if (tw > avail) w11.style.fontSize = Math.max(48, fs * avail / tw) + 'px'
    tl2 = gsap.timeline({ paused: true, onUpdate: () => render11(tl2!.time()) })
    tl2.add(() => {}, 2)
    st2 = ScrollTrigger.create({ trigger: '#pinB', start: 'top top', end: 'bottom bottom', scrub: RM ? true : 0.6, animation: tl2,
      snap: RM ? { snapTo: [0, 0.85], duration: 0.01, delay: 0.05 } : undefined })
    tl2.progress(prog); render11(tl2.time())
  }

  /* ===== passport navigation ===== */
  const pnList = byId('pnList'), passWrap = byId('passWrap'), faq = byId('faq')
  const navLis = [...pnList.children] as HTMLElement[]
  const yOfT = (t: number) => (st ? st.start + t / TOTAL * (st.end - st.start) : 0)
  const sceneY = (i: number) => (i < SCN.length ? yOfT(i ? SCN[i].a + 0.3 : 0) : faq.offsetTop)
  const goScene = (i: number) => lenis.scrollTo(sceneY(i), { duration: 1.2 })
  const onNavClick = (e: Event) => {
    const li = (e.target as Element).closest('li')
    const i = li ? navLis.indexOf(li) : -1
    if (i >= 0) goScene(i)
  }
  pnList.addEventListener('click', onNavClick)
  cleanups.push(() => pnList.removeEventListener('click', onNavClick))
  const pnAmt = byId('pnAmt')
  const onPnAmt = () => lenis.scrollTo(yOfT(R(4.6)), { duration: 1.2 })
  pnAmt.addEventListener('click', onPnAmt)
  cleanups.push(() => pnAmt.removeEventListener('click', onPnAmt))
  function curScene() {
    const y = scrollY
    if (y >= faq.offsetTop - innerHeight * 0.5) return SCN.length
    const t = st ? clamp((y - st.start) / ((st.end - st.start) || 1)) * TOTAL : 0
    let i = 0
    SCN.forEach((s, k) => { if (t >= s.a - 0.001) i = k })
    return i
  }
  function updNav() {
    const i = curScene()
    navLis.forEach((li, k) => { li.classList.toggle('past', k < i); li.classList.toggle('cur', k === i) })
    passWrap.classList.toggle('gone', i === 0 || scrollY > byId('pinB').offsetTop - innerHeight * 0.4)
  }
  listen('scroll', updNav, { passive: true })
  // 키보드(Space·방향키·PageUp/Down)·FAQ 아코디언·로그아웃 안내는 L-8

  /* ===== 고정 상단 바(#hdr2) — S0 이후 위로 스크롤하면 내려옴 ===== */
  const bar = byId('hdr2')
  let last = window.scrollY, acc = 0, shown = false, hover = false
  const inS0 = () => {
    const hd = byId('hdr')
    return window.scrollY < 4 || (hd && parseFloat(getComputedStyle(hd).opacity) > 0.01 && getComputedStyle(hd).visibility !== 'hidden')
  }
  const set = (v: boolean) => { if (v !== shown) { shown = v; bar.classList.toggle('on', v) } if (v) tone() }
  // 화면 맨 위(0~88px)에 깔린 장면으로 색 세트 결정 — S0~S9는 고정 타임라인 진행 위치로, 이후는 섹션 위치로
  const DARK: Record<string, number> = { S0: 1, S4: 1, S5: 1, S6: 1 }
  const sceneNow = () => {
    if (st && tl && window.scrollY < st.end - 44) {
      const t = tl.time()
      return (SCN.find((x) => t >= x.a && t < x.b) || SCN[SCN.length - 1]).k
    }
    const hit = (id: string) => { const el = document.getElementById(id); if (!el) return false; const r = el.getBoundingClientRect(); return r.top <= 44 && r.bottom > 44 }
    if (hit('ftr')) return 'FTR'
    if (hit('pinB')) return 'S11'
    if (hit('faq')) return 'S10'
    return 'S10'
  }
  let toneK = ''
  const tone = () => {
    const k = sceneNow()
    if (k === toneK) return
    toneK = k
    bar.classList.toggle('lt', !(DARK[k] || k === 'FTR'))
    bar.dataset.scene = k
  }
  const onScroll = () => {
    const y = window.scrollY, d = y - last
    last = y
    if (shown) tone()
    if (inS0()) { acc = 0; set(false); return }
    if (!d) return
    if ((d > 0) !== (acc > 0)) acc = 0
    acc += d
    if (acc <= -8) set(true)
    else if (acc >= 8 && !hover) set(false)
  }
  if (!RM) lenis.on('scroll', onScroll)
  else listen('scroll', onScroll, { passive: true })
  listen('mousemove', (e) => {
    if (e.clientY <= 16 && !inS0()) { hover = true; set(true) }
    else if (hover && e.clientY > 72) { hover = false }
  }, { passive: true })
  const lo = bar.querySelector<HTMLElement>('.lo')!
  const onLogo = (e: Event) => { e.preventDefault(); lenis.scrollTo(0) }
  lo.addEventListener('click', onLogo)
  cleanups.push(() => lo.removeEventListener('click', onLogo))

  /* ===== 시작: 첫 build ===== */
  // L-4: setP(), paintNums()
  ctx.add(build)

  /* ===== 스크롤 복원(⑦): 뒤로 가기(POP)면 이전 위치, 그 밖의 진입은 맨 위 ===== */
  const savedY = opts.pop ? readSavedScroll(opts.historyKey) : null
  if (savedY != null && savedY > 0) {
    lenis.scrollTo(savedY, { immediate: true, force: true })
    window.scrollTo(0, savedY) // lenis가 없는 RM 모드에서도 같은 위치
    ScrollTrigger.update()
  } else {
    window.scrollTo(0, 0)
  }
  // 언마운트 시점에는 새 페이지로 DOM이 바뀌며 scrollY가 줄어들 수 있어, 스크롤할 때마다 마지막 위치를 따로 기억한다
  let lastY = window.scrollY
  listen('scroll', () => { lastY = window.scrollY }, { passive: true })
  const saveScroll = () => writeSavedScroll(opts.historyKey, lastY)
  listen('pagehide', saveScroll)
  cleanups.push(saveScroll)

  /* ===== 다시 빌드: 글꼴 로드·창 크기·(L-3) 지도 로드 ===== */
  const rebuild = () => ctx.add(() => { build(); ScrollTrigger.refresh(); onTL() })
  const loadMap = (): Promise<void> => Promise.resolve() // L-3: 지도 데이터·캔버스 준비
  // L-3: 원본은 Noto Sans(SYM1) 글자 존재 확인도 이 Promise에 포함
  const fontsReady = Promise.all([
    document.fonts.load('500 16px Pretendard'),
    document.fonts.load('600 16px "Noto Sans"'),
    document.fonts.load('500 16px "Roboto Condensed"'),
  ])
  fontsReady.then(loadMap).then(() => { if (!dead) rebuild() }).catch((e) => console.warn('map', e))
  document.fonts.ready.then(() => { if (!dead && tl) rebuild() })
  let rT: ReturnType<typeof setTimeout> | undefined
  listen('resize', () => {
    clearTimeout(rT)
    rT = setTimeout(() => { timers.delete(rT!); if (!dead) { ctx.add(() => { build(); ScrollTrigger.refresh() }) } }, 200)
    timers.add(rT)
  })

  /* ===== 개발 모드에서만 비교용 훅 ===== */
  let hook: object | undefined
  if (import.meta.env.DEV) {
    hook = {
      get tl() { return tl },
      get st() { return st },
      get tl2() { return tl2 },
      get st2() { return st2 },
      get GEO() { return GEO },
      lenis, gsap, ScrollTrigger,
    }
    ;(window as unknown as { __landing?: object }).__landing = hook
  }

  return () => {
    dead = true
    timers.forEach(clearTimeout)
    timers.clear()
    cleanups.reverse().forEach((fn) => fn())
    ctx.revert()
    st?.kill(); st2?.kill(); tl?.kill(); tl2?.kill()
    st = st2 = tl = tl2 = undefined
    if (import.meta.env.DEV) {
      const w = window as unknown as { __landing?: object }
      if (w.__landing === hook) delete w.__landing
    }
  }
}
