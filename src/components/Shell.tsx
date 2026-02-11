import type { PropsWithChildren } from 'react';

export function Shell({ children }: PropsWithChildren) {
  return (
    <div style={styles.page}>
      <div style={styles.topbar}>
        <div style={styles.brand}>
          <div style={styles.logoBox} aria-hidden />
          <div>
            <div style={styles.title}>JobAppID</div>
            <div style={styles.subtitle}>Verification Portal</div>
          </div>
        </div>
      </div>

      <div style={styles.container}>{children}</div>

      <div style={styles.footer}>
        <span style={{ opacity: 0.7 }}>Read-only verification • Audit logged</span>
      </div>
    </div>
  );
}

const styles: Record<string, any> = {
  page: {
    minHeight: '100vh',
    background: 'radial-gradient(1200px 700px at 15% 0%, #1a1a24 0%, #0b0b0f 55%)',
    color: '#fff',
    fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif'
  },
  topbar: {
    padding: '18px 18px 0 18px'
  },
  brand: {
    display: 'flex',
    gap: 12,
    alignItems: 'center'
  },
  logoBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    background: 'rgba(255,255,255,0.12)',
    boxShadow: '0 8px 24px rgba(0,0,0,0.35)'
  },
  title: {
    fontSize: 18,
    fontWeight: 800,
    letterSpacing: 0.2
  },
  subtitle: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 2
  },
  container: {
    maxWidth: 980,
    margin: '0 auto',
    padding: '18px'
  },
  footer: {
    maxWidth: 980,
    margin: '0 auto',
    padding: '10px 18px 24px 18px',
    fontSize: 12
  }
};
