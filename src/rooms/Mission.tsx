import { useState } from 'react';
import { RoomShell } from '../components/RoomShell';
import { Ring } from '../components/Ring';
import { Face } from '../components/Face';
import { useApp } from '../state/AppContext';
import { useAuth } from '../state/AuthContext';
import { useCompanyData } from '../state/CompanyDataContext';
import { EMPLOYEES, employeeById } from '../data/employees';
import type { EmployeeId } from '../types';
import styles from './Mission.module.css';

/** Mission Room (経営戦略室) — Vision, Strategic Goals, KPI/KDI, all founder-editable. README §7.2/§10. */
export function Mission() {
  const { showToast } = useApp();
  const { profile } = useAuth();
  const {
    vision, visionProgressPct, goals, kpis, workflows,
    updateVision, addGoal, updateGoal, removeGoal, addKpi, updateKpi, removeKpi,
    createWorkflowFromGoal,
  } = useCompanyData();

  const [editVision, setEditVision] = useState(false);
  const [editGoals, setEditGoals] = useState(false);
  const [editKpis, setEditKpis] = useState(false);
  const [creatingWorkflowFor, setCreatingWorkflowFor] = useState<string | null>(null);

  const toggleEdit = (on: boolean, setOn: (v: boolean) => void) => {
    setOn(!on);
    if (on) showToast('保存しました');
  };

  const handleCreateWorkflow = async (goalId: string) => {
    setCreatingWorkflowFor(goalId);
    try {
      await createWorkflowFromGoal(goalId);
      showToast('Workflowを作成しました');
    } catch {
      showToast('Workflowの作成に失敗しました');
    } finally {
      setCreatingWorkflowFor(null);
    }
  };

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
              onChange={(e) => updateVision(e.target.value)}
              className={styles.visionInput}
            />
          )}
          <div className={styles.visionMeta}>{profile?.companyName} — FY2026 Strategic Mission</div>
          <div className={styles.visionRing}>
            <Ring pct={visionProgressPct} size={132} color="#2E7CD6" sub="MISSION PROGRESS" />
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
            {goals.map((g) => {
              const owner = employeeById(g.ownerEmployeeId);
              return (
                <div key={g.id}>
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
                      {workflows.some((w) => w.sourceGoalId === g.id) ? (
                        <button className={styles.workflowDoneBtn} disabled>
                          Workflow作成済み
                        </button>
                      ) : (
                        <button
                          onClick={() => handleCreateWorkflow(g.id)}
                          disabled={creatingWorkflowFor === g.id}
                          className={styles.workflowCreateBtn}
                        >
                          {creatingWorkflowFor === g.id ? '作成中…' : 'Workflowを作成'}
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className={styles.goalEditCard}>
                      <div className={styles.goalEditRow}>
                        <input
                          value={g.name}
                          onChange={(e) => updateGoal(g.id, { name: e.target.value })}
                          className={styles.input}
                        />
                        <button onClick={() => removeGoal(g.id)} aria-label="削除" className={styles.delBtn}>
                          ✕
                        </button>
                      </div>
                      <div className={styles.goalEditRow}>
                        <input
                          type="number"
                          value={g.pct}
                          onChange={(e) =>
                            updateGoal(g.id, { pct: Math.max(0, Math.min(100, parseInt(e.target.value, 10) || 0)) })
                          }
                          className={styles.pctInput}
                        />
                        <span className={styles.pctSign}>%</span>
                        <select
                          value={g.ownerEmployeeId}
                          onChange={(e) => updateGoal(g.id, { ownerEmployeeId: e.target.value as EmployeeId })}
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
            {kpis.map((k) => (
              <div key={k.id} className={styles.kpiCard}>
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
                      onChange={(e) => updateKpi(k.id, { label: e.target.value })}
                      placeholder="指標名"
                      className={styles.smallInput}
                    />
                    <input
                      value={k.value}
                      onChange={(e) => updateKpi(k.id, { value: e.target.value })}
                      placeholder="値"
                      className={styles.input}
                    />
                    <div className={styles.kpiEditRow}>
                      <input
                        value={k.delta}
                        onChange={(e) => updateKpi(k.id, { delta: e.target.value })}
                        placeholder="増減"
                        className={styles.deltaInput}
                      />
                      <button
                        onClick={() => updateKpi(k.id, { good: !k.good })}
                        className={styles.goodBtn}
                        data-good={k.good}
                      >
                        {k.good ? '↑ 好調' : '↓ 注意'}
                      </button>
                      <button onClick={() => removeKpi(k.id)} aria-label="削除" className={styles.delBtn}>
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
