import { useEffect, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import '../../styles/tokens.css'
import { RETURNS_DATA as RD } from '../../data/returns'
import { F } from '../../lib/calc'
import { Box } from '../common/Box'
import { KkiruAvatar } from '../common/KkiruAvatar'
import { StockIcon } from '../common/StockIcon'
import { Tabs } from '../common/Tabs'
import { cx } from '../common/cx'
import { KR_ALL, RECENT_LIMIT } from './communityData'
import { ddGroups } from './communityLogic'
import { myProfile } from './communityPosts'
import { PubDialog } from './CommunityDialogs'
import { CommunityNickForm } from './CommunityNickForm'
import { CommunityStockPick } from './CommunityStockPick'
import styles from './CommunityRight.module.css'

type WatchTab = 'watch' | 'recent'
const WATCH_TABS: { key: WatchTab; label: string }[] = [{ key: 'watch', label: '관심' }, { key: 'recent', label: '최근 본' }]

const tone = (n: number) => (n > 0 ? styles.up : n < 0 ? styles.down : styles.flat)

interface CommunityRightProps {
  code: string // 지금 보는 종목(목록에서 선택 표시)
  nick: string
  pubOn: boolean
  myPostN: number
  myRepN: number
  watch: string[]
  recent: string[]
  onSelect: (code: string) => void
  onNick: (nick: string) => void
  onPub: (on: boolean) => void // 성향 공개 켜기/끄기(토스트는 쓰는 쪽)
  onWatchAdd: (code: string) => void
  onWatchRemove: (code: string) => void
  onRecentRemove: (code: string) => void
  onGoMine: () => void // "글 N · 답글 N" → 내가 쓴 댓글 탭
}

// 오른쪽 열: 내 프로필 카드(닉네임·성향·글/답글 수·성향 공개) + 관심 / 최근 본 종목. 인기글·운영 정책은 C-7
export function CommunityRight({ code, nick, pubOn, myPostN, myRepN, watch, recent, onSelect, onNick, onPub, onWatchAdd, onWatchRemove, onRecentRemove, onGoMine }: CommunityRightProps) {
  const [nkEdit, setNkEdit] = useState(false)
  const [pd, setPd] = useState<{ agree: boolean } | null>(null)
  const [wTab, setWTab] = useState<WatchTab>('watch')
  const [ddOpen, setDdOpen] = useState(false)
  const [ddQ, setDdQ] = useState('')
  const [ddHi, setDdHi] = useState(0)
  const watchRef = useRef<HTMLDivElement>(null)
  const ddInputRef = useRef<HTMLInputElement>(null)

  const myPf = myProfile(pubOn)
  const myPl = myPf === 'private' ? '비공개' : (RD.PROFILES[myPf]?.label ?? '')
  const recentRows = recent.filter((c) => KR_ALL[c]).slice(0, RECENT_LIMIT)

  const closeDd = () => {
    setDdOpen(false)
    setDdQ('')
    setDdHi(0)
  }
  const toggleDd = () => {
    if (ddOpen) closeDd()
    else {
      setDdOpen(true)
      setDdQ('')
      setDdHi(0)
      setTimeout(() => ddInputRef.current?.focus(), 30)
    }
  }
  const pickWatch = (c: string) => {
    if (!watch.includes(c)) onWatchAdd(c)
    closeDd()
  }
  const goTab = (key: WatchTab) => {
    setWTab(key)
    closeDd()
  }
  const saveNick = (v: string) => {
    onNick(v)
    setNkEdit(false)
  }
  const togglePub = () => {
    if (pubOn) onPub(false)
    else setPd({ agree: false })
  }

  const groups = ddOpen ? ddGroups(ddQ, recent, false) : []
  const flat = groups.flatMap((g) => g.items)
  const ddKey = (e: KeyboardEvent) => {
    const n = flat.length
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (n) setDdHi((ddHi + 1) % n)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (n) setDdHi((ddHi - 1 + n) % n)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (n) pickWatch(flat[Math.min(ddHi, n - 1)].code)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      closeDd()
    }
  }

  // 목록 밖을 누르거나 Esc: 관심 종목 추가 목록 닫힘
  useEffect(() => {
    if (!ddOpen) return
    const onDown = (e: MouseEvent) => {
      if (watchRef.current && !watchRef.current.contains(e.target as Node)) closeDd()
    }
    const onKey = (e: globalThis.KeyboardEvent) => { if (e.key === 'Escape') closeDd() }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [ddOpen])

  const row = (c: string, removeLabel: string, onRemove: () => void, roundLast: boolean, last: boolean) => {
    const chg = RD.PX[c][1]
    return (
      <div key={c} className={styles.item}>
        <button type="button" className={cx(styles.go, c === code && styles.on, roundLast && last && styles.lastWatch)} onClick={() => onSelect(c)}>
          <StockIcon color={KR_ALL[c][1]} initial={KR_ALL[c][2]} size={20} />
          <span className={styles.nm}>
            <span className={styles.nmText}>{RD.SN[c]}</span> <span className={styles.cd}>{c}</span>
          </span>
          <span className={styles.px}>
            <span className={styles.pxText}>{F.won(RD.PX[c][0])}</span>
            <span className={cx(styles.chg, tone(chg))}>{F.pct(chg)}</span>
          </span>
        </button>
        <button type="button" className={styles.rm} aria-label={removeLabel} onClick={(e) => { e.stopPropagation(); onRemove() }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
      </div>
    )
  }

  return (
    <div data-col="right" className={styles.right}>
      <Box className={styles.card}>
        <div className={styles.me}>
          <KkiruAvatar profile={myPf} size={24} />
          <div className={styles.meBody}>
            <div className={styles.nameRow}>
              <span className={cx(styles.name, !nick && styles.nameNone)}>{nick || '닉네임 없음'}</span>
              <span className={styles.pl}>{myPl}</span>
              {nick && !nkEdit && <button type="button" className={styles.edit} onClick={() => setNkEdit(true)}>수정</button>}
            </div>
            <a href="?tab=mine" className={styles.mine} onClick={(e) => { e.preventDefault(); onGoMine() }}>글 {myPostN} · 답글 {myRepN}</a>
          </div>
          <span id="pubLabel" className={styles.pubLabel}>성향 공개</span>
          <button type="button" role="switch" aria-checked={pubOn} aria-labelledby="pubLabel" className={cx(styles.switch, pubOn && styles.switchOn)} onClick={togglePub}>
            <span className={styles.knob} />
          </button>
        </div>
        <div className={styles.pubHint}>기본은 비공개예요. 공개하면 내 글에 성향 이름이 보여요.</div>
        {nick && nkEdit && <CommunityNickForm bare first={false} initial={nick} onSave={saveNick} onCancel={() => setNkEdit(false)} />}
      </Box>

      <div ref={watchRef} className={styles.watch}>
        <Box
          head={<Tabs variant="box" items={WATCH_TABS} value={wTab} onChange={(k) => goTab(k as WatchTab)} ariaLabel="종목 목록" />}
          actions={wTab === 'watch' ? <button type="button" className={styles.add} aria-expanded={ddOpen} onClick={toggleDd}>+ 추가</button> : undefined}
        >
          {wTab === 'watch' ? (
            <>
              {!watch.length && <div className={styles.emptyRow}>별을 눌러 관심 종목을 추가할 수 있어요</div>}
              {watch.map((c, i) => row(c, RD.SN[c] + ' 관심 해제', () => onWatchRemove(c), true, i === watch.length - 1))}
            </>
          ) : (
            <>
              {!recent.length && <div className={styles.emptyRow}>아직 본 종목이 없어요</div>}
              {recentRows.map((c) => row(c, RD.SN[c] + ' 최근 본 목록에서 지우기', () => onRecentRemove(c), false, false))}
            </>
          )}
        </Box>
        {ddOpen && (
          <div className={styles.dd}>
            <CommunityStockPick
              groups={groups}
              q={ddQ}
              hi={ddHi}
              placeholder="관심 종목 추가 · 종목명 또는 코드"
              ariaLabel="관심 종목 검색"
              inputRef={ddInputRef}
              onType={(v) => { setDdQ(v); setDdHi(0) }}
              onKey={ddKey}
              onPick={pickWatch}
              onHover={setDdHi}
              tag={(c) => (watch.includes(c) ? '추가됨' : '')}
            />
          </div>
        )}
      </div>

      {pd && <PubDialog agree={pd.agree} onToggle={() => setPd({ agree: !pd.agree })} onCancel={() => setPd(null)} onOk={() => { if (pd.agree) { setPd(null); onPub(true) } }} />}
    </div>
  )
}
