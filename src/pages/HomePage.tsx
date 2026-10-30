import { Box } from '../components/common/Box'
import { HomePackageBox } from '../components/home/HomePackageBox'
import { HomeRecBox } from '../components/home/HomeRecBox'
import { HomeNewsBox } from '../components/home/HomeNewsBox'
import { HomeProfileBox } from '../components/home/HomeProfileBox'
import styles from '../components/home/HomeLayout.module.css'

// 홈 — 1~3번째 부분: 배치 + 프로필·계좌 + AI 뉴스 + 패키지 + 오늘의 추천. 나머지 박스는 머리줄 제목만 있는 자리
export function HomePage() {
  return (
    <div className={styles.page}>
      <div className={styles.colMain}>
        <HomeNewsBox className={styles.news} />
        <div className={styles.pair}>
          <HomePackageBox className={styles.pkg} />
          <HomeRecBox className={styles.rec} />
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
