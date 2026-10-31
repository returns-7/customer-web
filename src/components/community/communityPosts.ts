import { RETURNS_DATA as RD, type ChatProfile } from '../../data/returns'
import { F } from '../../lib/calc'
import { EX, PUBLIC_NICKS } from './communityData'

export interface Post {
  id: string
  nick: string
  pfRaw: string
  time: string
  text: string
  likes: number
  rc: number // 답글 수(원래 있던 것)
  mine: boolean
  code: string
  kiru: string | null // 끼루 답변 키
}
export interface Reply { id: string; nick: string; pfRaw: string; time: string; text: string; likes: number; target: string | null }

type PostRow = readonly [string, string, string, string, string, number, number, number, (string | null)?]
const toPost = (code: string) => (m: PostRow): Post => ({ id: m[0], nick: m[1], pfRaw: m[2], time: m[3], text: m[4], likes: m[5], rc: m[6], mine: !!m[7], code, kiru: m[8] || null })

// 글 목록이 있는 모든 종목(게시판 포함)
export const FEED_CODES: string[] = Object.keys(RD.CHAT).concat(Object.keys(EX).filter((c) => !RD.CHAT[c]))

// TODO: 백엔드 연결 시 서버 글로 대체. 새로 붙은 글(added)이 맨 앞, 그다음 예시 글, 그다음 홈과 같은 RD.CHAT
export const postsOf = (code: string, added: Record<string, Post[]>): Post[] =>
  (added[code] || []).concat((EX[code] || []).map(toPost(code)), (RD.CHAT[code] || []).map((m) => toPost(code)(m as unknown as PostRow)))

export const repliesOf = (id: string): Reply[] =>
  (RD.REPLIES[id] || []).map((r) => ({ id: r[0], nick: r[1], pfRaw: r[2], time: r[3], text: r[4], likes: r[5], target: r[6] }))

// 작성자 성향: 내 글은 내가 공개한 때만 성향 표시, 다른 사람은 공개 동의한 닉네임만
const PUB = new Set(PUBLIC_NICKS)
export const pfOf = (raw: string, nick: string, myPf: string): string => (raw === 'me' ? myPf : PUB.has(nick) ? raw : 'private')
export const plOf = (pf: string): string => (pf === 'private' ? '' : (RD.PROFILES[pf as ChatProfile]?.label ?? ''))
export const myProfile = (pubOn: boolean): string => (pubOn ? RD.CUSTOMER.profile || 'neutral' : 'private')

// ===== 끼루 답변 =====
export type KiruStatus = 'ANSWERED' | 'OUT_OF_SCOPE' | 'PENDING' | 'NO_SOURCE' | 'FAILED'
export interface KiruAnswer { status: KiruStatus; time: string; likes: number; text: string; src: [string, string][] }
// 근거 쪽 번호·기사·공시 날짜는 원본이 직접 넣은 예시 — 실제 자료가 정해지면 교체. TODO: 백엔드 연결 시 서버 답변으로 대체
export const kiruAnswers = (): Record<string, KiruAnswer | { status: 'OUT_OF_SCOPE' }> => ({
  hbm: {
    status: 'ANSWERED', time: '14:52', likes: 3,
    text: F.kday(F.ago(3)) + ' 공시 기준으로 내년 HBM 생산 능력을 올해의 2배로 늘린다는 계획이 확인돼요. 관련 기사에서는 주요 고객사와 공급 협의를 진행 중이라고 해요. 숫자는 공시·기사 원문 기준이에요.\nSK하이닉스의 위험등급은 2등급(높은 위험)이고, 과거 3년 기준 연 변동성은 34%예요. 리턴증권이 자체 산정한 값이에요.',
    src: [['전자공시 ' + F.short(F.ago(3)), 'https://dart.fss.or.kr'], ['한빛경제 ' + F.short(F.ago(1)) + ' 기사', 'https://example.com/news/hbm'], ['위험등급(자체 산정) ' + F.short(F.ago(1)) + ' 기준', '/#faq']]
  },
  lock: {
    status: 'ANSWERED', time: '13:24', likes: 8,
    text: 'RIA 계좌 안에서 국내 주식을 판 돈은 계좌에 그대로 남아요. 1년 유지 기간은 해외주식 매도 대금이 원화로 확정된 날부터 세요. 그 전에 원금을 인출하면 이 계좌의 세제 혜택이 모두 취소돼요.',
    src: [['RIA 상품 가이드라인 p.4', 'https://www.fsc.go.kr']]
  },
  oos: { status: 'OUT_OF_SCOPE' }
})

// ===== 목록 만들기 =====
export type FeedView = 'live' | 'hot' | 'mine' | 'search'
export interface BuildArgs { code: string; view: FeedView; scope: 'stock' | 'all'; q: string; added: Record<string, Post[]> }

export const repCount = (p: Post): number => p.rc // TODO: C-4에서 내가 단 답글 수를 더함
export function buildList({ code, view, scope, q, added }: BuildArgs): Post[] {
  const ql = q.toLowerCase()
  const all = () => FEED_CODES.flatMap((c) => postsOf(c, added))
  if (view === 'mine') return all().filter((p) => p.mine)
  if (view === 'hot') return (scope === 'all' ? all() : postsOf(code, added)).slice().sort((a, b) => b.likes + repCount(b) - (a.likes + repCount(a)))
  if (view === 'search') return postsOf(code, added).filter((p) => p.text.toLowerCase().includes(ql) || repliesOf(p.id).some((r) => r.text.toLowerCase().includes(ql)))
  return postsOf(code, added)
}

// 내가 쓴 답글(내가 쓴 댓글 탭 아래 줄)
export interface MyReply { code: string; postId: string; parent: string; time: string; text: string; target: string | null }
export const myReplies = (added: Record<string, Post[]>): MyReply[] =>
  FEED_CODES.flatMap((c) => postsOf(c, added).flatMap((p) => repliesOf(p.id).filter((r) => r.pfRaw === 'me').map((r) => ({ code: p.code, postId: p.id, parent: p.mine ? '내' : p.nick, time: r.time, text: r.text, target: r.target }))))
