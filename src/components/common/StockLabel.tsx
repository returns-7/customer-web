import '../../styles/tokens.css'
import { cx } from './cx'
import { StockIcon } from './StockIcon'
import styles from './StockLabel.module.css'

interface StockInfo {
  t?: string
  code?: string
  name: string
  sector?: string
  color: string
  initial: string
}

// 종목 마스터 (해외: 티커 / 국내: 6자리 코드). 아이콘은 대표색 원 + 흰 이니셜 — 로고 교체는 logo prop
const MASTER: Record<string, StockInfo> = {
  TSLA: { t: 'TSLA', name: '테슬라', color: 'var(--stock-tsla)', initial: 'T' },
  AAPL: { t: 'AAPL', name: '애플', color: 'var(--stock-aapl)', initial: 'A' },
  NVDA: { t: 'NVDA', name: '엔비디아', color: 'var(--stock-nvda)', initial: 'N' },
  MSFT: { t: 'MSFT', name: '마이크로소프트', color: 'var(--stock-msft)', initial: 'M' },
  '005930': { code: '005930', name: '삼성전자', sector: '반도체', color: 'var(--stock-005930)', initial: 'S' },
  '000660': { code: '000660', name: 'SK하이닉스', sector: '반도체', color: 'var(--stock-000660)', initial: 'SK' },
  '005380': { code: '005380', name: '현대차', sector: '자동차', color: 'var(--stock-005380)', initial: 'H' },
  '000270': { code: '000270', name: '기아', sector: '자동차', color: 'var(--stock-000270)', initial: 'K' },
  '068270': { code: '068270', name: '셀트리온', sector: '제약·바이오', color: 'var(--stock-068270)', initial: 'C' },
  '207940': { code: '207940', name: '삼성바이오로직스', sector: '제약·바이오', color: 'var(--stock-207940)', initial: 'S' },
  '373220': { code: '373220', name: 'LG에너지솔루션', sector: '2차전지', color: 'var(--stock-373220)', initial: 'L' },
  '035420': { code: '035420', name: 'NAVER', sector: '인터넷', color: 'var(--stock-035420)', initial: 'N' },
  '105560': { code: '105560', name: 'KB금융', sector: '금융', color: 'var(--stock-105560)', initial: 'KB' },
  '005490': { code: '005490', name: 'POSCO홀딩스', sector: '철강', color: 'var(--stock-005490)', initial: 'P' },
  // 국내 ETF(가명, 예시) — 업종 배지 자리에 'ETF'. 실제 운용사 로고·이름 쓰지 않음
  '900010': { code: '900010', name: '국내대형주200 ETF', sector: 'ETF', color: 'var(--stock-900010)', initial: 'K2' },
  '900020': { code: '900020', name: '국내고배당 ETF', sector: 'ETF', color: 'var(--stock-900020)', initial: 'HD' },
  '900030': { code: '900030', name: '반도체TOP10 ETF', sector: 'ETF', color: 'var(--stock-900030)', initial: 'S10' },
  '900040': { code: '900040', name: '국내채권혼합 ETF', sector: 'ETF', color: 'var(--stock-900040)', initial: 'B' },
  '900050': { code: '900050', name: '신규2차전지 ETF', sector: 'ETF', color: 'var(--stock-900050)', initial: 'E' }
}

const findStock = (sym: string): StockInfo => {
  if (MASTER[sym]) return MASTER[sym]
  return Object.values(MASTER).find((s) => s.name === sym) || { t: String(sym || ''), name: String(sym || ''), color: 'var(--color-muted)', initial: String(sym || '?')[0] }
}

interface StockLabelProps {
  sym: string
  size?: 'sm' | 'md' | 'lg'
  stack?: boolean
  sector?: boolean
  logo?: string
}

export function StockLabel({ sym, size = 'md', stack = false, sector = true, logo = '' }: StockLabelProps) {
  const s = findStock(sym)
  const iconSize = size === 'sm' ? 20 : size === 'lg' ? 36 : 28
  const isKr = !!s.code

  return (
    <div className={cx(styles.label, styles[size])}>
      <StockIcon color={s.color} initial={s.initial} size={iconSize} logo={logo} />
      {!isKr && (
        <span className={styles.overseas}>
          <b className={styles.ticker}>{s.t}</b>
          <span className={styles.overseasName}>{s.name}</span>
        </span>
      )}
      {isKr && !stack && (
        <span className={styles.inline}>
          <b className={cx(styles.name, styles.nameEllipsis)}>{s.name}</b>
          <span className={cx(styles.code, styles.codeInline)}>{s.code}</span>
          {sector && <span className={cx(styles.badge, styles.badgeInline)}>{s.sector}</span>}
        </span>
      )}
      {isKr && stack && (
        <span className={styles.stack}>
          <b className={cx(styles.name, styles.nameEllipsis, styles.nameStack)}>{s.name}</b>
          <span className={styles.stackRow}>
            <span className={styles.code}>{s.code}</span>
            {sector && <span className={cx(styles.badge, styles.badgeStack)}>{s.sector}</span>}
          </span>
        </span>
      )}
    </div>
  )
}
