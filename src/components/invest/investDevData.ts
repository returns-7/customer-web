// 주식 패키지 시연 설정에서만 쓰는 선택지(원본 invest.dc.html 그대로). 이 화면 안에서만 유지하고 홈·내 계좌와 공유하지 않음

// 새 패키지 창 검사 결과를 실제 흐름 대신 보여 주는 상태(원본 chkDemo). null이면 실제 흐름
export type ChkDemo = 'before' | 'loading' | 'full' | 'noexp' | 'novol' | 'risky' | 'stale'
export const CHK_DEMOS: [ChkDemo | null, string][] = [
  [null, '실제 흐름'],
  ['before', '검사 전'],
  ['loading', '검사 중'],
  ['full', '결과(설명 있음)'],
  ['noexp', '결과(설명 없음)'],
  ['novol', '변동성 계산 불가'],
  ['risky', '성향보다 위험'],
  ['stale', '이전 구성 기준']
]

// 다음 주문 한 번을 거부시키는 사유(원본 rejNext)
export type RejectReason = 'NOT_ELIGIBLE' | 'INSUFFICIENT_CASH' | 'INSUFFICIENT_QTY' | 'ACCOUNT_NOT_OPEN' | 'PRICE_UNAVAILABLE'
export const REJECT_REASONS: [RejectReason | null, string][] = [
  [null, '없음'],
  ['NOT_ELIGIBLE', 'NOT_ELIGIBLE'],
  ['INSUFFICIENT_CASH', 'INSUFFICIENT_CASH'],
  ['INSUFFICIENT_QTY', 'INSUFFICIENT_QTY'],
  ['ACCOUNT_NOT_OPEN', 'ACCOUNT_NOT_OPEN'],
  ['PRICE_UNAVAILABLE', 'PRICE_UNAVAILABLE']
]
