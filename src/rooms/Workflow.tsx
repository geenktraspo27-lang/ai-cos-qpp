import { RoomShell } from '../components/RoomShell';
import { Face } from '../components/Face';
import { employeeById } from '../data/employees';
import { WORKFLOWS } from '../data/workflow';
import styles from './Workflow.module.css';

/** Workflow Room (オペレーション管制センター) — README §7.7. */
export function Workflow() {
  return (
    <RoomShell roomId="workflow">
      <div className={styles.list}>
        {WORKFLOWS.map((w) => {
          const owner = employeeById(w.owner);
          return (
            <div key={w.name} className={styles.card}>
              <div className={styles.head}>
                <Face emp={owner} size={40} />
                <div className={styles.headInfo}>
                  <div className={styles.name}>{w.name}</div>
                  <div className={styles.owner}>
                    実行: {owner.name}({owner.role})
                  </div>
                </div>
                <span className={styles.pct}>{w.pct}%</span>
              </div>
              <div className={styles.steps}>
                {w.stages.map((stage, i) => {
                  const done = i < w.current;
                  const isCurrent = i === w.current;
                  const notLast = i !== w.stages.length - 1;
                  return (
                    <div key={stage} className={styles.stepWrap}>
                      <div className={styles.step}>
                        <span
                          className={styles.dot}
                          style={{
                            background: done ? 'var(--aicos-holo)' : isCurrent ? owner.color : 'rgba(184,147,78,0.25)',
                            animation: isCurrent ? 'aicos-pulse 2s infinite' : 'none',
                          }}
                        />
                        <span
                          className={styles.stepLabel}
                          style={{
                            color: i <= w.current ? 'var(--aicos-brown)' : 'var(--aicos-dim)',
                            fontWeight: isCurrent ? 700 : 400,
                          }}
                        >
                          {stage}
                        </span>
                      </div>
                      {notLast && (
                        <div
                          className={styles.connector}
                          style={{ background: done ? 'var(--aicos-holo)' : 'rgba(184,147,78,0.2)' }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </RoomShell>
  );
}
