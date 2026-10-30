import { useEffect, useRef, useState, type FormEvent } from 'react'
import '../../styles/tokens.css'
import { RETURNS_DATA as RD } from '../../data/returns'
import { F } from '../../lib/calc'
import { Box } from '../common/Box'
import { StockLabel } from '../common/StockLabel'
import { Toast } from '../common/Toast'
import { assetUrl } from '../common/assetUrl'
import { cx } from '../common/cx'
import { useToast } from '../common/useToast'
import { NEWS, NEWS_GROUPS, NEWS_Q, NEWS_TAB_LABELS, type NewsArticle } from './newsData'
import styles from './HomeNewsBox.module.css'

interface KkiruMsg {
  me?: false
  text: string
  quote?: string | null
  chips?: string[]
}
interface MyMsg {
  me: true
  text: string
}
type Msg = MyMsg | KkiruMsg

const NO_ANSWER = '이 기사에는 그 내용이 없어요. 기사에 나온 숫자, 내용 설명, 관련 종목에 대해 물어봐 주세요.'

// 종목 이름 표기: 국내는 이름(코드), 해외는 티커(이름)
const lbl = (sym: string) => {
  const n = RD.SN[sym] || sym
  return /^\d{6}$/.test(sym) ? n + '(' + sym + ')' : sym + '(' + n + ')'
}

// 끼루는 선택한 기사 내용 안에서만 답한다(원본 newsAnswer 그대로)
function newsAnswer(q: string, a: NewsArticle): KkiruMsg {
  if (!a.sum || !a.num || !a.easy || !a.rel) return { text: NO_ANSWER, quote: null }
  if (/숫자|수치|얼마|몇/.test(q)) return { text: a.num[0], quote: a.num[1] }
  if (/쉽게|쉬운|설명|무슨 뜻|뜻이/.test(q)) return { text: a.easy[0], quote: a.easy[1] }
  if (/종목|회사|기업/.test(q)) return { text: '기사에 나온 종목은 ' + a.rel.map(lbl).join(', ') + '예요.', quote: a.relq, chips: a.rel }
  return { text: NO_ANSWER, quote: null }
}

// 기사를 처음 열면 이미 오가 있던 대화 2번(숫자 → 쉬운 설명)
function seedConv(a: NewsArticle): Msg[] {
  if (!a.sum) return []
  return [
    { me: true, text: NEWS_Q[1] },
    newsAnswer(NEWS_Q[1], a),
    { me: true, text: NEWS_Q[0] },
    newsAnswer(NEWS_Q[0], a)
  ]
}

function Chips({ syms }: { syms: string[] }) {
  return (
    <div className={styles.chips}>
      {syms.map((sym) => {
        const c = (RD.PX[sym] || [0, 0])[1]
        return (
          <span key={sym} className={styles.chip}>
            <StockLabel sym={sym} size="sm" />
            <span className={cx(styles.chg, c > 0 && styles.up, c < 0 && styles.down)}>{F.pct(c)}</span>
          </span>
        )
      })}
    </div>
  )
}

// AI 뉴스 박스: 탭 → 기사 목록(오른쪽) → 주요 기사·끼루 대화(왼쪽)
export function HomeNewsBox({ className }: { className?: string }) {
  const { message: toast, showToast } = useToast()
  const [tab, setTab] = useState(0)
  const [idx, setIdx] = useState(0)
  const [conv, setConv] = useState<Msg[] | null>(null) // null이면 기사별 기본 대화
  const [input, setInput] = useState('')
  const convRef = useRef<HTMLDivElement>(null)
  const seen = useRef({ key: '0-0', n: seedConv(NEWS[0][0]).length })

  const list = NEWS[tab]
  const art = list[idx]
  const msgs = conv ?? seedConv(art)

  // 기사를 바꾸면 대화 맨 위로, 질문이 붙으면 맨 아래로
  useEffect(() => {
    const el = convRef.current
    if (!el) return
    const key = tab + '-' + idx
    if (seen.current.key !== key) {
      seen.current = { key, n: msgs.length }
      el.scrollTop = 0
    } else if (seen.current.n !== msgs.length) {
      seen.current.n = msgs.length
      el.scrollTop = el.scrollHeight
    }
  })

  const pick = (t: number, i: number) => {
    setTab(t)
    setIdx(i)
    setConv(null)
    setInput('')
  }

  const ask = (q: string) => {
    if (!q.trim()) return
    setConv(msgs.concat([{ me: true, text: q }, newsAnswer(q, art)]))
    setInput('')
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    ask(input)
  }

  const soon = (text: string) => (e: { preventDefault: () => void }) => {
    e.preventDefault()
    showToast(text)
  }

  const tabs = (
    <div className={styles.tabs}>
      {NEWS_TAB_LABELS.map((label, i) => (
        <span key={label} className={styles.tabItem}>
          {i > 0 && <span className={styles.sep}>·</span>}
          <button type="button" className={cx(styles.tab, i === tab && styles.tabOn)} onClick={() => i !== tab && pick(i, 0)}>
            {label}
          </button>
        </span>
      ))}
    </div>
  )

  const info = (
    <span
      className={styles.info}
      title="보유·관심 종목 기준으로 골랐어요. 끼루 요약과 답변은 기사 내용을 바탕으로 하며 원문과 다를 수 있어요."
      aria-label="AI 뉴스 안내"
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 16v-4" />
        <path d="M12 8h.01" />
      </svg>
    </span>
  )

  return (
    <Box shadow className={cx(styles.news, className)} title="AI 뉴스" head={<>{tabs}{info}</>}>
      <div className={styles.cols}>
        <div className={styles.main}>
          <div className={styles.article}>
            <div className={styles.thumb}>썸네일</div>
            <div className={styles.articleText}>
              <h3 className={styles.articleTitle}>{art.t}</h3>
              <div className={styles.articleMeta}>
                <span>
                  {art.src} · {art.ago}
                </span>
                <a href="#" className={styles.orig} onClick={soon('원문 기사를 새 창에서 열어요')}>
                  원문 ›
                </a>
              </div>
            </div>
          </div>

          <div ref={convRef} className={styles.conv}>
            <div className={styles.kk}>
              <img className={styles.face} src={assetUrl('assets/kkiru-ai-face.png')} alt="끼루" />
              <div className={styles.bubble}>
                {art.sum && art.rel ? (
                  <>
                    <div className={styles.head}>
                      이 기사 3줄로 요약해드릴게요<span className={styles.headTag}>끼루 AI 요약 · 기사 발췌 기준</span>
                    </div>
                    <ul className={styles.sum}>
                      {art.sum.map((x) => (
                        <li key={x}>{x}</li>
                      ))}
                    </ul>
                    <Chips syms={art.rel} />
                  </>
                ) : (
                  <div>기사를 누르면 끼루가 요약해 드려요</div>
                )}
              </div>
            </div>
            {msgs.map((m, i) =>
              m.me ? (
                <div key={i} className={styles.meRow}>
                  <span className={styles.me}>{m.text}</span>
                </div>
              ) : (
                <div key={i} className={styles.kk}>
                  <img className={styles.face} src={assetUrl('assets/kkiru-ai-face.png')} alt="끼루" />
                  <div className={styles.bubble}>
                    <div>{m.text}</div>
                    {m.chips && <Chips syms={m.chips} />}
                    {m.quote && <div className={styles.quote}>기사 내용: ‘{m.quote}’</div>}
                  </div>
                </div>
              )
            )}
          </div>

          <div className={styles.qChips}>
            {NEWS_Q.map((label) => (
              <button key={label} type="button" className={styles.qChip} onClick={() => ask(label)}>
                {label}
              </button>
            ))}
          </div>
          <form className={styles.form} onSubmit={submit}>
            <input
              className={styles.input}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="이 기사에 대해 끼루에게 물어보세요"
              aria-label="이 기사에 대해 끼루에게 질문"
            />
            <button type="submit" className={styles.send}>
              전송
            </button>
          </form>
        </div>

        <div className={styles.list}>
          {NEWS_GROUPS.map((label, gi) => (
            <div key={label} className={styles.group}>
              <div className={styles.groupLabel}>{label}</div>
              {list.slice(gi * 4, gi * 4 + 4).map((n, k) => {
                const i = gi * 4 + k
                const on = i === idx
                return (
                  <button key={n.t} type="button" className={cx(styles.item, on && styles.itemOn)} onClick={() => !on && pick(tab, i)}>
                    <div className={styles.itemTitle}>{n.t}</div>
                    <div className={styles.itemMeta}>
                      {n.src} · {n.ago}
                    </div>
                  </button>
                )
              })}
            </div>
          ))}
          <button type="button" className={styles.more} onClick={soon('어제 소식을 불러와요')}>
            어제 소식 더보기 ›
          </button>
        </div>
      </div>
      <Toast message={toast} />
    </Box>
  )
}
