import { useEffect, useMemo, useState } from 'react';
import { LoginPage } from './pages/LoginPage';
import { SearchPage } from './pages/SearchPage';
import { getSession, setSession, clearSession, type VerifySession } from './lib/session';

export default function App() {
  const [session, setSessionState] = useState<VerifySession | null>(() => getSession());

  useEffect(() => {
    setSessionState(getSession());
  }, []);

  const view = useMemo(() => (session ? 'search' : 'login'), [session]);

  function onLogin(next: VerifySession) {
    setSession(next);
    setSessionState(next);
  }

  function onLogout() {
    clearSession();
    setSessionState(null);
  }

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div>
          <div style={styles.brand}>JobAppID</div>
          <div style={styles.title}>Verification Portal</div>
        </div>
        {session ? (
          <div style={styles.headerRight}>
            <div style={styles.meta}>
              <div style={styles.metaLabel}>Signed in as</div>
              <div style={styles.metaValue}>{session.officeName}</div>
            </div>
            <button onClick={onLogout} style={styles.linkButton}>
              Sign out
            </button>
          </div>
        ) : (
          <div style={styles.meta}>
            <div style={styles.metaLabel}>Read-only</div>
            <div style={styles.metaValue}>Audit logged</div>
          </div>
        )}
      </header>

      <main style={styles.main}>
        {view === 'login' ? <LoginPage onLogin={onLogin} /> : <SearchPage session={session!} />}
      </main>

      <footer style={styles.footer}>
        <div>© {new Date().getFullYear()} JobAppID</div>
        <div style={{ opacity: 0.75 }}>For authorized verification only</div>
      </footer>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: 'radial-gradient(1200px 700px at 15% 0%, #1a1a24 0%, #0b0b0f 55%)',
    color: '#fff',
    fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '18px 22px',
    borderBottom: '1px solid rgba(255,255,255,0.10)'
  },
  brand: { fontWeight: 700, letterSpacing: 0.5 },
  title: { fontSize: 14, opacity: 0.85, marginTop: 2 },
  headerRight: { display: 'flex', alignItems: 'center', gap: 14 },
  meta: { textAlign: 'right' },
  metaLabel: { fontSize: 12, opacity: 0.7 },
  metaValue: { fontSize: 14, fontWeight: 600 },
  linkButton: {
    background: 'transparent',
    color: '#fff',
    border: '1px solid rgba(255,255,255,0.18)',
    padding: '8px 10px',
    borderRadius: 10,
    cursor: 'pointer'
  },
  main: { maxWidth: 980, margin: '0 auto', padding: '22px' },
  footer: {
    maxWidth: 980,
    margin: '0 auto',
    padding: '20px 22px',
    display: 'flex',
    justifyContent: 'space-between',
    borderTop: '1px solid rgba(255,255,255,0.08)',
    opacity: 0.7
  }
};
