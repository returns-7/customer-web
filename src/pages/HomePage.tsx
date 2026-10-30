import { Box } from '../components/common/Box'
import { HomeProfileBox } from '../components/home/HomeProfileBox'
import styles from '../components/home/HomeLayout.module.css'

// 홈 — 1번째 부분: 배치 + 프로필·계좌 박스. 나머지 박스는 머리줄 제목만 있는 자리
export function HomePage() {
  return (
    <div className={styles.page}>
      <div className={styles.colMain}>
        <Box shadow className={styles.news} title="AI 뉴스" />
        <div className={styles.pair}>
          <Box shadow className={styles.pkg} title="나만의 주식 패키지" />
          <Box shadow className={styles.rec} title="오늘의 추천" />
        </div>
      </div>
      <div className={styles.colSide}>
        <HomeProfileBox className={styles.prof} />
        <Box shadow className={styles.tax} title="끼루 브리핑" />
        <Box shadow className={styles.chat} title="경제 채팅방" />
      </div>
    </div>
  )
}
