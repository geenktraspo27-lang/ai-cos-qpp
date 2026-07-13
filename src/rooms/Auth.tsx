import { useState, type FormEvent } from 'react';
import { signIn, signUp } from '../lib/auth';
import styles from './Auth.module.css';

/** Pre-app login/signup screen. On signup, the DB trigger creates the
 * company + founder profile and seeds starter data (see supabase/migrations). */
export function Auth() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [signedUpAwaitingConfirm, setSignedUpAwaitingConfirm] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (mode === 'login') {
        await signIn(email, password);
      } else {
        await signUp(email, password, companyName, displayName);
        setSignedUpAwaitingConfirm(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
    } finally {
      setSubmitting(false);
    }
  };

  if (signedUpAwaitingConfirm) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <div className={styles.brand}>AI・COS</div>
          <p className={styles.confirmText}>
            確認メールを送信しました。メール内のリンクからアカウントを有効化してください。
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.brand}>AI・COS</div>
        <div className={styles.tabs}>
          <button
            type="button"
            className={styles.tab}
            data-active={mode === 'login'}
            onClick={() => setMode('login')}
          >
            ログイン
          </button>
          <button
            type="button"
            className={styles.tab}
            data-active={mode === 'signup'}
            onClick={() => setMode('signup')}
          >
            新規登録
          </button>
        </div>

        <form onSubmit={submit} className={styles.form}>
          {mode === 'signup' && (
            <>
              <label className={styles.label}>
                会社名
                <input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                  className={styles.input}
                  placeholder="MIRAI WORKS Inc."
                />
              </label>
              <label className={styles.label}>
                お名前(Founder)
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                  className={styles.input}
                  placeholder="げんき"
                />
              </label>
            </>
          )}
          <label className={styles.label}>
            メールアドレス
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={styles.input}
            />
          </label>
          <label className={styles.label}>
            パスワード
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className={styles.input}
            />
          </label>

          {error && <div className={styles.error}>{error}</div>}

          <button type="submit" disabled={submitting} className={styles.submitBtn}>
            {submitting ? '処理中…' : mode === 'login' ? 'ログイン' : '会社を設立する'}
          </button>
        </form>
      </div>
    </div>
  );
}
