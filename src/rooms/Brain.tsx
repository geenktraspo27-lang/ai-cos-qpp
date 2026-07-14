import { useEffect, useState } from 'react';
import { RoomShell } from '../components/RoomShell';
import { Face } from '../components/Face';
import { useCompanyData, type IdeaRow } from '../state/CompanyDataContext';
import { employeeById } from '../data/employees';
import styles from './Brain.module.css';

/** Brain Room (AIリサーチラボ) — README §7.5. */
export function Brain() {
  const { ideas } = useCompanyData();
  const [selectedIdea, setSelectedIdea] = useState<IdeaRow | null>(null);

  useEffect(() => {
    if (!selectedIdea) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedIdea(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedIdea]);

  return (
    <RoomShell roomId="brain">
      <div className={styles.grid}>
        {ideas.map((idea) => {
          const by = employeeById(idea.employeeId);
          return (
            <div
              key={idea.id}
              className={styles.card}
              onClick={() => setSelectedIdea(idea)}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  setSelectedIdea(idea);
                }
              }}
            >
              <div className={styles.head}>
                <span className={styles.tag}>{idea.tag}</span>
                <span className={styles.heat}>熱量 {idea.heat}</span>
              </div>
              <div className={styles.title}>{idea.title}</div>
              {idea.content && <div className={styles.content}>{idea.content}</div>}
              <div className={styles.barTrack}>
                <div
                  className={styles.barFill}
                  style={{ width: `${idea.heat}%`, background: `linear-gradient(90deg, ${by.color}, var(--aicos-gold))` }}
                />
              </div>
              <div className={styles.byRow}>
                <Face emp={by} size={26} working={false} />
                <span className={styles.byText}>{by.name} が提案</span>
              </div>
            </div>
          );
        })}
      </div>

      {selectedIdea && (
        <div className={styles.modalBackdrop} onClick={() => setSelectedIdea(null)}>
          <article className={styles.detailModal} onClick={(e) => e.stopPropagation()}>
            <button
              className={styles.closeButton}
              onClick={() => setSelectedIdea(null)}
              aria-label="閉じる"
            >
              ×
            </button>

            <div className={styles.detailHeader}>
              <span className={styles.tag}>{selectedIdea.tag}</span>
              <span className={styles.date}>{new Date(selectedIdea.createdAt).toLocaleDateString('ja-JP')}</span>
            </div>

            <h2 className={styles.detailTitle}>{selectedIdea.title}</h2>

            <div className={styles.knowledgeContent}>
              {selectedIdea.content || 'このKnowledgeには詳細本文がありません。'}
            </div>

            {selectedIdea.sourceDocumentId && (
              <p className={styles.sourceRef}>元の完了報告はDocumentation Roomで確認できます</p>
            )}

            <div className={styles.byRow}>
              <Face emp={employeeById(selectedIdea.employeeId)} size={22} working={false} />
              <span className={styles.byText}>{employeeById(selectedIdea.employeeId).name} が提案</span>
            </div>
          </article>
        </div>
      )}
    </RoomShell>
  );
}
