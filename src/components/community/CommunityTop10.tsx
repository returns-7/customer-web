import '../../styles/tokens.css'
import { RETURNS_DATA as RD } from '../../data/returns'
import { F } from '../../lib/calc'
import { Box } from '../common/Box'
import { StockIcon } from '../common/StockIcon'
import { cx } from '../common/cx'
import { KR_ALL, RANK12 } from './communityData'
import styles from './CommunityTop10.module.css'

interface CommunityTop10Props {
  code: string // 선택된 종목
  fixed: boolean // 화면에 고정(박스가 칸을 채우고 목록만 스크롤)
  rowH: number // 행 높이(px)
  onSelect: (code: string) => void
}

const tone = (n: number) => (n > 0 ? styles.up : n < 0 ? styles.down : styles.flat)

// 많이 이야기하는 종목 — 순위·종목·등락·글 수. 행을 누르면 선택만 바뀜(가운데 피드 연결은 C-2부터)
export function CommunityTop10({ code, fixed, rowH, onSelect }: CommunityTop10Props) {
  return (
    <Box
      data-box="top10"
      className={cx(styles.box, fixed && styles.boxFixed)}
      head={
        <>
          <h2 className={styles.title}>많이 이야기하는 종목</h2>
          <span className={styles.scope}>오늘</span>
        </>
      }
    >
      <div className={cx(styles.list, fixed && styles.listFixed)}>
        {RANK12.map(([c, posts], i) => {
          const chg = RD.PX[c][1]
          const on = c === code
          return (
            <button
              key={c}
              type="button"
              className={cx(styles.row, on && styles.on)}
              style={{ height: rowH }}
              aria-current={on ? 'true' : undefined}
              onClick={() => onSelect(c)}
            >
              <span className={cx(styles.num, i < 3 && styles.numTop)}>{i + 1}</span>
              <StockIcon color={KR_ALL[c][1]} initial={KR_ALL[c][2]} size={20} />
              <span className={styles.name}>
                <span className={styles.nameText}>{RD.SN[c]}</span> <span className={styles.code}>{c}</span>
              </span>
              <span className={styles.right}>
                <span className={cx(styles.chg, tone(chg))}>{F.pct(chg)}</span>
                <span className={styles.posts}>글 {posts}</span>
              </span>
            </button>
          )
        })}
      </div>
    </Box>
  )
}
