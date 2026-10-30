import { Link } from 'react-router-dom'
import '../../styles/tokens.css'
import { RETURNS_DATA as RD } from '../../data/returns'
import { F } from '../../lib/calc'
import { Box } from '../common/Box'
import { KkiruAvatar } from '../common/KkiruAvatar'
import { StockIcon } from '../common/StockIcon'
import { cx } from '../common/cx'
import { PKG_ASK_CHIPS } from './homeRecData'
import { spark } from './homeRecLogic'
import styles from './HomePackageBox.module.css'

const tone = (n: number) => (n > 0 ? styles.up : n < 0 ? styles.down : styles.flat)

// 패키지 위험등급 = 구성 종목 등급의 평가금액 가중평균(소수 둘째 자리 내림)
function weightedGrade(id: keyof typeof RD.PKG_HOLDINGS): string {
  const H = RD.PKG_HOLDINGS[id] || []
  const w = H.map((h) => h.qty * (RD.PX[h.code] || [0])[0])
  const t = w.reduce((a, b) => a + b, 0) || 1
  return (Math.floor((H.reduce((a, h, k) => a + (F.meta(h.code).grade ?? 0) * w[k], 0) / t) * 100) / 100).toFixed(2)
}

// 나만의 주식 패키지 박스. hasPkg는 시연 설정(패키지 있음/없음)에서 바뀌는 값 — 설정 위젯을 옮길 때 연결
export function HomePackageBox({ className, hasPkg = true }: { className?: string; hasPkg?: boolean }) {
  const opened = RD.ACCOUNT_STATE === 'opened'
  const show = opened && hasPkg
  // 원본 홈은 예전 고정값(29,650,000)이었으나 다른 페이지와 맞추려고 데이터 계산값(RD.PKGS) 사용
  const pkgs = RD.PKGS.slice(0, 3)
  const total = pkgs.reduce((t, p) => t + p.amt, 0)
  const ret = RD.PKG_TOTAL_RET

  const head = show ? (
    <span className={styles.summary}>
      <span>총 평가 ₩{F.won(total)}</span>
      <span className={cx(styles.retTotal, tone(ret))}>{F.pct(ret)}</span>
      <span className={styles.example}>예시</span>
    </span>
  ) : null

  const actions = (
    <span className={styles.links}>
      {show && (
        <>
          <Link to="/invest?new=1" className={styles.newPkg}>+ 새 패키지 만들기</Link>
          <span className={styles.dot}>·</span>
        </>
      )}
      <Link to="/invest" className={styles.all}>전체 ›</Link>
    </span>
  )

  return (
    <Box shadow className={className} title="나만의 주식 패키지" head={head} actions={actions}>
      {show && (
        <div className={styles.cols}>
          {pkgs.map((p) => (
            <Link key={p.id} to={'/invest?pkg=' + p.id} className={styles.card}>
              <span className={styles.nameRow}>
                <span className={styles.name}>{p.name}</span>
                <span className={styles.chev}>›</span>
              </span>
              <span className={styles.iconRow}>
                <span className={styles.icons}>
                  {p.icons.map(([color, ini], i) => (
                    <span key={i} className={styles.icon}>
                      <StockIcon color={color} initial={ini} size={18} />
                    </span>
                  ))}
                </span>
                <span className={styles.more}>외 {p.count - p.icons.length}종목</span>
              </span>
              <span className={styles.amtRow}>
                <b className={styles.amt}>₩{F.won(p.amt)}</b>
                <span className={cx(styles.ret, tone(p.ret))}>{F.pct(p.ret)}</span>
              </span>
              <svg viewBox="0 0 200 48" preserveAspectRatio="none" className={styles.spark}>
                <path d={spark(p.seed, p.ret >= 0)} fill="none" strokeWidth="1.5" vectorEffect="non-scaling-stroke" className={p.ret >= 0 ? styles.lineUp : styles.lineDown} />
              </svg>
              <span className={styles.grade}>가중평균 {weightedGrade(p.id)}등급</span>
            </Link>
          ))}
        </div>
      )}

      {opened && !hasPkg && (
        <div className={styles.empty}>
          <div className={styles.emptyTop}>
            <KkiruAvatar profile={RD.CUSTOMER.profile} size={48} />
            <div className={styles.emptyText}>끼루에게 원하는 걸 말하면 성향에 맞는 종목으로 패키지 구성을 도와드려요.</div>
          </div>
          <div className={styles.chips}>
            {PKG_ASK_CHIPS.map((label) => (
              <Link key={label} to={'/invest?new=1&ask=' + encodeURIComponent(label)} className={styles.chip}>
                {label}
              </Link>
            ))}
          </div>
          <Link to="/invest?new=1" className={styles.go}>패키지 만들러 가기 ›</Link>
        </div>
      )}

      {!opened && <div className={styles.closed}>계좌를 연 뒤 만들 수 있어요</div>}
    </Box>
  )
}
