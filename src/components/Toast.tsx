import { useApp } from '../state/AppContext';
import styles from './Toast.module.css';

export function Toast() {
  const { toast } = useApp();
  if (!toast) return null;
  return (
    <div className={styles.toast}>
      <span className={styles.check}>✓</span>
      <span className={styles.text}>{toast}</span>
    </div>
  );
}
