import { useState } from 'react';
import { RoomShell } from '../components/RoomShell';
import { Face } from '../components/Face';
import { useApp } from '../state/AppContext';
import { employeeById } from '../data/employees';
import { DECISIONS } from '../data/decisions';
import styles from './Decision.module.css';

type Status = 'pending' | 'approved' | 'hold';

/** Decision Room (CEO決裁室) — README §7.3/§8, the core "autonomous collaboration" showcase. */
export function Decision() {
  const { showToast } = useApp();
  const [status, setStatus] = useState<Record<number, Status>>({});
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  const approve = (id: number, title: string) => {
    setStatus((prev) => ({ ...prev, [id]: 'approved' }));
    showToast(`承認しました — ${title}`);
  };
  const hold = (id: number) => setStatus((prev) => ({ ...prev, [id]: 'hold' }));
  const toggleThread = (id: number) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <RoomShell roomId="decision">
      <div className={styles.list}>
        {DECISIONS.map((d) => {
          const by = employeeById(d.by);
          const st = status[d.id] ?? 'pending';
          const isOpen = !!expanded[d.id];
          return (
            <div key={d.id} className={styles.card} style={{ opacity: st === 'pending' ? 1 : 0.72 }}>
              <div className={styles.row}>
                <Face emp={by} size={48} />
                <div className={styles.body}>
                  <div className={styles.tagRow}>
                    <span
                      className={styles.riskPill}
                      style={{ color: d.risk === '低' ? 'var(--aicos-green)' : 'var(--aicos-gold)', borderColor: d.risk === '低' ? 'var(--aicos-green)' : 'var(--aicos-gold)' }}
                    >
                      リスク {d.risk}
                    </span>
                    <span className={styles.byLine} style={{ color: by.color }}>
                      {by.name}({by.role})の提言
                    </span>
                  </div>
                  <div className={styles.title}>{d.title}</div>
                  <div className={styles.rec}>{d.rec}</div>
                  <p className={styles.detail}>{d.detail}</p>

                  <button onClick={() => toggleThread(d.id)} className={styles.threadToggle}>
                    {isOpen ? '▲ 議論を閉じる' : `▼ ${d.contributors.length}名の議論を見る`}
                  </button>

                  {isOpen && (
                    <div className={styles.thread}>
                      {d.discussion.map((m, i) => {
                        const speaker = employeeById(m.by);
                        return (
                          <div key={i} className={styles.msgRow}>
                            <Face emp={speaker} size={26} working={false} />
                            <div className={styles.msgBody}>
                              <div className={styles.msgHead}>
                                <span style={{ color: speaker.color }}>{speaker.name}</span>
                                <span className={styles.msgRole}>{speaker.role}</span>
                                {m.stance === 'dissent' && (
                                  <span className={styles.stanceDissent}>異論</span>
                                )}
                                {m.stance === 'revision' && (
                                  <span className={styles.stanceRevision}>修正</span>
                                )}
                              </div>
                              <div className={styles.msgText}>{m.text}</div>
                            </div>
                          </div>
                        );
                      })}
                      <div className={styles.credit}>
                        🤝 この推奨は {d.contributors.map((id) => employeeById(id).name).join('・')}{' '}
                        の自律的な議論により作成されました
                      </div>
                    </div>
                  )}
                </div>
                <div className={styles.actions}>
                  {st === 'approved' && <span className={styles.stamp}>✓ 承認しました</span>}
                  {st === 'hold' && <span className={styles.heldLabel}>保留中</span>}
                  {st === 'pending' && (
                    <>
                      <button onClick={() => approve(d.id, d.title)} className={styles.approveBtn}>
                        承認する
                      </button>
                      <button onClick={() => hold(d.id)} className={styles.holdBtn}>
                        保留
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </RoomShell>
  );
}
