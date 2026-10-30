import { useState } from 'react'
import '../../styles/tokens.css'
import { RETURNS_DATA as RD, demo } from '../../data/returns'
import type { DemoSettings } from '../../data/returns'
import { cx } from '../common/cx'
import { DEV_ACCT, DEV_ASSESS, DEV_BENEFIT, DEV_TRADE } from '../home/homeDevData'
import styles from '../home/HomeDevPanel.module.css'
import { currentAdj } from './accountTaxData'

// 조정비율(다른 계좌 순매수) 선택지 — 원본 devAdj
const DEV_ADJ: [number, string][] = [[1, '1.00'], [0.9, '0.90']]

interface AccountDevPanelProps {
  onChange: (patch: Partial<DemoSettings>) => void // 시연 설정이 바뀜 → 박스들이 새로 그려짐
  onAdj: (v: number) => void // 조정비율만 바뀜(이 화면 안에서만 유지)
}

// 왼쪽 아래 "시연 설정" — 조정비율·진행 중 매도 예시·성향·계좌 상태·성향 상태·혜택 상태. 값은 홈 시연 설정과 같은 데모 상태(RD.setDemo)에 저장
export function AccountDevPanel({ onChange, onAdj }: AccountDevPanelProps) {
  const [open, setOpen] = useState(false)
  const dm = demo()
  const adj = currentAdj()

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
            <div className={styles.label}>조정비율(다른 계좌 순매수)</div>
            <div className={styles.rowNoWrap}>{DEV_ADJ.map(([v, label]) => seg(label, adj === v, () => onAdj(v)))}</div>
          </div>
          <div>
            <div className={styles.label}>진행 중 매도 예시</div>
            <div className={styles.rowNoWrap}>{DEV_TRADE.map(([v, label]) => seg(label, dm.trade === v, () => onChange({ trade: v })))}</div>
          </div>
          <div>
            <div className={styles.label}>성향</div>
            <div className={styles.row}>
              {Object.keys(RD.PROFILES).filter((k) => k !== 'private').map((k) =>
                seg(RD.PROFILES[k].label, RD.CUSTOMER.profile === k, () => onChange({ profile: k as DemoSettings['profile'] }))
              )}
            </div>
          </div>
          <div>
            <div className={styles.label}>계좌 상태</div>
            <div className={styles.row}>{DEV_ACCT.map(([v, label]) => seg(label, dm.account === v, () => onChange({ account: v })))}</div>
          </div>
          <div>
            <div className={styles.label}>성향 상태</div>
            <div className={styles.row}>{DEV_ASSESS.map(([v, label]) => seg(label, (dm.assess || 'ok') === v, () => onChange({ assess: v })))}</div>
          </div>
          <div>
            <div className={styles.label}>혜택 상태</div>
            <div className={styles.row}>{DEV_BENEFIT.map((v) => seg(v, dm.benefit === v, () => onChange({ benefit: v })))}</div>
          </div>
        </div>
      )}
      <button type="button" className={styles.toggle} onClick={() => setOpen((o) => !o)}>시연 설정</button>
    </div>
  )
}
