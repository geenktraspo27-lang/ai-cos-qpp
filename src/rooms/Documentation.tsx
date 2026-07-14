import { useEffect, useMemo, useState } from 'react';
import { RoomShell } from '../components/RoomShell';
import { Ring } from '../components/Ring';
import { Face } from '../components/Face';
import { employeeById } from '../data/employees';
import { DOC_CATS } from '../data/docs';
import { useCompanyData, type DocumentRow } from '../state/CompanyDataContext';
import styles from './Documentation.module.css';

/** Documentation Room (会社の記憶) — README §7.8. */
export function Documentation() {
  const { docCoveragePct, documents } = useCompanyData();
  const [cat, setCat] = useState('すべて');
  const [q, setQ] = useState('');
  const [selectedDocument, setSelectedDocument] = useState<DocumentRow | null>(null);

  useEffect(() => {
    if (!selectedDocument) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedDocument(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedDocument]);

  const hits = useMemo(() => {
    const query = q.toLowerCase();
    return documents.filter(
      (d) =>
        (cat === 'すべて' || d.cat === cat) &&
        (query === '' || (d.title + d.summary).toLowerCase().includes(query)),
    );
  }, [documents, cat, q]);

  return (
    <RoomShell roomId="docs">
      <div className={styles.searchBar}>
        <Ring pct={docCoveragePct} size={96} color="#8A6238" label={`${docCoveragePct}%`} sub="網羅率" />
        <div className={styles.searchCol}>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ドキュメントを検索…"
            className={styles.searchInput}
          />
          <div className={styles.catRow}>
            {DOC_CATS.map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={styles.catChip}
                data-active={c === cat}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
        <div className={styles.countCol}>
          <div className={styles.countNum}>{hits.length}</div>
          <div className={styles.countLabel}>DOCUMENTS</div>
        </div>
      </div>

      {hits.length === 0 ? (
        <div className={styles.empty}>該当するドキュメントが見つかりませんでした</div>
      ) : (
        <div className={styles.grid}>
          {hits.map((d) => {
            const by = employeeById(d.employeeId);
            return (
              <div
                key={d.id}
                className={styles.card}
                onClick={() => setSelectedDocument(d)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedDocument(d);
                  }
                }}
              >
                <div className={styles.cardHead}>
                  <span className={styles.catPill}>{d.cat}</span>
                  <span className={styles.date}>{d.date}</span>
                </div>
                <div className={styles.docTitle}>📄 {d.title}</div>
                <p className={styles.summary}>{d.summary}</p>
                <div className={styles.byRow}>
                  <Face emp={by} size={22} working={false} />
                  <span className={styles.byText}>{by.name} が作成</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedDocument && (
        <div className={styles.modalBackdrop} onClick={() => setSelectedDocument(null)}>
          <article className={styles.detailModal} onClick={(e) => e.stopPropagation()}>
            <button
              className={styles.closeButton}
              onClick={() => setSelectedDocument(null)}
              aria-label="閉じる"
            >
              ×
            </button>

            <div className={styles.detailHeader}>
              <span className={styles.catPill}>{selectedDocument.cat}</span>
              <span className={styles.date}>{selectedDocument.date}</span>
            </div>

            <h2 className={styles.detailTitle}>{selectedDocument.title}</h2>

            <p className={styles.detailSummary}>{selectedDocument.summary}</p>

            <div className={styles.detailContent}>
              {selectedDocument.content || 'このドキュメントには詳細本文がありません。'}
            </div>

            <div className={styles.byRow}>
              <Face emp={employeeById(selectedDocument.employeeId)} size={22} working={false} />
              <span className={styles.byText}>{employeeById(selectedDocument.employeeId).name} が作成</span>
            </div>
          </article>
        </div>
      )}
    </RoomShell>
  );
}
