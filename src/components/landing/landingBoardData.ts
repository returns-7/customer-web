// S3 출발 전광판 데이터 — 원본 landing-journey.html의 ROWS / STATES (시연용 가짜 종목)
export type MarketKey = 'NASDAQ' | 'NYSE' | 'TSE' | 'LSE' | 'HKEX'

export const MARKET_COLOR: Record<MarketKey, string> = {
  NASDAQ: 'var(--landing-mk-nasdaq)',
  NYSE: 'var(--landing-mk-nyse)',
  TSE: 'var(--landing-mk-tse)',
  LSE: 'var(--landing-mk-lse)',
  HKEX: 'var(--landing-mk-hkex)',
}

const MKS: MarketKey[] = ['NASDAQ', 'NYSE', 'TSE', 'NASDAQ', 'HKEX', 'LSE', 'NYSE', 'TSE', 'NASDAQ', 'HKEX', 'NYSE', 'LSE']
const QTY = [40, 15, 200, 22, 300, 60, 12, 100, 35, 500, 18, 80]
export const SHARE = [0.14, 0.1, 0.09, 0.1, 0.08, 0.08, 0.07, 0.07, 0.07, 0.07, 0.07, 0.06]

const hm = (m: number): string => `${String(13 + Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`

export interface BoardRow {
  m: MarketKey
  n: string // 종목
  t: string // 주문 시각
  f: string // 체결 시각
  q: number
  share: number
}

export const BOARD_ROWS: BoardRow[] = MKS.map((m, i) => ({
  m,
  n: '해외주식 ' + String.fromCharCode(65 + i),
  t: hm(2 + i * 3),
  f: hm(4 + i * 3),
  q: QTY[i],
  share: SHARE[i],
}))

export const BOARD_STATES = ['주문 접수', '매도 체결', '원화 환전 중', '원화 확정']

// 작은 패널(psm): 12행 중 앞 8행만 채움
export const BOARD_ROWS_SMALL: ({ t: string; n: string } | null)[] = Array.from({ length: 12 }, (_, i) =>
  i < 8 ? { t: hm(38 + i * 3), n: '해외주식 ' + String.fromCharCode(77 + i) } : null,
)
