import { useEffect, useMemo, useState } from "react";
import { LoginPage } from "./pages/LoginPage";
import { SearchPage } from "./pages/SearchPage";

type AgentSession = {
  kind: "agent";
  officeName: string;
  accessKey: string;
};

type AgencySession = {
  kind: "agency";
  agency_id: string;
  agency_name: string;
  agency_token: string;
};

export type PortalSession = AgentSession | AgencySession;

const STORAGE_KEY = "jobappid_verify_portal_session_v2";

function loadSession(): PortalSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);

    if (parsed?.kind === "agent") {
      if (typeof parsed.officeName === "string" && typeof parsed.accessKey === "string") {
        return { kind: "agent", officeName: parsed.officeName, accessKey: parsed.accessKey };
      }
    }

    if (parsed?.kind === "agency") {
      if (
        typeof parsed.agency_id === "string" &&
        typeof parsed.agency_name === "string" &&
        typeof parsed.agency_token === "string"
      ) {
        return {
          kind: "agency",
          agency_id: parsed.agency_id,
          agency_name: parsed.agency_name,
          agency_token: parsed.agency_token,
        };
      }
    }

    return null;
  } catch {
    return null;
  }
}

function saveSession(s: PortalSession) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

function clearSession() {
  localStorage.removeItem(STORAGE_KEY);
}

export default function App() {
  const [session, setSessionState] = useState<PortalSession | null>(() => loadSession());

  useEffect(() => {
    setSessionState(loadSession());
  }, []);

  const view = useMemo(() => {
    if (!session) return "login";
    if (session.kind === "agent") return "search";
    return "agency";
  }, [session]);

  function onSetSession(next: PortalSession) {
    saveSession(next);
    setSessionState(next);
  }

  function onLogout() {
    clearSession();
    setSessionState(null);
  }

  const signedInLabel =
    session?.kind === "agent"
      ? `Agent • ${session.officeName}`
      : session?.kind === "agency"
      ? `Agency • ${session.agency_name}`
      : "";

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
              <div style={styles.metaValue}>{signedInLabel}</div>
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
        {view === "login" ? (
          <LoginPage onSetSession={onSetSession} />
        ) : view === "search" ? (
          <SearchPage session={(session as any) as { officeName: string; accessKey: string }} />
        ) : (
          <LoginPage onSetSession={onSetSession} />
        )}
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
    minHeight: "100vh",
    background: "radial-gradient(1200px 700px at 15% 0%, #1a1a24 0%, #0b0b0f 55%)",
    color: "#fff",
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "18px 22px",
    borderBottom: "1px solid rgba(255,255,255,0.10)",
  },
  brand: { fontWeight: 800, letterSpacing: 0.6 },
  title: { fontSize: 14, opacity: 0.85, marginTop: 2 },
  headerRight: { display: "flex", alignItems: "center", gap: 14 },
  meta: { textAlign: "right" },
  metaLabel: { fontSize: 12, opacity: 0.7 },
  metaValue: { fontSize: 14, fontWeight: 700 },
  linkButton: {
    background: "transparent",
    color: "#fff",
    border: "1px solid rgba(255,255,255,0.18)",
    padding: "8px 10px",
    borderRadius: 10,
    cursor: "pointer",
    fontWeight: 800,
  },
  main: { maxWidth: 980, margin: "0 auto", padding: "22px" },
  footer: {
    maxWidth: 980,
    margin: "0 auto",
    padding: "20px 22px",
    display: "flex",
    justifyContent: "space-between",
    borderTop: "1px solid rgba(255,255,255,0.08)",
    opacity: 0.7,
  },
};
