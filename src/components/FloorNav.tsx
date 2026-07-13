import { useApp } from '../state/AppContext';
import { FLOORS } from '../data/rooms';
import type { RoomId } from '../types';
import styles from './FloorNav.module.css';

interface FloorNavProps {
  variant?: 'desktop' | 'drawer';
}

/** Left floor directory: Lobby + 8 rooms grouped by floor, per README §3. */
export function FloorNav({ variant = 'desktop' }: FloorNavProps) {
  const { current, go } = useApp();
  const isLobby = current === 'lobby';

  return (
    <nav className={`${styles.nav} ${variant === 'drawer' ? styles.drawer : ''}`}>
      <div className={styles.heading}>FLOOR DIRECTORY</div>
      <button
        onClick={() => go('lobby')}
        className={styles.lobbyBtn}
        data-active={isLobby}
      >
        <span className={styles.lobbyIcon}>⌂</span>
        <span>
          ロビー <span className={styles.lobbyEn}>LOBBY</span>
        </span>
      </button>
      {FLOORS.map((floor) => (
        <div key={floor.id} className={styles.group}>
          <div className={styles.groupLabel}>{floor.label}</div>
          {floor.rooms.map((room) => {
            const active = room.id === current;
            return (
              <button
                key={room.id}
                onClick={() => go(room.id as RoomId)}
                className={styles.item}
                data-active={active}
              >
                <span className={styles.dot} data-active={active} />
                <span className={styles.label} data-active={active}>
                  {room.jp}
                </span>
                <span className={styles.arrow} data-active={active}>
                  →
                </span>
              </button>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
