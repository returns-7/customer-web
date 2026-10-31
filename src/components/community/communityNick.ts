import { useSyncExternalStore } from 'react'
import { RETURNS_DATA as RD } from '../../data/returns'
import { EX, NICK_RE } from './communityData'

// 커뮤니티 닉네임을 두는 한 곳. 가운데 열 닉네임 정하기·오른쪽 프로필 카드(C-6)·내 정보 페이지가 같은 값을 읽고 바꿈.
// 원본은 저장소(localStorage 등)에 두지 않고 화면 상태로만 가짐 — 처음 값은 RD.COMMUNITY.nickname, 주소에 ?first=1 이면 비어 있음(첫 방문),
// 새로고침하면 처음 값으로 돌아감. 그대로 따름.
// TODO: 백엔드 연결 시 서버의 닉네임 저장·조회로 대체(그때 중복 확인도 서버가 판정)
let nick = ''
const subs = new Set<() => void>()
const subscribe = (fn: () => void) => { subs.add(fn); return () => { subs.delete(fn) } }

export const initNick = (first: boolean) => { nick = first ? '' : RD.COMMUNITY.nickname || '' }
export const setNick = (v: string) => { nick = v; subs.forEach((fn) => fn()) }
export const useNick = (): string => useSyncExternalStore(subscribe, () => nick)

// 이미 다른 사람이 쓰고 있는 닉네임(예시): 글·답글·새 글 예시의 작성자. 내 이름('리아')은 빠짐
// TODO: 백엔드 연결 시 서버가 중복 여부를 판정
let taken: Set<string> | null = null
const takenNicks = (): Set<string> => {
  if (!taken) {
    const names: string[] = []
    Object.values(RD.CHAT).forEach((rows) => rows.forEach((m) => names.push(m[1])))
    Object.values(RD.REPLIES).forEach((rows) => rows.forEach((r) => names.push(r[1])))
    Object.values(EX).forEach((rows) => rows.forEach((m) => names.push(m[1])))
    RD.LIVE_POOL.forEach((x) => names.push(x[0]))
    Object.values(RD.LIVE_BY_STOCK).forEach((rows) => rows.forEach((x) => names.push(x[0])))
    taken = new Set(names.filter((n) => n !== '리아'))
  }
  return taken
}

export type NickCheck = 'ok' | 'dup' | 'bad'
export const checkNick = (v: string): NickCheck => (!NICK_RE.test(v) ? 'bad' : takenNicks().has(v) ? 'dup' : 'ok')
