import { RETURNS_DATA as RD } from '../../data/returns'
import { F } from '../../lib/calc'
import { DEFAULT_RECENT, EX, GEN, GEN_NAME, GEN_RE, KR_ALL, PX_TIME, RANK12, RECENT_KEY, RECENT_LIMIT } from './communityData'

// ===== 최근 본 종목 =====
// 처음: sessionStorage(없으면 기본값) → 지금 종목을 맨 앞으로
export function loadRecent(code: string): string[] {
  let r = DEFAULT_RECENT
  try {
    const v = JSON.parse(sessionStorage.getItem(RECENT_KEY) || 'null')
    if (Array.isArray(v)) r = v.filter((c): c is string => typeof c === 'string').slice(0, RECENT_LIMIT)
  } catch { /* 저장값이 깨져 있으면 기본값 */ }
  return (KR_ALL[code] ? [code] : []).concat(r.filter((c) => c !== code && KR_ALL[c])).slice(0, RECENT_LIMIT)
}
export const pushRecent = (recent: string[], code: string): string[] =>
  code === GEN ? recent : [code].concat(recent.filter((c) => c !== code)).slice(0, RECENT_LIMIT)

// ===== 종목 고르기 목록 =====
export interface Seg { t: string; hl: boolean }
export interface DdItem {
  code: string
  name: Seg[]
  codeSegs: Seg[]
  sector: string
  rank: number | null // 순위 묶음에서만 보임
  posts: string | null
  chg: number | null
  icon: { color: string; ini: string }
}
export interface DdGroup { title: string; rank: boolean; items: DdItem[] }

const hl = (t: string, dq: string): Seg[] => {
  if (!dq) return [{ t, hl: false }]
  const i = t.toLowerCase().indexOf(dq.toLowerCase())
  if (i < 0) return [{ t, hl: false }]
  return [{ t: t.slice(0, i), hl: false }, { t: t.slice(i, i + dq.length), hl: true }, { t: t.slice(i + dq.length), hl: false }].filter((x) => x.t)
}

const rankMap = Object.fromEntries(RANK12.map((r, i) => [r[0], [i + 1, r[1]] as const]))

export function ddGroups(dqRaw: string, recent: string[], withGen = true): DdGroup[] {
  const dq = dqRaw.trim()
  const dql = dq.toLowerCase()
  const item = (c: string, rankGroup: boolean): DdItem => {
    if (c === GEN) return { code: c, name: hl(GEN_NAME, dq), codeSegs: [], sector: '일반', rank: null, posts: null, chg: null, icon: { color: 'var(--color-navy)', ini: 'R' } }
    const r = rankMap[c]
    return { code: c, name: hl(RD.SN[c], dq), codeSegs: hl(c, dq), sector: KR_ALL[c][0], rank: rankGroup && r ? r[0] : null, posts: r ? r[1] : null, chg: RD.PX[c][1], icon: { color: KR_ALL[c][1], ini: KR_ALL[c][2] } }
  }
  const genHit = withGen && (!dq || GEN_RE.test(dq)) // 게시판은 종목 고르기에만(관심 종목 추가에는 없음)
  const groups: DdGroup[] = []
  if (genHit) groups.push({ title: dq ? '' : '게시판', rank: false, items: [item(GEN, false)] })
  if (dq) groups.push({ title: '', rank: false, items: Object.keys(KR_ALL).filter((c) => RD.SN[c].toLowerCase().includes(dql) || c.includes(dq)).map((c) => item(c, false)) })
  else {
    groups.push({ title: '최근 본 종목', rank: false, items: recent.filter((c) => KR_ALL[c]).slice(0, 3).map((c) => item(c, false)) })
    groups.push({ title: '많이 이야기하는 종목', rank: true, items: RANK12.map((r) => item(r[0], true)) })
  }
  return groups.filter((g) => g.items.length)
}

// ===== 이 종목 글에서 검색 =====
// TODO: C-3에서 피드와 같은 목록을 쓰게 합치기. 지금은 예시 글·답글만 세고, 실시간으로 붙는 새 글·내가 쓴 글은 아직 없음
export function searchCount(code: string, qRaw: string): number {
  const q = qRaw.trim().toLowerCase()
  if (!q) return 0
  const posts: { id: string; text: string }[] = (EX[code] || []).map((m) => ({ id: m[0], text: m[4] })).concat((RD.CHAT[code] || []).map((m) => ({ id: m[0], text: m[4] })))
  return posts.filter((p) => p.text.toLowerCase().includes(q) || (RD.REPLIES[p.id] || []).some((r) => r[4].toLowerCase().includes(q))).length
}

export const priceAt = (): string => F.short(F.today()) + PX_TIME

// ===== 오른쪽 열 인기글 박스 =====
export interface HotRowView { title: string; meta: string; code: string; id: string }
// 원본 순서: 홈과 같은 RD.HOT 6개 먼저, 그다음 좋아요+답글이 8 이상인 글을 많은 순으로 14개까지
export function hotRows(): HotRowView[] {
  const base = RD.HOT.slice()
  const seen = new Set(base.map((h) => h[2]))
  const more: [string, string, string, number, number][] = []
  Object.keys(RD.CHAT).forEach((c) => RD.CHAT[c].forEach((m) => { if (!seen.has(m[0]) && m[5] + m[6] >= 8) more.push([m[4].split(String.fromCharCode(10))[0], c, m[0], m[5], m[6]]) }))
  more.sort((a, b) => b[3] + b[4] - (a[3] + a[4]))
  return base.concat(more.slice(0, 14)).map(([title, c, id, likes, reps]) => ({ title, meta: RD.SN[c] + ' · 좋아요 ' + likes + ' · 답글 ' + reps, code: c, id }))
}
