import { useState } from 'react'
import { Box } from '../common/Box'
import { cx } from '../common/cx'
import { MyInfoSwitch } from './MyInfoSwitch'
import row from './MyInfoToggleRow.module.css'
import styles from './MyInfoNotifyBox.module.css'

interface Props {
  className?: string
  id?: string
  onToast: (msg: string) => void
}

type Key = 'push' | 'sms' | 'email' | 'settle' | 'band' | 'reply' | 'kiru'
type Notify = Record<Key, boolean>

const KEY = 'returns-notify'
const DEFAULTS: Notify = { push: true, sms: false, email: false, settle: true, band: true, reply: true, kiru: true }
const CHANNELS: [Key, string][] = [['push', '앱 푸시'], ['sms', '문자'], ['email', '이메일']]
const KINDS: [Key, string, string][] = [
  ['settle', '정산 완료', '매도 대금이 원화로 확정·정산되면 알려드려요'],
  ['band', '공제율 구간 마감 안내', '12/31 마감 7일 전과 1일 전에 알려드려요'],
  ['reply', '커뮤니티 답글', '내 글에 답글이 달리면 알려드려요'],
  ['kiru', '끼루 답글', '끼루가 내 글에 답하면 알려드려요(커뮤니티)']
]

// 세션 저장소에서 읽음(원본: 브라우저 탭을 닫기 전까지 유지, 없거나 깨졌으면 기본값)
// TODO: 백엔드 연결 시 서버의 알림 설정 조회로 대체
const read = (): Notify => {
  try {
    const v = JSON.parse(sessionStorage.getItem(KEY) || 'null')
    if (v && typeof v === 'object') return { ...DEFAULTS, ...v }
  } catch {
    // 저장값이 깨졌으면 기본값
  }
  return { ...DEFAULTS }
}

// 알림 설정 — 바꾸면 바로 저장(sessionStorage) + 토스트
export function MyInfoNotifyBox({ className, id, onToast }: Props) {
  const [nt, setNt] = useState(read)
  const allOff = !nt.push && !nt.sms && !nt.email

  const toggle = (k: Key) => {
    const next = { ...nt, [k]: !nt[k] }
    setNt(next)
    try {
      sessionStorage.setItem(KEY, JSON.stringify(next))
    } catch {
      // 저장 못 해도 화면은 그대로
    }
    onToast('알림 설정을 저장했어요')
  }

  return (
    <Box id={id} data-box="notify" className={className} title="알림 설정" head={<span className={styles.saveNote}>바꾸면 바로 저장돼요</span>}>
      <div className={styles.cols}>
        <div className={styles.col}>
          <div className={styles.colHead}>받는 방법</div>
          {CHANNELS.map(([k, label]) => (
            <div key={k} className={styles.channel}>
              <span id={'nt-' + k} className={styles.channelName}>{label}</span>
              <MyInfoSwitch on={nt[k]} labelId={'nt-' + k} onToggle={() => toggle(k)} />
            </div>
          ))}
          {allOff && <div className={styles.warn}>받는 방법이 모두 꺼져 있어 알림을 받을 수 없어요</div>}
        </div>
        <div className={cx(styles.col, styles.kinds)}>
          <div className={styles.colHead}>알림 종류</div>
          {KINDS.map(([k, label, desc]) => (
            <div key={k} className={styles.kind}>
              <span className={row.label}>
                <span id={'nt-' + k} className={row.name}>{label}</span>
                <span className={row.desc}>{desc}</span>
              </span>
              <MyInfoSwitch on={nt[k]} labelId={'nt-' + k} onToggle={() => toggle(k)} />
            </div>
          ))}
        </div>
      </div>
    </Box>
  )
}
