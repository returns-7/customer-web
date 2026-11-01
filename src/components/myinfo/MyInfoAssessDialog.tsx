import { useEffect, useState } from 'react'
import type { MouseEvent } from 'react'
import { createPortal } from 'react-dom'
import { RETURNS_DATA as RD } from '../../data/returns'
import { F } from '../../lib/calc'
import { assetUrl } from '../common/assetUrl'
import { cx } from '../common/cx'
import { ASSESS_BANDS, ASSESS_DESC, ASSESS_QUESTIONS as Q } from './myinfoAssess'
import styles from './MyInfoAssessDialog.module.css'

interface Props {
  onClose: () => void
  onSave: (score: number, profile: string) => void
}

// 투자성향 다시 진단 창: 5문항(보기 순서 = 0~4점) → 결과(합계 × 5 = 100점 만점)
// 창을 열 때마다 처음부터. 중간에 닫아도 확인 없이 닫힘(어두운 막·Esc·X). 저장은 결과 단계의 "이 결과로 저장"
// TODO: 백엔드 연결 시 진단 결과를 서버에 저장 (지금은 localStorage 진단 이력 + 시연 설정)
export function MyInfoAssessDialog({ onClose, onSave }: Props) {
  const [step, setStep] = useState(0)
  const [ans, setAns] = useState<(number | undefined)[]>([])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const onBackdrop = (e: MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose()
  }

  const isRes = step >= Q.length
  const sum = ans.reduce<number>((a, v) => a + (v ?? 0), 0)
  const score = sum * 5
  const rk = F.profileOf(score)
  const rp = RD.PROFILES[rk]
  const picked = isRes ? undefined : ans[step]

  const pick = (i: number) => setAns((a) => { const n = a.slice(); n[step] = i; return n })

  return createPortal(
    <div className={styles.backdrop} onClick={onBackdrop}>
      <div className={styles.panel} role="dialog" aria-modal="true" aria-label="투자성향 다시 진단">
        <div className={styles.head}>
          <h2>투자성향 다시 진단</h2>
          <span className={styles.step}>{isRes ? '결과' : step + 1 + ' / ' + Q.length}</span>
          <button type="button" className={styles.close} onClick={onClose} aria-label="닫기">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>
        <div className={styles.body}>
          {!isRes ? (
            <div className={styles.q}>
              <div className={styles.topic}>{Q[step][0]}</div>
              <div className={styles.question}>{Q[step][1]}</div>
              <div className={styles.opts} role="radiogroup" aria-label={Q[step][0]}>
                {Q[step][2].map((label, i) => (
                  <button key={i} type="button" role="radio" aria-checked={picked === i} className={cx(styles.opt, picked === i && styles.optOn)} onClick={() => pick(i)}>
                    <span className={styles.ring} />
                    {label}
                    <span className={styles.pt}>{i}점</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div className={styles.res}>
                <img src={assetUrl(rp.img ?? '')} alt={rp.label + ' 끼루'} />
                <div className={styles.resInfo}>
                  <b className={styles.resLabel}>{rp.label}</b>
                  <div className={styles.line}>
                    점수 <b>{score}점</b> <span className={styles.of}>/ 100점 · 문항 합계 {sum}점 × 5</span>
                  </div>
                  <div className={styles.line}>
                    추천받을 수 있는 상품 <b>{F.allowedLabel(rk)}</b>
                  </div>
                  <div className={cx(styles.line, styles.desc)}>{ASSESS_DESC[rk]}</div>
                </div>
              </div>
              <div className={styles.bands}>
                {ASSESS_BANDS.map(([range, k]) => (
                  <div key={k} className={cx(styles.band, k === rk && styles.bandOn)}>
                    <span className={styles.range}>{range}</span>
                    <span>{RD.PROFILES[k].label}</span>
                  </div>
                ))}
              </div>
              <div className={styles.basis}>구간 기준: 키움증권 고객투자성향 분류 기준(팀 합의)</div>
            </>
          )}
        </div>
        <div className={styles.foot}>
          <button
            type="button"
            className={styles.back}
            onClick={() => {
              if (isRes) {
                setStep(0)
                setAns([])
              } else if (step === 0) onClose()
              else setStep(step - 1)
            }}
          >
            {isRes ? '다시 하기' : step === 0 ? '취소' : '이전'}
          </button>
          <button
            type="button"
            className={cx(styles.next, !isRes && picked == null && styles.nextOff)}
            disabled={!isRes && picked == null}
            onClick={() => {
              if (isRes) onSave(score, rk)
              else if (picked != null) setStep(step + 1)
            }}
          >
            {isRes ? '이 결과로 저장' : step === Q.length - 1 ? '결과 보기' : '다음'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
