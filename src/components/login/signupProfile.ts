// 투자성향 진단 5문항: [주제, 질문, 보기(점수 = 순서)]
export const QUESTIONS: [string, string, string[]][] = [
  ['투자 경험', '주식·펀드에 투자해 본 기간은 얼마나 되나요?', ['없어요', '1년 미만', '1~3년', '3~5년', '5년 이상']],
  ['투자 기간', '이 돈을 얼마 동안 투자할 계획인가요?', ['6개월 미만', '6개월~1년', '1~2년', '2~3년', '3년 이상']],
  ['손실 감내', '투자금이 줄어든다면 어디까지 견딜 수 있나요?', ['원금은 꼭 지키고 싶어요', '10% 이내 손실까지', '20% 이내 손실까지', '30% 이내 손실까지', '그 이상도 괜찮아요']],
  ['소득 대비 투자 비중', '연 소득에서 투자금이 차지하는 비중은 어느 정도인가요?', ['10% 미만', '10~20%', '20~30%', '30~40%', '40% 이상']],
  ['금융 지식', '금융상품에 대해 얼마나 알고 있나요?', ['잘 몰라요', '예금·적금 정도 알아요', '주식·펀드 구조를 알아요', '파생상품까지 이해해요']]
]

export type ProfileKey = 'stable' | 'stableSeek' | 'neutral' | 'active' | 'aggressive'

// 낮은 점수 → 높은 점수 순서
export const ORDER: ProfileKey[] = ['stable', 'stableSeek', 'neutral', 'active', 'aggressive']

interface ProfileInfo {
  label: string
  color: string // CSS 색(성향 막대)
  img: string
  desc: [string, string]
}

export const PROFILES: Record<ProfileKey, ProfileInfo> = {
  stable: { label: '안정형', color: 'var(--color-profile-stable)', img: 'assets/kkiru-stable.png', desc: ['원금을 지키는 것을 가장 중요하게 생각해요.', '예금에 가까운 안정적인 상품 위주로 안내해 드릴게요.'] },
  stableSeek: { label: '안정추구형', color: 'var(--color-profile-stable-seek)', img: 'assets/kkiru-stable-seek.png', desc: ['손실은 작게, 예금보다 조금 높은 수익을 원해요.', '채권·배당주 중심으로 안내해 드릴게요.'] },
  neutral: { label: '위험중립형', color: 'var(--color-profile-neutral)', img: 'assets/kkiru-neutral.png', desc: ['수익을 위해 어느 정도의 가격 변동은 받아들여요.', '대형 우량주 중심으로 안내해 드릴게요.'] },
  active: { label: '적극투자형', color: 'var(--color-profile-active)', img: 'assets/kkiru-active.png', desc: ['높은 수익을 위해 큰 가격 변동도 감수할 수 있어요.', '성장주 비중을 높인 구성을 안내해 드릴게요.'] },
  aggressive: { label: '공격투자형', color: 'var(--color-profile-aggressive)', img: 'assets/kkiru-aggressive.png', desc: ['손실 위험이 커도 가장 높은 수익을 추구해요.', '변동성이 큰 종목까지 함께 안내해 드릴게요.'] }
}

// 점수 합(보기 순서) ÷ 만점 → 다섯 구간 중 하나
export const profileKey = (answers: (number | null)[]): ProfileKey => {
  const sum = answers.reduce<number>((a, v) => a + (v || 0), 0)
  const max = QUESTIONS.reduce((a, q) => a + q[2].length - 1, 0)
  const r = sum / max
  return ORDER[Math.min(4, Math.floor(r * 5))]
}
