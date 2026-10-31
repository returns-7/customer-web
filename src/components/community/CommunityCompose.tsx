import '../../styles/tokens.css'
import { KkiruAvatar } from '../common/KkiruAvatar'
import { cx } from '../common/cx'
import { POST_MAX } from './communityData'
import type { useCommunityFeed } from './useCommunityFeed'
import styles from './CommunityCompose.module.css'

type Feed = ReturnType<typeof useCommunityFeed>

interface CommunityComposeProps {
  feed: Feed
  myPf: string // 내 아바타 성향
  placeholder: string
  hint: string // "끼루에게 물어보기"를 켰을 때 옆 안내
}

// 글쓰기: 한 줄로 시작해 눌러 쓰면 3줄로 커짐. "등록"은 공백이 아닌 글자가 있어야 켜짐
export function CommunityCompose({ feed, myPf, placeholder, hint }: CommunityComposeProps) {
  const keepFocus = (e: React.MouseEvent) => e.preventDefault() // 체크·등록을 눌러도 입력칸 포커스를 유지
  const { composing, canPost, kAsk } = feed
  return (
    <div className={styles.compose}>
      <span className={styles.face}><KkiruAvatar profile={myPf} size={24} /></span>
      <div className={styles.main}>
        <textarea
          className={styles.area}
          style={{ height: composing ? 76 : 36, overflow: composing ? 'auto' : 'hidden' }}
          value={feed.draft}
          onChange={(e) => feed.typeDraft(e.target.value)}
          onFocus={() => feed.setCompFocus(true)}
          onBlur={() => feed.setCompFocus(false)}
          maxLength={POST_MAX}
          placeholder={placeholder}
          aria-label={placeholder}
        />
        <div className={styles.opts}>
          <button type="button" role="checkbox" aria-checked={kAsk} className={styles.ask} onMouseDown={keepFocus} onClick={feed.toggleKAsk}>
            <span className={cx(styles.box, kAsk && styles.boxOn)}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
            </span>
            끼루에게 물어보기
          </button>
          {kAsk && <span className={styles.hint}>{hint}</span>}
          {composing && <span className={styles.count}>{feed.draft.length}/{POST_MAX}</span>}
        </div>
      </div>
      <button type="button" className={styles.post} disabled={!canPost} onMouseDown={keepFocus} onClick={feed.submitPost}>등록</button>
    </div>
  )
}
