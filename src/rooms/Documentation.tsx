import { useMemo, useState } from 'react';
import { RoomShell } from '../components/RoomShell';
import { Ring } from '../components/Ring';
import { Face } from '../components/Face';
import { employeeById } from '../data/employees';
import { DOC_CATS } from '../data/docs';
import { useCompanyData } from '../state/CompanyDataContext';
import styles from './Documentation.module.css';

/** Documentation Room (会社の記憶) — README §7.8. */
export function Documentation() {
  const { docCoveragePct, documents } = useCompanyData();
  const [cat, setCat] = useState('すべて');
  const [q, setQ] = useState('');

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
              <div key={d.id} className={styles.card}>
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
    </RoomShell>
  );
}
