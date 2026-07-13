import type { ReactNode } from 'react';
import { employeeById } from '../data/employees';
import { ALL_ROOMS, ROOM_DESC, ROOM_HOSTS, roomFloorLabel } from '../data/rooms';
import type { RoomId } from '../types';
import { Face } from './Face';
import styles from './RoomShell.module.css';

interface RoomShellProps {
  roomId: Exclude<RoomId, 'lobby'>;
  children: ReactNode;
}

/** Common room header (floor/room label, title, description, host badge) per README §7. */
export function RoomShell({ roomId, children }: RoomShellProps) {
  const host = employeeById(ROOM_HOSTS[roomId]);
  const room = ALL_ROOMS.find((r) => r.id === roomId);
  return (
    <div className={styles.room}>
      <div className={styles.header}>
        <div>
          <span className={styles.eyebrow}>
            {roomFloorLabel(roomId)} — {room?.name}
          </span>
          <h2 className={styles.title}>{room?.jp}</h2>
          <p className={styles.desc}>{ROOM_DESC[roomId]}</p>
        </div>
        <div className={styles.hostBadge}>
          <Face emp={host} size={34} />
          <div>
            <div className={styles.hostLabel}>この部屋の担当 · WORKING HERE</div>
            <div className={styles.hostName}>
              {host.name} <span className={styles.hostRole}>{host.role}</span>
            </div>
          </div>
        </div>
      </div>
      {children}
    </div>
  );
}
