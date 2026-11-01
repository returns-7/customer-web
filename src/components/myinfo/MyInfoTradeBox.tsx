import { Box } from '../common/Box'
import { cx } from '../common/cx'
import { tradeView } from './myinfoProfile'
import styles from './MyInfoTradeBox.module.css'

interface Props {
  className?: string
  onOpenAssess: () => void // 다시 진단하기 창 열기
}

// 거래로 본 성향(참고용). 미진단일 때는 페이지가 이 박스를 아예 그리지 않음(원본)
export function MyInfoTradeBox({ className, onOpenAssess }: Props) {
  const tp = tradeView()
  return (
    <Box
      data-box="trade-profile"
      className={cx(styles.box, className)}
      title="거래로 본 성향"
      head={<span className={styles.sub}>최근 3개월 · 참고용</span>}
    >
      {tp ? (
        <>
          <div className={styles.head}>{tp.head}</div>
          <div className={styles.rows}>
            {tp.rows.map((r) => (
              <div key={r.k} className={styles.row}>
                <span>{r.k}</span>
                <b>{r.v}</b>
              </div>
            ))}
          </div>
          <div className={styles.desc}>{tp.desc}</div>
          <div className={styles.foot}>
            <button type="button" className={styles.link} onClick={onOpenAssess}>
              다시 진단하기 ›
            </button>
          </div>
        </>
      ) : (
        <div className={styles.none}>거래가 쌓이면 보여드려요</div>
      )}
    </Box>
  )
}
