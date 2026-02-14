import { useEffect, useMemo, useState } from "react";
import { LoginPage } from "./pages/LoginPage";
import { SearchPage } from "./pages/SearchPage";
import { getSession, setSession, clearSession, type AppSession } from "./lib/session";
import { agencyAgentsList, agencyAgentCreate, agencyAgentDisable } from "./lib/api";
import { Container } from "./components/UI";

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

  const signedInLabel =
    session?.kind === "agency" ? session.agencyName : session?.kind === "agent" ? session.officeName : "";

  return (
    <div style={styles.page}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <div style={styles.headerLeft}>
            <div style={styles.brandRow}>
              <div style={styles.brand}>JobAppID</div>
              <div style={styles.badge}>Verification</div>
            </div>
            <div style={styles.title}>Verification Portal</div>
          </div>

          {session ? (
            <div style={styles.headerRight}>
              <div style={styles.meta}>
                <div style={styles.metaLabel}>Signed in as</div>
                <div style={styles.metaValue}>{signedInLabel}</div>
              </div>

              <button onClick={onLogout} style={styles.linkButton} type="button">
                Sign out
              </button>
            </div>
          ) : (
            <div style={styles.meta}>
              <div style={styles.metaLabel}>Read-only</div>
              <div style={styles.metaValue}>Audit logged</div>
            </div>
          )}
        </div>
      </header>

      {/* Main */}
      <main style={styles.main}>
        <Container>
          {view === "login" ? (
            <LoginPage onLogin={onLogin} />
          ) : view === "search" ? (
            <SearchPage session={session as any} />
          ) : (
            <AgencyDashboard
              agencyName={(session as any).agencyName}
              agencyToken={(session as any).agencyToken}
            />
          )}
        </Container>
      </main>

      {/* Footer */}
      <footer style={styles.footer}>
        <div style={styles.footerInner}>
          <div>© {new Date().getFullYear()} JobAppID</div>
          <div style={{ opacity: 0.75 }}>For authorized verification only</div>
        </div>
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
  const [passwordMode, setPasswordMode] = useState<"manual" | "auto">("manual");
  const [manualPassword, setManualPassword] = useState("");
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

    if (passwordMode === "manual") {
      if (manualPassword.trim().length < 6) return setMsg("Password must be at least 6 characters.");
    }

    setBusy(true);
    try {
      if (passwordMode === "auto") {
        const r = await agencyAgentCreate(props.agencyToken, { username, generate_password: true });
        setCreatedPassword(r.password);
        setMsg("Agent created. Copy the password now — it will not be shown again.");
      } else {
        await agencyAgentCreate(props.agencyToken, {
          username,
          generate_password: false,
          password: manualPassword,
        });
        setMsg("Agent created with your password.");
      }

      setNewUsername("");
      setManualPassword("");
      await loadAgents();
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

        <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
          <input
            style={card.input}
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
            placeholder="New agent username (e.g. agent01)"
            autoComplete="off"
          />

          <div style={card.modeRow}>
            <button
              type="button"
              onClick={() => {
                setPasswordMode("manual");
                setCreatedPassword(null);
                setMsg("");
              }}
              style={{ ...card.modeBtn, ...(passwordMode === "manual" ? card.modeBtnActive : {}) }}
              disabled={busy}
            >
              Set password
            </button>

            <button
              type="button"
              onClick={() => {
                setPasswordMode("auto");
                setManualPassword("");
                setCreatedPassword(null);
                setMsg("");
              }}
              style={{ ...card.modeBtn, ...(passwordMode === "auto" ? card.modeBtnActive : {}) }}
              disabled={busy}
            >
              Auto-generate password
            </button>
          </div>

          {passwordMode === "manual" ? (
            <input
              style={card.input}
              value={manualPassword}
              onChange={(e) => setManualPassword(e.target.value)}
              placeholder="Agent password (min 6)"
              type="password"
              autoComplete="new-password"
            />
          ) : (
            <div style={card.helperText}>A password will be generated and shown one time after creation.</div>
          )}

          <div style={{ display: "grid", gap: 10, gridTemplateColumns: "1fr auto" }}>
            <button style={card.secondaryBtn} onClick={loadAgents} disabled={busy} type="button">
              {busy ? "Loading…" : "Refresh list"}
            </button>

            <button style={card.primaryBtn} onClick={createAgent} disabled={busy} type="button">
              {busy ? "Working…" : "Create agent"}
            </button>
          </div>
        </div>

        {createdPassword ? (
          <div style={card.notice}>
            <div style={{ fontWeight: 900 }}>Agent password (shown once):</div>
            <div
              style={{
                marginTop: 6,
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                wordBreak: "break-all",
              }}
            >
              {createdPassword}
            </div>
          </div>
        ) : null}

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
                <button
                  style={card.dangerBtn}
                  onClick={() => disableAgent(a.id)}
                  disabled={busy || !a.is_active}
                  title={!a.is_active ? "Already disabled" : "Disable agent"}
                  type="button"
                >
                  Disable
                </button>
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
    position: "sticky",
    top: 0,
    zIndex: 20,
    backdropFilter: "blur(10px)",
    background: "rgba(11,11,15,0.65)",
    borderBottom: "1px solid rgba(255,255,255,0.10)",
  },
  headerInner: {
    maxWidth: 980,
    margin: "0 auto",
    padding: "16px 22px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
  },
  headerLeft: { display: "grid", gap: 4 },
  brandRow: { display: "flex", alignItems: "center", gap: 10 },
  brand: { fontWeight: 900, letterSpacing: 0.5 },
  badge: {
    fontSize: 11,
    fontWeight: 900,
    padding: "4px 8px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.16)",
    background: "rgba(255,255,255,0.06)",
    opacity: 0.92,
  },
  title: { fontSize: 13, opacity: 0.85 },
  headerRight: { display: "flex", alignItems: "center", gap: 14 },
  meta: { textAlign: "right" },
  metaLabel: { fontSize: 12, opacity: 0.7 },
  metaValue: { fontSize: 14, fontWeight: 700 },
  linkButton: {
    background: "transparent",
    color: "#fff",
    border: "1px solid rgba(255,255,255,0.18)",
    padding: "8px 10px",
    borderRadius: 12,
    cursor: "pointer",
    fontWeight: 800,
  },
  main: {
    padding: "22px 0 30px 0",
  },
  footer: {
    borderTop: "1px solid rgba(255,255,255,0.08)",
    opacity: 0.75,
  },
  footerInner: {
    maxWidth: 980,
    margin: "0 auto",
    padding: "18px 22px",
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    flexWrap: "wrap",
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
  helperText: { fontSize: 12, opacity: 0.8, lineHeight: 1.35 },
  modeRow: { display: "flex", gap: 10, flexWrap: "wrap" },
  modeBtn: {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.18)",
    background: "rgba(0,0,0,0.20)",
    color: "#fff",
    fontWeight: 900,
    cursor: "pointer",
  },
  modeBtnActive: { background: "#fff", color: "#111" },
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
