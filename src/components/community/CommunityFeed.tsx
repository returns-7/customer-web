import type { RefObject } from 'react'
import '../../styles/tokens.css'
import { StockLabel } from '../common/StockLabel'
import { cx } from '../common/cx'
import { FEED_EMPTY } from './communityData'
import { kiruOf, myProfile, pfOf, repCount, type Post } from './communityPosts'
import { CommunityPost } from './CommunityPost'
import { CommunityReplies } from './CommunityReplies'
import type { useCommunityFeed } from './useCommunityFeed'
import styles from './CommunityFeed.module.css'

type Feed = ReturnType<typeof useCommunityFeed>

interface CommunityFeedProps {
  feed: Feed
  q: string // 글 검색어(검색 중일 때만 값이 있음)
  scope: 'stock' | 'all'
  fixed: boolean
  nick: string
  pubOn: boolean
  listRef: RefObject<HTMLDivElement | null>
  onShare: (p: Post) => void
  onGoThread: (code: string, id: string) => void
  onBot: () => void // 끼루 답변 줄의 "끼루 챗봇에서 물어보기 ›"
}

// 새 글 바 + 글 목록(고정 상태에서는 이 영역만 스크롤) + 이전 글 더 보기
export function CommunityFeed({ feed, q, scope, fixed, nick, pubOn, listRef, onShare, onGoThread, onBot }: CommunityFeedProps) {
  const myPf = myProfile(pubOn)
  const multi = feed.view === 'mine' || (feed.view === 'hot' && scope === 'all')
  const empty = !feed.shown.length
  const emptyText = feed.qOn ? FEED_EMPTY.search(q) : feed.view === 'mine' ? FEED_EMPTY.mine : FEED_EMPTY.other

  return (
    <>
      {feed.newBar.show && (
        <button
          type="button"
          data-newbar="1"
          className={cx(styles.newBar, !fixed && styles.newBarPage, feed.newBar.fading && styles.newBarFading)}
          onClick={feed.showNew}
        >
          새 글 {feed.newBar.n}개 · 보기
        </button>
      )}
      <div ref={listRef} data-scroll="1" className={cx(styles.list, fixed && styles.listFixed)}>
        {empty && <div className={styles.empty}>{emptyText}</div>}
        {feed.shown.map((p) => (
          <CommunityPost
            key={p.id}
            p={p}
            nick={nick}
            pf={pfOf(p.pfRaw, p.nick, myPf)}
            q={feed.qOn ? q.trim() : ''}
            multi={multi}
            liked={!!feed.liked[p.id]}
            expanded={!!feed.expanded[p.id]}
            kLiked={!!feed.liked['k-' + p.id]}
            kExpanded={!!feed.kMore[p.id]}
            menuOpen={feed.menu === p.id}
            rn={repCount(p, feed.addRep)}
            repOpen={!!feed.repOpen[p.id]}
            fresh={feed.fresh === p.id}
            flash={feed.flash && feed.flash.id === p.id ? (feed.flash.on ? 'on' : 'fade') : null}
            onLike={feed.like}
            onMore={feed.toggleMore}
            onKiruMore={feed.toggleKMore}
            onMenu={feed.toggleMenu}
            onToggleRep={feed.toggleRep}
            onShare={onShare}
            kiru={kiruOf(p, feed.kSt)}
            editing={feed.editing === p.id}
            editText={feed.editText}
            onRetry={(post) => feed.askKiru(post, true)}
            onBot={onBot}
            onEdit={feed.startEdit}
            onEditType={feed.typeEdit}
            onEditCancel={feed.cancelEdit}
            onEditSave={feed.saveEdit}
            onDelete={feed.askDelete}
            onReport={feed.openReport}
          >
            {feed.repOpen[p.id] && <CommunityReplies p={p} feed={feed} nick={nick} myPf={myPf} q={feed.qOn ? q.trim() : ''} />}
          </CommunityPost>
        ))}
        {feed.view === 'mine' && (
          <>
            <div className={styles.myRepHead}>내가 쓴 답글 <span className={styles.myRepCount}>{feed.myReps.length}개</span></div>
            {feed.myReps.map((r, i) => (
              <a
                key={r.postId + i}
                className={styles.myRep}
                href={'?stock=' + r.code + '&thread=' + r.postId}
                onClick={(e) => { e.preventDefault(); onGoThread(r.code, r.postId) }}
              >
                <div className={styles.myRepTop}>
                  <StockLabel sym={r.code} size="sm" sector={false} />
                  <span className={styles.myRepMeta}>{r.parent} 님 글에 남긴 답글 · {r.time}</span>
                </div>
                <div className={styles.myRepText}>{r.target && <span className={styles.at}>@{r.target} </span>}{r.text}</div>
              </a>
            ))}
          </>
        )}
        {feed.moreOn && <button type="button" className={styles.more} onClick={feed.loadMore}>이전 글 더 보기</button>}
      </div>
    </>
  )
}

