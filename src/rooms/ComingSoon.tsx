import { RoomShell } from '../components/RoomShell';
import type { RoomId } from '../types';
import styles from './ComingSoon.module.css';

interface ComingSoonProps {
  roomId: Exclude<RoomId, 'lobby'>;
}

/** Placeholder for rooms beyond the Lobby + Mission first phase (README §7's remaining 7 rooms). */
export function ComingSoon({ roomId }: ComingSoonProps) {
  return (
    <RoomShell roomId={roomId}>
      <div className={styles.card}>
        <span className={styles.label}>Coming soon</span>
        <p className={styles.text}>
          この部屋は Lobby / Mission Room の実装確認後に着手予定です。
        </p>
      </div>
    </RoomShell>
  );
}
