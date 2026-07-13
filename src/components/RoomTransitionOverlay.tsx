import styles from './RoomTransitionOverlay.module.css';

/** ~620ms core-flash + gold sweep shown while switching rooms, per README §7.10. */
export function RoomTransitionOverlay() {
  return (
    <div className={styles.overlay}>
      <div className={styles.ring} />
      <div className={styles.sweep} />
    </div>
  );
}
