// 커뮤니티: 원본 community.dc.html에만 있는 값 (채팅·순위·종목 이름은 src/data의 RD를 씀)
import { RETURNS_DATA as RD } from '../../data/returns'

export const DEFAULT_STOCK = '000660' // 처음 열리는 종목
export const WIDE_MIN = 1281 // 3열(왼쪽·가운데·오른쪽): 화면 폭이 1280px 넘을 때
export const MID_MIN = 1025 // 2열: 1280px 이하 ~ 1025px 이상
export const FIXED_MIN_HEIGHT = 720 // 3열이면서 높이가 이 값 이상일 때만 화면에 고정(열 안에서만 스크롤)
export const BAR_H_FALLBACK = 65 // 상단 바 높이를 아직 못 쟀을 때(원본 값)

// TODO: 백엔드 연결 시 순위 11·12위(국내 ETF 종목방)도 서버 값으로 대체 — 지금은 원본의 예시 값
const RANK_X: [string, string][] = [['900020', '142'], ['900010', '97']]

// 많이 이야기하는 종목 12위까지: [종목 코드, 글 수]. 1~10위는 홈과 같은 RD.RANK
export const RANK12: [string, string][] = (RD.RANK as [string, string][]).concat(RANK_X).slice(0, 12)

export const KR_ALL: Record<string, [string, string, string]> = { ...RD.KR, ...RD.KR_ETF }

// 주소의 ?stock= 값 → 선택 종목(원본: 모르는 값이면 기본 종목). 게시판 GEN은 C-2부터 만듦
export const stockFromUrl = (v: string | null): string => (v && (KR_ALL[v] || v === 'GEN') ? v : DEFAULT_STOCK)

// 행 높이: 고정일 때 왼쪽 칸 높이에 맞춰 44~76px(원본 rowH)
export const rowHeight = (fixed: boolean, colH: number): number =>
  fixed && colH ? Math.max(44, Math.min(76, Math.floor((colH - 50) / RANK12.length))) : 44
