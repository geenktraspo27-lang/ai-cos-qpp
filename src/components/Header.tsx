import { useApp } from '../state/AppContext';
import { useAuth } from '../state/AuthContext';
import { signOut } from '../lib/auth';
import { employeeById } from '../data/employees';
import { ALL_ROOMS } from '../data/rooms';
import { NOTIFS } from '../data/lobby';
import { Face } from './Face';
import styles from './Header.module.css';

/** Top app bar: mobile menu toggle, AI CORE brand, clock, notifications, founder badge. */
export function Header() {
  const { isMobile, isDesktop, toggleNav, notifOpen, toggleNotif, closeNotif, now, go } = useApp();
  const { profile } = useAuth();

  const unreadCount = NOTIFS.filter((n) => n.unread).length;
  const clock = now.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });

  const handleNotifClick = (room: (typeof NOTIFS)[number]['room']) => {
    go(room);
    closeNotif();
  };

  return (
    <header className={styles.header}>
      {isMobile && (
        <button
          onClick={toggleNav}
          aria-label="フロアメニュー"
          className={styles.iconBtn}
        >
          ☰
        </button>
      )}

      <div className={styles.brand}>
        <div className={styles.core}>
          <div className={styles.coreDot} />
        </div>
        <div>
          <div className={styles.logo}>AI・COS</div>
          <div className={styles.logoSub}>AI COMPANY OPERATING SYSTEM</div>
        </div>
      </div>

      {isDesktop && <div className={styles.divider} />}
      {isDesktop && <div className={styles.companyName}>{profile?.companyName}</div>}

      <div className={styles.right}>
        {isDesktop && (
          <span className={styles.coreStatus}>
            <span className={styles.coreStatusDot}>●</span> AI CORE: ONLINE
          </span>
        )}
        <span className={styles.clock}>{clock}</span>

        <div className={styles.notifWrap}>
          <button onClick={toggleNotif} aria-label="通知" className={styles.iconBtn}>
            🔔
            {unreadCount > 0 && <span className={styles.badge}>{unreadCount}</span>}
          </button>
          {notifOpen && (
            <div className={styles.dropdown}>
              <div className={styles.dropdownHeader}>
                <span>NOTIFICATIONS</span>
                <span className={styles.dropdownCount}>{unreadCount} 件の新着</span>
              </div>
              {NOTIFS.map((n, i) => {
                const emp = employeeById(n.by);
                const room = ALL_ROOMS.find((r) => r.id === n.room);
                return (
                  <button
                    key={i}
                    onClick={() => handleNotifClick(n.room)}
                    className={styles.notifRow}
                    style={{ background: n.unread ? 'rgba(229,106,154,0.05)' : 'transparent' }}
                  >
                    <Face emp={emp} size={30} working={false} />
                    <div className={styles.notifBody}>
                      <div className={styles.notifText}>
                        <b style={{ color: emp.color }}>{emp.name}</b> {n.text}
                      </div>
                      <div className={styles.notifMeta}>
                        {n.t} · {room ? room.jp : 'Lobby'}
                      </div>
                    </div>
                    {n.unread && <span className={styles.unreadDot} />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className={styles.user}>
          <div className={styles.userAvatar}>{profile?.displayName?.[0] ?? '?'}</div>
          {isDesktop && (
            <div>
              <div className={styles.userName}>{profile?.displayName}</div>
              <div className={styles.userRole}>{profile?.role === 'founder' ? 'FOUNDER' : 'MEMBER'}</div>
            </div>
          )}
        </div>
        <button onClick={() => void signOut()} aria-label="ログアウト" className={styles.iconBtn}>
          ⏻
        </button>
      </div>
    </header>
  );
}
