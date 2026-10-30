import { HomeBriefBox } from '../components/home/HomeBriefBox'
import { HomeChatBox } from '../components/home/HomeChatBox'
import { HomePackageBox } from '../components/home/HomePackageBox'
import { HomeRecBox } from '../components/home/HomeRecBox'
import { HomeNewsBox } from '../components/home/HomeNewsBox'
import { HomeProfileBox } from '../components/home/HomeProfileBox'
import { DISCLAIMER } from '../components/home/homeChatData'
import styles from '../components/home/HomeLayout.module.css'

// 홈 — 1~5번째 부분: 배치 + 프로필·계좌 + AI 뉴스 + 패키지 + 오늘의 추천 + 끼루 브리핑 + 경제 채팅방 + 아래 고지
export function HomePage() {
  return (
    <>
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
          <HomeBriefBox className={styles.tax} />
          <HomeChatBox className={styles.chat} />
        </div>
      </div>
      <p className={styles.note}>{DISCLAIMER}</p>
    </>
  )
}
