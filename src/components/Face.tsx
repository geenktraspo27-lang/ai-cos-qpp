import type { Employee } from '../types';
import styles from './Face.module.css';

interface FaceProps {
  emp: Pick<Employee, 'id' | 'name' | 'color' | 'img'>;
  size?: number;
  working?: boolean;
  dimmed?: boolean;
}

/** Circular employee portrait with key-color ring and optional "working" pulse dot. */
export function Face({ emp, size = 44, working = true, dimmed = false }: FaceProps) {
  const dotSize = Math.max(9, Math.round(size * 0.26));
  return (
    <div
      className={styles.wrap}
      style={{ width: size, height: size, opacity: dimmed ? 0.4 : 1 }}
    >
      <div
        className={styles.frame}
        style={{ borderColor: emp.color, boxShadow: `0 2px 9px ${emp.color}55` }}
      >
        <img className={styles.img} src={emp.img} alt={emp.name} />
      </div>
      {working && (
        <span
          className={styles.dot}
          style={{ width: dotSize, height: dotSize }}
        />
      )}
    </div>
  );
}
