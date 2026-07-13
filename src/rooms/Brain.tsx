import { RoomShell } from '../components/RoomShell';
import { Face } from '../components/Face';
import { employeeById } from '../data/employees';
import { IDEAS } from '../data/brain';
import styles from './Brain.module.css';

/** Brain Room (AIリサーチラボ) — README §7.5. */
export function Brain() {
  return (
    <RoomShell roomId="brain">
      <div className={styles.grid}>
        {IDEAS.map((idea) => {
          const by = employeeById(idea.by);
          return (
            <div key={idea.title} className={styles.card}>
              <div className={styles.head}>
                <span className={styles.tag}>{idea.tag}</span>
                <span className={styles.heat}>熱量 {idea.heat}</span>
              </div>
              <div className={styles.title}>{idea.title}</div>
              <div className={styles.barTrack}>
                <div
                  className={styles.barFill}
                  style={{ width: `${idea.heat}%`, background: `linear-gradient(90deg, ${by.color}, var(--aicos-gold))` }}
                />
              </div>
              <div className={styles.byRow}>
                <Face emp={by} size={26} working={false} />
                <span className={styles.byText}>{by.name} が提案</span>
              </div>
            </div>
          );
        })}
      </div>
    </RoomShell>
  );
}
