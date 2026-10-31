import { useState } from 'react'
import '../../styles/tokens.css'
import { RETURNS_DATA as RD, demo } from '../../data/returns'
import type { DemoSettings } from '../../data/returns'
import { cx } from '../common/cx'
import { DEV_ASSESS } from '../home/homeDevData'
import styles from '../home/HomeDevPanel.module.css'
import { CHK_DEMOS, REJECT_REASONS } from './investDevData'
import type { ChkDemo, RejectReason } from './investDevData'

const PROFILE_KEYS: DemoSettings['profile'][] = ['stable', 'stableSeek', 'neutral', 'active', 'aggressive']
const NO_CAND: [boolean, string][] = [[false, '끔'], [true, '켬']]

interface Props {
  onChange: (patch: Partial<DemoSettings>) => void // 홈·내 계좌와 같이 쓰는 시연 설정이 바뀜 → 화면이 새로 그려짐
  noCand: boolean // 이 화면 안에서만 유지
  onNoCand: (v: boolean) => void
  chk: ChkDemo | null
  onChk: (v: ChkDemo | null) => void
  rej: RejectReason | null
  onRej: (v: RejectReason | null) => void
}

// 왼쪽 아래 "시연 설정" — 성향·성향 상태(홈·내 계좌와 같은 값) + 후보 없음·검사 결과·다음 주문 거부 사유(이 화면 안에서만)
export function InvestDevPanel({ onChange, noCand, onNoCand, chk, onChk, rej, onRej }: Props) {
  const [open, setOpen] = useState(false)
  const dm = demo()

  const seg = (label: string, on: boolean, go: () => void) => (
    <button key={label} type="button" className={cx(styles.seg, on && styles.segOn)} onClick={go}>
      {label}
    </button>
  )

  return (
    <div className={styles.dev}>
      {open && (
        <div className={styles.panel}>
          <div>
            <div className={styles.label}>성향</div>
            <div className={styles.row}>{PROFILE_KEYS.map((k) => seg(RD.PROFILES[k].label, RD.CUSTOMER.profile === k, () => onChange({ profile: k })))}</div>
          </div>
          <div>
            <div className={styles.label}>성향 상태</div>
            <div className={styles.row}>{DEV_ASSESS.map(([v, label]) => seg(label, (dm.assess || 'ok') === v, () => onChange({ assess: v })))}</div>
          </div>
          <div>
            <div className={styles.label}>후보 없음</div>
            <div className={styles.row}>{NO_CAND.map(([v, label]) => seg(label, noCand === v, () => onNoCand(v)))}</div>
          </div>
          <div>
            <div className={styles.label}>검사 결과</div>
            <div className={styles.row}>{CHK_DEMOS.map(([v, label]) => seg(label, chk === v, () => onChk(v)))}</div>
          </div>
          <div>
            <div className={styles.label}>다음 주문 거부 사유</div>
            <div className={styles.row}>{REJECT_REASONS.map(([v, label]) => seg(label, rej === v, () => onRej(v)))}</div>
          </div>
        </div>
      )}
      <button type="button" className={styles.toggle} onClick={() => setOpen((o) => !o)}>시연 설정</button>
    </div>
  )
}
