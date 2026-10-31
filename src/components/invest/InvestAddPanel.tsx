import '../../styles/tokens.css'
import { RETURNS_DATA as RD } from '../../data/returns'
import { F } from '../../lib/calc'
import { StockIcon } from '../common/StockIcon'
import { StockLabel } from '../common/StockLabel'
import { cx } from '../common/cx'
import { addGroups, cleanPct, pctInt } from './investAddLogic'
import type { AddRow, AddState } from './investAddLogic'
import type { PkgView } from './investPkgLogic'
import { toneOf } from './investPkgLogic'
import { InvestSidePanel, PanelClose } from './InvestSidePanel'
import panel from './InvestSidePanel.module.css'
import styles from './InvestAddPanel.module.css'

interface Props {
  pkg: PkgView
  add: AddState
  onChange: (patch: Partial<AddState>) => void
  onClose: () => void
  onPick: (code: string) => void // "담기" — 성향 밖 종목이면 확인을 거쳐 비중 입력으로
  onAdd: (code: string, target: number, adj: Record<string, string> | null) => void
}

// "종목 추가" 창 — 종목을 골라 목표 비중을 정해 패키지에 담는다(사지는 않음)
export function InvestAddPanel({ pkg, add, onChange, onClose, onPick, onAdd }: Props) {
  const groups = addGroups(pkg, add.q)
  const curSum = pkg.items.reduce((a, i) => a + i.target, 0)
  const t = pctInt(add.pct)
  const addOk = !!add.pick && t > 0 && t <= 100
  const adjSum = add.adj ? Object.values(add.adj).reduce((a, v) => a + pctInt(v), 0) : 0
  const adjOk = adjSum === 100

  const submitPct = () => {
    if (!addOk || !add.pick) return
    // 합계가 100%를 넘으면 다른 종목 비중을 줄이는 단계로
    if (curSum + t > 100) onChange({ adj: Object.fromEntries(pkg.items.map((i) => [i.code, String(i.target)]).concat([[add.pick, String(t)]])) })
    else onAdd(add.pick, t, null)
  }

  const labelOf = (r: AddRow) =>
    r.blocked ? (
      <span className={styles.blkLabel}>
        <StockIcon color="#CBD3DE" initial={r.ini} size={20} />
        <b className={styles.blkName}>{r.name}</b>
        <span className={styles.blkCode}>{r.code}</span>
        <span className={styles.blkSector}>{r.sector}</span>
      </span>
    ) : (
      <StockLabel sym={r.code} size="sm" />
    )

  return (
    <InvestSidePanel label="종목 추가" onClose={onClose}>
      <div className={panel.planHead}>
        <h2 className={panel.planTitle}>종목 추가</h2>
        <span className={panel.planName}>{pkg.name}</span>
        <PanelClose onClose={onClose} />
      </div>
      <div className={styles.searchBar}>
        <label className={styles.search}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input className={styles.searchInput} value={add.q} onChange={(e) => onChange({ q: e.target.value })} placeholder="종목명 또는 코드" aria-label="종목 검색" />
        </label>
      </div>
      <div className={styles.addBody}>
        {add.adj && (
          <div className={styles.adj}>
            <div className={styles.adjTitle}>다른 종목 비중을 줄여 합계를 100%로 맞춰 주세요</div>
            {Object.keys(add.adj).map((c) => (
              <div key={c} className={styles.adjRow}>
                <span className={cx(styles.adjName, c === add.pick && styles.adjNameOn)}>{RD.SN[c] || c}</span>
                <input className={styles.pctInput} value={add.adj?.[c] ?? ''} onChange={(e) => onChange({ adj: { ...add.adj, [c]: cleanPct(e.target.value) } })} inputMode="numeric" aria-label={(RD.SN[c] || c) + ' 목표 비중'} />
                <span>%</span>
              </div>
            ))}
            <div className={styles.adjFoot}>
              <span>
                합계 <b style={{ color: adjOk ? 'var(--color-navy)' : 'var(--color-red)' }}>{adjSum}%</b>
              </span>
              <button type="button" className={cx(styles.smallBtn, adjOk ? styles.smallOn : styles.smallOff)} disabled={!adjOk} onClick={() => add.pick && onAdd(add.pick, pctInt(add.adj?.[add.pick]), add.adj)}>
                비중 맞추고 추가
              </button>
            </div>
          </div>
        )}
        {groups.map((g) => (
          <div key={g.title}>
            <div className={styles.groupTitle}>{g.title}</div>
            {!g.rows.length && <div className={styles.groupEmpty}>{g.emptyMsg}</div>}
            {g.rows.map((r) => (
              <div key={r.code} className={styles.addItem}>
                <div className={styles.addRow}>
                  <div className={styles.addMain}>
                    <div className={styles.addLabel}>{labelOf(r)}</div>
                    <div className={styles.addRisk} style={{ color: r.blocked ? 'var(--color-muted)' : r.riskWarn ? 'var(--color-orange)' : 'var(--color-sub)' }}>
                      {r.risk}
                    </div>
                    {r.why && <div className={styles.addWhy}>{r.why}</div>}
                  </div>
                  <span className={styles.addPx}>
                    <span className={styles.addPxVal} style={{ color: r.blocked ? 'var(--color-muted)' : 'var(--color-ink)' }}>
                      {F.won(r.px)}
                    </span>
                    <span className={cx(styles.addChg, !r.blocked && styles[toneOf(r.chg)])} style={r.blocked ? { color: 'var(--color-muted)' } : undefined}>
                      {F.pct(r.chg)}
                    </span>
                  </span>
                  <span className={styles.addAct}>
                    {r.blocked && (
                      <span className={styles.blkMsg}>
                        <span>RIA 계좌에서 살 수 없어요</span>
                        <span>{r.blockWhy}</span>
                      </span>
                    )}
                    {r.can && (
                      <button type="button" className={styles.pickBtn} onClick={() => onPick(r.code)}>
                        담기
                      </button>
                    )}
                    {r.has && <span className={styles.has}>담겨 있음</span>}
                  </span>
                </div>
                {add.pick === r.code && !add.adj && (
                  <div className={styles.pickRow}>
                    <span className={styles.pickLabel}>목표 비중</span>
                    <input className={cx(styles.pctInput, styles.pctInputPick)} value={add.pct} onChange={(e) => onChange({ pct: cleanPct(e.target.value) })} inputMode="numeric" aria-label="목표 비중" />
                    <span>%</span>
                    <span className={styles.curSum}>지금 합계 {curSum}%</span>
                    <button type="button" className={cx(styles.smallBtn, addOk ? styles.smallOn : styles.smallOff)} disabled={!addOk} onClick={submitPct}>
                      추가
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </InvestSidePanel>
  )
}
