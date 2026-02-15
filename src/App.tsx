import { useEffect, useMemo, useState } from "react";
import { LoginPage } from "./pages/LoginPage";
import { SearchPage } from "./pages/SearchPage";
import { getSession, setSession, clearSession, type AppSession } from "./lib/session";
import { agencyAgentsList, agencyAgentCreate, agencyAgentDisable } from "./lib/api";
import { Container, Card, Field, Input, Button, Table, Th, Td, Tag, Alert, Divider, GOV_THEME } from "./components/UI";

export default function App() {
  const [session, setSessionState] = useState<AppSession | null>(() => getSession());

  useEffect(() => setSessionState(getSession()), []);

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
          <div style={styles.brandLeft}>
            <img
              src="/JobAppID-Logo.png"
              alt="JobAppID"
              style={styles.logo}
              onError={(e) => {
                // If logo path is wrong, at least don’t break layout
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
            />
            <div style={{ display: "grid", gap: 2 }}>
              <div style={styles.brand}>JobAppID</div>
              <div style={styles.sub}>Verification Portal</div>
            </div>
          </div>

          {session ? (
            <div style={styles.headerRight}>
              <div style={styles.meta}>
                <div style={styles.metaLabel}>Signed in as</div>
                <div style={styles.metaValue}>{signedInLabel}</div>
              </div>
              <Button variant="secondary" onClick={onLogout} type="button" style={{ padding: "10px 12px" }}>
                Sign out
              </Button>
            </div>
          ) : (
            <div style={styles.meta}>
              <div style={styles.metaLabel}>Security</div>
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
          <div style={{ color: GOV_THEME.faint }}>For authorized verification only</div>
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
        await agencyAgentCreate(props.agencyToken, { username, generate_password: false, password: manualPassword });
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

  useEffect(() => void loadAgents(), []);

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
        <div style={formGrid}>
          <Field label="Username" hint="Min 3 characters">
            <Input
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              placeholder="e.g. agent01"
              autoComplete="off"
            />
          </Field>

          <div style={{ display: "grid", gap: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: GOV_THEME.text }}>Password</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Button
                variant={passwordMode === "manual" ? "primary" : "secondary"}
                type="button"
                disabled={busy}
                onClick={() => {
                  setPasswordMode("manual");
                  setCreatedPassword(null);
                  setMsg("");
                }}
                style={{ padding: "10px 12px" }}
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
                  setMsg("");
                }}
                style={{ padding: "10px 12px" }}
              >
                Auto-generate
              </Button>
            </div>

            {passwordMode === "manual" ? (
              <Input
                value={manualPassword}
                onChange={(e) => setManualPassword(e.target.value)}
                placeholder="Min 6 characters"
                type="password"
                autoComplete="new-password"
              />
            ) : (
              <div style={{ fontSize: 12, color: GOV_THEME.muted }}>
                A password will be generated and shown one time after creation.
              </div>
            )}
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
          <Button onClick={createAgent} disabled={busy} type="button">
            {busy ? "Working…" : "Create agent"}
          </Button>
        </div>

        {createdPassword ? (
          <Alert tone="warn">
            <div style={{ fontWeight: 900 }}>Agent password (shown once)</div>
            <div style={{ marginTop: 6, fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" }}>
              {createdPassword}
            </div>
          </Alert>
        ) : null}

        {msg ? <Alert tone="neutral">{msg}</Alert> : null}

        <Divider />

        <div style={{ fontSize: 13, fontWeight: 900, color: GOV_THEME.text, marginBottom: 10 }}>Agents</div>
        <div style={{ overflowX: "auto" }}>
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
                    <Td style={{ fontWeight: 800 }}>{a.username}</Td>
                    <Td>{a.is_active ? <Tag tone="success">Active</Tag> : <Tag tone="danger">Disabled</Tag>}</Td>
                    <Td>{fmt(a.created_at)}</Td>
                    <Td>{a.last_login_at ? fmt(a.last_login_at) : "—"}</Td>
                    <Td style={{ textAlign: "right" }}>
                      <Button
                        variant="danger"
                        onClick={() => disableAgent(a.id)}
                        disabled={busy || !a.is_active}
                        type="button"
                        style={{ padding: "10px 12px" }}
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

function fmt(v: string) {
  try {
    return new Date(v).toLocaleString();
  } catch {
    return v;
  }
}

const formGrid: React.CSSProperties = {
  display: "grid",
  gap: 12,
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  alignItems: "start",
};

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: GOV_THEME.pageBg,
    color: GOV_THEME.text,
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
  },
  header: {
    position: "sticky",
    top: 0,
    zIndex: 50,
    background: GOV_THEME.headerBg,
    borderBottom: `1px solid ${GOV_THEME.border}`,
  },
  headerInner: {
    maxWidth: 1080,
    margin: "0 auto",
    padding: "14px 18px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  brandLeft: { display: "flex", alignItems: "center", gap: 12 },
  logo: { width: 134, height: 102, objectFit: "contain" },
  brand: { fontWeight: 900, letterSpacing: 0.2, lineHeight: 1.1 },
  sub: { fontSize: 12, color: GOV_THEME.muted, lineHeight: 1.1 },
  headerRight: { display: "flex", alignItems: "center", gap: 12 },
  meta: { textAlign: "right" },
  metaLabel: { fontSize: 11, color: GOV_THEME.faint },
  metaValue: { fontSize: 13, fontWeight: 800, color: GOV_THEME.text },
  main: { padding: "18px 0 28px 0" },
  footer: { borderTop: `1px solid ${GOV_THEME.border}`, background: "#fff" },
  footerInner: {
    maxWidth: 1080,
    margin: "0 auto",
    padding: "16px 18px",
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
    color: GOV_THEME.muted,
    fontSize: 12,
  },
};
