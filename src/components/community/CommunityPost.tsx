import '../../styles/tokens.css'
import { KkiruAvatar } from '../common/KkiruAvatar'
import { StockLabel } from '../common/StockLabel'
import { assetUrl } from '../common/assetUrl'
import { cx } from '../common/cx'
import { GEN, GEN_NAME, KIRU_LONG_CHARS, LONG_CHARS, LONG_LINES } from './communityData'
import { kiruAnswers, plOf, repCount, type KiruAnswer, type KiruStatus, type Post } from './communityPosts'
import styles from './CommunityPost.module.css'

// 끼루 답변이 없을 때 글 아래에 한 줄로 보이는 안내: [문구, 링크 글자]
// TODO: PENDING·NO_SOURCE·FAILED는 글쓰기(C-5)에서 '끼루에게 물어보기'를 켰을 때만 생김. 링크 동작은 그때 연결
const KIRU_LINES: Record<Exclude<KiruStatus, 'ANSWERED'>, [string, string]> = {
  PENDING: ['끼루가 근거를 찾고 있어요...', ''],
  NO_SOURCE: ['확인된 자료가 없어 끼루가 답하지 않았어요 ·', '끼루 챗봇에서 물어보기 ›'],
  OUT_OF_SCOPE: ['끼루는 RIA 제도와 종목 정보만 안내해요', ''],
  FAILED: ['끼루 답변을 불러오지 못했어요 ·', '다시 요청']
}

const Segs = ({ text, q }: { text: string; q: string }) => {
  if (!q) return <span>{text}</span>
  const lo = text.toLowerCase()
  const ql = q.toLowerCase()
  const out: { t: string; hl: boolean }[] = []
  let i = 0
  let j: number
  while ((j = lo.indexOf(ql, i)) >= 0) {
    if (j > i) out.push({ t: text.slice(i, j), hl: false })
    out.push({ t: text.slice(j, j + q.length), hl: true })
    i = j + q.length
  }
  if (i < text.length) out.push({ t: text.slice(i), hl: false })
  return <>{out.map((g, n) => <span key={n} className={g.hl ? styles.hl : undefined}>{g.t}</span>)}</>
}

interface CommunityPostProps {
  p: Post
  nick: string // 내 닉네임(내 글 표시용)
  pf: string // 작성자 성향(아바타)
  q: string // 검색어(일치 글자 강조). 검색 중이 아니면 빈 문자열
  multi: boolean // 여러 종목 글이 섞인 목록(내가 쓴 댓글·인기글 전체 종목)이면 종목 표시
  liked: boolean
  expanded: boolean
  kLiked: boolean
  kExpanded: boolean
  menuOpen: boolean
  fresh: boolean
  flash: 'on' | 'fade' | null
  onLike: (id: string) => void
  onMore: (id: string) => void
  onKiruMore: (id: string) => void
  onMenu: (id: string) => void
  onShare: (p: Post) => void
  onNoop: () => void // 신고·수정·삭제: C-5에서 연결
}

// 글 한 개: 아바타·닉네임·성향·시간 + "…" 메뉴 + 본문 + 좋아요/답글/공유 줄 + 끼루 답변
export function CommunityPost({ p, nick, pf, q, multi, liked, expanded, kLiked, kExpanded, menuOpen, fresh, flash, onLike, onMore, onKiruMore, onMenu, onShare, onNoop }: CommunityPostProps) {
  const lines = p.text.split('\n').length
  const long = p.text.length > LONG_CHARS || lines > LONG_LINES
  const exp = expanded || !!q
  const clamped = long && !exp

  const ka = p.kiru ? kiruAnswers()[p.kiru] : null
  const kAns = ka && ka.status === 'ANSWERED' ? (ka as KiruAnswer) : null
  const kLine = ka && !kAns ? KIRU_LINES[ka.status as Exclude<KiruStatus, 'ANSWERED'>] : null
  const kLong = !!kAns && kAns.text.length > KIRU_LONG_CHARS
  const kClamped = kLong && !kExpanded

  return (
    <article
      data-post={p.id}
      className={cx(styles.post, fresh && styles.fresh, flash === 'on' && styles.flash, flash && styles.flashFade)}
    >
      {multi && p.code !== GEN && <div className={styles.stockLine}><StockLabel sym={p.code} size="sm" sector={false} /></div>}
      {multi && p.code === GEN && <div className={styles.genLine}>{GEN_NAME}</div>}
      <div className={styles.grid}>
        <KkiruAvatar profile={pf} size={28} />
        <div className={styles.body}>
          <div className={styles.head}>
            <span className={styles.nick}>{p.mine ? nick + ' (나)' : p.nick}</span>
            <span className={styles.meta}>{plOf(pf)}</span>
            <span className={styles.meta}>{p.time}</span>
            <span data-menu="1" className={styles.menuWrap}>
              <button type="button" className={styles.menuBtn} aria-label="더 보기 메뉴" aria-expanded={menuOpen} onClick={() => onMenu(p.id)}>…</button>
              {menuOpen && (
                <div role="menu" className={styles.menu}>
                  {!p.mine && <button type="button" role="menuitem" className={styles.menuItem} onClick={onNoop}>신고하기</button>}
                  {p.mine && (
                    <>
                      <button type="button" role="menuitem" className={styles.menuItem} onClick={onNoop}>수정</button>
                      <button type="button" role="menuitem" className={styles.menuItem} onClick={onNoop}>삭제</button>
                    </>
                  )}
                </div>
              )}
            </span>
          </div>
          <div className={cx(styles.text, clamped && styles.clamp)} style={clamped ? { WebkitLineClamp: LONG_LINES } : undefined}>
            <Segs text={p.text} q={q} />
          </div>
          {long && !q && <button type="button" className={styles.link} onClick={() => onMore(p.id)}>{expanded ? '접기' : '더보기'}</button>}
          {kAns && <div className={styles.kDone}>끼루가 답했어요</div>}
          <div className={styles.actions}>
            <button type="button" className={cx(styles.act, liked && styles.actOn)} aria-pressed={liked} onClick={() => onLike(p.id)}>좋아요 {p.likes + (liked ? 1 : 0)}</button>
            {/* TODO: C-4에서 눌러 펼치기. 지금은 숫자만 */}
            <button type="button" className={styles.act} aria-expanded={false}>답글 {repCount(p)} ∨</button>
            <button type="button" className={styles.act} onClick={() => onShare(p)}>공유</button>
          </div>
          {ka && (
            <div className={styles.kiru}>
              {kAns && (
                <div className={styles.kAns}>
                  <img className={styles.kFace} src={assetUrl('assets/kkiru/kkiru-ai-face.png')} alt="" />
                  <div style={{ minWidth: 0 }}>
                    <div className={styles.kHead}><b className={styles.kName}>끼루 AI</b><span className={styles.meta}>{kAns.time}</span></div>
                    <div className={styles.kText} style={kClamped ? { display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 5 } : undefined}>{kAns.text}</div>
                    {kLong && <button type="button" className={styles.link} onClick={() => onKiruMore(p.id)}>{kExpanded ? '접기' : '더보기'}</button>}
                    <div className={styles.kSrc}>
                      근거
                      {kAns.src.map(([label, url]) => (
                        <span key={label} style={{ display: 'contents' }}>
                          <span className={styles.dot}>·</span>
                          <a href={url} target="_blank" rel="noopener noreferrer">{label}</a>
                        </span>
                      ))}
                    </div>
                    <div className={styles.kNote}>끼루는 정보를 안내해요 · 교육용 프로젝트의 자체 분석 결과이며 수익을 보장하지 않아요</div>
                    <div className={styles.kActions}>
                      <button type="button" className={cx(styles.act, kLiked && styles.actOn)} aria-pressed={kLiked} onClick={() => onLike('k-' + p.id)}>좋아요 {kAns.likes + (kLiked ? 1 : 0)}</button>
                      <button type="button" className={styles.act} onClick={onNoop}>신고</button>
                    </div>
                  </div>
                </div>
              )}
              {kLine && (
                <div className={styles.kLine}>
                  {kLine[0]}
                  {kLine[1] && <button type="button" className={styles.kLink} onClick={onNoop}>{kLine[1]}</button>}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  )
}
