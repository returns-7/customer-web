// 장면 표와 시간 변환 — 원본 landing-journey.html의 R(), SCN, TOTAL (타임라인 시간 1 = 화면 1장)

/* S0–S4는 예전 시간 단위로 써 둔 것을 장면당 2.5 / 2.0장으로 늘려 쓴다 */
export function R(t: number): number {
  const O = [0, 2.95, 4.85, 6.85, 8.55, 11.75], N = [0, 2.5, 4.5, 6.5, 8.5, 10.5]
  if (t >= O[5]) return N[5] + (t - O[5])
  for (let i = 1; i < 6; i++) if (t <= O[i]) return N[i - 1] + (t - O[i - 1]) * (N[i] - N[i - 1]) / (O[i] - O[i - 1])
  return t
}

export const TOTAL = 21.9

export interface Scene {
  k: string
  n: string
  a: number
  b: number
  done: number
}

export const SCN: Scene[] = [
  { k: 'S0', n: '해외 자산', a: 0, b: 2.5, done: 2.0 },
  { k: 'S1', n: '계좌 개설', a: 2.5, b: 4.5, done: 4.25 },
  { k: 'S2', n: '입고', a: 4.5, b: 6.5, done: 6.1 },
  { k: 'S3', n: '매도', a: 6.5, b: 8.5, done: 8.1 },
  { k: 'S4', n: '국내 복귀', a: 8.5, b: 10.5, done: 10.0 },
  { k: 'S5', n: '1년 유지', a: 10.5, b: 12.5, done: 12.2 },
  { k: 'S6', n: '외부감시', a: 12.5, b: 14.5, done: 14.15 },
  { k: 'S7', n: '공제율·세액', a: 14.5, b: 16.5, done: 16.15 },
  { k: 'S8', n: '국내 투자', a: 16.5, b: 18.5, done: 18.15 },
  { k: 'S9', n: '서비스', a: 18.5, b: 21.9, done: 21.7 },
]

// 패스포트 장면 이동 목록: 장면 이름 + FAQ
export const NAV_NAMES: string[] = [...SCN.map((s) => s.n), 'FAQ']
