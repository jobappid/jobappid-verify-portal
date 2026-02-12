import { useMemo, useState } from "react";
import { verifyHealth, agencyOnboard, agencyApprove, agencyJoin } from "../lib/api";
import type { VerifySession } from "../lib/session";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

// Create client only if env is present (prevents weird runtime issues)
const supabase =
  SUPABASE_URL && SUPABASE_ANON_KEY
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: true } })
    : null;

type Tab = "signin" | "agency" | "approve" | "agent";

export function LoginPage({ onLogin }: { onLogin: (s: VerifySession) => void }) {
  const [tab, setTab] = useState<Tab>("signin");

  // Access-key sign-in (existing)
  const [officeName, setOfficeName] = useState("");
  const [accessKey, setAccessKey] = useState("");
  const [msg, setMsg] = useState<string>("");
  const [busy, setBusy] = useState(false);

  // Agency owner signup/signin
  const [agencyName, setAgencyName] = useState("");
  const [agencyEmail, setAgencyEmail] = useState("");
  const [agencyPass, setAgencyPass] = useState("");

  // Approval code
  const [approvalCode, setApprovalCode] = useState("");

  // Agent join (single-use invite)
  const [agentEmail, setAgentEmail] = useState("");
  const [agentPass, setAgentPass] = useState("");
  const [inviteCode, setInviteCode] = useState("");

  const canAgencySignup = useMemo(() => {
    return agencyName.trim().length >= 2 && agencyEmail.trim().length >= 6 && agencyPass.length >= 6 && !busy;
  }, [agencyName, agencyEmail, agencyPass, busy]);

  const canAgentJoin = useMemo(() => {
    return agentEmail.trim().length >= 6 && agentPass.length >= 6 && inviteCode.replace(/\D/g, "").length >= 8 && !busy;
  }, [agentEmail, agentPass, inviteCode, busy]);

  function requireSupabaseConfigured() {
    if (!supabase) {
      setMsg("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in the verify portal .env.");
      return false;
    }
    return true;
  }

  async function submitSignin() {
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

  async function submitAgencySignup() {
    setMsg("");
    if (!requireSupabaseConfigured()) return;

    const name = agencyName.trim();
    const email = agencyEmail.trim().toLowerCase();
    const pass = agencyPass;

    if (name.length < 2) return setMsg("Enter your agency name.");
    if (!email) return setMsg("Enter your email.");
    if (pass.length < 6) return setMsg("Password must be at least 6 characters.");

    setBusy(true);
    try {
      // 1) Owner: sign up or sign in via Supabase Auth
      const signUp = await supabase!.auth.signUp({ email, password: pass });
      if (signUp.error) {
        const signIn = await supabase!.auth.signInWithPassword({ email, password: pass });
        if (signIn.error) throw new Error(signIn.error.message);
      }

      const session = (await supabase!.auth.getSession()).data.session;
      if (!session?.access_token) throw new Error("Could not get Supabase session token.");

      // 2) Onboard agency (API emails support approval code)
      await agencyOnboard(session.access_token, name);

      setMsg(
        "Agency submitted. Support will receive an approval code and provide it to you. Then use the Approval Code tab."
      );
      setTab("approve");
    } catch (e: any) {
      setMsg(`Agency signup failed: ${e?.message || e}`);
    } finally {
      setBusy(false);
    }
  }

  async function submitApprove() {
    setMsg("");
    if (!requireSupabaseConfigured()) return;

    const code = approvalCode.replace(/\D/g, "").slice(0, 12).trim();
    if (!code) return setMsg("Enter the approval code provided by support.");

    setBusy(true);
    try {
      const session = (await supabase!.auth.getSession()).data.session;
      if (!session?.access_token) {
        throw new Error("You must be signed in as the agency owner (Agency Sign Up tab) first.");
      }

      await agencyApprove(session.access_token, code);

      setMsg("Agency approved. Next: go to Agent Join and have agents join using a SINGLE-USE invite code.");
      setTab("agent");
    } catch (e: any) {
      setMsg(`Approval failed: ${e?.message || e}`);
    } finally {
      setBusy(false);
    }
  }

  async function submitAgentJoin() {
    setMsg("");
    if (!requireSupabaseConfigured()) return;

    const email = agentEmail.trim().toLowerCase();
    const pass = agentPass;
    const code = inviteCode.replace(/\D/g, "").slice(0, 16);

    if (!email) return setMsg("Enter agent email.");
    if (pass.length < 6) return setMsg("Password must be at least 6 characters.");
    if (!code) return setMsg("Enter your invite code.");

    setBusy(true);
    try {
      // 1) Agent: sign up or sign in via Supabase Auth
      const signUp = await supabase!.auth.signUp({ email, password: pass });
      if (signUp.error) {
        const signIn = await supabase!.auth.signInWithPassword({ email, password: pass });
        if (signIn.error) throw new Error(signIn.error.message);
      }

      const session = (await supabase!.auth.getSession()).data.session;
      if (!session?.access_token) throw new Error("Could not get Supabase session token.");

      // 2) Join agency via SINGLE-USE invite code
      await agencyJoin(session.access_token, code);

      setMsg("Agent joined successfully. You can now use the access-key sign-in provided to your agency.");
    } catch (e: any) {
      setMsg(`Agent join failed: ${e?.message || e}`);
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
        <TabButton active={tab === "signin"} onClick={() => setTab("signin")}>
          Sign In
        </TabButton>
        <TabButton active={tab === "agency"} onClick={() => setTab("agency")}>
          Agency Sign Up
        </TabButton>
        <TabButton active={tab === "approve"} onClick={() => setTab("approve")}>
          Approval Code
        </TabButton>
        <TabButton active={tab === "agent"} onClick={() => setTab("agent")}>
          Agent Join
        </TabButton>
      </div>

      {tab === "signin" ? (
        <>
          <label style={styles.label}>Office name</label>
          <input
            style={styles.input}
            value={officeName}
            onChange={(e) => setOfficeName(e.target.value)}
            placeholder="e.g., Cook County Public Aid Office"
            autoComplete="organization"
          />

          <label style={styles.label}>Access key</label>
          <input
            style={styles.input}
            value={accessKey}
            onChange={(e) => setAccessKey(e.target.value)}
            placeholder="Provided by JobAppID"
            autoComplete="off"
          />

          <button style={styles.button} onClick={submitSignin} disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </>
      ) : null}

      {tab === "agency" ? (
        <>
          <div style={styles.sectionTitle}>Create an agency (owner)</div>
          <div style={styles.sectionNote}>
            After you submit, support receives an approval code at <b>requestjobappid@jobappid.com</b>.
          </div>

          <label style={styles.label}>Agency name</label>
          <input
            style={styles.input}
            value={agencyName}
            onChange={(e) => setAgencyName(e.target.value)}
            placeholder="e.g., Illinois Department of Human Services"
            autoComplete="organization"
          />

          <label style={styles.label}>Owner email</label>
          <input
            style={styles.input}
            value={agencyEmail}
            onChange={(e) => setAgencyEmail(e.target.value)}
            placeholder="you@agency.gov"
            autoComplete="email"
          />

          <label style={styles.label}>Password</label>
          <input
            style={styles.input}
            value={agencyPass}
            onChange={(e) => setAgencyPass(e.target.value)}
            placeholder="Create a password"
            autoComplete="new-password"
            type="password"
          />

          <button style={styles.button} onClick={submitAgencySignup} disabled={!canAgencySignup}>
            {busy ? "Submitting…" : "Submit agency for approval"}
          </button>

          <div style={styles.sectionFoot}>If your owner email already exists, we’ll sign you in and continue.</div>
        </>
      ) : null}

      {tab === "approve" ? (
        <>
          <div style={styles.sectionTitle}>Enter approval code</div>
          <div style={styles.sectionNote}>
            Support will provide your approval code after reviewing your agency signup.
          </div>

          <label style={styles.label}>Approval code</label>
          <input
            style={styles.input}
            value={approvalCode}
            onChange={(e) => setApprovalCode(e.target.value)}
            placeholder="8 digits"
            autoComplete="off"
            inputMode="numeric"
          />

          <button style={styles.button} onClick={submitApprove} disabled={busy}>
            {busy ? "Verifying…" : "Approve agency"}
          </button>

          <div style={styles.sectionFoot}>
            If you get “must be signed in”, go back to <b>Agency Sign Up</b> and sign in with your owner email/password first.
          </div>
        </>
      ) : null}

      {tab === "agent" ? (
        <>
          <div style={styles.sectionTitle}>Agent Join (single-use invite)</div>
          <div style={styles.sectionNote}>
            Agents create/sign in with email + password, then enter the <b>single-use invite code</b> provided by the agency owner.
          </div>

          <label style={styles.label}>Agent email</label>
          <input
            style={styles.input}
            value={agentEmail}
            onChange={(e) => setAgentEmail(e.target.value)}
            placeholder="agent@agency.gov"
            autoComplete="email"
          />

          <label style={styles.label}>Password</label>
          <input
            style={styles.input}
            value={agentPass}
            onChange={(e) => setAgentPass(e.target.value)}
            placeholder="Create a password"
            autoComplete="new-password"
            type="password"
          />

          <label style={styles.label}>Invite code</label>
          <input
            style={styles.input}
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            placeholder="Provided by your agency owner"
            autoComplete="off"
            inputMode="numeric"
          />

          <button style={styles.button} onClick={submitAgentJoin} disabled={!canAgentJoin}>
            {busy ? "Joining…" : "Join agency"}
          </button>

          <div style={styles.sectionFoot}>
            Invite codes are single-use. If it says “used” or “expired”, the owner must generate a new one.
          </div>
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
      style={{
        ...styles.tabBtn,
        ...(props.active ? styles.tabBtnActive : {}),
      }}
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
    maxWidth: 560,
    margin: "0 auto",
  },
  brandRow: {
    display: "flex",
    justifyContent: "center",
    marginBottom: 10,
  },
  logo: {
    width: 84,
    height: 84,
    objectFit: "contain",
    filter: "drop-shadow(0 6px 18px rgba(0,0,0,0.35))",
  },
  h2: { margin: 0, fontSize: 20, textAlign: "center" },
  p: { marginTop: 8, marginBottom: 14, opacity: 0.8, textAlign: "center" },

  tabs: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr 1fr",
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
  tabBtnActive: {
    background: "#fff",
    color: "#111",
  },

  sectionTitle: { marginTop: 6, fontWeight: 900, fontSize: 14 },
  sectionNote: { marginTop: 6, opacity: 0.8, fontSize: 13, lineHeight: 1.35 },
  sectionFoot: { marginTop: 10, opacity: 0.7, fontSize: 12, lineHeight: 1.35 },

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
