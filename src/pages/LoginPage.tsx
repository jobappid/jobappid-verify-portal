import { useMemo, useState } from "react";
import { agencyLogin, agentLogin, agencySignup, agencyApprove } from "../lib/api";
import type { AppSession } from "../lib/session";
import { Alert, Button, Card, Field, Input, SectionTitle, Tabs, Divider } from "../components/UI";

type TabKey = "agency_login" | "agent_login" | "agency_signup" | "approve";

export function LoginPage({ onLogin }: { onLogin: (s: AppSession) => void }) {
  const [tab, setTab] = useState<TabKey>("agency_login");
  const [msg, setMsg] = useState<{ tone: "neutral" | "danger" | "success" | "warn"; text: string } | null>(null);
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
    setMsg(null);
    setBusy(true);
    try {
      const r = await agencyLogin(agencyNameLogin.trim(), agencyPassLogin);
      onLogin({ kind: "agency", agencyName: r.agency_name, agencyToken: r.agency_token });
    } catch (e: any) {
      setMsg({ tone: "danger", text: `Agency sign-in failed: ${e?.message || e}` });
    } finally {
      setBusy(false);
    }
  }

  async function submitAgentLogin() {
    setMsg(null);
    setBusy(true);
    try {
      const r = await agentLogin(agentAgencyName.trim(), agentUsername.trim(), agentPass);
      onLogin({ kind: "agent", officeName: r.officeName, accessKey: r.accessKey });
    } catch (e: any) {
      setMsg({ tone: "danger", text: `Agent sign-in failed: ${e?.message || e}` });
    } finally {
      setBusy(false);
    }
  }

  async function submitAgencySignup() {
    setMsg(null);
    setBusy(true);
    try {
      await agencySignup({
        agency_name: agencyName.trim(),
        agency_email: agencyEmail.trim().toLowerCase(),
        agency_password: agencyPass,
      });

      setMsg({
        tone: "success",
        text: "Submitted. Support will review your request and send an approval code to your email.",
      });
      setApprovalAgencyName(agencyName.trim());
      setTab("approve");
    } catch (e: any) {
      setMsg({ tone: "danger", text: `Signup failed: ${e?.message || e}` });
    } finally {
      setBusy(false);
    }
  }

  async function submitApproval() {
    setMsg(null);
    const code = approvalCode.replace(/\D/g, "").trim();
    if (!code) return setMsg({ tone: "warn", text: "Enter the approval code." });

    setBusy(true);
    try {
      await agencyApprove({ agency_name: approvalAgencyName.trim(), approval_code: code });
      setMsg({ tone: "success", text: "Approved. You can now sign in using Agency Name + Agency Password." });
      setTab("agency_login");
    } catch (e: any) {
      setMsg({ tone: "danger", text: `Approval failed: ${e?.message || e}` });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card
      title="Verification Portal Access"
      subtitle={
        <>
          Authorized agencies only. All lookups are audit logged.
          <br />
          Use the tabs below to sign in or request agency access.
        </>
      }
      right={<a href="#approval" onClick={(e) => { e.preventDefault(); setTab("approve"); }} style={linkStyle}>Approval</a>}
    >
      <Tabs
        value={tab}
        onChange={(k) => setTab(k as any)}
        tabs={[
          { key: "agency_login", label: "Agency Sign In" },
          { key: "agent_login", label: "Agent Sign In" },
          { key: "agency_signup", label: "Agency Sign Up" },
        ]}
      />

      <Divider />

      {tab === "agency_login" ? (
        <div style={gridOne}>
          <SectionTitle>Agency sign in</SectionTitle>
          <div style={note}>
            Agency owners sign in to manage agents and access.
          </div>

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

          <div style={btnRow}>
            <Button onClick={submitAgencyLogin} disabled={!canAgencyLogin} type="button">
              {busy ? "Signing in…" : "Sign in"}
            </Button>
          </div>
        </div>
      ) : null}

      {tab === "agent_login" ? (
        <div style={gridOne}>
          <SectionTitle>Agent sign in</SectionTitle>
          <div style={note}>
            Agents can search applicants only. They do not have agency management access.
          </div>

          <Field label="Agency name">
            <Input value={agentAgencyName} onChange={(e) => setAgentAgencyName(e.target.value)} autoComplete="organization" />
          </Field>

          <Field label="Username" hint="Provided by your agency">
            <Input value={agentUsername} onChange={(e) => setAgentUsername(e.target.value)} autoComplete="username" />
          </Field>

          <Field label="Password">
            <Input type="password" value={agentPass} onChange={(e) => setAgentPass(e.target.value)} autoComplete="current-password" />
          </Field>

          <div style={btnRow}>
            <Button onClick={submitAgentLogin} disabled={!canAgentLogin} type="button">
              {busy ? "Signing in…" : "Sign in"}
            </Button>
          </div>
        </div>
      ) : null}

      {tab === "agency_signup" ? (
        <div style={gridOne}>
          <SectionTitle>Agency sign up</SectionTitle>
          <div style={note}>
            Request agency access. After approval, you can sign in using <b>Agency Name + Agency Password</b>.
          </div>

          <Field label="Agency name">
            <Input value={agencyName} onChange={(e) => setAgencyName(e.target.value)} autoComplete="organization" />
          </Field>

          <Field label="Agency email" hint="Approval code will be sent here">
            <Input value={agencyEmail} onChange={(e) => setAgencyEmail(e.target.value)} autoComplete="email" />
          </Field>

          <Field label="Agency password" hint="Minimum 6 characters">
            <Input
              type="password"
              value={agencyPass}
              onChange={(e) => setAgencyPass(e.target.value)}
              autoComplete="new-password"
            />
          </Field>

          <div style={btnRow}>
            <Button onClick={submitAgencySignup} disabled={!canAgencySignup} type="button">
              {busy ? "Submitting…" : "Submit for approval"}
            </Button>
          </div>
        </div>
      ) : null}

      {tab === "approve" ? (
        <div id="approval" style={gridOne}>
          <SectionTitle>Approval</SectionTitle>
          <div style={note}>
            Enter the approval code provided by JobAppID support to activate your agency.
          </div>

          <Field label="Agency name">
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
              autoComplete="off"
            />
          </Field>

          <div style={btnRow}>
            <Button onClick={submitApproval} disabled={busy} type="button">
              {busy ? "Verifying…" : "Verify approval code"}
            </Button>
          </div>
        </div>
      ) : null}

      {msg ? <Alert tone={msg.tone}>{msg.text}</Alert> : null}
    </Card>
  );
}

const gridOne: React.CSSProperties = {
  display: "grid",
  gap: 12,
};

const btnRow: React.CSSProperties = {
  marginTop: 4,
};

const note: React.CSSProperties = {
  fontSize: 13,
  color: "#6b7280",
  lineHeight: 1.35,
};

const linkStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 700,
  color: "#1d4ed8",
  textDecoration: "underline",
  cursor: "pointer",
  whiteSpace: "nowrap",
};
