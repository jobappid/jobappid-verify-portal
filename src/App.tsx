import { useEffect, useMemo, useState } from "react";
import { LoginPage } from "./pages/LoginPage";
import { SearchPage } from "./pages/SearchPage";
import { getSession, setSession, clearSession, type AppSession } from "./lib/session";
import { agencyAgentsList, agencyAgentCreate, agencyAgentDisable } from "./lib/api";
import { Container, Card, Field, Input, Button, Alert, Divider, Tag, Table, Th, Td, GOV_THEME } from "./components/UI";

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
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <div style={styles.headerLeft}>
            <div style={styles.brandLine}>
              <div style={styles.brand}>JobAppID</div>
              <Tag>Verification</Tag>
            </div>
            <div style={styles.subtitle}>Verification Portal</div>
          </div>

          {session ? (
            <div style={styles.headerRight}>
              <div style={styles.meta}>
                <div style={styles.metaLabel}>Signed in as</div>
                <div style={styles.metaValue}>{signedInLabel}</div>
              </div>

              <Button variant="secondary" onClick={onLogout} type="button">
                Sign out
              </Button>
            </div>
          ) : (
            <div style={styles.meta}>
              <div style={styles.metaLabel}>Read-only</div>
              <div style={styles.metaValue}>Audit logged</div>
            </div>
          )}
        </div>
      </header>

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

      <footer style={styles.footer}>
        <div style={styles.footerInner}>
          <div>© {new Date().getFullYear()} JobAppID</div>
          <div style={{ color: GOV_THEME.muted }}>For authorized verification only</div>
        </div>
      </footer>
    </div>
  );
}

function AgencyDashboard(props: { agencyName: string; agencyToken: string }) {
  const [msg, setMsg] = useState<{ tone: "neutral" | "danger" | "success" | "warn"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const [agents, setAgents] = useState<
    { id: string; username: string; is_active: boolean; created_at: string; last_login_at?: string | null }[]
  >([]);

  const [newUsername, setNewUsername] = useState("");
  const [passwordMode, setPasswordMode] = useState<"manual" | "auto">("manual");
  const [manualPassword, setManualPassword] = useState("");
  const [createdPassword, setCreatedPassword] = useState<string | null>(null);

  async function loadAgents() {
    setMsg(null);
    setCreatedPassword(null);
    setBusy(true);
    try {
      const r = await agencyAgentsList(props.agencyToken);
      setAgents(r.agents || []);
    } catch (e: any) {
      setMsg({ tone: "danger", text: e?.message || String(e) });
    } finally {
      setBusy(false);
    }
  }

  async function createAgent() {
    setMsg(null);
    setCreatedPassword(null);

    const username = newUsername.trim();
    if (username.length < 3) return setMsg({ tone: "warn", text: "Username must be at least 3 characters." });

    if (passwordMode === "manual") {
      if (manualPassword.trim().length < 6) return setMsg({ tone: "warn", text: "Password must be at least 6 characters." });
    }

    setBusy(true);
    try {
      if (passwordMode === "auto") {
        const r = await agencyAgentCreate(props.agencyToken, { username, generate_password: true });
        setCreatedPassword(r.password);
        setMsg({ tone: "success", text: "Agent created. Copy the password now — it will not be shown again." });
      } else {
        await agencyAgentCreate(props.agencyToken, { username, generate_password: false, password: manualPassword });
        setMsg({ tone: "success", text: "Agent created with your password." });
      }

      setNewUsername("");
      setManualPassword("");
      await loadAgents();
    } catch (e: any) {
      setMsg({ tone: "danger", text: e?.message || String(e) });
    } finally {
      setBusy(false);
    }
  }

  async function disableAgent(agent_id: string) {
    setMsg(null);
    setCreatedPassword(null);
    setBusy(true);
    try {
      await agencyAgentDisable(props.agencyToken, agent_id);
      await loadAgents();
      setMsg({ tone: "success", text: "Agent disabled." });
    } catch (e: any) {
      setMsg({ tone: "danger", text: e?.message || String(e) });
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
      <Card
        title="Agency Dashboard"
        subtitle={
          <>
            Signed in as <b>{props.agencyName}</b>. Create agents and manage access.
          </>
        }
        right={
          <Button variant="secondary" onClick={loadAgents} disabled={busy} type="button">
            {busy ? "Refreshing…" : "Refresh"}
          </Button>
        }
      >
        <div style={formGrid}>
          <Field label="New agent username" hint="Minimum 3 characters">
            <Input
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              placeholder="e.g. agent01"
              autoComplete="off"
            />
          </Field>

          <div style={{ display: "grid", gap: 8 }}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Button
                variant={passwordMode === "manual" ? "primary" : "secondary"}
                type="button"
                disabled={busy}
                onClick={() => {
                  setPasswordMode("manual");
                  setCreatedPassword(null);
                  setMsg(null);
                }}
              >
                Set password
              </Button>

              <Button
                variant={passwordMode === "auto" ? "primary" : "secondary"}
                type="button"
                disabled={busy}
                onClick={() => {
                  setPasswordMode("auto");
                  setManualPassword("");
                  setCreatedPassword(null);
                  setMsg(null);
                }}
              >
                Auto-generate
              </Button>
            </div>

            {passwordMode === "manual" ? (
              <Field label="Password" hint="Minimum 6 characters">
                <Input
                  value={manualPassword}
                  onChange={(e) => setManualPassword(e.target.value)}
                  placeholder="Agent password"
                  type="password"
                  autoComplete="new-password"
                />
              </Field>
            ) : (
              <div style={{ fontSize: 13, color: GOV_THEME.muted }}>
                A password will be generated and shown once after creation.
              </div>
            )}
          </div>
        </div>

        <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Button onClick={createAgent} disabled={busy} type="button">
            {busy ? "Working…" : "Create agent"}
          </Button>
        </div>

        {createdPassword ? (
          <Alert tone="warn">
            <b>Agent password (shown once):</b>
            <div style={{ marginTop: 6, fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" }}>
              {createdPassword}
            </div>
          </Alert>
        ) : null}

        {msg ? <Alert tone={msg.tone}>{msg.text}</Alert> : null}

        <Divider />

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <div style={{ fontSize: 14, fontWeight: 800 }}>Agents</div>
          <div style={{ color: GOV_THEME.muted, fontSize: 13 }}>{agents.length} total</div>
        </div>

        <div style={{ marginTop: 10 }}>
          <Table>
            <thead>
              <tr>
                <Th>Username</Th>
                <Th>Status</Th>
                <Th>Created</Th>
                <Th>Last login</Th>
                <Th></Th>
              </tr>
            </thead>
            <tbody>
              {agents.length === 0 ? (
                <tr>
                  <Td colSpan={5}>No agents yet.</Td>
                </tr>
              ) : (
                agents.map((a) => (
                  <tr key={a.id}>
                    <Td><b>{a.username}</b></Td>
                    <Td>
                      {a.is_active ? <Tag tone="info">active</Tag> : <Tag tone="danger">disabled</Tag>}
                    </Td>
                    <Td>{safeDate(a.created_at)}</Td>
                    <Td>{a.last_login_at ? safeDate(a.last_login_at) : "—"}</Td>
                    <Td>
                      <Button
                        variant="danger"
                        onClick={() => disableAgent(a.id)}
                        disabled={busy || !a.is_active}
                        type="button"
                      >
                        Disable
                      </Button>
                    </Td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
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
    background: GOV_THEME.bg,
    color: GOV_THEME.text,
    fontFamily:
      'system-ui, -apple-system, "Segoe UI", Roboto, Arial, "Noto Sans", "Liberation Sans", sans-serif',
  },
  header: {
    background: "#ffffff",
    borderBottom: `1px solid ${GOV_THEME.lineSoft}`,
  },
  headerInner: {
    maxWidth: 1040,
    margin: "0 auto",
    padding: "14px 18px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
    flexWrap: "wrap",
  },
  headerLeft: { display: "grid", gap: 4 },
  brandLine: { display: "flex", alignItems: "center", gap: 10 },
  brand: { fontWeight: 900, letterSpacing: 0.2 },
  subtitle: { fontSize: 13, color: GOV_THEME.muted },
  headerRight: { display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" },
  meta: { textAlign: "right" },
  metaLabel: { fontSize: 12, color: GOV_THEME.muted },
  metaValue: { fontSize: 14, fontWeight: 800 },
  main: { padding: "12px 0 18px 0" },
  footer: {
    background: "#ffffff",
    borderTop: `1px solid ${GOV_THEME.lineSoft}`,
  },
  footerInner: {
    maxWidth: 1040,
    margin: "0 auto",
    padding: "14px 18px",
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    flexWrap: "wrap",
    fontSize: 13,
    color: GOV_THEME.muted,
  },
};

const formGrid: React.CSSProperties = {
  display: "grid",
  gap: 12,
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
};
