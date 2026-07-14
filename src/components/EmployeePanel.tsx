import { useEffect, useState, type KeyboardEvent } from 'react';
import { useApp } from '../state/AppContext';
import { useCompanyData } from '../state/CompanyDataContext';
import { EMPLOYEES, employeeById } from '../data/employees';
import { Face } from './Face';
import styles from './EmployeePanel.module.css';

interface EmployeePanelProps {
  variant?: 'desktop' | 'drawer';
  onClose?: () => void;
}

const CHAT_ERROR_TEXT = '回答を生成できませんでした。再度お試しください。';

/** Right-hand AI Employee Panel: selector row, portrait card, tasks, chat. */
export function EmployeePanel({ variant = 'desktop', onClose }: EmployeePanelProps) {
  const { eId, selectEmployee, showToast } = useApp();
  const { employeeStates, tasksByEmployee, updateTask, addTask, removeTask, chatMessagesByEmployee, sendChatMessage } =
    useCompanyData();
  const [editTasks, setEditTasks] = useState(false);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  const emp = employeeById(eId);
  const state = employeeStates[eId];
  const tasks = tasksByEmployee[eId] ?? [];
  const chatLog = chatMessagesByEmployee[eId] ?? [];

  useEffect(() => {
    setDraft('');
    setChatError(null);
  }, [eId]);

  const toggleEditTasks = () => {
    setEditTasks((v) => {
      if (v) showToast('保存しました');
      return !v;
    });
  };

  const send = async () => {
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    setChatError(null);
    try {
      await sendChatMessage(eId, text);
      setDraft('');
    } catch {
      setChatError(CHAT_ERROR_TEXT);
    } finally {
      setSending(false);
    }
  };

  const onDraftKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') void send();
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
        {(chatLog.length > 0 || sending || chatError) && (
          <div className={styles.chatLog}>
            {chatLog.map((m) => (
              <div key={m.id} className={m.role === 'user' ? styles.bubbleMe : styles.bubbleAi}>
                {m.content}
              </div>
            ))}
            {sending && <div className={styles.bubbleAi}>{emp.name}が考えています…</div>}
            {chatError && <div className={styles.chatErrorText}>{chatError}</div>}
          </div>
        )}
        <div className={styles.chatInputRow}>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onDraftKey}
            placeholder={`${emp.name} に話しかける…`}
            className={styles.chatInput}
            disabled={sending}
          />
          <button
            onClick={() => void send()}
            aria-label="送信"
            className={styles.sendBtn}
            style={{ background: emp.color }}
            disabled={sending || draft.trim() === ''}
          >
            ↑
          </button>
        </div>
      </div>
    </aside>
  );
}
