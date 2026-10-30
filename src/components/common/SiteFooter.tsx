import '../../styles/tokens.css'
import styles from './SiteFooter.module.css'

export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.row}>
        <a className={styles.strong} href="#">이용약관</a>
        <a className={styles.strong} href="#">개인정보처리방침</a>
        <a className={styles.plain} href="#">고객센터</a>
        <span className={styles.note}>© Returns · 리턴증권은 교육용 프로젝트의 가상 증권사입니다</span>
      </div>
    </footer>
  )
}
