import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import '../../styles/tokens.css'
import { RETURNS_DATA as RD, demo } from '../../data/returns'
import { F } from '../../lib/calc'
import { Box } from '../common/Box'
import { KkiruAvatar } from '../common/KkiruAvatar'
import { StockLabel } from '../common/StockLabel'
import { Toast } from '../common/Toast'
import { assetUrl } from '../common/assetUrl'
import { cx } from '../common/cx'
import { useToast } from '../common/useToast'
import { ASK_CHIPS, ASK_CHIPS_EMPTY, ASK_SEED_QUESTIONS, ETF_TOP, NO_REC_TEXT } from './homeRecData'
import { josa, recAnswer, spark } from './homeRecLogic'
import styles from './HomeRecBox.module.css'

type AskMsg = { me: true; text: string; seed?: boolean } | { me?: false; q: string; focus: string | null; seed?: boolean }

const tone = (n: number) => (n > 0 ? styles.up : n < 0 ? styles.down : styles.flat)

const INITIAL_ASK: AskMsg[] = ASK_SEED_QUESTIONS.flatMap((q): AskMsg[] => [
  { me: true, text: q, seed: true },
  { q, focus: null, seed: true }
])

interface HomeRecBoxProps {
  className?: string
  onOpenFullAsk?: () => void // "전체 대화 보기 ›" — 홈 챗봇 창을 옮길 때 연결
  onAskDeposit?: () => void // "예탁금으로 두면 어떻게 되나요? ›" — 홈 챗봇 창을 옮길 때 연결
}

// 오늘의 추천 박스: 성향별 추천 3종목 + 상세 카드 + 끼루에게 물어보기
export function HomeRecBox({ className, onOpenFullAsk, onAskDeposit }: HomeRecBoxProps) {
  const { message: toast, showToast } = useToast()
  const [open, setOpen] = useState<number | null>(null)
  const [ask, setAsk] = useState<AskMsg[]>(INITIAL_ASK)
  const [askFocus, setAskFocus] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const askRef = useRef<HTMLDivElement>(null)
  const askCount = useRef<number | null>(null)

  const profileKey = RD.CUSTOMER.profile
  const prof = RD.PROFILES[profileKey]
  const opened = RD.ACCOUNT_STATE === 'opened'
  const assess = demo().assess || 'ok'
  const off = assess === 'expired' || assess === 'none'
  const recs = RD.recsFor(profileKey)
  const recEmpty = recs.length === 0
  const recEmptyT1 = prof.label + '은 ' + F.allowedLabel(profileKey) + ' 상품을 추천받을 수 있어요.'

  // 상세 카드: 바깥 클릭·Esc·스크롤하면 닫힘
  useEffect(() => {
    if (open === null) return
    const onDown = (e: MouseEvent) => {
      const t = e.target as Element | null
      if (!(t && t.closest && t.closest('[data-rec-pop],[data-rec-row]'))) setOpen(null)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(null)
    }
    const onScroll = () => setOpen(null)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('scroll', onScroll)
    }
  }, [open])

  // 대화는 처음에도, 질문이 붙을 때도 맨 아래로
  useEffect(() => {
    const el = askRef.current
    if (!el) return
    if (askCount.current !== ask.length) {
      askCount.current = ask.length
      el.scrollTop = el.scrollHeight
    }
  })

  const addPkgToast = (code: string) => showToast(RD.SN[code] + josa(RD.SN[code], '을', '를') + ' 패키지에 담았어요')

  const doAsk = (q: string) => {
    if (!q.trim()) return
    setAsk(ask.concat([{ me: true, text: q }, { q, focus: askFocus }]))
    setInput('')
  }
  const submit = (e: FormEvent) => {
    e.preventDefault()
    doAsk(input)
  }

  const visible = ask.filter((m) => !(recEmpty && m.seed))
  const msgs: ({ me: true; text: string } | { me: false; text: string; pkg?: string })[] = visible.map((m) => {
    if (m.me) return { me: true, text: m.text }
    const r = recAnswer(m.q, m.focus)
    return { me: false, text: r.text, pkg: r.pkg }
  })
  if (recEmpty && !ask.some((m) => !m.seed)) msgs.push({ me: false, text: recEmptyT1 + ' 궁금한 걸 물어보세요.' })

  const chips = recEmpty ? ASK_CHIPS_EMPTY : ASK_CHIPS

  const headRight = (
    <span className={styles.headRight}>
      {prof.label + ' · ' + F.allowedLabel(profileKey) + ' 안에서 · '}<Link to="/invest#recommend">더보기 ›</Link>
    </span>
  )

  return (
    <Box shadow className={className} title="오늘의 추천" actions={headRight} style={{ zIndex: open !== null ? 20 : undefined }}>
      <div className={styles.gradeLine}>
        위험등급: 리턴증권 자체 산정 · {F.short(F.ago(1))} 기준 · 1 매우 높은 위험 ~ 6 매우 낮은 위험
      </div>

      {!off && (
        <>
          <div className={styles.cols}>
            {recs.map((r, i) => {
              const isOpen = open === i
              const [price, chg] = RD.PX[r.code]
              const etf = RD.ETF[r.code]
              const info: [string, string][] = etf
                ? [
                    ['국내주식 비중', etf.mix.replace('국내주식 ', '')],
                    ['설정일', etf.since],
                    ['3년 VaR', r.gradeBasis.replace('3년 VaR ', '')],
                    ['구성 상위(예시)', (ETF_TOP[r.code] || []).map((c) => RD.SN[c]).join(' · ')]
                  ]
                : [
                    ['시가총액', r.cap],
                    ['PER', r.per],
                    ['배당수익률', r.div],
                    ['52주', r.lo + '~' + r.hi]
                  ]
              const reasons = [
                prof.label + ' 허용 범위(' + F.allowedLabel(profileKey) + ') 안의 ' + r.grade + '등급 상품이에요.',
                'RIA 자금으로 투자할 수 있는 국내 상장 상품이에요.',
                r.extra
              ]
              return (
                <div key={r.code} className={cx(styles.cell, i === 2 && styles.cellLast)}>
                  <button
                    type="button"
                    data-rec-row="1"
                    aria-expanded={isOpen}
                    className={cx(styles.row, isOpen && styles.rowOpen)}
                    onClick={() => {
                      setOpen(isOpen ? null : i)
                      setAskFocus(r.code)
                    }}
                  >
                    <span className={styles.rowTop}>
                      <span className={styles.label}>
                        <StockLabel sym={r.code} stack />
                      </span>
                      <svg className={cx(styles.chevron, isOpen && styles.chevronOpen)} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </span>
                    <span className={styles.priceRow}>
                      <b className={styles.price}>{price.toLocaleString('ko-KR')}</b>
                      <span className={cx(styles.chg, tone(chg))}>{F.pct(chg)}</span>
                    </span>
                    <span className={styles.gradeText}>{'위험 ' + r.grade + '등급 · ' + F.gradeName(r.grade ?? 0)}</span>
                  </button>

                  {isOpen && (
                    <div role="dialog" aria-label={RD.SN[r.code] + ' 추천 상세'} data-rec-pop="1" className={styles.pop}>
                      <div className={styles.popTop}>
                        <img className={styles.face} src={assetUrl('assets/kkiru-ai-face.png')} alt="끼루" />
                        <div className={styles.minw}>
                          <div className={styles.popHead}>추천 이유</div>
                          <ul className={styles.reasons}>
                            {reasons.map((x) => (
                              <li key={x}>{x}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      <div>
                        <div className={styles.popHead}>AI 종목 정보</div>
                        <div className={styles.info}>
                          {info.map(([k, v]) => (
                            <div key={k} className={styles.infoRow}>
                              <span className={styles.infoKey}>{k}</span>
                              <b className={styles.infoVal}>{v}</b>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className={styles.risk}>
                        <div className={styles.riskRow}>
                          <span className={styles.infoKey}>위험등급</span>
                          <b className={styles.riskVal}>{r.grade + '등급 ' + F.gradeName(r.grade ?? 0) + ' · 근거 ' + r.gradeBasis}</b>
                        </div>
                        <div className={styles.riaOk}>RIA 계좌에서 살 수 있어요</div>
                      </div>
                      <div>
                        <div className={styles.thirty}>최근 30일</div>
                        <svg viewBox="0 0 200 48" preserveAspectRatio="none" className={styles.popSpark}>
                          <path d={spark(r.seed, chg > 0)} fill="none" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
                        </svg>
                      </div>
                      <div className={styles.popBtns}>
                        {opened && (
                          <button type="button" className={styles.addPkg} onClick={() => addPkgToast(r.code)}>
                            패키지에 담기
                          </button>
                        )}
                        <Link to={'/community?stock=' + r.code} className={styles.chat}>종목 채팅방</Link>
                      </div>
                      <div className={styles.popNote}>{'교육용 프로젝트의 자체 분석 결과예요 · 진단일 ' + F.dot(RD.ASSESSMENT.date) + ' 성향 기준'}</div>
                    </div>
                  )}
                </div>
              )
            })}

            {recEmpty && (
              <div className={styles.empty}>
                <KkiruAvatar profile={profileKey} size={48} />
                <div className={styles.emptyBody}>
                  <div className={styles.emptyT1}>{recEmptyT1}</div>
                  <div className={styles.emptyT2}>{NO_REC_TEXT}</div>
                  <div className={styles.emptyLinks}>
                    <Link to="/myinfo#assess">투자성향 다시 확인하기 ›</Link>
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault()
                        onAskDeposit?.()
                      }}
                    >
                      예탁금으로 두면 어떻게 되나요? ›
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className={styles.askHead}>
            <img className={styles.askFace} src={assetUrl('assets/kkiru-ai-face.png')} alt="" />
            <h3 className={styles.askTitle}>끼루에게 물어보기</h3>
            <div className={styles.askChips}>
              {chips.map((label) => (
                <button key={label} type="button" className={styles.askChip} onClick={() => doAsk(label)}>
                  {label}
                </button>
              ))}
            </div>
            <button type="button" className={styles.full} onClick={() => onOpenFullAsk?.()}>
              전체 대화 보기 ›
            </button>
          </div>

          <div ref={askRef} className={styles.conv}>
            {msgs.map((m, i) =>
              m.me ? (
                <div key={i} className={styles.meRow}>
                  <span className={styles.me}>{m.text}</span>
                </div>
              ) : (
                <div key={i} className={styles.kk}>
                  <img className={styles.face} src={assetUrl('assets/kkiru-ai-face.png')} alt="끼루" />
                  <div className={styles.bubble}>
                    {m.text}
                    {m.pkg && opened && (
                      <div className={styles.bubbleBtn}>
                        <button type="button" className={styles.bubbleAdd} onClick={() => addPkgToast(m.pkg as string)}>
                          패키지에 담기
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            )}
          </div>

          <form className={styles.form} onSubmit={submit}>
            <input
              className={styles.input}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="오늘의 추천 종목에 대해 끼루에게 물어보세요"
              aria-label="추천 종목에 대해 끼루에게 질문"
            />
            <button type="submit" className={styles.send}>
              전송
            </button>
          </form>
          <div className={styles.foot}>교육용 프로젝트의 자체 분석 결과예요. 수익을 보장하지 않으며, 실제 금융상품 판매·권유 절차를 대체하지 않아요.</div>
        </>
      )}

      {off && (
        <div className={styles.off}>
          <p className={styles.offMsg}>
            {assess === 'none' ? '투자성향을 진단하면 성향에 맞는 범위 안에서 추천을 받을 수 있어요.' : '진단 유효기간이 지나 추천을 보여드릴 수 없어요.'}
          </p>
          <Link to="/myinfo#assess" className={styles.offBtn}>{assess === 'none' ? '진단하기' : '다시 진단하기'}</Link>
        </div>
      )}
      <Toast message={toast} />
    </Box>
  )
}
