import styles from './Ring.module.css';

interface RingProps {
  pct: number;
  size?: number;
  color?: string;
  label?: string;
  sub?: string;
}

/** Circular progress ring with a centered label/sub-label, per README §6/§9. */
export function Ring({ pct, size = 110, color = '#2E7CD6', label, sub = '' }: RingProps) {
  const sw = Math.max(6, Math.round(size * 0.075));
  const r = (size - sw * 2) / 2;
  const mid = size / 2;
  const circ = 2 * Math.PI * r;
  const clamped = Math.min(100, Math.max(0, pct));
  const dash = circ * (1 - clamped / 100);

  return (
    <div className={styles.box} style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className={styles.svg}
      >
        <circle cx={mid} cy={mid} r={r} fill="none" stroke="rgba(184,147,78,0.18)" strokeWidth={sw} />
        <circle
          cx={mid}
          cy={mid}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={sw}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={dash}
          className={styles.progress}
        />
      </svg>
      <div className={styles.center}>
        <div className={styles.label} style={{ fontSize: Math.round(size * 0.24) }}>
          {label ?? `${clamped}%`}
        </div>
        <div
          className={styles.sub}
          style={{ fontSize: Math.max(7, Math.round(size * 0.075)), maxWidth: size * 0.94 }}
        >
          {sub}
        </div>
      </div>
    </div>
  );
}
