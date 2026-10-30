import styles from './PagePlaceholder.module.css'

interface PagePlaceholderProps {
  name: string
}

// 화면을 옮기기 전까지 쓰는 빈 껍데기
export function PagePlaceholder({ name }: PagePlaceholderProps) {
  return <p className={styles.note}>{name} · 준비 중이에요</p>
}
