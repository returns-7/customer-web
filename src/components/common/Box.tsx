import type { HTMLAttributes, ReactNode } from 'react'
import '../../styles/tokens.css'
import { cx } from './cx'
import styles from './Box.module.css'

interface BoxProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  title?: ReactNode // 머리줄 왼쪽 제목(16px 굵게)
  head?: ReactNode // 제목 대신 머리줄에 넣을 내용(예: 탭). title과 같이 쓰면 title 뒤에 붙음
  actions?: ReactNode // 머리줄 오른쪽 끝
  headScroll?: boolean // 머리줄이 넘치면 가로로 스크롤(탭이 많을 때)
  shadow?: boolean // 홈 화면 박스처럼 옅은 그림자
}

// 흰 박스 + 머리줄(48px). 머리줄이 필요 없으면 title·head·actions를 모두 생략
export function Box({ title, head, actions, headScroll = false, shadow = false, className, children, ...rest }: BoxProps) {
  const hasHead = title != null || head != null || actions != null

  return (
    <section className={cx(styles.box, shadow && styles.shadow, className)} {...rest}>
      {hasHead && (
        <div className={cx(styles.head, headScroll && styles.headScroll)}>
          {title != null && <h2 className={styles.title}>{title}</h2>}
          {head}
          {actions != null && <div className={styles.actions}>{actions}</div>}
        </div>
      )}
      {children}
    </section>
  )
}
