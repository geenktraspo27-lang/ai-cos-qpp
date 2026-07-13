import { useApp } from '../state/AppContext';
import { useCompanyData } from '../state/CompanyDataContext';
import { EMPLOYEES, employeeById } from '../data/employees';
import { ALL_ROOMS, ROOM_HOSTS } from '../data/rooms';
import { COMPANY_HEALTH_PCT } from '../data/lobby';
import { Face } from '../components/Face';
import { Ring } from '../components/Ring';
import type { RoomId } from '../types';
import styles from './Lobby.module.css';

const relativeTime = (iso: string): string => {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60_000));
  if (mins < 1) return 'たった今';
  if (mins < 60) return `${mins}分前`;
  return `${Math.round(mins / 60)}時間前`;
};

/** Atrium lobby (design pack's adopted variant A) — README §7.1. */
export function Lobby() {
  const { go } = useApp();
  const { visionProgressPct, activeWorkflowsCount, pendingDecisionsCount, employeeStates, feed } = useCompanyData();

  const vitals = [
    { k: 'ミッション進捗', v: `${visionProgressPct}%` },
    { k: '稼働中ワークフロー', v: `${activeWorkflowsCount}件` },
    { k: '承認待ちの意思決定', v: `${pendingDecisionsCount}件` },
    { k: 'AI社員 稼働率', v: '100%' },
  ];

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
              {vitals.map((v) => (
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
                    <div className={styles.employeeActivity}>{employeeStates[e.id]?.activity ?? e.activity}</div>
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
              {feed.map((f) => {
                const emp = employeeById(f.employeeId);
                return (
                  <div key={f.id} className={styles.feedRow}>
                    <Face emp={emp} size={28} working={false} />
                    <div className={styles.feedText}>
                      <span style={{ color: emp.color, fontWeight: 800, fontFamily: 'var(--aicos-font-jp)' }}>
                        {emp.name}
                      </span>{' '}
                      {f.text}
                    </div>
                    <span className={styles.feedTime}>{relativeTime(f.createdAt)}</span>
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
