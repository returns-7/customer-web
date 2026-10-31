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

// ===== C-2: 가운데 열 윗부분 =====
export const GEN = 'GEN' // 게시판 "RIA 제도·일반"의 종목 자리 값
export const GEN_NAME = 'RIA 제도·일반'
export const GEN_RE = /ria|제도|일반/i // 종목 고르기 검색어가 이것이면 게시판도 보임
export const PX_TIME = ' 15:30' // 가격 기준 시각(날짜 뒤에 붙음). TODO: 백엔드 연결 시 시세 기준 시각으로 대체
export const RECENT_KEY = 'returns-recent-stocks' // sessionStorage 키(원본 그대로)
export const RECENT_LIMIT = 6
export const DEFAULT_RECENT = ['000660', '005930', '373220'] // 처음 '최근 본 종목'
export const TOAST_MS = 2200

// 글 몇 개를 EX로 둔 원본 예시. [id, 닉네임, 성향, 시간, 본문, 좋아요, 답글 수, 내 글, 끼루 답변 키]
// TODO: 백엔드 연결 시 서버 글로 대체. C-3(피드)에서 같은 값을 씀
export const EX: Record<string, [string, string, string, string, string, number, number, number, string | null][]> = {
  '000660': [['k660-01', '리아', 'me', '14:48', 'HBM 증설 기사 나왔던데 회사가 공시한 내용도 있나요?', 5, 0, 1, 'hbm']],
  GEN: [
    ['kgen-01', '해외에서복귀', 'stableSeek', '13:20', '국내 주식 판 돈도 1년 묶이나요?', 12, 0, 0, 'lock'],
    ['kgen-02', '차분한투자', 'stable', '12:40', 'RIA 계좌 입고 신청하고 심사까지 하루 걸렸어요. 다들 비슷하셨나요?', 6, 0, 0, null],
    ['kgen-03', '도시락', 'private', '11:15', '매도 체결일이 어느 달이냐에 따라 공제율이 달라진다는 거 이번에 처음 알았어요', 9, 0, 0, null]
  ],
  '005380': [['k380-01', '오후세시', 'active', '14:41', '이거 지금 사도 돼요?', 1, 0, 0, 'oos']]
}

// ===== C-3: 피드 글 목록 =====
// 성향 공개에 동의한 작성자(예시). 나머지는 비공개: 회색 기본 아바타 + 닉네임만. TODO: 백엔드 연결 시 작성자별 공개 값으로 대체
export const PUBLIC_NICKS = ['반도체개미', '장기보유러', '차분한투자', '새벽시장', '가치투자']
export const FEED_LIMIT = 20 // 처음 보이는 글 수 / "이전 글 더 보기" 한 번에 늘어나는 수
export const THREAD_LIMIT = 40 // 내 답글 줄에서 글로 이동할 때 보이는 글 수
export const LONG_CHARS = 120 // 이 글자 수를 넘거나 3줄을 넘으면 "더보기"
export const LONG_LINES = 3
export const KIRU_LONG_CHARS = 180 // 끼루 답변이 이 글자 수를 넘으면 "더보기"
export const LIVE_MIN_MS = 10000 // 실시간 새 글: 10~15초마다 1개
export const LIVE_SPAN_MS = 5000
export const AT_TOP_PX = 40 // 고정 상태에서 이 값 미만이면 "맨 위"
export const AT_TOP_PAGE_PX = 60 // 페이지 스크롤 상태에서 피드 윗부분이 이만큼 안 벗어나면 "맨 위"
export const COMPOSE_H = 83 // 글쓰기 창 자리 높이(글쓰기 창은 C-5에서 만듦)
export const FEED_EMPTY = { search: (q: string) => '‘' + q + '’ 내용의 글이 없어요', mine: '아직 쓴 글이 없어요. 위 입력칸에 첫 의견을 남겨 보세요.', other: '아직 글이 없어요. 첫 의견을 남겨 보세요.' }
