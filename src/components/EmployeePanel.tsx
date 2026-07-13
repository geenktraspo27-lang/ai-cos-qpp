import { useState, type KeyboardEvent } from 'react';
import { useApp } from '../state/AppContext';
import { useCompanyData } from '../state/CompanyDataContext';
import { EMPLOYEES, employeeById } from '../data/employees';
import { Face } from './Face';
import styles from './EmployeePanel.module.css';

interface ChatMessage {
  me: boolean;
  text: string;
}

interface EmployeePanelProps {
  variant?: 'desktop' | 'drawer';
  onClose?: () => void;
}

/** Right-hand AI Employee Panel: selector row, portrait card, tasks, chat. */
export function EmployeePanel({ variant = 'desktop', onClose }: EmployeePanelProps) {
  const { eId, selectEmployee, showToast } = useApp();
  const { employeeStates, tasksByEmployee, updateTask, addTask, removeTask } = useCompanyData();
  const [editTasks, setEditTasks] = useState(false);
  const [chat, setChat] = useState<Partial<Record<string, ChatMessage[]>>>({});
  const [draft, setDraft] = useState('');

  const emp = employeeById(eId);
  const state = employeeStates[eId];
  const tasks = tasksByEmployee[eId] ?? [];
  const chatLog = chat[eId] ?? [];

  const toggleEditTasks = () => {
    setEditTasks((v) => {
      if (v) showToast('保存しました');
      return !v;
    });
  };

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    const reply = `かしこまりました!「${text.slice(0, 22)}${text.length > 22 ? '…' : ''}」を承りました。優先度を確認して進めますね。`;
    setChat((prev) => ({
      ...prev,
      [eId]: [...(prev[eId] ?? []), { me: true, text }, { me: false, text: reply }],
    }));
    setDraft('');
  };

  const onDraftKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') send();
  };

  return (
    <aside className={`${styles.panel} ${variant === 'drawer' ? styles.drawer : ''}`}>
      <div className={styles.top}>
        <span className={styles.heading}>AI Employee Panel</span>
        {onClose && (
          <button onClick={onClose} aria-label="閉じる" className={styles.closeBtn}>
            ✕
          </button>
        )}
      </div>

      <div className={styles.selectors}>
        {EMPLOYEES.map((e) => (
          <button
            key={e.id}
            onClick={() => selectEmployee(e.id)}
            className={styles.selectorBtn}
            title={e.name}
            aria-label={e.name}
          >
            <Face emp={e} size={30} working={e.id === eId} dimmed={e.id !== eId} />
          </button>
        ))}
      </div>

      <div className={styles.card}>
        <div className={styles.portraitFrame} style={{ borderColor: emp.color }}>
          <img src={emp.img} alt={emp.name} className={styles.portraitImg} />
        </div>
        <div className={styles.name} style={{ color: emp.color }}>
          {emp.name} <span className={styles.nameJp}>{emp.jp}</span>
        </div>
        <div className={styles.role}>
          {emp.role} <span className={styles.roleJp}>/ {emp.roleJp}</span>
        </div>
        <div className={styles.workingBadge}>
          <span className={styles.workingDot} />
          稼働中
        </div>
        <div className={styles.activity}>{state?.activity ?? emp.activity}</div>
      </div>

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <span className={styles.cardLabel}>Current Tasks</span>
          <button onClick={toggleEditTasks} className={styles.editBtn} data-on={editTasks}>
            ✎ {editTasks ? '完了' : '編集'}
          </button>
        </div>
        {!editTasks ? (
          <div>
            {tasks.map((t) => (
              <div key={t.id} className={styles.taskRow}>
                <span className={styles.taskDot} style={{ color: emp.color }}>
                  ●
                </span>
                <span>{t.text}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.taskEditList}>
            {tasks.map((t) => (
              <div key={t.id} className={styles.taskEditRow}>
                <input
                  value={t.text}
                  onChange={(e) => updateTask(t.id, e.target.value)}
                  className={styles.taskInput}
                />
                <button
                  onClick={() => removeTask(eId, t.id)}
                  aria-label="削除"
                  className={styles.taskDel}
                >
                  ✕
                </button>
              </div>
            ))}
            <button onClick={() => addTask(eId)} className={styles.addBtn}>
              ＋ タスクを追加
            </button>
          </div>
        )}
      </div>

      <div className={styles.recCard}>
        <span className={styles.cardLabel}>{emp.name} からの提案</span>
        <div className={styles.recText}>{state?.rec ?? emp.rec}</div>
      </div>

      <div className={styles.chatArea}>
        {chatLog.length > 0 && (
          <div className={styles.chatLog}>
            {chatLog.map((m, i) => (
              <div key={i} className={m.me ? styles.bubbleMe : styles.bubbleAi}>
                {m.text}
              </div>
            ))}
          </div>
        )}
        <div className={styles.chatInputRow}>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onDraftKey}
            placeholder={`${emp.name} に話しかける…`}
            className={styles.chatInput}
          />
          <button
            onClick={send}
            aria-label="送信"
            className={styles.sendBtn}
            style={{ background: emp.color }}
          >
            ↑
          </button>
        </div>
      </div>
    </aside>
  );
}
