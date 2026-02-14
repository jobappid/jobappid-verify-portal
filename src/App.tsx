import { useEffect, useMemo, useState } from "react";
import { LoginPage } from "./pages/LoginPage";
import { SearchPage } from "./pages/SearchPage";
import { getSession, setSession, clearSession, type AppSession } from "./lib/session";
import { agencyAgentsList, agencyAgentCreate, agencyAgentDisable } from "./lib/api";
import { Container, Card, Field, Input, Button, Alert, Divider, SectionTitle } from "./components/UI";

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
            <AgencyDashboard agencyName={(session as any).agencyName} agencyToken={(session as any).agencyToken} />
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

    if (passwordMode === "manual" && manualPassword.trim().length < 6) {
      return setMsg("Password must be at least 6 characters.");
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

  const msgTone =
    msg.toLowerCase().includes("failed") || msg.toLowerCase().includes("error")
      ? "danger"
      : msg.toLowerCase().includes("created") || msg.toLowerCase().includes("disabled")
      ? "success"
      : "neutral";

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <Card
        title="Agency Dashboard"
        subtitle={
          <>
            Signed in as <b>{props.agencyName}</b>. Create agents and manage access.
          </>
        }
        right={
          <Button variant="secondary" onClick={loadAgents} disabled={busy} type="button" style={{ padding: "10px 12px" }}>
            {busy ? "Loading…" : "Refresh"}
          </Button>
        }
      >
        <SectionTitle>Create agent</SectionTitle>
        <div style={grid.form}>
          <Field label="Username" hint="Min 3 characters">
            <Input
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              placeholder="e.g. agent01"
              autoComplete="off"
            />
          </Field>

          <div style={grid.modeRow}>
            <button
              type="button"
              onClick={() => {
                setPasswordMode("manual");
                setCreatedPassword(null);
                setMsg("");
              }}
              style={{ ...mode.btn, ...(passwordMode === "manual" ? mode.active : {}) }}
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
              style={{ ...mode.btn, ...(passwordMode === "auto" ? mode.active : {}) }}
              disabled={busy}
            >
              Auto-generate
            </button>
          </div>

          {passwordMode === "manual" ? (
            <Field label="Password" hint="Min 6 characters">
              <Input
                value={manualPassword}
                onChange={(e) => setManualPassword(e.target.value)}
                placeholder="Agent password"
                type="password"
                autoComplete="new-password"
              />
            </Field>
          ) : (
            <Alert tone="warn">A password will be generated and shown one time after creation.</Alert>
          )}

          <Button onClick={createAgent} disabled={busy} type="button">
            {busy ? "Working…" : "Create agent"}
          </Button>
        </div>

        {createdPassword ? (
          <Alert tone="warn">
            <div style={{ fontWeight: 900, marginBottom: 6 }}>Agent password (shown once):</div>
            <div style={mono.password}>{createdPassword}</div>
          </Alert>
        ) : null}

        {msg ? <Alert tone={msgTone as any}>{msg}</Alert> : null}

        <Divider />

        <SectionTitle>Agents</SectionTitle>

        <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
          {agents.length === 0 ? (
            <div style={{ opacity: 0.75 }}>No agents yet.</div>
          ) : (
            agents.map((a) => (
              <div key={a.id} style={grid.row}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 950, letterSpacing: 0.2 }}>{a.username}</div>
                  <div style={grid.rowMeta}>
                    status: <b>{a.is_active ? "active" : "disabled"}</b> • created: {safeDate(a.created_at)}
                    {a.last_login_at ? ` • last login: ${safeDate(a.last_login_at)}` : ""}
                  </div>
                </div>

                <Button
                  variant="danger"
                  onClick={() => disableAgent(a.id)}
                  disabled={busy || !a.is_active}
                  type="button"
                  style={{ padding: "10px 12px", whiteSpace: "nowrap" }}
                  title={!a.is_active ? "Already disabled" : "Disable agent"}
                >
                  Disable
                </Button>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}

function safeDate(v: string) {
  try {
    return new Date(v).toLocaleString();
  } catch {
    return v;
  }
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
  main: { padding: "22px 0 30px 0" },
  footer: { borderTop: "1px solid rgba(255,255,255,0.08)", opacity: 0.75 },
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

const grid: Record<string, React.CSSProperties> = {
  form: { display: "grid", gap: 12, marginTop: 10 },
  modeRow: { display: "flex", gap: 10, flexWrap: "wrap" },
  row: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    padding: "12px 12px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.04)",
  },
  rowMeta: { opacity: 0.75, fontSize: 12, marginTop: 4, lineHeight: 1.25 },
};

const mode: Record<string, React.CSSProperties> = {
  btn: {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.18)",
    background: "rgba(0,0,0,0.20)",
    color: "#fff",
    fontWeight: 950,
    cursor: "pointer",
  },
  active: { background: "#fff", color: "#111", border: "1px solid rgba(255,255,255,0.14)" },
};

const mono: Record<string, React.CSSProperties> = {
  password: {
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
    wordBreak: "break-all",
    fontWeight: 900,
  },
};
