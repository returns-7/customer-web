import '../../styles/tokens.css'
import { cx } from '../common/cx'
import { QUESTIONS } from './signupProfile'
import styles from './SignupQuiz.module.css'

interface SignupQuizProps {
  qi: number // 지금 문항(0부터)
  answers: (number | null)[]
  onPick: (index: number) => void
}

// 4단계 투자성향 진단: 한 화면에 한 문항
export function SignupQuiz({ qi, answers, onPick }: SignupQuizProps) {
  const [topic, text, options] = QUESTIONS[qi]
  const picked = answers[qi]

  return (
    <div className={styles.section}>
      <div className={styles.top}>
        <b className={styles.topic}>{topic}</b>
        <span className={styles.count}>{qi + 1} / {QUESTIONS.length}</span>
      </div>
      <h2 className={styles.question}>{text}</h2>
      <div className={styles.radios} role="radiogroup" aria-label={text}>
        {options.map((label, i) => (
          <button key={label} type="button" role="radio" aria-checked={picked === i} className={cx(styles.radio, picked === i && styles.radioOn)} onClick={() => onPick(i)}>
            <span className={cx(styles.dot, picked === i && styles.dotOn)} />
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}
