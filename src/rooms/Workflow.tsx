import { useState } from 'react';
import { RoomShell } from '../components/RoomShell';
import { Face } from '../components/Face';
import { employeeById } from '../data/employees';
import { useApp } from '../state/AppContext';
import { useCompanyData } from '../state/CompanyDataContext';
import styles from './Workflow.module.css';

/**
 * Workflow Room (オペレーション管制センター) — README §7.7.
 * 課題7: 「次のステージへ進む」は AI社員に実行させる → 実行結果を確認 →
 * 承認して次へ進む、の3段階に置き換えられた。生成だけではステージは
 * 進まず、advanceWorkflowStage(=承認)を呼んだときだけ進む。
 */
export function Workflow() {
  const { showToast } = useApp();
  const { workflows, workflowStageResults, executeWorkflowStage, advanceWorkflowStage } = useCompanyData();
  const [executing, setExecuting] = useState<Record<string, boolean>>({});
  const [executeErrors, setExecuteErrors] = useState<Record<string, boolean>>({});
  const [approving, setApproving] = useState<Record<string, boolean>>({});

  const handleExecute = async (workflowId: string) => {
    setExecuting((prev) => ({ ...prev, [workflowId]: true }));
    setExecuteErrors((prev) => ({ ...prev, [workflowId]: false }));
    try {
      await executeWorkflowStage(workflowId);
    } catch {
      setExecuteErrors((prev) => ({ ...prev, [workflowId]: true }));
      showToast('実行結果を生成できませんでした');
    } finally {
      setExecuting((prev) => ({ ...prev, [workflowId]: false }));
    }
  };

  const handleApprove = async (workflowId: string, isFinalAdvance: boolean) => {
    setApproving((prev) => ({ ...prev, [workflowId]: true }));
    try {
      await advanceWorkflowStage(workflowId);
      showToast(isFinalAdvance ? 'Workflowが完了しました' : '承認して次のステージに進みました');
    } catch {
      showToast('承認に失敗しました');
    } finally {
      setApproving((prev) => ({ ...prev, [workflowId]: false }));
    }
  };

  return (
    <RoomShell roomId="workflow">
      <div className={styles.list}>
        {workflows.map((w) => {
          const owner = employeeById(w.ownerEmployeeId);
          const isComplete = w.currentStage >= w.stages.length - 1;
          const isFinalAdvance = w.currentStage === w.stages.length - 2;
          const currentResult = workflowStageResults.find(
            (r) => r.workflowId === w.id && r.stageIndex === w.currentStage && r.status === 'generated',
          );
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

              {isComplete ? (
                <div className={styles.advanceRow}>
                  <span className={styles.completeLabel}>✓ 完了</span>
                </div>
              ) : executing[w.id] ? (
                <div className={styles.executingBox}>{owner.name}が業務を実行しています…</div>
              ) : currentResult ? (
                <div className={styles.resultBox}>
                  <div className={styles.resultTitle}>実行結果</div>
                  <div className={styles.resultLabel}>要約</div>
                  <p className={styles.resultSummary}>{currentResult.summary}</p>
                  <div className={styles.resultLabel}>結果</div>
                  <p className={styles.resultText}>{currentResult.result}</p>
                  <div className={styles.resultActions}>
                    <button
                      onClick={() => handleApprove(w.id, isFinalAdvance)}
                      disabled={!!approving[w.id]}
                      className={styles.approveBtn}
                    >
                      {approving[w.id] ? '承認中…' : '承認して次へ進む'}
                    </button>
                    <button
                      onClick={() => handleExecute(w.id)}
                      disabled={!!approving[w.id]}
                      className={styles.regenerateBtn}
                    >
                      再生成
                    </button>
                  </div>
                </div>
              ) : (
                <div className={styles.advanceRow}>
                  {executeErrors[w.id] && (
                    <p className={styles.executeError}>実行結果を生成できませんでした。再度お試しください。</p>
                  )}
                  <button onClick={() => handleExecute(w.id)} className={styles.advanceBtn}>
                    AI社員に実行させる
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </RoomShell>
  );
}
