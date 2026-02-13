import { useMemo, useState } from "react";
import {
  agencyLogin,
  agentLogin,
  agencyAgentsList,
  agencyAgentCreate,
  agencyAgentDisable,
} from "../lib/api";

type Props = {
  onSetSession: (s: any) => void;
};

type Tab = "agency_signin" | "agent_signin" | "agency_signup";

export function LoginPage({ onSetSession }: Props) {
  const [tab, setTab] = useState<Tab>("agency_signin");

  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  // Agency sign-in
  const [agencyName, setAgencyName] = useState("");
  const [agencyPass, setAgencyPass] = useState("");

  // Agent sign-in
  const [agentAgencyName, setAgentAgencyName] = useState("");
  const [agentUsername, setAgentUsername] = useState("");
  const [agentPass, setAgentPass] = useState("");

  // Agency sign-up (kept for your existing approval flow placeholder UI)
  const [signupAgencyName, setSignupAgencyName] = useState("");
  const [signupAgencyPass, setSignupAgencyPass] = useState("");
  const [showApproval, setShowApproval] = useState(false);
  const [approvalCode, setApprovalCode] = useState("");

  // Agency dashboard state (after agency sign-in)
  const [agencyToken, setAgencyToken] = useState<string>("");
  const [agencyId, setAgencyId] = useState<string>("");
  const [agencyDisplay, setAgencyDisplay] = useState<string>("");

  const [agents, setAgents] = useState<
    { id: string; username: string; is_active: boolean; created_at: string; last_login_at?: string | null }[]
  >([]);

  const [newUsername, setNewUsername] = useState("");
  const [genPass, setGenPass] = useState(true);
  const [newPassword, setNewPassword] = useState("");
  const [createdPasswordOnce, setCreatedPasswordOnce] = useState<string>("");

  const isAgencyAuthed = !!agencyToken;

  const canAgencySignin = useMemo(() => {
    return agencyName.trim().length >= 2 && agencyPass.length >= 6 && !busy;
  }, [agencyName, agencyPass, busy]);

  const canAgentSignin = useMemo(() => {
    return (
      agentAgencyName.trim().length >= 2 &&
      agentUsername.trim().length >= 2 &&
      agentPass.length >= 6 &&
      !busy
    );
  }, [agentAgencyName, agentUsername, agentPass, busy]);

  async function submitAgencySignin() {
    setMsg("");
    setCreatedPasswordOnce("");

    const name = agencyName.trim();
    const pass = agencyPass;

    setBusy(true);
    try {
      const r = await agencyLogin(name, pass);

      // store in-app session
      onSetSession({
        kind: "agency",
        agency_id: r.agency_id,
        agency_name: r.agency_name,
        agency_token: r.agency_token,
      });

      // also keep local dashboard state so this component can render dashboard immediately
      setAgencyToken(r.agency_token);
      setAgencyId(r.agency_id);
      setAgencyDisplay(r.agency_name);

      await refreshAgents(r.agency_token);
    } catch (e: any) {
      setMsg(`Agency sign-in failed: ${e?.message || e}`);
    } finally {
      setBusy(false);
    }
  }

  async function submitAgentSignin() {
    setMsg("");

    const agency_name = agentAgencyName.trim();
    const username = agentUsername.trim();
    const password = agentPass;

    setBusy(true);
    try {
      const r = await agentLogin(agency_name, username, password);

      onSetSession({ kind: "agent", officeName: r.officeName, accessKey: r.accessKey });
    } catch (e: any) {
      setMsg(`Agent sign-in failed: ${e?.message || e}`);
    } finally {
      setBusy(false);
    }
  }

  async function refreshAgents(token?: string) {
    const t = token || agencyToken;
    if (!t) return;

    setMsg("");
    setBusy(true);
    try {
      const r = await agencyAgentsList(t);
      setAgents(r.agents || []);
    } catch (e: any) {
      setMsg(`Load agents failed: ${e?.message || e}`);
    } finally {
      setBusy(false);
    }
  }

  async function createAgent() {
    setMsg("");
    setCreatedPasswordOnce("");

    if (!agencyToken) return setMsg("Missing agency token. Please sign in again.");
    const username = newUsername.trim();
    if (username.length < 2) return setMsg("Enter an agent username (min 2 chars).");

    const payload = genPass
      ? { username, generate_password: true }
      : { username, password: newPassword, generate_password: false };

    if (!genPass && String(newPassword || "").length < 6) {
      return setMsg("Agent password must be at least 6 characters (or enable Generate).");
    }

    setBusy(true);
    try {
      const r = await agencyAgentCreate(agencyToken, payload);
      setCreatedPasswordOnce(r.password || "");
      setNewUsername("");
      setNewPassword("");
      await refreshAgents();
    } catch (e: any) {
      setMsg(`Create agent failed: ${e?.message || e}`);
    } finally {
      setBusy(false);
    }
  }

  async function disableAgent(agent_id: string) {
    setMsg("");
    if (!agencyToken) return setMsg("Missing agency token. Please sign in again.");

    setBusy(true);
    try {
      await agencyAgentDisable(agencyToken, agent_id);
      await refreshAgents();
    } catch (e: any) {
      setMsg(`Disable failed: ${e?.message || e}`);
    } finally {
      setBusy(false);
    }
  }

  // NOTE: This is UI-only placeholder to preserve your “approval” concept.
  // If you want, next step is: wire these to your existing /agency/onboard + /agency/approve endpoints.
  function submitAgencySignupPlaceholder() {
    setMsg(
      "Signup flow is currently placeholder UI. If you want it wired to your existing approval endpoints, send your current API signup/approve endpoints and I’ll hook it up clean."
    );
    setShowApproval(true);
  }

  function submitApprovalPlaceholder() {
    setMsg(
      "Approval flow is currently placeholder UI. If you want it wired, we’ll connect this to your existing /agency/approve endpoint."
    );
    setApprovalCode("");
  }

  // ==========================
  // Render
  // ==========================

  if (isAgencyAuthed) {
    return (
      <div style={styles.card}>
        <div style={styles.brandRow}>
          <img src="/JobAppID-Logo.png" alt="JobAppID" style={styles.logo} />
        </div>

        <h2 style={styles.h2}>Agency Dashboard</h2>
        <p style={styles.p}>
          Signed in: <b>{agencyDisplay}</b>
        </p>

        <div style={styles.sectionTitle}>Create agent</div>
        <div style={styles.grid2}>
          <Field label="Agent username">
            <input
              style={styles.input}
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              placeholder="e.g., caseworker_1"
              autoComplete="off"
            />
          </Field>

          <Field label="Password mode">
            <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 6 }}>
              <label style={styles.inlineLabel}>
                <input
                  type="checkbox"
                  checked={genPass}
                  onChange={(e) => setGenPass(e.target.checked)}
                />{" "}
                Generate password automatically
              </label>
            </div>

            {!genPass ? (
              <input
                style={{ ...styles.input, marginTop: 10 }}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Set agent password"
                type="password"
                autoComplete="new-password"
              />
            ) : (
              <div style={{ marginTop: 10, fontSize: 12, opacity: 0.75 }}>
                A strong password will be generated and shown once.
              </div>
            )}
          </Field>
        </div>

        <button style={styles.button} onClick={createAgent} disabled={busy}>
          {busy ? "Working…" : "Create agent"}
        </button>

        {createdPasswordOnce ? (
          <div style={styles.successBox}>
            <div style={{ fontWeight: 900, marginBottom: 6 }}>Agent created</div>
            <div style={{ fontSize: 13, opacity: 0.9 }}>
              This password is shown <b>once</b>. Save it now:
            </div>
            <div style={styles.mono}>{createdPasswordOnce}</div>
          </div>
        ) : null}

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 18 }}>
          <div style={styles.sectionTitle}>Agents</div>
          <button style={styles.secondaryBtn} onClick={() => refreshAgents()} disabled={busy}>
            Refresh
          </button>
        </div>

        <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
          {agents.length === 0 ? (
            <div style={{ opacity: 0.75, fontSize: 13 }}>No agents found yet.</div>
          ) : (
            agents.map((a) => (
              <div key={a.id} style={styles.agentRow}>
                <div>
                  <div style={{ fontWeight: 900 }}>{a.username}</div>
                  <div style={{ opacity: 0.75, fontSize: 12 }}>
                    active: {String(a.is_active)} • created: {fmtDate(a.created_at)}
                    {a.last_login_at ? ` • last login: ${fmtDate(a.last_login_at)}` : ""}
                  </div>
                </div>

                <button
                  style={styles.dangerBtn}
                  disabled={busy || !a.is_active}
                  onClick={() => disableAgent(a.id)}
                  title="Disable / terminate agent"
                >
                  Disable
                </button>
              </div>
            ))
          )}
        </div>

        {msg ? <div style={styles.msg}>{msg}</div> : null}
      </div>
    );
  }

  return (
    <div style={styles.card}>
      <div style={styles.brandRow}>
        <img src="/JobAppID-Logo.png" alt="JobAppID" style={styles.logo} />
      </div>

      <h2 style={styles.h2}>Verification Portal</h2>
      <p style={styles.p}>Authorized agencies only. All searches are audited.</p>

      <div style={styles.tabs}>
        <TabButton active={tab === "agency_signin"} onClick={() => setTab("agency_signin")}>
          Agency Sign In
        </TabButton>
        <TabButton active={tab === "agent_signin"} onClick={() => setTab("agent_signin")}>
          Agent Sign In
        </TabButton>
        <TabButton active={tab === "agency_signup"} onClick={() => setTab("agency_signup")}>
          Agency Sign Up
        </TabButton>
      </div>

      {tab === "agency_signin" ? (
        <>
          <div style={styles.sectionTitle}>Agency sign in</div>
          <div style={styles.sectionNote}>
            Use your <b>Agency Name</b> + <b>Agency Password</b>. If your agency is approved, you’ll access the dashboard
            to manage agents.
          </div>

          <label style={styles.label}>Agency name</label>
          <input style={styles.input} value={agencyName} onChange={(e) => setAgencyName(e.target.value)} />

          <label style={styles.label}>Agency password</label>
          <input
            style={styles.input}
            type="password"
            value={agencyPass}
            onChange={(e) => setAgencyPass(e.target.value)}
          />

          <button style={styles.button} onClick={submitAgencySignin} disabled={!canAgencySignin}>
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </>
      ) : null}

      {tab === "agent_signin" ? (
        <>
          <div style={styles.sectionTitle}>Agent sign in</div>
          <div style={styles.sectionNote}>
            Agents only get access to <b>Applicant Lookup</b>. Your agency provides your username/password.
          </div>

          <label style={styles.label}>Agency name</label>
          <input
            style={styles.input}
            value={agentAgencyName}
            onChange={(e) => setAgentAgencyName(e.target.value)}
          />

          <label style={styles.label}>Agent username</label>
          <input style={styles.input} value={agentUsername} onChange={(e) => setAgentUsername(e.target.value)} />

          <label style={styles.label}>Agent password</label>
          <input
            style={styles.input}
            type="password"
            value={agentPass}
            onChange={(e) => setAgentPass(e.target.value)}
          />

          <button style={styles.button} onClick={submitAgentSignin} disabled={!canAgentSignin}>
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </>
      ) : null}

      {tab === "agency_signup" ? (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <div style={styles.sectionTitle}>Agency sign up</div>

            <button
              type="button"
              onClick={() => setShowApproval((v) => !v)}
              style={styles.tinyLink}
              title="Approval code"
            >
              Approval
            </button>
          </div>

          <div style={styles.sectionNote}>
            Submit your agency for approval. After approval, you can sign in using <b>Agency Name + Agency Password</b>.
          </div>

          <label style={styles.label}>Agency name</label>
          <input
            style={styles.input}
            value={signupAgencyName}
            onChange={(e) => setSignupAgencyName(e.target.value)}
          />

          <label style={styles.label}>Agency password</label>
          <input
            style={styles.input}
            type="password"
            value={signupAgencyPass}
            onChange={(e) => setSignupAgencyPass(e.target.value)}
          />

          <button style={styles.button} onClick={submitAgencySignupPlaceholder} disabled={busy}>
            {busy ? "Submitting…" : "Submit for approval"}
          </button>

          {showApproval ? (
            <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.10)" }}>
              <div style={styles.sectionTitle}>Approval</div>
              <div style={styles.sectionNote}>
                Enter the approval code provided by JobAppID support to activate your agency.
              </div>

              <label style={styles.label}>Approval code</label>
              <input
                style={styles.input}
                value={approvalCode}
                onChange={(e) => setApprovalCode(e.target.value)}
                inputMode="numeric"
              />

              <button style={styles.secondaryBtnWide} onClick={submitApprovalPlaceholder} disabled={busy}>
                {busy ? "Verifying…" : "Verify approval code"}
              </button>
            </div>
          ) : null}
        </>
      ) : null}

      {msg ? <div style={styles.msg}>{msg}</div> : null}
    </div>
  );
}

function TabButton(props: { active: boolean; onClick: () => void; children: any }) {
  return (
    <button
      onClick={props.onClick}
      style={{ ...styles.tabBtn, ...(props.active ? styles.tabBtnActive : {}) }}
      type="button"
    >
      {props.children}
    </button>
  );
}

function Field({ label, children }: any) {
  return (
    <div>
      <label style={styles.label}>{label}</label>
      {children}
    </div>
  );
}

function fmtDate(v: string | null | undefined) {
  if (!v) return "—";
  try {
    return new Date(v).toLocaleString();
  } catch {
    return String(v);
  }
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    background: "rgba(19,19,26,0.95)",
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 18,
    padding: 22,
    boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
    maxWidth: 840,
    margin: "0 auto",
  },
  brandRow: { display: "flex", justifyContent: "center", marginBottom: 10 },
  logo: { width: 84, height: 84, objectFit: "contain", filter: "drop-shadow(0 6px 18px rgba(0,0,0,0.35))" },
  h2: { margin: 0, fontSize: 20, textAlign: "center" },
  p: { marginTop: 8, marginBottom: 14, opacity: 0.8, textAlign: "center" },

  tabs: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: 8,
    marginTop: 12,
    marginBottom: 12,
  },
  tabBtn: {
    padding: "10px 10px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(0,0,0,0.20)",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 900,
    fontSize: 12,
  },
  tabBtnActive: { background: "#fff", color: "#111" },

  sectionTitle: { marginTop: 6, fontWeight: 950, fontSize: 14 },
  sectionNote: { marginTop: 6, opacity: 0.82, fontSize: 13, lineHeight: 1.35 },

  label: { display: "block", marginTop: 12, fontSize: 13, opacity: 0.85 },
  inlineLabel: { fontSize: 13, opacity: 0.9 },

  input: {
    width: "100%",
    marginTop: 6,
    padding: "12px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(0,0,0,0.35)",
    color: "#fff",
    outline: "none",
  },

  grid2: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
    marginTop: 10,
  },

  button: {
    width: "100%",
    marginTop: 16,
    padding: "12px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "#fff",
    color: "#111",
    fontWeight: 950,
    cursor: "pointer",
  },

  secondaryBtn: {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.18)",
    background: "transparent",
    color: "#fff",
    fontWeight: 900,
    cursor: "pointer",
  },

  secondaryBtnWide: {
    width: "100%",
    marginTop: 12,
    padding: "12px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.18)",
    background: "transparent",
    color: "#fff",
    fontWeight: 900,
    cursor: "pointer",
  },

  tinyLink: {
    background: "transparent",
    border: "none",
    color: "rgba(255,255,255,0.75)",
    cursor: "pointer",
    fontSize: 12,
    textDecoration: "underline",
    padding: 0,
    fontWeight: 800,
  },

  msg: {
    marginTop: 12,
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,157,157,0.35)",
    background: "rgba(255,157,157,0.10)",
  },

  agentRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.04)",
  },

  dangerBtn: {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,157,157,0.55)",
    background: "rgba(255,157,157,0.18)",
    color: "#fff",
    fontWeight: 950,
    cursor: "pointer",
  },

  successBox: {
    marginTop: 12,
    padding: "12px 12px",
    borderRadius: 12,
    border: "1px solid rgba(157,255,176,0.25)",
    background: "rgba(157,255,176,0.10)",
  },

  mono: {
    marginTop: 10,
    padding: "10px 10px",
    borderRadius: 12,
    border: "1px dashed rgba(255,255,255,0.22)",
    background: "rgba(0,0,0,0.30)",
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
    fontSize: 13,
    wordBreak: "break-all",
  },
};
