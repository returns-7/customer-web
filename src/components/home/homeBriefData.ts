// 끼루 브리핑 박스에 쓰는 문구·예시 값 (금액·날짜는 여기 두지 않고 src/data·src/lib에서 계산)

// 원본의 범위 예시: 시뮬레이션 결과 폭을 줄어드는 세금의 배율로 표현한 값
export const RANGE_LOW = 0.962
export const RANGE_HIGH = 1.035

export const RANGE_TIP =
  '주가·환율 변동을 반영하면 10번 중 8번은 이 범위예요. 남은 보유 종목의 주가와 환율을 과거 변동성으로 1,000번 시뮬레이션한 결과예요. 실제 세액은 매도 시점에 따라 달라져요.'

// 그래프 가장 큰 막대 위로 남겨 두는 여유 배율, 가운데 글자를 막대 사이 가운데에 맞추는 보정(px)
export const CHART_HEADROOM = 1.4
export const CUT_LABEL_OFFSET_PX = 17
// 예상 막대가 이보다 낮으면(그래프 %) 안의 글자를 숨김
export const EXPECT_LABEL_MIN_PCT = 8

export const ASSET_FOOT_NOTE = '끼루 문장은 저장된 숫자로만 만들어요'
