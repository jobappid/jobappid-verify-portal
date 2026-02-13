// pages/LoginPage.tsx
import { useMemo, useState } from "react";
import {
  verifyHealth,
  agencyOnboard,
  agencyApprove,
  agencyLogin,
  agencySession,
  agencyJoin,
  agencyInvite,
  agencyListAgents,
  agencyRemoveAgent,
} from "../lib/api";
import type { VerifySession } from "../lib/session";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

const supabase =
  SUPABASE_URL && SUPABASE_ANON_KEY
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: true } })
    : null;

type Tab = "accesskey" | "agency_login" | "agency_signup" | "approve" | "agent_login" | "join" | "manage";

export function LoginPage({ onLogin }: { onLogin: (s: VerifySession) => void }) {
  const [tab, setTab] = useState<Tab>("agency_login");

  const [msg, setMsg] = useState<string>("");
  const [busy, setBusy] = useState(false);

  // Existing manual access-key sign-in (optional backdoor)
  const [officeName, setOfficeName] = useState("");
  const [accessKey, setAccessKey] = useState("");

  // Agency daily sign-in (NO email)
  const [agencyNameLogin, setAgencyNameLogin] = useState("");
  const [agencyPassLogin, setAgencyPassLogin] = useState("");

  // Agency signup (owner) + approval
  const [agencyName, setAgencyName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [ownerPass, setOwnerPass] = useState("");
  const [approvalCode, setApprovalCode] = useState("");

  // Agent login + join
  const [agentEmail, setAgentEmail] = useState("");
  const [agentPass, setAgentPass] = useState("");
  const [inviteCode, setInviteCode] = useState("");

  // Manage agents
  const [agents, setAgents] = useState<any[]>([]);
  const [deleteAuthUser, setDeleteAuthUser] = useState(false);

  const canAgencySignup = useMemo(() => {
    return agencyName.trim().length >= 2 && ownerEmail.trim().length >= 6 && ownerPass.length >= 6 && !busy;
  }, [agencyName, ownerEmail, ownerPass, busy]);

  const canAgencyLogin = useMemo(() => {
    return agencyNameLogin.trim().length >= 2 && agencyPassLogin.length >= 6 && !busy;
  }, [agencyNameLogin, agencyPassLogin, busy]);

  const canAgentLogin = useMemo(() => {
    return agentEmail.trim().length >= 6 && agentPass.length >= 6 && !busy;
  }, [agentEmail, agentPass, busy]);

  async function submitAccessKeySignin() {
    setMsg("");
    const name = officeName.trim();
    const key = accessKey.trim();
    if (!name) return setMsg("Enter your office name.");
    if (!key) return setMsg("Enter your access key.");

    setBusy(true);
    try {
      await verifyHealth(key);
      onLogin({ officeName: name, accessKey: key });
    } catch (e: any) {
      setMsg(`Login failed: ${e?.message || e}`);
    } finally {
      setBusy(false);
    }
  }

  // ✅ Agency daily sign-in (NO email)
  async function submitAgencyLogin() {
    setMsg("");
    const name = agencyNameLogin.trim();
    const pass = agencyPassLogin;

    setBusy(true);
    try {
      const r = await agencyLogin(name, pass);
      onLogin({ officeName: r.officeName, accessKey: r.accessKey });
    } catch (e: any) {
      setMsg(`Agency sign-in failed: ${e?.message || e}`);
    } finally {
      setBusy(false);
    }
  }

  // Owner signup uses Supabase email/password ONLY for onboarding/approval
  async function submitAgencySignup() {
    setMsg("");
    if (!supabase) return setMsg("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in verify portal .env.");

    const name = agencyName.trim();
    const email = ownerEmail.trim().toLowerCase();
    const pass = ownerPass;

    if (name.length < 2) return setMsg("Enter your agency name.");
    if (!email) return setMsg("Enter owner email.");
    if (pass.length < 6) return setMsg("Password must be at least 6 characters.");

    setBusy(true);
    try {
      const signUp = await supabase.auth.signUp({ email, password: pass });
      if (signUp.error) {
        const signIn = await supabase.auth.signInWithPassword({ email, password: pass });
        if (signIn.error) throw new Error(signIn.error.message);
      }

      const session = (await supabase.auth.getSession()).data.session;
      if (!session?.access_token) throw new Error("Could not get Supabase session token.");

      await agencyOnboard(session.access_token, name, pass);

      setMsg("Agency submitted. Support will provide approval code. Go to Approval Code tab.");
      setTab("approve");
    } catch (e: any) {
      setMsg(`Agency signup failed: ${e?.message || e}`);
    } finally {
      setBusy(false);
    }
  }

  async function submitApprove() {
    setMsg("");
    if (!supabase) return setMsg("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in verify portal .env.");

    const code = approvalCode.replace(/\D/g, "").slice(0, 12).trim();
    if (!code) return setMsg("Enter approval code.");

    setBusy(true);
    try {
      const session = (await supabase.auth.getSession()).data.session;
      if (!session?.access_token) throw new Error("Owner must be signed in (email + password) to approve.");

      await agencyApprove(session.access_token, code);

      setMsg("Agency approved. Now you can sign in using Agency Name + Agency Password.");
      setTab("agency_login");
    } catch (e: any) {
      setMsg(`Approval failed: ${e?.message || e}`);
    } finally {
      setBusy(false);
    }
  }

  // ✅ Agent daily sign-in (email/password → JWT → /agency/session → accessKey)
  async function submitAgentLogin() {
    setMsg("");
    if (!supabase) return setMsg("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in verify portal .env.");

    const email = agentEmail.trim().toLowerCase();
    const pass = agentPass;

    setBusy(true);
    try {
      const signIn = await supabase.auth.signInWithPassword({ email, password: pass });
      if (signIn.error) throw new Error(signIn.error.message);

      const session = (await supabase.auth.getSession()).data.session;
      if (!session?.access_token) throw new Error("Could not get Supabase session token.");

      const r = await agencySession(session.access_token);
      onLogin({ officeName: r.officeName, accessKey: r.accessKey });
    } catch (e: any) {
      setMsg(`Agent sign-in failed: ${e?.message || e}`);
    } finally {
      setBusy(false);
    }
  }

  // ✅ Agent join (must be logged in via Supabase first)
  async function submitJoin() {
    setMsg("");
    if (!supabase) return setMsg("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in verify portal .env.");

    const code = inviteCode.replace(/\D/g, "").slice(0, 16).trim();
    if (!code) return setMsg("Enter invite code.");

    setBusy(true);
    try {
      const session = (await supabase.auth.getSession()).data.session;
      if (!session?.access_token) throw new Error("Agent must be signed in (email + password) before joining.");

      await agencyJoin(session.access_token, code);

      setMsg("Joined agency. You can now use Agent Sign In.");
      setTab("agent_login");
    } catch (e: any) {
      setMsg(`Join failed: ${e?.message || e}`);
    } finally {
      setBusy(false);
    }
  }

  // ✅ Owner management: list agents + remove
  async function refreshAgents() {
    setMsg("");
    if (!supabase) return setMsg("Missing Supabase env.");

    setBusy(true);
    try {
      const session = (await supabase.auth.getSession()).data.session;
      if (!session?.access_token) throw new Error("Owner must sign in with email/password to manage agents.");

      const r = await agencyListAgents(session.access_token);
      setAgents(r.users || []);
    } catch (e: any) {
      setMsg(`Load agents failed: ${e?.message || e}`);
    } finally {
      setBusy(false);
    }
  }

  async function removeAgent(user_id: string) {
    setMsg("");
    if (!supabase) return setMsg("Missing Supabase env.");

    setBusy(true);
    try {
      const session = (await supabase.auth.getSession()).data.session;
      if (!session?.access_token) throw new Error("Owner must sign in with email/password to manage agents.");

      const r = await agencyRemoveAgent(session.access_token, user_id, deleteAuthUser);
      setMsg(r.message || "Agent removed.");
      await refreshAgents();
    } catch (e: any) {
      setMsg(`Remove failed: ${e?.message || e}`);
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
        <TabButton active={tab === "agency_login"} onClick={() => setTab("agency_login")}>Agency Sign In</TabButton>
        <TabButton active={tab === "agent_login"} onClick={() => setTab("agent_login")}>Agent Sign In</TabButton>
        <TabButton active={tab === "join"} onClick={() => setTab("join")}>Join</TabButton>
        <TabButton active={tab === "agency_signup"} onClick={() => setTab("agency_signup")}>Agency Sign Up</TabButton>
        <TabButton active={tab === "approve"} onClick={() => setTab("approve")}>Approval</TabButton>
        <TabButton active={tab === "manage"} onClick={() => setTab("manage")}>Manage Agents</TabButton>
        <TabButton active={tab === "accesskey"} onClick={() => setTab("accesskey")}>Access Key</TabButton>
      </div>

      {tab === "agency_login" ? (
        <>
          <div style={styles.sectionTitle}>Agency sign in (no email)</div>
          <label style={styles.label}>Agency name</label>
          <input style={styles.input} value={agencyNameLogin} onChange={(e) => setAgencyNameLogin(e.target.value)} />
          <label style={styles.label}>Agency password</label>
          <input style={styles.input} type="password" value={agencyPassLogin} onChange={(e) => setAgencyPassLogin(e.target.value)} />
          <button style={styles.button} onClick={submitAgencyLogin} disabled={!canAgencyLogin}>
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </>
      ) : null}

      {tab === "agent_login" ? (
        <>
          <div style={styles.sectionTitle}>Agent sign in (email + password)</div>
          <label style={styles.label}>Email</label>
          <input style={styles.input} value={agentEmail} onChange={(e) => setAgentEmail(e.target.value)} />
          <label style={styles.label}>Password</label>
          <input style={styles.input} type="password" value={agentPass} onChange={(e) => setAgentPass(e.target.value)} />
          <button style={styles.button} onClick={submitAgentLogin} disabled={!canAgentLogin}>
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </>
      ) : null}

      {tab === "join" ? (
        <>
          <div style={styles.sectionTitle}>Join agency (invite code)</div>
          <div style={styles.sectionNote}>Agent must be signed in first (email + password).</div>
          <label style={styles.label}>Invite code</label>
          <input style={styles.input} value={inviteCode} onChange={(e) => setInviteCode(e.target.value)} />
          <button style={styles.button} onClick={submitJoin} disabled={busy}>
            {busy ? "Joining…" : "Join"}
          </button>
        </>
      ) : null}

      {tab === "agency_signup" ? (
        <>
          <div style={styles.sectionTitle}>Create agency (owner)</div>
          <label style={styles.label}>Agency name</label>
          <input style={styles.input} value={agencyName} onChange={(e) => setAgencyName(e.target.value)} />
          <label style={styles.label}>Owner email</label>
          <input style={styles.input} value={ownerEmail} onChange={(e) => setOwnerEmail(e.target.value)} />
          <label style={styles.label}>Password</label>
          <input style={styles.input} type="password" value={ownerPass} onChange={(e) => setOwnerPass(e.target.value)} />
          <button style={styles.button} onClick={submitAgencySignup} disabled={!canAgencySignup}>
            {busy ? "Submitting…" : "Submit for approval"}
          </button>
        </>
      ) : null}

      {tab === "approve" ? (
        <>
          <div style={styles.sectionTitle}>Enter approval code</div>
          <div style={styles.sectionNote}>Owner must be signed in via Supabase (email + password).</div>
          <label style={styles.label}>Approval code</label>
          <input style={styles.input} value={approvalCode} onChange={(e) => setApprovalCode(e.target.value)} inputMode="numeric" />
          <button style={styles.button} onClick={submitApprove} disabled={busy}>
            {busy ? "Approving…" : "Approve"}
          </button>
        </>
      ) : null}

      {tab === "manage" ? (
        <>
          <div style={styles.sectionTitle}>Manage agents (owner only)</div>
          <div style={styles.sectionNote}>
            This uses the owner’s Supabase email/password session for authorization.
          </div>

          <label style={{ ...styles.label, display: "flex", gap: 10, alignItems: "center" }}>
            <input
              type="checkbox"
              checked={deleteAuthUser}
              onChange={(e) => setDeleteAuthUser(e.target.checked)}
            />
            Also delete agent’s Supabase Auth user (hard revoke)
          </label>

          <button style={styles.button} onClick={refreshAgents} disabled={busy}>
            {busy ? "Loading…" : "Load users"}
          </button>

          <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
            {agents.map((u) => (
              <div key={u.user_id} style={styles.agentRow}>
                <div>
                  <div style={{ fontWeight: 900 }}>{u.email || u.user_id}</div>
                  <div style={{ opacity: 0.75, fontSize: 12 }}>
                    role: {u.role} • active: {String(u.is_active)}
                  </div>
                </div>
                {u.role !== "owner" ? (
                  <button
                    style={styles.dangerBtn}
                    disabled={busy}
                    onClick={() => removeAgent(u.user_id)}
                  >
                    Remove
                  </button>
                ) : (
                  <div style={{ opacity: 0.6, fontSize: 12 }}>Owner</div>
                )}
              </div>
            ))}
          </div>
        </>
      ) : null}

      {tab === "accesskey" ? (
        <>
          <div style={styles.sectionTitle}>Manual access key (optional)</div>
          <label style={styles.label}>Office name</label>
          <input style={styles.input} value={officeName} onChange={(e) => setOfficeName(e.target.value)} />
          <label style={styles.label}>Access key</label>
          <input style={styles.input} value={accessKey} onChange={(e) => setAccessKey(e.target.value)} />
          <button style={styles.button} onClick={submitAccessKeySignin} disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </>
      ) : null}

      {msg ? <div style={styles.msg}>{msg}</div> : null}
    </div>
  );
}

function TabButton(props: { active: boolean; onClick: () => void; children: any }) {
  return (
    <button onClick={props.onClick} style={{ ...styles.tabBtn, ...(props.active ? styles.tabBtnActive : {}) }} type="button">
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
  tabs: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
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
    fontWeight: 800,
    fontSize: 12,
  },
  tabBtnActive: { background: "#fff", color: "#111" },
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
    border: "1px solid rgba(255,157,157,0.5)",
    background: "rgba(255,157,157,0.18)",
    color: "#fff",
    fontWeight: 900,
    cursor: "pointer",
  },
};
