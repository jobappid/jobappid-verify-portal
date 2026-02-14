import { useMemo, useState } from "react";
import { agencyLogin, agentLogin, agencySignup, agencyApprove } from "../lib/api";
import type { AppSession } from "../lib/session";
import { Card, Tabs, Field, Input, Button, Alert, Divider } from "../components/UI";

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

  const tabs = [
    { key: "agency_login", label: "Agency Sign In" },
    { key: "agent_login", label: "Agent Sign In" },
    { key: "agency_signup", label: "Agency Sign Up" },
  ];

  return (
    <div style={layout.wrap}>
      <div style={layout.hero}>
        <img src="/JobAppID-Logo.png" alt="JobAppID" style={layout.logo} />
        <div style={layout.heroText}>
          <div style={layout.heroTitle}>Verification Portal</div>
          <div style={layout.heroSub}>Authorized agencies only. All lookups are audited.</div>
        </div>
      </div>

      <Card
        title="Access"
        subtitle={
          tab === "agency_login"
            ? "Agency owners sign in here to manage agents."
            : tab === "agent_login"
            ? "Agents sign in here for applicant lookups only."
            : tab === "agency_signup"
            ? "Submit your agency for approval."
            : "Enter the approval code from JobAppID support."
        }
        right={
          tab !== "approve" ? (
            <button type="button" style={layout.approvalLink} onClick={() => setTab("approve")} disabled={busy}>
              Approval
            </button>
          ) : null
        }
      >
        <Tabs tabs={tabs} value={tab} onChange={(k) => setTab(k as Tab)} />

        <Divider />

        {tab === "agency_login" ? (
          <div style={layout.form}>
            <Field label="Agency name" hint="Exact name used at signup">
              <Input value={agencyNameLogin} onChange={(e) => setAgencyNameLogin(e.target.value)} autoComplete="organization" />
            </Field>

            <Field label="Agency password" hint="Minimum 6 characters">
              <Input
                type="password"
                value={agencyPassLogin}
                onChange={(e) => setAgencyPassLogin(e.target.value)}
                autoComplete="current-password"
              />
            </Field>

            <Button onClick={submitAgencyLogin} disabled={!canAgencyLogin}>
              {busy ? "Signing in…" : "Sign in"}
            </Button>
          </div>
        ) : null}

        {tab === "agent_login" ? (
          <div style={layout.form}>
            <Field label="Agency name" hint="Provided by your agency">
              <Input value={agentAgencyName} onChange={(e) => setAgentAgencyName(e.target.value)} autoComplete="organization" />
            </Field>

            <Field label="Username" hint="Created by your agency">
              <Input value={agentUsername} onChange={(e) => setAgentUsername(e.target.value)} autoComplete="username" />
            </Field>

            <Field label="Password" hint="Minimum 6 characters">
              <Input type="password" value={agentPass} onChange={(e) => setAgentPass(e.target.value)} autoComplete="current-password" />
            </Field>

            <Button onClick={submitAgentLogin} disabled={!canAgentLogin}>
              {busy ? "Signing in…" : "Sign in"}
            </Button>
          </div>
        ) : null}

        {tab === "agency_signup" ? (
          <div style={layout.form}>
            <Alert tone="warn">
              After submitting, JobAppID support will review your agency and email you an approval code.
            </Alert>

            <Field label="Agency name" hint="Public-facing agency name">
              <Input value={agencyName} onChange={(e) => setAgencyName(e.target.value)} autoComplete="organization" />
            </Field>

            <Field label="Agency email" hint="Where your approval code will be sent">
              <Input value={agencyEmail} onChange={(e) => setAgencyEmail(e.target.value)} autoComplete="email" />
            </Field>

            <Field label="Agency password" hint="Used for future logins">
              <Input type="password" value={agencyPass} onChange={(e) => setAgencyPass(e.target.value)} autoComplete="new-password" />
            </Field>

            <Button onClick={submitAgencySignup} disabled={!canAgencySignup}>
              {busy ? "Submitting…" : "Submit for approval"}
            </Button>
          </div>
        ) : null}

        {tab === "approve" ? (
          <div style={layout.form}>
            <Alert tone="neutral">
              Enter the approval code emailed by JobAppID support to activate your agency.
            </Alert>

            <Field label="Agency name" hint="Must match signup">
              <Input
                value={approvalAgencyName}
                onChange={(e) => setApprovalAgencyName(e.target.value)}
                placeholder="Exact agency name"
                autoComplete="organization"
              />
            </Field>

            <Field label="Approval code" hint="Numbers only">
              <Input
                value={approvalCode}
                onChange={(e) => setApprovalCode(e.target.value)}
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="########"
              />
            </Field>

            <Button onClick={submitApproval} disabled={busy}>
              {busy ? "Verifying…" : "Verify approval code"}
            </Button>

            <Button
              variant="secondary"
              onClick={() => setTab("agency_login")}
              disabled={busy}
              style={{ marginTop: 10 }}
              type="button"
            >
              Back to sign in
            </Button>
          </div>
        ) : null}

        {msg ? <Alert tone={msg.toLowerCase().includes("failed") ? "danger" : "success"}>{msg}</Alert> : null}
      </Card>
    </div>
  );
}

const layout: Record<string, React.CSSProperties> = {
  wrap: {
    display: "grid",
    gap: 14,
    maxWidth: 720,
    margin: "0 auto",
  },
  hero: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    padding: "8px 6px",
  },
  logo: {
    width: 62,
    height: 62,
    objectFit: "contain",
    filter: "drop-shadow(0 10px 24px rgba(0,0,0,0.40))",
  },
  heroText: { display: "grid", gap: 2 },
  heroTitle: { fontSize: 20, fontWeight: 950, letterSpacing: 0.2 },
  heroSub: { fontSize: 13, opacity: 0.8, lineHeight: 1.3 },

  approvalLink: {
    background: "transparent",
    color: "rgba(255,255,255,0.85)",
    border: "none",
    cursor: "pointer",
    fontSize: 12,
    textDecoration: "underline",
    padding: 0,
    fontWeight: 900,
  },

  form: { display: "grid", gap: 12 },
};
