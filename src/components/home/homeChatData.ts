// 경제 채팅방 박스: 홈 원본에만 있는 값 (채팅·인기글·순위 예시는 src/data의 RD.CHAT·HOT·RANK를 씀)

export const DEFAULT_STOCK = '000660' // 처음 열리는 종목
export const DEFAULT_RECENT = ['000660', '005930', '373220'] // 드롭다운 '최근 본 종목'
export const RECENT_LIMIT = 3

// 끼루가 답한 글 id
export const KKIRU_REPLIED: Record<string, boolean> = { 't660-02': true, 't660-06': true, 't660-08': true, 't930-02': true, 't930-05': true }

export type ChatTabKey = 'live' | 'hot' | 'mine'
export const CHAT_TABS: [ChatTabKey, string][] = [['live', '실시간'], ['hot', '인기글'], ['mine', '내가 쓴 댓글']]

export type HotScope = 'stock' | 'all'
export const HOT_SCOPES: [HotScope, string][] = [['stock', '이 종목'], ['all', '전체 종목']]
export const HOT_LIMIT = 7 // 인기글에 보이는 개수

// 실시간 예시: 10~15초마다 새 글 1개, 시계는 14:41부터 1분씩
export const LIVE_START_MIN = 14 * 60 + 41
export const LIVE_MIN_MS = 10000
export const LIVE_SPAN_MS = 5000

export const CHAT_EMPTY = '조건에 맞는 글이 없어요.'
export const DISCLAIMER = '끼루 AI는 정보를 안내하며 투자 판단은 고객님께 있어요 · 금액은 다른 계좌의 해외주식 순매수가 없다고 가정한 예시예요'
