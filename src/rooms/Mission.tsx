import { useState } from 'react';
import { RoomShell } from '../components/RoomShell';
import { Ring } from '../components/Ring';
import { Face } from '../components/Face';
import { useApp } from '../state/AppContext';
import { usePersistedState } from '../lib/usePersistedState';
import { EMPLOYEES, employeeById } from '../data/employees';
import { DEFAULT_GOALS, DEFAULT_KPIS, DEFAULT_VISION, MISSION_PROGRESS_PCT } from '../data/mission';
import type { EmployeeId, Kpi, StrategicGoal } from '../types';
import styles from './Mission.module.css';

/** Mission Room (経営戦略室) — Vision, Strategic Goals, KPI/KDI, all founder-editable. README §7.2/§10. */
export function Mission() {
  const { showToast } = useApp();
  const [vision, setVision] = usePersistedState('vision', DEFAULT_VISION);
  const [goals, setGoals] = usePersistedState<StrategicGoal[]>('goals', DEFAULT_GOALS);
  const [kpis, setKpis] = usePersistedState<Kpi[]>('kpis', DEFAULT_KPIS);

  const [editVision, setEditVision] = useState(false);
  const [editGoals, setEditGoals] = useState(false);
  const [editKpis, setEditKpis] = useState(false);

  const toggleEdit = (on: boolean, setOn: (v: boolean) => void) => {
    setOn(!on);
    if (on) showToast('保存しました');
  };

  const updateGoal = (i: number, field: 'name' | 'pct', value: string) => {
    setGoals((prev) =>
      prev.map((g, j) =>
        j === i
          ? { ...g, [field]: field === 'pct' ? Math.max(0, Math.min(100, parseInt(value, 10) || 0)) : value }
          : g,
      ),
    );
  };
  const setGoalOwner = (i: number, owner: EmployeeId) => {
    setGoals((prev) => prev.map((g, j) => (j === i ? { ...g, owner } : g)));
  };
  const addGoal = () => setGoals((prev) => [...prev, { name: '新しい戦略目標', pct: 0, owner: 'nova' }]);
  const removeGoal = (i: number) => setGoals((prev) => prev.filter((_, j) => j !== i));

  const updateKpi = (i: number, field: keyof Kpi, value: string) => {
    setKpis((prev) => prev.map((k, j) => (j === i ? { ...k, [field]: value } : k)));
  };
  const toggleKpiGood = (i: number) => {
    setKpis((prev) => prev.map((k, j) => (j === i ? { ...k, good: !k.good } : k)));
  };
  const addKpi = () => setKpis((prev) => [...prev, { label: '新しい指標', value: '—', delta: '', good: true }]);
  const removeKpi = (i: number) => setKpis((prev) => prev.filter((_, j) => j !== i));

  return (
    <RoomShell roomId="mission">
      <div className={styles.visionCard}>
        <img src="/assets/hq/interior.jpg" alt="" className={styles.visionBg} aria-hidden />
        <div className={styles.visionContent}>
          <div className={styles.visionHeaderRow}>
            <span className={styles.cardLabel}>Company Vision</span>
            <button
              onClick={() => toggleEdit(editVision, setEditVision)}
              className={styles.editBtn}
              data-on={editVision}
            >
              ✎ {editVision ? '完了' : '編集'}
            </button>
          </div>
          {!editVision ? (
            <div className={styles.visionText}>{vision}</div>
          ) : (
            <textarea
              value={vision}
              onChange={(e) => setVision(e.target.value)}
              className={styles.visionInput}
            />
          )}
          <div className={styles.visionMeta}>MIRAI WORKS Inc. — FY2026 Strategic Mission</div>
          <div className={styles.visionRing}>
            <Ring pct={MISSION_PROGRESS_PCT} size={132} color="#2E7CD6" sub="MISSION PROGRESS" />
          </div>
        </div>
      </div>

      <div className={styles.twoCol}>
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <span className={styles.cardLabelHolo}>Strategic Goals</span>
            <button
              onClick={() => toggleEdit(editGoals, setEditGoals)}
              className={styles.editBtn}
              data-on={editGoals}
            >
              ✎ {editGoals ? '完了' : '編集'}
            </button>
          </div>
          <div className={styles.goalsList}>
            {goals.map((g, i) => {
              const owner = employeeById(g.owner);
              return (
                <div key={i}>
                  {!editGoals ? (
                    <div>
                      <div className={styles.goalRow}>
                        <span className={styles.goalName}>{g.name}</span>
                        <span className={styles.goalPct}>{g.pct}%</span>
                      </div>
                      <div className={styles.goalBarTrack}>
                        <div
                          className={styles.goalBarFill}
                          style={{
                            width: `${g.pct}%`,
                            background: `linear-gradient(90deg, ${owner.color}, var(--aicos-gold))`,
                          }}
                        />
                      </div>
                      <div className={styles.goalOwnerRow}>
                        <Face emp={owner} size={20} working={false} />
                        <span className={styles.goalOwnerText}>
                          担当: {owner.name}({owner.role})
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className={styles.goalEditCard}>
                      <div className={styles.goalEditRow}>
                        <input
                          value={g.name}
                          onChange={(e) => updateGoal(i, 'name', e.target.value)}
                          className={styles.input}
                        />
                        <button onClick={() => removeGoal(i)} aria-label="削除" className={styles.delBtn}>
                          ✕
                        </button>
                      </div>
                      <div className={styles.goalEditRow}>
                        <input
                          type="number"
                          value={g.pct}
                          onChange={(e) => updateGoal(i, 'pct', e.target.value)}
                          className={styles.pctInput}
                        />
                        <span className={styles.pctSign}>%</span>
                        <select
                          value={g.owner}
                          onChange={(e) => setGoalOwner(i, e.target.value as EmployeeId)}
                          className={styles.select}
                        >
                          {EMPLOYEES.map((e) => (
                            <option key={e.id} value={e.id}>
                              {e.name}({e.role})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {editGoals && (
            <button onClick={addGoal} className={styles.addBtn}>
              ＋ 戦略目標を追加
            </button>
          )}
        </div>

        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <span className={styles.cardLabelHolo}>KPI / KDI</span>
            <button
              onClick={() => toggleEdit(editKpis, setEditKpis)}
              className={styles.editBtn}
              data-on={editKpis}
            >
              ✎ {editKpis ? '完了' : '編集'}
            </button>
          </div>
          <div className={styles.kpiGrid}>
            {kpis.map((k, i) => (
              <div key={i} className={styles.kpiCard}>
                {!editKpis ? (
                  <div>
                    <div className={styles.kpiLabel}>{k.label}</div>
                    <div className={styles.kpiValue}>{k.value}</div>
                    <div
                      className={styles.kpiDelta}
                      style={{ color: k.good ? 'var(--aicos-green)' : 'var(--aicos-danger)' }}
                    >
                      {k.delta}
                    </div>
                  </div>
                ) : (
                  <div className={styles.kpiEdit}>
                    <input
                      value={k.label}
                      onChange={(e) => updateKpi(i, 'label', e.target.value)}
                      placeholder="指標名"
                      className={styles.smallInput}
                    />
                    <input
                      value={k.value}
                      onChange={(e) => updateKpi(i, 'value', e.target.value)}
                      placeholder="値"
                      className={styles.input}
                    />
                    <div className={styles.kpiEditRow}>
                      <input
                        value={k.delta}
                        onChange={(e) => updateKpi(i, 'delta', e.target.value)}
                        placeholder="増減"
                        className={styles.deltaInput}
                      />
                      <button
                        onClick={() => toggleKpiGood(i)}
                        className={styles.goodBtn}
                        data-good={k.good}
                      >
                        {k.good ? '↑ 好調' : '↓ 注意'}
                      </button>
                      <button onClick={() => removeKpi(i)} aria-label="削除" className={styles.delBtn}>
                        ✕
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          {editKpis && (
            <button onClick={addKpi} className={styles.addBtn}>
              ＋ 指標を追加
            </button>
          )}
        </div>
      </div>
    </RoomShell>
  );
}
