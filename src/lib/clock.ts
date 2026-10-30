import { MOCK_BUSINESS_TODAY } from '../data/businessDate'

// 업무일('YYYY-MM-DD') — 화면의 "오늘"은 브라우저 시계가 아니라 이 함수 한 곳에서만 가져온다.
// TODO: 서버 system_clock API 응답 값으로 교체할 자리. 지금은 목업 상수를 그대로 돌려준다.
export const getBusinessToday = (): string => MOCK_BUSINESS_TODAY
