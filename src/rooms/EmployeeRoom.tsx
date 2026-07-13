import { RoomShell } from '../components/RoomShell';
import { useApp } from '../state/AppContext';
import { EMPLOYEES } from '../data/employees';
import styles from './EmployeeRoom.module.css';

/** AI Employee Room (未来のHR部門) — README §7.9. */
export function EmployeeRoom() {
  const { selectEmployee } = useApp();
  return (
    <RoomShell roomId="employee">
      <div className={styles.grid}>
        {EMPLOYEES.map((e) => (
          <div key={e.id} onClick={() => selectEmployee(e.id)} className={styles.card}>
            <div className={styles.frame} style={{ borderColor: e.color }}>
              <img src={e.img} alt={e.name} className={styles.frameImg} />
            </div>
            <div className={styles.name} style={{ color: e.color }}>
              {e.name} <span className={styles.nameJp}>{e.jp}</span>
            </div>
            <div className={styles.role}>
              {e.role} <span className={styles.roleJp}>/ {e.roleJp}</span>
            </div>
            <p className={styles.persona}>{e.persona}</p>
            <div className={styles.perfRow}>
              <span className={styles.perfLabel}>パフォーマンス</span>
              <span className={styles.perfValue}>{e.perf}%</span>
            </div>
            <div className={styles.barTrack}>
              <div
                className={styles.barFill}
                style={{ width: `${e.perf}%`, background: `linear-gradient(90deg, ${e.color}, var(--aicos-gold))` }}
              />
            </div>
            <div className={styles.footRow}>
              <span className={styles.doneText}>完了タスク {e.done}件</span>
              <span className={styles.workingBadge}>
                <span className={styles.workingDot} />
                稼働中
              </span>
            </div>
          </div>
        ))}
      </div>
    </RoomShell>
  );
}
