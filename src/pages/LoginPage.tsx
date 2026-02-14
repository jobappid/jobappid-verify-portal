import { useMemo, useState } from "react";
import { agencyLogin, agentLogin, agencySignup, agencyApprove } from "../lib/api";
import type { AppSession } from "../lib/session";

type Tab = "agency_login" | "agent_login" | "agency_signup" | "approve";

export function LoginPage({ onLogin }: { onLogin: (s: AppSession) => void }) {
  const [tab, setTab] = useState<Tab>("agency_login");

  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  // Agency sign in
  const [agencyNameLogin, setAgencyNameLogin] = useState("");
  const [agencyPassLogin, setAgencyPassLogin] = useState("");

  // Agent sign in
  const [agentAgencyName, setAgentAgencyName] = useState("");
  const [agentUsername, setAgentUsername] = useState("");
  const [agentPass, setAgentPass] = useState("");

  // Agency sign up
  const [agencyName, setAgencyName] = useState("");
  const [agencyEmail, setAgencyEmail] = useState("");
  const [agencyPass, setAgencyPass] = useState("");

  // Approval
  const [approvalAgencyName, setApprovalAgencyName] = useState("");
  const [approvalCode, setApprovalCode] = useState("");

  const canAgencyLogin = useMemo(() => {
    return agencyNameLogin.trim().length >= 2 && agencyPassLogin.length >= 6 && !busy;
  }, [agencyNameLogin, agencyPassLogin, busy]);

  const canAgentLogin = useMemo(() => {
    return agentAgencyName.trim().length >= 2 && agentUsername.trim().length >= 3 && agentPass.length >= 6 && !busy;
  }, [agentAgencyName, agentUsername, agentPass, busy]);

  const canAgencySignup = useMemo(() => {
    return agencyName.trim().length >= 2 && agencyEmail.trim().length >= 6 && agencyPass.length >= 6 && !busy;
  }, [agencyName, agencyEmail, agencyPass, busy]);

  async function submitAgencyLogin() {
    setMsg("");
    setBusy(true);
    try {
      const r = await agencyLogin(agencyNameLogin.trim(), agencyPassLogin);
      onLogin({ kind: "agency", agencyName: r.agency_name, agencyToken: r.agency_token });
    } catch (e: any) {
      setMsg(`Agency sign-in failed: ${e?.message || e}`);
    } finally {
      setBusy(false);
    }
  }

  async function submitAgentLogin() {
    setMsg("");
    setBusy(true);
    try {
      const r = await agentLogin(agentAgencyName.trim(), agentUsername.trim(), agentPass);
      onLogin({ kind: "agent", officeName: r.officeName, accessKey: r.accessKey });
    } catch (e: any) {
      setMsg(`Agent sign-in failed: ${e?.message || e}`);
    } finally {
      setBusy(false);
    }
  }

  async function submitAgencySignup() {
    setMsg("");
    setBusy(true);
    try {
      await agencySignup({
        agency_name: agencyName.trim(),
        agency_email: agencyEmail.trim().toLowerCase(),
        agency_password: agencyPass,
      });

      setMsg("Submitted. Support will review your request and send an approval code to your email.");
      setApprovalAgencyName(agencyName.trim());
      setTab("approve");
    } catch (e: any) {
      setMsg(`Signup failed: ${e?.message || e}`);
    } finally {
      setBusy(false);
    }
  }

  async function submitApproval() {
    setMsg("");
    const code = approvalCode.replace(/\D/g, "").trim();
    if (!code) return setMsg("Enter the approval code.");

    setBusy(true);
    try {
      await agencyApprove({ agency_name: approvalAgencyName.trim(), approval_code: code });
      setMsg("Approved. You can now sign in using Agency Name + Agency Password.");
      setTab("agency_login");
    } catch (e: any) {
      setMsg(`Approval failed: ${e?.message || e}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={styles.card}>
      <div style={styles.brandRow}>
        <img src="/JobAppID-Logo.png" alt="JobAppID" style={styles.logo} />
      </div>

      <h2 style={styles.h2}>Verification Portal</h2>
      <p style={styles.p}>Authorized agencies only. All searches are audited.</p>

      <div style={styles.tabs}>
        <TabButton active={tab === "agency_login"} onClick={() => setTab("agency_login")}>
          Agency Sign In
        </TabButton>
        <TabButton active={tab === "agent_login"} onClick={() => setTab("agent_login")}>
          Agent Sign In
        </TabButton>
        <TabButton active={tab === "agency_signup"} onClick={() => setTab("agency_signup")}>
          Agency Sign Up
        </TabButton>
      </div>

      {tab === "agency_login" ? (
        <>
          <div style={styles.sectionTitle}>Agency sign in</div>
          <div style={styles.sectionNote}>
            Use your <b>Agency Name</b> + <b>Agency Password</b>. If approved, you’ll go to the dashboard to manage agents.
          </div>

          <label style={styles.label}>Agency name</label>
          <input style={styles.input} value={agencyNameLogin} onChange={(e) => setAgencyNameLogin(e.target.value)} />

          <label style={styles.label}>Agency password</label>
          <input
            style={styles.input}
            type="password"
            value={agencyPassLogin}
            onChange={(e) => setAgencyPassLogin(e.target.value)}
          />

          <button style={styles.button} onClick={submitAgencyLogin} disabled={!canAgencyLogin}>
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </>
      ) : null}

      {tab === "agent_login" ? (
        <>
          <div style={styles.sectionTitle}>Agent sign in</div>
          <div style={styles.sectionNote}>
            Agents can only do applicant searches. They do not have agency management access.
          </div>

          <label style={styles.label}>Agency name</label>
          <input style={styles.input} value={agentAgencyName} onChange={(e) => setAgentAgencyName(e.target.value)} />

          <label style={styles.label}>Username</label>
          <input style={styles.input} value={agentUsername} onChange={(e) => setAgentUsername(e.target.value)} />

          <label style={styles.label}>Password</label>
          <input style={styles.input} type="password" value={agentPass} onChange={(e) => setAgentPass(e.target.value)} />

          <button style={styles.button} onClick={submitAgentLogin} disabled={!canAgentLogin}>
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </>
      ) : null}

      {tab === "agency_signup" ? (
        <>
          <div style={styles.sectionTitleRow}>
            <div style={styles.sectionTitle}>Agency sign up</div>
            <button type="button" style={styles.approvalLink} onClick={() => setTab("approve")}>
              Approval
            </button>
          </div>

          <div style={styles.sectionNote}>
            Submit your agency for approval. After approval, you can sign in using <b>Agency Name + Agency Password</b>.
          </div>

          <label style={styles.label}>Agency name</label>
          <input style={styles.input} value={agencyName} onChange={(e) => setAgencyName(e.target.value)} />

          <label style={styles.label}>Agency email</label>
          <input style={styles.input} value={agencyEmail} onChange={(e) => setAgencyEmail(e.target.value)} autoComplete="email" />

          <label style={styles.label}>Agency password</label>
          <input
            style={styles.input}
            type="password"
            value={agencyPass}
            onChange={(e) => setAgencyPass(e.target.value)}
            autoComplete="new-password"
          />

          <button style={styles.button} onClick={submitAgencySignup} disabled={!canAgencySignup}>
            {busy ? "Submitting…" : "Submit for approval"}
          </button>
        </>
      ) : null}

      {tab === "approve" ? (
        <>
          <div style={styles.sectionTitle}>Approval</div>
          <div style={styles.sectionNote}>
            Enter the approval code provided by JobAppID support to activate your agency.
          </div>

          <label style={styles.label}>Agency name</label>
          <input
            style={styles.input}
            value={approvalAgencyName}
            onChange={(e) => setApprovalAgencyName(e.target.value)}
            placeholder="Exact agency name"
          />

          <label style={styles.label}>Approval code</label>
          <input
            style={styles.input}
            value={approvalCode}
            onChange={(e) => setApprovalCode(e.target.value)}
            inputMode="numeric"
            autoComplete="off"
          />

          <button style={styles.button} onClick={submitApproval} disabled={busy}>
            {busy ? "Verifying…" : "Verify approval code"}
          </button>
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

const styles: Record<string, React.CSSProperties> = {
  card: {
    background: "rgba(19,19,26,0.95)",
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 18,
    padding: 22,
    boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
    maxWidth: 720,
    margin: "0 auto",
  },
  brandRow: { display: "flex", justifyContent: "center", marginBottom: 10 },
  logo: { width: 84, height: 84, objectFit: "contain", filter: "drop-shadow(0 6px 18px rgba(0,0,0,0.35))" },
  h2: { margin: 0, fontSize: 20, textAlign: "center" },
  p: { marginTop: 8, marginBottom: 14, opacity: 0.8, textAlign: "center" },
  tabs: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 12, marginBottom: 12 },
  tabBtn: {
    padding: "10px 10px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(0,0,0,0.20)",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 800,
    fontSize: 12,
  },
  tabBtnActive: { background: "#fff", color: "#111" },

  sectionTitleRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 },
  approvalLink: {
    background: "transparent",
    color: "rgba(255,255,255,0.85)",
    border: "none",
    cursor: "pointer",
    fontSize: 12,
    textDecoration: "underline",
    padding: 0,
  },

  sectionTitle: { marginTop: 6, fontWeight: 900, fontSize: 14 },
  sectionNote: { marginTop: 6, opacity: 0.8, fontSize: 13, lineHeight: 1.35 },
  label: { display: "block", marginTop: 12, fontSize: 13, opacity: 0.85 },
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
  button: {
    width: "100%",
    marginTop: 16,
    padding: "12px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "#fff",
    color: "#111",
    fontWeight: 900,
    cursor: "pointer",
  },
  msg: {
    marginTop: 12,
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,157,157,0.35)",
    background: "rgba(255,157,157,0.10)",
  },
};
