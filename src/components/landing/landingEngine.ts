// 랜딩(/) 스크롤 엔진 — 원본 landing-journey.html <script>의 구조를 그대로 옮긴 일반 TS 모듈.
// LandingPage의 useLayoutEffect 한 곳에서 mountLanding(root)을 부르고, 돌려받은 함수를 cleanup으로 쓴다.
// 이번 단계(L-2): Lenis·ScrollTrigger·마스터 타임라인 뼈대, build() 재빌드, #hdr2, 패스포트 장면 이동, 스크롤 복원.
// 장면 tween·캔버스·글자 갱신은 L-3부터 채운다(자리는 // L-n 주석으로 표시).
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import { calc as calcAt, clamp, LIMIT, man, MY, won } from './landingCalc'
import { createLandingMap } from './landingMap'
import { MH, MW, SYM1 } from './landingMapData'
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
  const $$ = <T extends HTMLElement = HTMLElement>(s: string): T[] => [...root.querySelectorAll<T>(s)]
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
  const ac = new AbortController() // 마운트 중 시작한 지도 fetch를 언마운트 때 취소
  cleanups.push(() => ac.abort())
  const map = createLandingMap($('#map') as HTMLCanvasElement)
  const { Mp, V, C, A, P } = map

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

  /* ===== numbers ===== */
  const on = <K extends keyof HTMLElementEventMap>(el: HTMLElement, type: K, fn: (e: HTMLElementEventMap[K]) => void) => {
    el.addEventListener(type, fn)
    cleanups.push(() => el.removeEventListener(type, fn))
  }
  const later = (fn: () => void, ms: number) => {
    const id: ReturnType<typeof setTimeout> = setTimeout(() => { timers.delete(id); fn() }, ms)
    timers.add(id)
    return id
  }
  const my = { A: MY.A, r: MY.r }
  const calc = (A = my.A, r = my.r) => calcAt(A, r)
  const disp = { A: my.A, save: calc().save, remain: calc().remain }
  const K = { v: 1, last: -1 }   // S1 limit count-up
  const limBig = byId('limBig'), amt = byId('amt') as HTMLInputElement, amtMsg = byId('amtMsg')
  const setP = () => amt.style.setProperty('--p', (+amt.value / +amt.max * 100) + '%')
  function paintBig() { const v = disp.A * K.v; limBig.textContent = won(v); amt.value = String(v); setP() }
  function paintNums() {
    $$('[data-n=A]').forEach((e) => { e.textContent = won(disp.A) })
    $$('[data-n=Aman]').forEach((e) => { e.textContent = man(disp.A) })
    $$('[data-n=remain]').forEach((e) => { e.textContent = won(disp.remain) })
    paintBig()
    // L-5: updBoard(tl ? tl.time() : 0, false, true)
  }
  function refreshNums() {
    const c = calc()
    ctx.add(() => { gsap.to(disp, { A: my.A, save: c.save, remain: c.remain, duration: 0.6, ease: 'power2.out', onUpdate: paintNums, overwrite: true }) })
  }
  let msgT: ReturnType<typeof setTimeout> | undefined
  on(amt, 'input', () => {
    let v = +amt.value
    if (v > LIMIT) {
      v = LIMIT; amt.value = String(LIMIT); amtMsg.textContent = '매도 한도는 전 증권사 합산 5,000만 원이에요'; amtMsg.classList.add('warn')
      if (msgT) { clearTimeout(msgT); timers.delete(msgT) }
      msgT = later(() => { amtMsg.classList.remove('warn'); amtMsg.textContent = '입력하지 않아도 3,000만 원 기준으로 보여드려요' }, 2600)
    }
    my.A = v; K.v = 1; disp.A = v; limBig.textContent = won(v); setP(); refreshNums()
  })
  $$('#rates button').forEach((b) => on(b, 'click', () => {
    $$('#rates button').forEach((x) => x.classList.toggle('on', x === b)); my.r = +b.dataset.r!; refreshNums()
  }))

  /* ===== frame render ===== */
  const e2o = (q: number) => 1 - (1 - q) * (1 - q), e2io = (q: number) => q < 0.5 ? 2 * q * q : 1 - Math.pow(-2 * q + 2, 2) / 2
  function monitorFrame(t: number) {
    const g = GEO; if (!g) return
    A.sil = t < g.T4 ? 1 : 0
    const on = t >= g.T4 && t < g.TX, rise = e2o(clamp((t - g.T4) / g.dR))
    gsap.set(['#mon', '#monUI'], { autoAlpha: on ? 1 : 0, y: on ? (1 - rise) * g.MOFF : 0 })
    if (t < g.T1x) return                       // S0–S1: map viewport is tween-driven
    if (t < g.T4) { V.o = 0; return }
    const S = g.SCR
    if (t < g.TX) { Object.assign(V, { x: S.x, y: S.y + (1 - rise) * g.MOFF, w: S.w, h: S.h, r: 6, bg: 1, o: 1 }); return }
    const k = e2io(clamp((t - g.TX) / g.dX))
    Object.assign(V, { x: S.x * (1 - k), y: S.y * (1 - k), w: S.w + (g.vw - S.w) * k, h: S.h + (g.vh - S.h) * k, r: 6 * (1 - k), bg: 1, o: 1 - clamp((t - g.TX - g.dX * 0.33) / (g.dX * 0.67)) })
  }
  function onTL() {
    if (!tl) return
    const t = tl.time()
    monitorFrame(t); map.drawMap()
    // L-5 이후: renderLate(t), updBoard(t, boardLive()), 진행률 #mPct
    if (K.v !== K.last) { K.last = K.v; paintBig() }
    const n = STAMPS.filter((x) => t >= x).length
    if (stampN < 0) { setStamps(n); stampN = n; return }
    if (n !== stampN) {
      if (n === stampN + 1) stampFx(n)
      else { if (passFx) passFx.kill(); gsap.set(pass, { width: 72, height: 88 }); gsap.set('.po', { autoAlpha: 0 }); gsap.set('.pt', { autoAlpha: 1 }); setStamps(n) }
      stampN = n
    }
  }
  function render11(_p: number) {
    // L-8: S11 마무리 장면 갱신
  }

  /* ===== passport tab ===== */
  const STAMPS = [R(5.3), R(6.6), R(8.45), 11.8, 13.75], STL = ['계좌 개설', '입고', '매도', '확정', '외부감시']
  const pass = byId('pass'), stI = $$('.st i'); let stampN = 0, passFx: gsap.core.Timeline | undefined
  function setStamps(n: number) { stI.forEach((st_, i) => gsap.set(st_, { opacity: i < n ? 1 : 0, scale: 1 })); byId('pCount').textContent = `${n}/5`; byId('stLab').textContent = n ? `${STL[n - 1]} 도장` : '' }
  function stampFx(n: number) {
    if (passFx) passFx.kill()
    setStamps(n - 1); byId('pCount').textContent = `${n}/5`; byId('stLab').textContent = `${STL[n - 1]} 도장`
    ctx.add(() => {
      passFx = gsap.timeline()
        .to(pass, { width: 160, height: 212, duration: 0.35, ease: 'power3.out' })
        .to('.pt', { autoAlpha: 0, duration: 0.12 }, 0).to('.po', { autoAlpha: 1, duration: 0.2 }, 0.12)
        .fromTo(stI[n - 1], { opacity: 0, scale: 2.4 }, { opacity: 1, scale: 1, duration: 0.22, ease: 'power3.in' }, 0.38)
        .to('.po', { autoAlpha: 0, duration: 0.15 }, 1.4).to('.pt', { autoAlpha: 1, duration: 0.15 }, 1.5)
        .to(pass, { width: 72, height: 88, duration: 0.3, ease: 'power3.inOut' }, 1.4)
    })
  }
  cleanups.push(() => passFx?.kill())

  /* ===== master timeline (one take) ===== */
  const stageEl = $('#stage')
  const rel = (el: Element) => { const s = stageEl.getBoundingClientRect(), r = el.getBoundingClientRect(); return { x: r.left - s.left, y: r.top - s.top, w: r.width, h: r.height } }
  const r$ = (s: string) => rel($(s))
  const ANIM = '#hdr,#c0,#scrim,#bg1,#bg2,#bg2 img,#bg3,#bg4,#s1,#c1,#c1p,#card1,#seal,.kv b,.gln,#c2,#c2p,#card2,.c2r,.c2res,.c2n,#board,#c3,#mon,#monUI,#c4,#c4a,#c4b,#c4lab,#hero,#hero img,#slogan,#pass,.ml>span'

  function build() {
    const prog = st ? st.progress : 0
    if (st) st.kill()
    if (tl) tl.kill()
    const vw = innerWidth, vh = innerHeight, mob = vw <= 760
    $('#pinA').style.height = (TOTAL + 1) * vh + 'px'
    map.readColors(document.documentElement) // 캔버스 색은 build() 때 CSS 변수에서 읽는다
    map.resize(vw, vh)
    map.buildGrid()
    gsap.set($$(ANIM).filter((e) => !e.closest('#c0')), { clearProps: 'all' })
    gsap.set(['#hdr', '#c0', '#scrim'], { clearProps: 'all' })

    const sw = $('#s1w'); sw.style.transform = ''
    const SK = Math.min(1, (vh - 56) / sw.offsetHeight); sw.style.transform = SK < 1 ? `scale(${SK})` : ''
    const TB = r$('#thumb'), CD = r$('#card1'), PS = r$('#pass'), BD = r$('#board') // BD: L-5(전광판)에서 사용
    void BD

    /* seat-back monitor geometry */
    const mw = Math.min(1040, vw * (mob ? 0.92 : 0.78), ((vh * (mob ? 0.5 : 0.66)) - 28) * 16 / 9 + 28), mh = (mw - 28) * 9 / 16 + 28
    const mx = (vw - mw) / 2, my0 = vh - mh - Math.max(40, vh * 0.07)
    ;[$('#mon'), $('#monUI')].forEach((e) => Object.assign(e.style, { left: mx + 'px', top: my0 + 'px', width: mw + 'px', height: mh + 'px' }))
    Object.assign($('#c4').style, { left: mx + 'px', bottom: (vh - my0 + 32) + 'px' })
    const SCR = { x: mx + 14, y: my0 + 14, w: mw - 28, h: mh - 28 }, MOFF = vh - my0 + 80
    GEO = { SCR, MOFF, vw, vh, T1x: R(4.93), T4: R(8.7), TX: R(11.15), dR: R(9.15) - R(8.7), dX: R(11.6) - R(11.15) }
    // L-7: buildLate(vw, vh, PS)
    gsap.set('#board', { transformPerspective: 1400, transformOrigin: '0% 50%' })

    Object.assign(V, { x: 0, y: 0, w: vw, h: vh, r: 0, bg: 0, o: 1 })
    Object.assign(C, { cx: MW / 2, cy: MH / 2, z: 1 })
    Object.assign(A, { sw: -0.2, krDot: 0, ro: 0, krLit: 0, lit: 0, dimOn: 0 }); P.v = 0; K.v = 0; K.last = -1

    gsap.set(['#bg1', '#bg2', '#bg3', '#bg4', '#s1', '#c1', '#c1p', '#card1', '#seal', '.kv b', '#c2', '#c2p', '#card2', '.c2res', '.c2n', '#board', '#c3', '#mon', '#monUI', '#c4', '#c4a', '#c4b', '#c4lab', '#hero', '#slogan', '#pass'], { autoAlpha: 0 })
    gsap.set('.ml>span', { yPercent: 0 })

    tl = gsap.timeline({ paused: true, defaults: { ease: 'none' }, onUpdate: onTL })
    wrapTL(tl)
    const FADE = (t: number, sel: string, to: number, d = 0.6) => tl!.fromTo(sel, { autoAlpha: to ? 0 : 1 }, { autoAlpha: to, duration: d }, t)
    const q = (sel: string | string[]) => $$(String(sel))
    const REV = (t: number, sel: string) => { tl!.set(sel, { autoAlpha: 1 }, t); tl!.fromTo($$(sel + ' .ml>span'), { yPercent: 112 }, { yPercent: 0, duration: 0.2, stagger: 0.06, ease: 'power3.out' }, t) }
    const IN = (t: number, sel: string | string[], d = 0.18, y = 14) => tl!.fromTo(q(sel), { autoAlpha: 0, y }, { autoAlpha: 1, y: 0, duration: d, ease: 'power2.out' }, t)
    const OUT = (t: number, sel: string | string[], d = 0.16, y = -10) => tl!.to(q(sel), { autoAlpha: 0, y, duration: d, ease: 'power1.in' }, t)

    /* S0 — whole world in currency symbols, slow approach ×1.35, one light sweep */
    tl.to('#hdr', { autoAlpha: 0, y: -8, duration: 0.22 }, 0.05)
    tl.to(C, { z: 1.35, cy: MH * 0.46, duration: 2.0, ease: 'power1.inOut' }, 0.1)
    tl.fromTo(A, { sw: -0.2 }, { sw: 1.2, duration: 1.1, ease: 'power1.inOut', immediateRender: false }, 0.6)
    tl.to(['#c0', '#scrim'], { autoAlpha: 0, duration: 0.18 }, 1.95)
    /* → map shrinks into the card thumbnail while night turns to ivory */
    FADE(2.4, '#bg1', 1)
    tl.set('#s1', { autoAlpha: 1 }, 2.4)
    tl.fromTo('#card1', { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3 }, 2.5)
    tl.to(V, { x: TB.x, y: TB.y, w: TB.w, h: TB.h, r: 10, bg: 1, duration: 0.7, ease: 'power2.inOut' }, 2.3)
    tl.to(C, { cx: MW * 0.5, cy: (Mp.seoul[1] || MH * 0.4), z: 1.25, duration: 0.7, ease: 'power2.inOut' }, 2.3)
    tl.to(A, { krDot: 1, duration: 0.25 }, 2.75)

    /* S1 — account card fills in slowly (≈2 screens) */
    REV(3.0, '#c1'); IN(3.08, '#c1p')
    const glns = $$('.gln'), pulse = (g: HTMLElement, t: number, d: number) => { tl!.fromTo(g, { opacity: 0 }, { opacity: 1, duration: 0.04, immediateRender: false }, t); tl!.to(g, { opacity: 0, duration: 0.06 }, t + d) }
    $$('.kv b').forEach((b, i) => { const t = 3.2 + i * 0.25; tl!.fromTo(b, { autoAlpha: 0, x: -8 }, { autoAlpha: 1, x: 0, duration: 0.12, ease: 'power2.out' }, t); pulse(glns[i], t, 0.19) })
    tl.fromTo(K, { v: 0 }, { v: 1, duration: 0.45, ease: 'power2.out' }, 3.95); pulse(glns[3], 3.95, 0.39)
    tl.fromTo('#seal', { autoAlpha: 0, scale: 2.2, rotate: -28 }, { autoAlpha: 1, scale: 1, rotate: -12, duration: 0.15, ease: 'power3.in' }, 4.4)
    OUT(4.83, ['#c1', '#c1p'])
    tl.to(V, { o: 0, duration: 0.08 }, 4.85)
    const tdx = ((PS.x + PS.w / 2) - (CD.x + CD.w / 2)) / SK, tdy = ((PS.y + PS.h / 2) - (CD.y + CD.h / 2)) / SK
    tl.to('#card1', { scaleY: 0.5, duration: 0.12, ease: 'power2.in' }, 4.85)
    tl.to('#card1', { x: tdx, y: tdy, scaleX: 0.1, scaleY: 0.06, duration: 0.3, ease: 'power2.inOut' }, 4.97)
    tl.to('#card1', { autoAlpha: 0, duration: 0.08 }, 5.19)
    tl.fromTo('#pass', { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.06 }, 5.21)
    FADE(4.85, '#bg2', 1)
    tl.set('#s1', { autoAlpha: 0 }, 5.28)

    /* S2 — transfer in: right card, left type */
    REV(5.45, '#c2'); IN(5.63, '#c2p')
    tl.fromTo('#card2', { autoAlpha: 0, x: 64 }, { autoAlpha: 1, x: 0, duration: 0.3, ease: 'power2.out' }, 5.5)
    const rws = $$('.c2r')
    tl.to([rws[0], rws[2]], { opacity: 0.28, duration: 0.15 }, 6.1)
    tl.fromTo('.c2res', { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.14 }, 6.3)
    tl.fromTo('.c2n', { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.1 }, 6.42)
    OUT(6.75, ['#c2', '#c2p']); tl.to('#card2', { autoAlpha: 0, x: -48, duration: 0.18 }, 6.75)
    // L-5 이후: S2→S3 전환(벨트 사진·회색 벽·전광판), S3 ~ S4 장면 tween
    tl.add(() => {}, TOTAL)

    st = ScrollTrigger.create({ trigger: '#pinA', start: 'top top', end: 'bottom bottom', scrub: RM ? true : 0.6, animation: tl,
      snap: RM ? { snapTo: SCN.map((s) => s.done / TOTAL), duration: 0.01, delay: 0.05 } : undefined })
    stampN = -1; tl.progress(prog); onTL()
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
  setP(); ctx.add(build); paintNums()

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
  // 폰트 <link>는 마운트 때 막 붙었을 수 있어서(원본은 <head>에 있어 렌더 전에 로드됨) 스타일시트 로드를 먼저 기다린다.
  // 안 그러면 fonts.load()가 아직 모르는 글꼴이라 바로 끝나 버리고, 글리프 확인(FONT_OK)이 틀어진다.
  const linkReady = (id: string) => new Promise<void>((resolve) => {
    const el = document.getElementById(id) as HTMLLinkElement | null
    if (!el || el.sheet) return resolve()
    const done = () => { el.removeEventListener('load', done); el.removeEventListener('error', done); resolve() }
    el.addEventListener('load', done); el.addEventListener('error', done)
    cleanups.push(() => { el.removeEventListener('load', done); el.removeEventListener('error', done) })
  })
  const fontsReady = Promise.all(['landing-font-pretendard', 'landing-font-css'].map(linkReady))
    .then(() => Promise.all([document.fonts.load('500 16px Pretendard'), document.fonts.load('600 16px "Noto Sans"', SYM1), document.fonts.load('500 16px "Roboto Condensed"')]))
    .then(() => { [...SYM1].forEach((c) => { map.FONT_OK[c] = document.fonts.check('600 16px "Noto Sans"', c) }); const bad = [...SYM1].filter((c) => !map.FONT_OK[c]); if (bad.length) console.warn('Noto Sans missing:', bad.join(' ')) })
  const loadMap = () => (dead ? Promise.resolve() : map.loadMap(ac.signal))
  fontsReady.then(loadMap).then(() => { if (!dead && Mp.ready) rebuild() }).catch((e) => { if (e?.name !== 'AbortError') console.warn('map', e) })
  document.fonts.ready.then(() => { if (!dead && tl) rebuild() })
  let rT: ReturnType<typeof setTimeout> | undefined
  listen('resize', () => {
    clearTimeout(rT)
    rT = setTimeout(() => { timers.delete(rT!); if (!dead) { ctx.add(() => { build(); ScrollTrigger.refresh() }) } }, 200)
    timers.add(rT)
  })

  /* ===== live numbers ===== */
  const kick = () => ctx.add(() => { gsap.to({}, { duration: 0.7, onUpdate: () => { /* L-6: if (tl) renderLate(tl.time()) */ if (tl2) render11(tl2.time()) } }) })
  on(amt, 'input', kick)
  $$('#rates button').forEach((b) => on(b, 'click', () => {
    $$('#rates7 button').forEach((x) => x.classList.toggle('on', x.dataset.r === b.dataset.r)); kick()
  }))
  $$('#rates7 button').forEach((b) => on(b, 'click', () => {
    my.r = +b.dataset.r!; $$('#rates button, #rates7 button').forEach((x) => x.classList.toggle('on', x.dataset.r === b.dataset.r)); refreshNums(); kick()
  }))
  cleanups.push(() => gsap.killTweensOf(disp))

  /* ===== 개발 모드에서만 비교용 훅 ===== */
  let hook: object | undefined
  if (import.meta.env.DEV) {
    hook = {
      get tl() { return tl },
      get st() { return st },
      get tl2() { return tl2 },
      get st2() { return st2 },
      get GEO() { return GEO },
      Mp, V, C, A, P, map, my, disp, K,
      get passFx() { return passFx },
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
