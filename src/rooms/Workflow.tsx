import { useState } from 'react';
import { RoomShell } from '../components/RoomShell';
import { Face } from '../components/Face';
import { employeeById } from '../data/employees';
import { useApp } from '../state/AppContext';
import { useCompanyData } from '../state/CompanyDataContext';
import styles from './Workflow.module.css';

/** Workflow Room (オペレーション管制センター) — README §7.7. 課題2: stage advance + completion. */
export function Workflow() {
  const { showToast } = useApp();
  const { workflows, advanceWorkflowStage } = useCompanyData();
  const [advancing, setAdvancing] = useState<Record<string, boolean>>({});

  const handleAdvance = async (workflowId: string, isFinalAdvance: boolean) => {
    setAdvancing((prev) => ({ ...prev, [workflowId]: true }));
    try {
      await advanceWorkflowStage(workflowId);
      showToast(isFinalAdvance ? 'Workflowが完了しました' : '次のステージに進みました');
    } catch {
      showToast('ステージの更新に失敗しました');
    } finally {
      setAdvancing((prev) => ({ ...prev, [workflowId]: false }));
    }
  };

  return (
    <RoomShell roomId="workflow">
      <div className={styles.list}>
        {workflows.map((w) => {
          const owner = employeeById(w.ownerEmployeeId);
          const isComplete = w.currentStage >= w.stages.length - 1;
          const isFinalAdvance = w.currentStage === w.stages.length - 2;
          return (
            <div key={w.id} className={styles.card}>
              <div className={styles.head}>
                <Face emp={owner} size={40} />
                <div className={styles.headInfo}>
                  <div className={styles.name}>{w.name}</div>
                  <div className={styles.owner}>
                    実行: {owner.name}({owner.role})
                  </div>
                </div>
                <span className={styles.pct}>{w.pct}%</span>
              </div>
              <div className={styles.steps}>
                {w.stages.map((stage, i) => {
                  const done = i < w.currentStage;
                  const isCurrent = i === w.currentStage;
                  const notLast = i !== w.stages.length - 1;
                  return (
                    <div key={stage} className={styles.stepWrap}>
                      <div className={styles.step}>
                        <span
                          className={styles.dot}
                          style={{
                            background: done ? 'var(--aicos-holo)' : isCurrent ? owner.color : 'rgba(184,147,78,0.25)',
                            animation: isCurrent ? 'aicos-pulse 2s infinite' : 'none',
                          }}
                        />
                        <span
                          className={styles.stepLabel}
                          style={{
                            color: i <= w.currentStage ? 'var(--aicos-brown)' : 'var(--aicos-dim)',
                            fontWeight: isCurrent ? 700 : 400,
                          }}
                        >
                          {stage}
                        </span>
                      </div>
                      {notLast && (
                        <div
                          className={styles.connector}
                          style={{ background: done ? 'var(--aicos-holo)' : 'rgba(184,147,78,0.2)' }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
              <div className={styles.advanceRow}>
                {isComplete ? (
                  <span className={styles.completeLabel}>✓ 完了</span>
                ) : (
                  <button
                    onClick={() => handleAdvance(w.id, isFinalAdvance)}
                    disabled={!!advancing[w.id]}
                    className={styles.advanceBtn}
                  >
                    {advancing[w.id] ? '更新中…' : '次のステージへ進む'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </RoomShell>
  );
}
