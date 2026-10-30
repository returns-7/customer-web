import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import '../../styles/tokens.css'
import { F } from '../../lib/calc'
import { cx } from '../common/cx'
import { StockLabel } from '../common/StockLabel'
import { ModalFrame } from './ModalFrame'
import { IN_NEXT, LIMIT_MAX, LIMIT_MIN, SUBMIT_NOTE, applyConfig, clampLimit, inMinNote, inRows, limitBar, openValues, outDoneSum, outNext, outValues, parseInt0 } from './accountApplyData'
import type { AddedIn, ApplyKind } from './accountApplyData'
import type { HistTab } from './accountHistData'
import styles from './ApplyModal.module.css'

interface ApplyModalProps {
  kind: ApplyKind
  onClose: () => void
  onGoHist: (tab: HistTab) => void // 완료 화면의 '내역 보기'
  onSubmitIn: (rows: AddedIn[]) => void
  onSubmitOut: (amt: number) => void
  onFinishOpen: () => void
}

interface DoneInfo {
  sum: string
  next: string[]
}

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}

// 체크 상자(켜면 남색)
function Box({ on }: { on: boolean }) {
  return (
    <span className={cx(styles.cb, on && styles.cbOn)}>
      <CheckIcon />
    </span>
  )
}

// 완료 화면 — 접수 요약과 '다음에 일어날 일'
function DoneView({ title, sum, next }: { title: string; sum: string; next: string[] }) {
  return (
    <>
      <div className={styles.done}>
        <span className={styles.doneIcon}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </span>
        <h3 className={styles.doneTitle}>{title}</h3>
        <div className={styles.doneSum}>{sum}</div>
      </div>
      <div>
        <div className={styles.nextHead}>다음에 일어날 일</div>
        {next.map((text, i) => (
          <div key={i} className={styles.nextRow}>
            <span className={styles.nextNo}>{i + 1}</span>
            <span className={styles.nextTxt}>{text}</span>
          </div>
        ))}
      </div>
    </>
  )
}

// 입고·인출·계좌 개설 신청 창(원본 modal in/out/open) — 열릴 때마다 처음 상태로 시작(부모에서 열 때 새로 그림)
export function ApplyModal({ kind, onClose, onGoHist, onSubmitIn, onSubmitOut, onFinishOpen }: ApplyModalProps) {
  const [step, setStep] = useState(0)
  const [inQ, setInQ] = useState<Record<string, string>>({})
  const [outAmt, setOutAmt] = useState('')
  const [outAgree, setOutAgree] = useState(false)
  const [opLimit, setOpLimit] = useState<number | null>(null)
  const [opAgree, setOpAgree] = useState(false)
  const [askClose, setAskClose] = useState(false)
  const [done, setDone] = useState<DoneInfo | null>(null)

  const cfg = applyConfig(kind)
  const isOpen = kind === 'open'
  const last = cfg.steps.length - 1

  // 입고
  const rows = inRows(inQ)
  const picked = rows.filter((r) => r.sel && r.q > 0)
  // 인출
  const o = outValues()
  const oAmt = parseInt0(outAmt)
  const oRisky = oAmt > o.nowNum
  const oTooMuch = oAmt > o.cashNum
  const oOk = oAmt > 0 && !oTooMuch && (!oRisky || outAgree)
  // 계좌 개설
  const ov = openValues()
  const opLim = opLimit == null ? ov.defaultLimit : opLimit
  const opTot = opLim + ov.other
  const opOver = opTot > LIMIT_MAX
  const bar = limitBar(opTot)

  const nextOn = isOpen ? (step === 1 ? !opOver : step === 2 ? opAgree : true) : step === 0 ? (kind === 'in' ? picked.length > 0 : oOk) : true

  // 입력 중이면 닫기 전에 확인(원본 dirty): 접수 전 단계에서 입고는 고른 종목이 있을 때, 인출은 금액이 있을 때
  const dirty = step < 2 && (kind === 'in' ? Object.keys(inQ).length > 0 : kind === 'out' ? !!outAmt : false)
  const reqClose = () => (dirty ? setAskClose(true) : onClose())

  const submit = () => {
    if (kind === 'open') {
      setStep(3)
    } else if (kind === 'in') {
      setDone({ sum: picked.map((r) => r.t + ' ' + r.q + '주').join(' · '), next: IN_NEXT })
      onSubmitIn(picked.map((r) => ({ t: r.t, req: r.q, base: r.base, now: r.now })))
      setStep(2)
    } else {
      setDone({ sum: outDoneSum(oAmt), next: outNext(oRisky) })
      onSubmitOut(oAmt)
      setStep(2)
    }
  }

  const backLabel = step === 0 ? '취소' : step < last ? '이전' : isOpen ? '닫기' : '내역 보기'
  const nextLabel = step < last - 1 ? '다음' : step === last - 1 ? '신청하기' : '닫기'
  const onBack = () => {
    if (step === 0) reqClose()
    else if (step < last) setStep(step - 1)
    else if (isOpen) onFinishOpen()
    else if (cfg.histTab) onGoHist(cfg.histTab)
  }
  const onNext = () => {
    if (!nextOn) return
    if (step < last - 1) setStep(step + 1)
    else if (step === last - 1) submit()
    else if (isOpen) onFinishOpen()
    else onClose()
  }

  const stepBar = (
    <div className={styles.steps}>
      {cfg.steps.map((label, i) => (
        <span key={label} className={styles.stepWrap}>
          {i > 0 && <span className={styles.stepSep}>›</span>}
          <span className={cx(styles.stepItem, i <= step && styles.stepOn, i === step && styles.stepCur)}>
            <span className={cx(styles.stepNo, i < step ? styles.stepNoDone : i === step && styles.stepNoCur)}>{i + 1}</span>
            {label}
          </span>
        </span>
      ))}
    </div>
  )

  let body: ReactNode = null
  if (kind === 'in' && step === 0) {
    body = (
      <div>
        <div className={styles.secTitle}>일반계좌의 해외주식</div>
        <div className={cx(styles.inCols, styles.thead)}>
          <span />
          <span>종목</span>
          <span className={styles.right}>보유</span>
          <span className={styles.right}>입고 가능</span>
          <span className={styles.right}>신청 수량</span>
        </div>
        {rows.map((r) => (
          <div key={r.t} className={styles.line}>
            <div className={cx(styles.inCols, styles.inRow)}>
              <button
                type="button"
                className={styles.cbBtn}
                aria-pressed={r.sel}
                aria-label={r.t + ' 선택'}
                onClick={() =>
                  setInQ((q) => {
                    const n = { ...q }
                    if (Object.prototype.hasOwnProperty.call(n, r.t)) delete n[r.t]
                    else n[r.t] = String(r.avail)
                    return n
                  })
                }
              >
                <Box on={r.sel} />
              </button>
              <span className={styles.stockCell}>
                <StockLabel sym={r.t} size="sm" />
              </span>
              <span className={styles.right}>{r.now}주</span>
              <b className={cx(styles.right, styles.bold)}>{r.avail}주</b>
              <span className={styles.qtyCell}>
                <input
                  className={cx(styles.qtyInput, r.over && styles.qtyOver)}
                  value={r.qv}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, '').slice(0, 4)
                    setInQ((q) => ({ ...q, [r.t]: v }))
                  }}
                  disabled={!r.sel}
                  inputMode="numeric"
                  aria-label={r.t + ' 신청 수량'}
                  placeholder="0"
                />
                <span className={styles.unit}>주</span>
              </span>
            </div>
            {r.over && (
              <div className={styles.overBox}>
                <div className={styles.overMsg}>{r.overMsg}</div>
                <div className={styles.sub}>{r.retMsg}</div>
              </div>
            )}
          </div>
        ))}
        <div className={styles.note}>{inMinNote()}</div>
      </div>
    )
  } else if (kind === 'in' && step === 1) {
    body = (
      <div>
        <div className={cx(styles.confCols, styles.thead)}>
          <span>종목</span>
          <span className={styles.right}>신청 수량</span>
          <span className={styles.right}>예상 입고 수량</span>
        </div>
        {picked.map((r) => (
          <div key={r.t} className={cx(styles.confCols, styles.confRow)}>
            <span className={styles.stockCell}>
              <StockLabel sym={r.t} size="sm" />
            </span>
            <span className={styles.right}>{r.q}주</span>
            <span className={styles.right}>
              <b className={styles.bold}>{r.got}주</b>
              <span className={styles.backTxt}>{r.back ? '반환 ' + r.back + '주' : ''}</span>
            </span>
          </div>
        ))}
        <p className={styles.submitNote}>{SUBMIT_NOTE}</p>
      </div>
    )
  } else if (kind === 'out' && step === 0) {
    body = (
      <>
        <div>
          <div className={styles.outLabel}>지금 바로 인출할 수 있는 금액</div>
          <div className={styles.outNow}>₩{o.now}</div>
          <div className={styles.outLabel2}>1년이 지난 납입금 0원 + 수익 초과분 {o.now}원</div>
        </div>
        <div>
          <div className={cx(styles.payCols, styles.payHead)}>
            <span>납입일</span>
            <span className={styles.right}>금액</span>
            <span>인출 가능일</span>
            <span className={styles.right}>남은 기간</span>
          </div>
          <div className={cx(styles.payCols, styles.payRow)}>
            <span>{o.paid}</span>
            <b className={cx(styles.right, styles.bold)}>{o.paidAmt}</b>
            <span>{o.wdDate}</span>
            <b className={cx(styles.right, styles.bold, styles.navy)}>D-{o.wdD}</b>
          </div>
          <div className={styles.fifo}>먼저 들어온 돈부터 인출돼요</div>
        </div>
        <div>
          <div className={styles.amtTitle}>인출 금액</div>
          <div className={styles.amtRow}>
            <label className={cx(styles.amtField, oTooMuch && styles.amtOver)}>
              <input
                className={styles.amtInput}
                value={oAmt ? F.won(oAmt) : ''}
                onChange={(e) => setOutAmt(e.target.value.replace(/\D/g, '').slice(0, 10))}
                inputMode="numeric"
                placeholder="0"
                aria-label="인출 금액"
              />
              <span className={styles.amtUnit}>원</span>
            </label>
            <button
              type="button"
              className={styles.fillAll}
              onClick={() => {
                setOutAmt(String(o.nowNum))
                setOutAgree(false)
              }}
            >
              인출 가능액 전부
            </button>
          </div>
          {oTooMuch && <div className={styles.tooMsg}>{o.tooMsg}</div>}
        </div>
        {oRisky && (
          <div className={styles.risk}>
            <div className={styles.riskTxt}>1년이 지나지 않은 납입금이 포함돼요. 지금 인출하면 이 계좌의 세제 혜택이 모두 취소돼요.</div>
            <div className={styles.riskCut}>
              <span>취소되는 예상 혜택</span>
              <b className={styles.riskAmt}>−{o.cut}원</b>
            </div>
            <button type="button" className={styles.agree} aria-pressed={outAgree} onClick={() => setOutAgree(!outAgree)}>
              <Box on={outAgree} />위 내용을 이해했어요
            </button>
          </div>
        )}
      </>
    )
  } else if (kind === 'out' && step === 1) {
    body = (
      <div>
        <div className={styles.sumRow}>
          <span className={styles.sub}>인출 금액</span>
          <b className={styles.sumBig}>₩{F.won(oAmt)}</b>
        </div>
        <div className={styles.sumRow}>
          <span className={styles.sub}>세제 혜택</span>
          <b className={cx(styles.bold, styles.sumEnd, oRisky ? styles.red : styles.green)}>{oRisky ? '모두 취소돼요 · 예상 혜택 −' + o.cut + '원' : '유지돼요'}</b>
        </div>
        <p className={styles.submitNote}>{SUBMIT_NOTE}</p>
      </div>
    )
  } else if (isOpen && step === 0) {
    body = (
      <div>
        <div className={styles.secTitle}>가입 조건을 자동으로 확인했어요</div>
        {ov.checks.map((c) => (
          <div key={c.label} className={styles.checkRow}>
            <span className={styles.checkLabel}>{c.label}</span>
            <b className={cx(styles.checkRes, c.ok ? styles.green : styles.red)}>{c.ok ? '확인됐어요' : '확인이 필요해요'}</b>
          </div>
        ))}
      </div>
    )
  } else if (isOpen && step === 1) {
    body = (
      <>
        <div>
          <div className={styles.limitHead}>
            <span className={styles.limitTitle}>이번 계좌 한도</span>
            <b className={styles.limitAmt}>₩{F.won(opLim)}</b>
          </div>
          <input
            className={styles.range}
            type="range"
            min={LIMIT_MIN}
            max={LIMIT_MAX}
            step={1000000}
            value={opLim}
            onChange={(e) => setOpLimit(clampLimit(e.target.value))}
            aria-label="이번 계좌 한도"
          />
          <div className={styles.rangeLabels}>
            <span>100만 원</span>
            <span className={styles.rangeMax}>5,000만 원</span>
          </div>
        </div>
        <div className={styles.otherRow}>
          <span className={styles.sub}>다른 증권사 RIA 한도 합계</span>
          <span className={styles.mydata}>마이데이터 조회</span>
          <b className={cx(styles.bold, styles.sumEnd)}>₩{F.won(ov.other)}</b>
        </div>
        <div>
          <div className={styles.totRow}>
            <span className={styles.sub}>전 증권사 합계</span>
            <b className={cx(styles.totAmt, opOver ? styles.red : styles.navy)}>₩{F.won(opTot)}</b>
            <span className={styles.sub}>/ 5,000만 원</span>
          </div>
          <div className={styles.bar}>
            <div className={styles.barNavy} style={{ width: bar.navy }} />
            <div className={styles.barRed} style={{ left: bar.navy, width: bar.red }} />
          </div>
          {opOver && <div className={styles.overWarn}>합계가 5,000만 원을 넘어요. 이번 계좌 한도를 줄여 주세요.</div>}
        </div>
        <div>
          <div className={styles.amtTitle}>연결 일반계좌</div>
          <div className={styles.radio} role="radio" aria-checked="true">
            <span className={styles.radioDot} />
            <span className={styles.radioTxt}>
              <b className={styles.radioName}>{ov.linked}</b>
              <span className={styles.radioNote}>{ov.linkedNote}</span>
            </span>
          </div>
        </div>
      </>
    )
  } else if (isOpen && step === 2) {
    body = (
      <>
        <div>
          {ov.rowsFor(opLim).map(([k, v]) => (
            <div key={k} className={styles.confirmRow}>
              <span className={cx(styles.sub, styles.noShrink)}>{k}</span>
              <b className={styles.confirmVal}>{v}</b>
            </div>
          ))}
        </div>
        <button type="button" className={cx(styles.agree, styles.agreeWrap)} aria-pressed={opAgree} onClick={() => setOpAgree(!opAgree)}>
          <Box on={opAgree} />1년 안에 원금을 인출하면 세제 혜택이 모두 취소된다는 점을 확인했어요
        </button>
      </>
    )
  } else if (isOpen && step === 3) {
    body = <DoneView title="계좌 개설 신청이 접수됐어요" sum={'한도 ₩' + F.won(opLim) + ' · ' + ov.linked} next={ov.next} />
  } else if (done) {
    body = <DoneView title="신청이 접수됐어요" sum={done.sum} next={done.next} />
  }

  return (
    <>
      <ModalFrame
        title={cfg.title}
        onClose={reqClose}
        escape={!askClose}
        steps={stepBar}
        bodyClassName={styles.body}
        footClassName={styles.foot}
        footer={
          <>
            <button type="button" className={styles.back} onClick={onBack}>
              {backLabel}
            </button>
            <button type="button" className={cx(styles.next, nextOn && styles.nextOn)} disabled={!nextOn} onClick={onNext}>
              {nextLabel}
            </button>
          </>
        }
      >
        {step < 2 && !isOpen && (
          <div className={styles.acct}>
            <span className={styles.sub}>보내는 계좌</span>
            <b className={styles.bold}>{cfg.from}</b>
            <span className={styles.arrow}>→</span>
            <span className={styles.sub}>받는 계좌</span>
            <b className={styles.bold}>{cfg.to}</b>
          </div>
        )}
        {body}
      </ModalFrame>
      {askClose && <AskClose onKeep={() => setAskClose(false)} onLeave={onClose} />}
    </>
  )
}

// 입력 중에 닫으려 할 때 뜨는 확인 창 — Esc는 '계속 작성'
export function AskClose({ onKeep, onLeave }: { onKeep: () => void; onLeave: () => void }) {
  useEscape(onKeep)
  return createPortal(
    <div className={styles.askBackdrop}>
      <div className={styles.ask} role="alertdialog" aria-modal="true" aria-label="작성 중인 내용이 사라져요">
        <h3 className={styles.askTitle}>작성 중인 내용이 사라져요</h3>
        <p className={styles.askTxt}>지금 닫으면 입력한 내용은 저장되지 않아요.</p>
        <div className={styles.askBtns}>
          <button type="button" className={styles.askLeave} onClick={onLeave}>
            닫기
          </button>
          <button type="button" className={styles.askKeep} onClick={onKeep}>
            계속 작성
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

function useEscape(fn: () => void) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') fn()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [fn])
}
