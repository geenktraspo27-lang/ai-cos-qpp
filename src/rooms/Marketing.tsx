import { RoomShell } from '../components/RoomShell';
import { campaignStatusColor } from '../data/marketing';
import { employeeById } from '../data/employees';
import { useCompanyData } from '../state/CompanyDataContext';
import styles from './Marketing.module.css';

/** Marketing Room (ブランド&マーケティング) — README §7.6. */
export function Marketing() {
  const aurora = employeeById('aurora');
  const { brandKpis, campaigns, marketInsights } = useCompanyData();
  return (
    <RoomShell roomId="marketing">
      <div className={styles.healthPanel}>
        <span className={styles.cardLabelHolo}>ブランドヘルス</span>
        <div className={styles.kpiGrid}>
          {brandKpis.map((k) => (
            <div key={k.id} className={styles.kpiCard}>
              <div className={styles.kpiLabel}>{k.label}</div>
              <div className={styles.kpiValue}>{k.value}</div>
              <div className={styles.kpiDelta}>{k.delta}</div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.grid}>
        <div className={styles.panel}>
          <span className={styles.cardLabelHolo}>キャンペーン</span>
          <div className={styles.campaignList}>
            {campaigns.map((c) => {
              const color = campaignStatusColor(c.status);
              return (
                <div key={c.id}>
                  <div className={styles.campaignHead}>
                    <span className={styles.campaignName}>{c.name}</span>
                    <span className={styles.statusPill} style={{ color, borderColor: color }}>
                      {c.status}
                    </span>
                  </div>
                  <div className={styles.barTrack}>
                    <div
                      className={styles.barFill}
                      style={{ width: `${c.pct}%`, background: `linear-gradient(90deg, ${aurora.color}, var(--aicos-gold))` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className={styles.panel}>
          <span className={styles.cardLabelHolo}>Aurora の市場インサイト</span>
          <div className={styles.insightList}>
            {marketInsights.map((m) => (
              <p key={m.id} className={styles.insight} style={{ borderLeftColor: aurora.color }}>
                {m.text}
              </p>
            ))}
          </div>
        </div>
      </div>
    </RoomShell>
  );
}
