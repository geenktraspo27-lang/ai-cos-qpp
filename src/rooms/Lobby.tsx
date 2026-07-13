import { useApp } from '../state/AppContext';
import { EMPLOYEES, employeeById } from '../data/employees';
import { ALL_ROOMS, ROOM_HOSTS } from '../data/rooms';
import { COMPANY_HEALTH_PCT, FEED_BASE, VITALS } from '../data/lobby';
import { Face } from '../components/Face';
import { Ring } from '../components/Ring';
import type { RoomId } from '../types';
import styles from './Lobby.module.css';

/** Atrium lobby (design pack's adopted variant A) — README §7.1. */
export function Lobby() {
  const { go } = useApp();

  return (
    <div className={styles.lobby}>
      <div className={styles.grid}>
        <div className={styles.col}>
          <div className={styles.heroCard}>
            <img src="/assets/hq/hq-exterior.jpg" alt="AI-COS Headquarters" className={styles.heroImg} />
            <div className={styles.heroScrim} />
            <div className={styles.heroContent}>
              <span className={styles.heroEyebrow}>Welcome back, Founder</span>
              <h1 className={styles.heroTitle}>おかえりなさい、げんきさん</h1>
              <p className={styles.heroSub}>
                AI-COS本社は今日も稼働中。AI社員 8名が各フロアで働いています。
              </p>
            </div>
          </div>

          <div className={styles.healthCard}>
            <Ring
              pct={COMPANY_HEALTH_PCT}
              size={106}
              color="#B8934E"
              label={String(COMPANY_HEALTH_PCT)}
              sub="COMPANY HEALTH"
            />
            <div className={styles.vitals}>
              {VITALS.map((v) => (
                <div key={v.k} className={styles.vitalRow}>
                  <span className={styles.vitalKey}>{v.k}</span>
                  <span className={styles.vitalVal}>{v.v}</span>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.employeesCard}>
            <span className={styles.cardLabel}>AI Employees — いま働いています</span>
            <div className={styles.employeesGrid}>
              {EMPLOYEES.map((e) => (
                <div key={e.id} className={styles.employeeRow}>
                  <Face emp={e} size={40} />
                  <div className={styles.employeeInfo}>
                    <div className={styles.employeeName} style={{ color: e.color }}>
                      {e.name} <span className={styles.employeeRole}>{e.role}</span>
                    </div>
                    <div className={styles.employeeActivity}>{e.activity}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.col}>
          <div className={styles.floorGuideCard}>
            <div className={styles.floorGuideHeader}>
              <span className={styles.cardLabel}>Floor Guide</span>
              <span className={styles.floorGuideHint}>フロアをタップして入室</span>
            </div>
            <div className={styles.crossWrap}>
              <img src="/assets/hq/cross.jpg" alt="AI-COS 断面図" className={styles.crossImg} />
              <div className={styles.crossScrim} />
              <div className={styles.crossLabel}>
                <span className={styles.crossPulse}>●</span> AI CORE — ONLINE
              </div>
            </div>
            <div className={styles.floorList}>
              {ALL_ROOMS.map((r) => {
                const host = employeeById(ROOM_HOSTS[r.id as Exclude<RoomId, 'lobby'>]);
                return (
                  <button key={r.id} onClick={() => go(r.id as RoomId)} className={styles.floorBtn}>
                    <Face emp={host} size={28} working={false} />
                    <span className={styles.floorBtnLabel}>
                      <span className={styles.floorBtnJp}>{r.jp}</span>
                      <span className={styles.floorBtnFloor}>{r.floorLabel}</span>
                    </span>
                    <span className={styles.floorBtnArrow}>→</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className={styles.feedCard}>
            <span className={styles.cardLabelHolo}>Live Activity</span>
            <div className={styles.feedList}>
              {FEED_BASE.map((f, i) => {
                const emp = employeeById(f.by);
                return (
                  <div key={i} className={styles.feedRow}>
                    <Face emp={emp} size={28} working={false} />
                    <div className={styles.feedText}>
                      <span style={{ color: emp.color, fontWeight: 800, fontFamily: 'var(--aicos-font-jp)' }}>
                        {emp.name}
                      </span>{' '}
                      {f.text}
                    </div>
                    <span className={styles.feedTime}>{f.t}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
