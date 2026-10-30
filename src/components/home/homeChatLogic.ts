import { RETURNS_DATA as RD, type ChatRow } from '../../data/returns'
import { F } from '../../lib/calc'
import { HOT_LIMIT, KKIRU_REPLIED, type HotScope } from './homeChatData'

// 실시간으로 들어온 글은 어느 종목방 글인지 같이 기억
export interface LivePost {
  code: string
  row: ChatRow
}

export interface Seg {
  t: string
  hl: boolean
}

const PRIVATE = 'private'

// '나'의 성향은 공개 설정에 따라: 비공개면 회색 기본 아바타
const pfOf = (k: string) => (k === 'me' ? (RD.COMMUNITY.profilePublic ? RD.CUSTOMER.profile : PRIVATE) : k)
const plOf = (pf: string) => (pf === PRIVATE ? '' : RD.PROFILES[pf].label)

// 검색어와 일치하는 글자를 나눠 강조(검색 중이 아니면 통째로 한 조각)
export function splitMatch(text: string, q: string): Seg[] {
  if (!q) return [{ t: text, hl: false }]
  const out: Seg[] = []
  let i = 0
  let j: number
  while ((j = text.indexOf(q, i)) >= 0) {
    if (j > i) out.push({ t: text.slice(i, j), hl: false })
    out.push({ t: q, hl: true })
    i = j + q.length
  }
  if (i < text.length) out.push({ t: text.slice(i), hl: false })
  return out
}

// 드롭다운 종목명·코드: 첫 일치 글자만 강조(대소문자 무시)
export function splitFirst(str: string, dq: string): Seg[] {
  const i = dq ? str.toLowerCase().indexOf(dq.toLowerCase()) : -1
  if (i < 0) return [{ t: str, hl: false }]
  return [
    { t: str.slice(0, i), hl: false },
    { t: str.slice(i, i + dq.length), hl: true },
    { t: str.slice(i + dq.length), hl: false }
  ].filter((s) => s.t)
}

export interface ChatMsg {
  id: string
  to: string
  nick: string
  pf: string
  pl: string
  kkiru: boolean
  time: string
  segs: Seg[]
  likes: number
  replies: number
}

// 한 종목방의 글 목록: 최신 글이 앞(index 0)인 원본 배열을 뒤집어 오래된 글 위 → 최신 글 아래
export function chatMsgs(all: ChatRow[], code: string, view: 'live' | 'hot' | 'mine' | 'search', q: string): ChatMsg[] {
  const qOn = !!q && view === 'search'
  return (view === 'mine' ? all.filter((m) => m[7]) : all)
    .filter((m) => !qOn || m[4].includes(q))
    .slice()
    .reverse()
    .map((m) => {
      const pf = m[1] === '도시락' ? PRIVATE : pfOf(m[2]) // 커뮤니티와 같게: 도시락은 성향 비공개
      return {
        id: m[0],
        to: '/community?stock=' + code + '&thread=' + m[0],
        nick: m[7] ? m[1] + ' (나)' : m[1],
        pf,
        pl: plOf(pf),
        kkiru: !!KKIRU_REPLIED[m[0]],
        time: m[3],
        segs: splitMatch(m[4], qOn ? q : ''),
        likes: m[5],
        replies: m[6]
      }
    })
}

export interface HotMsg {
  id: string
  to: string
  rank: number
  pf: string
  nick: string
  stock: string | null
  text: string
  likes: number
  replies: number
}

// 인기글: 좋아요 많은 순 위에서 HOT_LIMIT개. 이 종목 / 전체 종목
export function hotMsgs(all: ChatRow[], code: string, scope: HotScope): HotMsg[] {
  const src: [ChatRow, string][] = scope === 'all' ? Object.keys(RD.CHAT).flatMap((c) => RD.CHAT[c].map((m): [ChatRow, string] => [m, c])) : all.map((m): [ChatRow, string] => [m, code])
  return src
    .slice()
    .sort((x, y) => y[0][5] - x[0][5])
    .slice(0, HOT_LIMIT)
    .map(([m, c], i) => ({
      id: m[0],
      to: '/community?stock=' + c + '&thread=' + m[0],
      rank: i + 1,
      pf: pfOf(m[2]),
      nick: m[7] ? m[1] + ' (나)' : m[1],
      stock: scope === 'all' ? RD.SN[c] : null,
      text: m[4],
      likes: m[5],
      replies: m[6]
    }))
}

export interface DdItem {
  code: string
  flat: number
  on: boolean
  rank: number | null // 많이 이야기하는 종목에서만 순위·오늘 글 수
  top3: boolean
  posts: string
  sector: string
  color: string
  ini: string
  chg: string
  chgTone: number
  nameSegs: Seg[]
  codeSegs: Seg[]
}
export interface DdGroup {
  title: string
  items: DdItem[]
}

// 종목 드롭다운: 검색어가 있으면 이름·코드 일치 종목, 없으면 '최근 본 종목'과 '많이 이야기하는 종목'
export function ddGroups(dq: string, code: string, recent: string[]): { groups: DdGroup[]; flat: string[] } {
  const lc = dq.toLowerCase()
  const raw: { title: string; codes: string[]; rank?: boolean }[] = dq
    ? [{ title: '', codes: Object.keys(RD.KR).filter((c) => RD.SN[c].toLowerCase().includes(lc) || c.includes(dq)) }]
    : [{ title: '최근 본 종목', codes: recent }, { title: '많이 이야기하는 종목', codes: RD.RANK.map((r) => r[0]), rank: true }]
  const flat: string[] = []
  const groups = raw
    .filter((g) => g.codes.length)
    .map((g) => ({
      title: g.title,
      items: g.codes.map((c, gi): DdItem => {
        const chg = RD.PX[c][1]
        flat.push(c)
        return {
          code: c,
          flat: flat.length - 1,
          on: c === code,
          rank: g.rank ? gi + 1 : null,
          top3: gi < 3,
          posts: g.rank ? RD.RANK[gi][1] : '',
          sector: RD.KR[c][0],
          color: RD.KR[c][1],
          ini: RD.KR[c][2],
          chg: F.pct(chg),
          chgTone: chg,
          nameSegs: splitFirst(RD.SN[c], dq),
          codeSegs: splitFirst(c, dq)
        }
      })
    }))
  return { groups, flat }
}
