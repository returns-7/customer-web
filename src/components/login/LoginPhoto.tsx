import { Link } from 'react-router-dom'
import '../../styles/tokens.css'
import { cx } from '../common/cx'
import styles from './LoginPhoto.module.css'

interface LoginPhotoProps {
  variant: 'wide' | 'narrow'
}

// 로그인 왼쪽(넓은 화면) / 위쪽(좁은 화면) 사진 영역
export function LoginPhoto({ variant }: LoginPhotoProps) {
  const wide = variant === 'wide'

  return (
    <aside className={cx(styles.photo, wide ? styles.wide : styles.narrow)} data-screen-label="로그인 · 사진">
      <img className={styles.image} src="/assets/photo-closing.jpg" alt="" />
      <div className={styles.cover} />
      <Link className={styles.logoLink} to="/">
        <img className={styles.logo} src="/assets/wordmark-white.png" alt="Returns. 처음으로" />
      </Link>
      <div className={styles.copy}>
        <h1 className={styles.title}>
          좋은 가치는,
          <br />
          언제나 돌아옵니다.
        </h1>
        <span className={styles.rule} />
        {wide && <p className={styles.sub}>국내로 잇는 투자, 내일로 이어지는 가치</p>}
      </div>
      {wide && <p className={styles.notice}>리턴증권은 교육용 프로젝트의 가상 증권사입니다 · 사진: Unsplash</p>}
    </aside>
  )
}
