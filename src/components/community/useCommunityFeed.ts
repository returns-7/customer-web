import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from 'react'
import { RETURNS_DATA as RD } from '../../data/returns'
import { AT_TOP_PAGE_PX, AT_TOP_PX, FEED_LIMIT, GEN, LIVE_MIN_MS, LIVE_SPAN_MS, REPLY_MAX, REP_FIRST, REP_STEP, THREAD_LIMIT } from './communityData'
import { buildList, myReplies, type AddedReplies, type FeedView, type Post, type Reply } from './communityPosts'

export type FeedTab = 'live' | 'hot' | 'mine'
export type HotScope = 'stock' | 'all'

interface FeedArgs {
  code: string
  tab: FeedTab
  scope: HotScope
  searchOpen: boolean
  q: string // 글 검색어(공백 포함 그대로)
  fixed: boolean // 화면 고정 상태면 피드 영역만 스크롤
  listRef: RefObject<HTMLDivElement | null>
  feedRef: RefObject<HTMLElement | null>
  nick: string // 내 닉네임(내가 단 답글의 작성자)
  thread: string | null // 주소 ?thread= 로 들어온 글 id(처음 한 번만 쓰임)
  onToast: (text: string) => void
}

// 답글 쓰는 중인 곳: 어느 글에, 어느 답글에(없으면 글에 바로), 누구에게(@닉네임)
interface ReplyAt { post: string; rep: string | null; target: string | null }

// 피드 글 목록의 상태: 새로 붙은 글, 아직 안 보인 새 글, 좋아요, 더보기, 메뉴, 보여 줄 개수 + 실시간 새 글 타이머
export function useCommunityFeed({ code, tab, scope, searchOpen, q, fixed, listRef, feedRef, nick, thread, onToast }: FeedArgs) {
  const [added, setAdded] = useState<Record<string, Post[]>>({}) // 종목별로 앞에 붙은 새 글
  const [pend, setPend] = useState<Record<string, Post[]>>({}) // 스크롤 중이라 바에만 알린 새 글
  const [fresh, setFresh] = useState<string | null>(null) // 방금 붙은 글(나타나는 효과)
  const [barFade, setBarFade] = useState(0)
  const [liked, setLiked] = useState<Record<string, boolean>>({})
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [kMore, setKMore] = useState<Record<string, boolean>>({})
  const [limitState, setLimitState] = useState<{ code: string; n: number }>({ code, n: thread ? THREAD_LIMIT : FEED_LIMIT }) // 종목이 바뀌면 자동으로 처음 개수로 돌아감
  const [menuState, setMenuState] = useState<{ code: string; id: string } | null>(null)
  const [flash, setFlash] = useState<{ id: string; on: boolean } | null>(thread ? { id: thread, on: true } : null)
  const [addRep, setAddRep] = useState<AddedReplies>({}) // 내가 새로 단 답글
  const [repOpen, setRepOpen] = useState<Record<string, boolean>>(thread ? { [thread]: true } : {}) // 답글을 펼친 글(여러 글 동시에 가능)
  const [repShow, setRepShow] = useState<Record<string, number>>({}) // 글마다 보여 줄 답글 수(처음 REP_FIRST)
  const [replyAt, setReplyAt] = useState<ReplyAt | null>(null)
  const [replyText, setReplyText] = useState('')
  // 종목이 바뀌면 쓰던 답글 자리는 닫힘(쓰던 글자는 그대로 두는 것까지 원본과 같음)
  const [seenCode, setSeenCode] = useState(code)
  if (seenCode !== code) { setSeenCode(code); setReplyAt(null) }

  const limit = limitState.code === code ? limitState.n : FEED_LIMIT
  const menu = menuState && menuState.code === code ? menuState.id : null

  const qt = q.trim()
  const qOn = searchOpen && !!qt
  const view: FeedView = qOn ? 'search' : tab
  const list = useMemo(() => buildList({ code, view, scope, q: qt, added, addRep }), [code, view, scope, qt, added, addRep])
  const total = list.length
  const shown = list.slice(0, limit)

  // ===== 스크롤 =====
  const atTop = useCallback(() => {
    if (fixed) {
      const l = listRef.current
      return !l || l.scrollTop < AT_TOP_PX
    }
    const el = feedRef.current
    return !el || el.getBoundingClientRect().top > -AT_TOP_PAGE_PX
  }, [fixed, listRef, feedRef])
  const toListTop = useCallback((smooth: boolean) => {
    const behavior = smooth ? 'smooth' : 'auto'
    if (fixed) listRef.current?.scrollTo({ top: 0, behavior })
    else {
      const el = feedRef.current
      if (el && el.getBoundingClientRect().top < 0) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 80, behavior })
    }
  }, [fixed, listRef, feedRef])

  // ===== 타이머(화면을 떠나면 모두 정리) =====
  const timers = useRef<Set<ReturnType<typeof setTimeout>>>(new Set())
  const later = useCallback((fn: () => void, ms: number) => {
    const t = setTimeout(() => { timers.current.delete(t); fn() }, ms)
    timers.current.add(t)
    return t
  }, [])
  useEffect(() => {
    const set = timers.current
    return () => { set.forEach(clearTimeout); set.clear() }
  }, [])

  // ===== 실시간 새 글: 10~15초마다 1개. 보고 있는 화면이 실시간이고 맨 위가 아니면 바로 붙이지 않고 새 글 바로 알림 =====
  const latest = useRef({ code, tab, searchOpen, atTop })
  useEffect(() => { latest.current = { code, tab, searchOpen, atTop } })
  const liveIdx = useRef<Record<string, number>>({})
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>
    const tick = () => {
      t = setTimeout(() => { addLive(); tick() }, LIVE_MIN_MS + Math.random() * LIVE_SPAN_MS)
    }
    const addLive = () => {
      const s = latest.current
      if (s.code === GEN) return
      const pool = RD.LIVE_BY_STOCK[s.code] || RD.LIVE_POOL
      const i = liveIdx.current[s.code] || 0
      liveIdx.current[s.code] = i + 1
      const [nick, pf, text] = pool[i % pool.length]
      // TODO: 백엔드 연결 시 서버가 보내 주는 새 글로 대체(지금은 예시 글을 차례로 돌려 씀)
      const post: Post = { id: 'live-' + Date.now(), nick, pfRaw: pf, time: '방금', text: text.replace('{n}', RD.SN[s.code]), likes: 0, rc: 0, mine: false, code: s.code, kiru: null }
      const watching = s.tab === 'live' && !s.searchOpen
      if (!watching || s.atTop()) {
        setAdded((a) => ({ ...a, [s.code]: [post].concat(a[s.code] || []) }))
        setFresh(post.id)
        later(() => setFresh((f) => (f === post.id ? null : f)), 400)
      } else setPend((p) => ({ ...p, [s.code]: [post].concat(p[s.code] || []) }))
    }
    tick()
    return () => clearTimeout(t)
  }, [later])

  // ===== 새 글 바 =====
  const pendN = (pend[code] || []).length
  const newBar = { show: (view === 'live' && pendN > 0) || !!barFade, n: pendN || barFade, fading: !!barFade }
  const showNew = () => {
    if (barFade) return
    toListTop(true)
    const mine = pend[code] || []
    setAdded((a) => ({ ...a, [code]: mine.concat(a[code] || []) }))
    setPend((p) => ({ ...p, [code]: [] }))
    setFresh(mine[0] ? mine[0].id : null)
    setBarFade(pendN)
    later(() => { setBarFade(0); setFresh(null) }, 200)
  }

  // ===== 글 하나에 대한 동작 =====
  const toggle = (set: typeof setLiked) => (id: string) => set((m) => { const n = { ...m }; if (n[id]) delete n[id]; else n[id] = true; return n })
  const like = toggle(setLiked)
  const toggleMore = toggle(setExpanded)
  const toggleKMore = toggle(setKMore)
  const toggleMenu = (id: string) => setMenuState(menu === id ? null : { code, id })
  const closeMenu = useCallback(() => setMenuState(null), [])
  const loadMore = () => setLimitState({ code, n: limit + FEED_LIMIT })
  const resetLimit = () => setLimitState({ code, n: FEED_LIMIT })

  // 글을 찾아 스크롤 + 잠깐 강조(글이 아직 안 그려졌으면 잠깐씩 기다리며 다시 찾음)
  const scrollToPost = (id: string, smooth: boolean) => {
    const behavior = smooth ? 'smooth' : 'auto'
    const go = (n: number) => {
      const el = document.querySelector('[data-post="' + id + '"]')
      if (!el) { if (n < 20) later(() => go(n + 1), 80); return }
      const l = listRef.current
      if (fixed && l) l.scrollTo({ top: el.getBoundingClientRect().top - l.getBoundingClientRect().top + l.scrollTop - 8, behavior })
      else window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 80, behavior })
      later(() => setFlash({ id, on: false }), 150)
      later(() => setFlash(null), 1800)
    }
    later(() => go(0), 120)
  }
  // 내가 쓴 답글 줄에서 그 글로 이동: 더 많이 보여 주고 답글을 펼치고 글을 찾아 스크롤 + 잠깐 강조
  const focusPost = (targetCode: string, id: string) => {
    setLimitState({ code: targetCode, n: THREAD_LIMIT })
    setRepOpen((o) => ({ ...o, [id]: true }))
    setReplyAt(null)
    setFlash({ id, on: true })
    scrollToPost(id, true)
  }
  // 주소 ?thread= 로 들어왔으면 그 글로 스크롤(처음 한 번)
  useEffect(() => {
    if (thread) later(() => scrollToPost(thread, false), 150)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ===== 답글 =====
  const toggleRep = (id: string) => {
    setRepOpen((o) => ({ ...o, [id]: !o[id] }))
    if (replyAt && replyAt.post === id) { setReplyAt(null); setReplyText('') }
  }
  const olderReps = (id: string) => setRepShow((m) => ({ ...m, [id]: (m[id] || REP_FIRST) + REP_STEP }))
  // 답글 버튼: 그 답글 아래에 입력칸을 열고 "@닉네임 "을 채움
  const openBox = (postId: string, repId: string, target: string) => {
    setReplyAt({ post: postId, rep: repId, target })
    setReplyText('@' + target + ' ')
    setRepOpen((o) => ({ ...o, [postId]: true }))
    later(() => {
      const el = document.querySelector<HTMLInputElement>('[data-rbox="' + repId + '"] input')
      if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length) }
    }, 40)
  }
  // 글 아래 입력칸에 커서를 두면 그 글에 바로 답글 쓰는 자리가 됨
  const focusBox = (postId: string) => {
    if (replyAt && replyAt.post === postId && !replyAt.rep) return
    setReplyAt({ post: postId, rep: null, target: null })
    setReplyText('')
  }
  const typeReply = (v: string) => setReplyText(v.slice(0, REPLY_MAX))
  const clearReply = () => setReplyAt(null)
  // 등록할 글: "@대상 "으로 시작하면 @닉네임 표시로 분리하고 나머지만 본문
  let rBody = replyText
  let rTarget: string | null = null
  if (replyAt && replyAt.target && rBody.startsWith('@' + replyAt.target)) { rTarget = replyAt.target; rBody = rBody.slice(replyAt.target.length + 1) }
  rBody = rBody.trim()
  const replyOk = !!replyAt && !!rBody
  const submitReply = () => {
    if (!replyAt || !replyOk) return
    const postId = replyAt.post
    // TODO: 백엔드 연결 시 서버가 id·시간을 정해 줌
    const r: Reply = { id: 'mr-' + Date.now(), nick, pfRaw: 'me', time: '방금', text: rBody, likes: 0, target: rTarget }
    setAddRep((m) => ({ ...m, [postId]: (m[postId] || []).concat([r]) }))
    setReplyAt(null)
    setReplyText('')
    setRepOpen((o) => ({ ...o, [postId]: true }))
    setRepShow((m) => ({ ...m, [postId]: (m[postId] || REP_FIRST) + 1 }))
    onToast('답글을 남겼어요')
  }
  const replyKey = (e: { key: string; preventDefault: () => void; stopPropagation: () => void }) => {
    if (e.key === 'Enter') { e.preventDefault(); submitReply() }
    else if (e.key === 'Escape') { e.stopPropagation(); setReplyAt(null); setReplyText('') }
  }

  const myReps = useMemo(() => myReplies(added, addRep), [added, addRep])
  const myPostN = useMemo(() => buildList({ code, view: 'mine', scope, q: '', added, addRep }).length, [code, scope, added, addRep])

  return { view, qOn, list, total, shown, limit, moreOn: total > limit, newBar, showNew, liked, like, expanded, toggleMore, kMore, toggleKMore, menu, toggleMenu, closeMenu, loadMore, resetLimit, flash, fresh, toListTop, focusPost, myReps, myPostN, addRep, repOpen, repShow, replyAt, replyText, replyOk, toggleRep, olderReps, openBox, focusBox, typeReply, clearReply, submitReply, replyKey }
}
