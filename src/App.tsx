import { useEffect, useMemo, useState } from "react";
import { LoginPage } from "./pages/LoginPage";
import { SearchPage } from "./pages/SearchPage";
import { getSession, setSession, clearSession, type AppSession } from "./lib/session";
import { agencyAgentsList, agencyAgentCreate, agencyAgentDisable } from "./lib/api";

export default function App() {
  const [session, setSessionState] = useState<AppSession | null>(() => getSession());

  useEffect(() => {
    setSessionState(getSession());
  }, []);

  const view = useMemo(() => {
    if (!session) return "login";
    return session.kind === "agency" ? "agency" : "search";
  }, [session]);

  function onLogin(next: AppSession) {
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
              <div style={styles.metaValue}>
                {session.kind === "agency" ? session.agencyName : session.officeName}
              </div>
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
          <LoginPage onLogin={onLogin} />
        ) : view === "search" ? (
          <SearchPage session={session as any} />
        ) : (
          <AgencyDashboard agencyName={(session as any).agencyName} agencyToken={(session as any).agencyToken} />
        )}
      </main>

      <footer style={styles.footer}>
        <div>© {new Date().getFullYear()} JobAppID</div>
        <div style={{ opacity: 0.75 }}>For authorized verification only</div>
      </footer>
    </div>
  );
}

function AgencyDashboard(props: { agencyName: string; agencyToken: string }) {
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const [agents, setAgents] = useState<
    { id: string; username: string; is_active: boolean; created_at: string; last_login_at?: string | null }[]
  >([]);

  const [newUsername, setNewUsername] = useState("");
  const [createdPassword, setCreatedPassword] = useState<string | null>(null);

  async function loadAgents() {
    setMsg("");
    setCreatedPassword(null);
    setBusy(true);
    try {
      const r = await agencyAgentsList(props.agencyToken);
      setAgents(r.agents || []);
    } catch (e: any) {
      setMsg(e?.message || String(e));
    } finally {
      setBusy(false);
    }
  }

  async function createAgent() {
    setMsg("");
    setCreatedPassword(null);

    const username = newUsername.trim();
    if (username.length < 3) return setMsg("Username must be at least 3 characters.");

    setBusy(true);
    try {
      const r = await agencyAgentCreate(props.agencyToken, { username, generate_password: true });
      setCreatedPassword(r.password);
      setNewUsername("");
      await loadAgents();
      setMsg("Agent created. Copy the password now — it will not be shown again.");
    } catch (e: any) {
      setMsg(e?.message || String(e));
    } finally {
      setBusy(false);
    }
  }

  async function disableAgent(agent_id: string) {
    setMsg("");
    setCreatedPassword(null);
    setBusy(true);
    try {
      await agencyAgentDisable(props.agencyToken, agent_id);
      await loadAgents();
      setMsg("Agent disabled.");
    } catch (e: any) {
      setMsg(e?.message || String(e));
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    loadAgents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div style={card.card}>
        <h2 style={{ margin: 0, fontSize: 18 }}>Agency Dashboard</h2>
        <div style={{ marginTop: 6, opacity: 0.8 }}>
          Signed in as <b>{props.agencyName}</b>. Create agents and manage access.
        </div>

        <div style={{ marginTop: 14, display: "grid", gap: 10, gridTemplateColumns: "1fr auto" }}>
          <input
            style={card.input}
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
            placeholder="New agent username (e.g. agent01)"
            autoComplete="off"
          />
          <button style={card.primaryBtn} onClick={createAgent} disabled={busy}>
            {busy ? "Working…" : "Create agent"}
          </button>
        </div>

        {createdPassword ? (
          <div style={card.notice}>
            <div style={{ fontWeight: 900 }}>Agent password (shown once):</div>
            <div style={{ marginTop: 6, fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" }}>
              {createdPassword}
            </div>
          </div>
        ) : null}

        <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button style={card.secondaryBtn} onClick={loadAgents} disabled={busy}>
            {busy ? "Loading…" : "Refresh list"}
          </button>
        </div>

        {msg ? <div style={card.msg}>{msg}</div> : null}
      </div>

      <div style={card.card}>
        <h3 style={{ margin: 0, fontSize: 15 }}>Agents</h3>
        <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
          {agents.length === 0 ? (
            <div style={{ opacity: 0.75 }}>No agents yet.</div>
          ) : (
            agents.map((a) => (
              <div key={a.id} style={card.row}>
                <div>
                  <div style={{ fontWeight: 900 }}>{a.username}</div>
                  <div style={{ opacity: 0.75, fontSize: 12 }}>
                    active: {String(a.is_active)} • created: {new Date(a.created_at).toLocaleString()}
                    {a.last_login_at ? ` • last login: ${new Date(a.last_login_at).toLocaleString()}` : ""}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    style={card.dangerBtn}
                    onClick={() => disableAgent(a.id)}
                    disabled={busy || !a.is_active}
                    title={!a.is_active ? "Already disabled" : "Disable agent"}
                  >
                    Disable
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
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
  brand: { fontWeight: 700, letterSpacing: 0.5 },
  title: { fontSize: 14, opacity: 0.85, marginTop: 2 },
  headerRight: { display: "flex", alignItems: "center", gap: 14 },
  meta: { textAlign: "right" },
  metaLabel: { fontSize: 12, opacity: 0.7 },
  metaValue: { fontSize: 14, fontWeight: 600 },
  linkButton: {
    background: "transparent",
    color: "#fff",
    border: "1px solid rgba(255,255,255,0.18)",
    padding: "8px 10px",
    borderRadius: 10,
    cursor: "pointer",
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

const card: Record<string, React.CSSProperties> = {
  card: {
    background: "rgba(19,19,26,0.95)",
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 18,
    padding: 22,
    boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
  },
  input: {
    width: "100%",
    padding: "12px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(0,0,0,0.35)",
    color: "#fff",
    outline: "none",
  },
  primaryBtn: {
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "#fff",
    color: "#111",
    fontWeight: 900,
    cursor: "pointer",
  },
  secondaryBtn: {
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.18)",
    background: "transparent",
    color: "#fff",
    fontWeight: 800,
    cursor: "pointer",
  },
  dangerBtn: {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,157,157,0.5)",
    background: "rgba(255,157,157,0.18)",
    color: "#fff",
    fontWeight: 900,
    cursor: "pointer",
  },
  row: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.04)",
  },
  msg: {
    marginTop: 12,
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.04)",
  },
  notice: {
    marginTop: 12,
    padding: "12px 12px",
    borderRadius: 12,
    border: "1px solid rgba(245,201,55,0.35)",
    background: "rgba(245,201,55,0.10)",
  },
};
