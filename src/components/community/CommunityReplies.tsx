import '../../styles/tokens.css'
import { KkiruAvatar } from '../common/KkiruAvatar'
import { cx } from '../common/cx'
import { REP_FIRST } from './communityData'
import { pfOf, plOf, repliesOf, type Post } from './communityPosts'
import { Segs } from './CommunityPost'
import type { useCommunityFeed } from './useCommunityFeed'
import styles from './CommunityReplies.module.css'

type Feed = ReturnType<typeof useCommunityFeed>

interface CommunityRepliesProps {
  p: Post
  feed: Feed
  nick: string // 내 닉네임
  myPf: string // 내 성향(아바타)
  q: string // 검색어(일치 글자 강조). 검색 중이 아니면 빈 문자열
}

// 펼친 글의 답글: 이전 답글 더 보기 + 답글 목록(최근 것부터 REP_FIRST개) + 글 아래 답글 입력칸
export function CommunityReplies({ p, feed, nick, myPf, q }: CommunityRepliesProps) {
  const all = repliesOf(p.id, feed.addRep)
  const showN = feed.repShow[p.id] || REP_FIRST
  const olderN = Math.max(0, all.length - showN)
  const at = feed.replyAt
  const atPost = !!at && at.post === p.id
  const atRep = atPost && !!at.rep
  const boxOk = atPost && !atRep && feed.replyOk
  const submitOn = (ok: boolean) => cx(styles.submit, ok && styles.submitOn)

  return (
    <div className={styles.wrap}>
      {olderN > 0 && <button type="button" className={styles.older} onClick={() => feed.olderReps(p.id)}>이전 답글 {olderN}개 더 보기</button>}
      {all.slice(-showN).map((r) => {
        const pf = pfOf(r.pfRaw, r.nick, myPf)
        const liked = !!feed.liked[r.id]
        const shownNick = r.pfRaw === 'me' ? nick + ' (나)' : r.nick
        return (
          <div key={r.id} className={styles.rep}>
            <KkiruAvatar profile={pf} size={24} />
            <div className={styles.body}>
              <div className={styles.head}>
                <span className={styles.nick}>{shownNick}</span>
                <span className={styles.meta}>{plOf(pf)}</span>
                <span className={styles.meta}>{r.time}</span>
              </div>
              <div className={styles.text}>
                {r.target && <span className={styles.at}>@{r.target} </span>}
                <Segs text={r.text} q={q} />
              </div>
              <div className={styles.actions}>
                <button type="button" className={cx(styles.act, liked && styles.actOn)} aria-pressed={liked} onClick={() => feed.like(r.id)}>좋아요 {r.likes + (liked ? 1 : 0)}</button>
                <button type="button" className={styles.act} onClick={() => feed.openBox(p.id, r.id, shownNick.replace(' (나)', ''))}>답글</button>
              </div>
              {atRep && at.rep === r.id && (
                <div data-rbox={r.id} className={cx(styles.box, styles.boxRep)}>
                  <input
                    className={styles.input}
                    value={feed.replyText}
                    onChange={(e) => feed.typeReply(e.target.value)}
                    onKeyDown={feed.replyKey}
                    maxLength={300}
                    aria-label="답글 입력"
                    placeholder="답글을 남겨주세요"
                  />
                  <button type="button" className={submitOn(feed.replyOk)} disabled={!feed.replyOk} onClick={feed.submitReply}>등록</button>
                </div>
              )}
            </div>
          </div>
        )
      })}
      {!atRep && (
        <div data-rbox="post" className={cx(styles.box, styles.boxPost)}>
          <input
            className={styles.input}
            value={atPost ? feed.replyText : ''}
            onChange={(e) => feed.typeReply(e.target.value)}
            onFocus={() => feed.focusBox(p.id)}
            onKeyDown={feed.replyKey}
            maxLength={300}
            aria-label="답글 입력"
            placeholder="답글을 남겨주세요"
          />
          <button type="button" className={submitOn(boxOk)} disabled={!boxOk} onClick={() => { if (boxOk) feed.submitReply() }}>등록</button>
        </div>
      )}
    </div>
  )
}
