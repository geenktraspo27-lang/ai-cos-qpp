import { RoomShell } from '../components/RoomShell';
import { Ring } from '../components/Ring';
import { Face } from '../components/Face';
import { useCompanyData } from '../state/CompanyDataContext';
import { employeeById } from '../data/employees';
import styles from './Finance.module.css';

/** Finance Room (財務戦略室) — README §7.4. */
export function Finance() {
  const sage = employeeById('sage');
  const { financeBudgetExecPct, financeKpis, financeCosts, contracts, financeSuggestion } = useCompanyData();
  return (
    <RoomShell roomId="finance">
      <div className={styles.topGrid}>
        <div className={styles.panel} style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
          <Ring pct={financeBudgetExecPct} size={106} color="#3FA45B" label={`${financeBudgetExecPct}%`} sub="予算執行率" />
          <div className={styles.kpiGrid}>
            {financeKpis.map((k) => (
              <div key={k.id} className={styles.kpiCard}>
                <div className={styles.kpiLabel}>{k.label}</div>
                <div className={styles.kpiValue}>{k.value}</div>
              </div>
            ))}
          </div>
        </div>
        <div className={styles.panel}>
          <span className={styles.cardLabelHolo}>部門別コスト構成</span>
          <div className={styles.costList}>
            {financeCosts.map((c) => (
              <div key={c.id}>
                <div className={styles.costRow}>
                  <span className={styles.costName}>{c.dept}</span>
                  <span className={styles.costPct}>{c.pct}%</span>
                </div>
                <div className={styles.barTrack}>
                  <div
                    className={styles.barFill}
                    style={{ width: `${c.pct}%`, background: `linear-gradient(90deg, ${c.color}, var(--aicos-gold))` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.bottomGrid}>
        <div className={styles.panel}>
          <span className={styles.cardLabelHolo}>契約更新アラート</span>
          <div className={styles.contractList}>
            {contracts.map((c) => (
              <div key={c.id} className={styles.contractCard}>
                <div className={styles.contractHead}>
                  <span className={styles.contractName}>{c.name}</span>
                  <span className={styles.contractDue}>期限 {c.due}</span>
                </div>
                <div className={styles.contractNote}>{c.note}</div>
              </div>
            ))}
          </div>
        </div>
        <div className={styles.panel}>
          <span className={styles.cardLabelHolo}>Sage からの提案</span>
          <div className={styles.suggestionRow}>
            <Face emp={sage} size={40} />
            <p className={styles.suggestionText}>{financeSuggestion}</p>
          </div>
        </div>
      </div>
    </RoomShell>
  );
}
