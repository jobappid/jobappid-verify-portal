import { useMemo, useState } from "react";
import { verifySearch } from "../lib/api";
import type { AgentSession } from "../lib/session";
import type { VerifySearchResult } from "../lib/api";
import { Card, Field, Input, Select, Button, Alert, Divider } from "../components/UI";

const REASONS = [
  { value: "unemployment", label: "Unemployment verification" },
  { value: "public_aid", label: "Public aid / work requirement" },
  { value: "housing", label: "Housing / case management" },
  { value: "other", label: "Other" },
];

export function SearchPage({ session }: { session: AgentSession }) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [badgeLast4, setBadgeLast4] = useState("");
  const [badgeToken, setBadgeToken] = useState("");
  const [patronCode, setPatronCode] = useState("");
  const [reason, setReason] = useState(REASONS[0].value);

  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<VerifySearchResult | null>(null);

  const canSearch = useMemo(() => {
    const hasToken = badgeToken.trim().length >= 6;
    const hasPin = patronCode.trim().length >= 4;

    const hasName = firstName.trim().length >= 2 && lastName.trim().length >= 2;
    const hasLast4 = badgeLast4.trim().length === 4;

    return (hasToken && hasPin) || (hasName && hasLast4);
  }, [badgeToken, patronCode, firstName, lastName, badgeLast4]);

  async function submit() {
    setMsg("");
    setResult(null);

    const input = {
      reason,
      first_name: firstName.trim() || undefined,
      last_name: lastName.trim() || undefined,
      badge_last4: badgeLast4.trim() || undefined,
      badge_token: badgeToken.trim() || undefined,
      patron_code: patronCode.trim() || undefined,
    };

    setBusy(true);
    try {
      const r = await verifySearch(session.accessKey, input);
      setResult(r);
      if (!r.applications.length) setMsg("No applications found for this applicant.");
    } catch (e: any) {
      setMsg(`Search failed: ${e?.message || e}`);
    } finally {
      setBusy(false);
    }
  }

  function clear() {
    setFirstName("");
    setLastName("");
    setBadgeLast4("");
    setBadgeToken("");
    setPatronCode("");
    setMsg("");
    setResult(null);
  }

  const patron = result?.patron ?? null;
  const badgeLast4View = result?.patron?.badge_last4 ?? "—";
  const apps = result?.applications ?? [];

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <Card
        title="Applicant lookup"
        subtitle="Use Badge Token + PIN, or Name + Badge last 4. All searches are audited."
        right={
          <div style={{ fontSize: 12, opacity: 0.75, fontWeight: 900 }}>
            Agent mode
          </div>
        }
      >
        <div style={grid.wrap}>
          <Field label="First name">
            <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          </Field>

          <Field label="Last name">
            <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </Field>

          <Field label="Badge last 4" hint="####">
            <Input
              value={badgeLast4}
              onChange={(e) => setBadgeLast4(e.target.value.replace(/\D/g, "").slice(0, 4))}
              placeholder="####"
              inputMode="numeric"
            />
          </Field>

          <Field label="Badge token" hint="Alternative method">
            <Input
              value={badgeToken}
              onChange={(e) => setBadgeToken(e.target.value)}
              placeholder="badge_xxx"
              autoComplete="off"
            />
          </Field>

          <Field label="Applicant PIN" hint="Required with token">
            <Input
              value={patronCode}
              onChange={(e) => setPatronCode(e.target.value.replace(/\D/g, "").slice(0, 8))}
              placeholder="####"
              inputMode="numeric"
              autoComplete="off"
            />
          </Field>

          <Field label="Reason for lookup">
            <Select value={reason} onChange={(e) => setReason(e.target.value)}>
              {REASONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Divider />

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Button onClick={submit} disabled={busy || !canSearch}>
            {busy ? "Searching…" : "Search"}
          </Button>

          <Button variant="secondary" onClick={clear} disabled={busy} type="button">
            Clear
          </Button>
        </div>

        {msg ? <Alert tone={msg.toLowerCase().includes("failed") ? "danger" : "neutral"}>{msg}</Alert> : null}
      </Card>

      {patron ? (
        <Card
          title="Results"
          subtitle={`Applicant: ${patron.first_name ?? ""} ${patron.last_name ?? ""} (Badge last4: ${badgeLast4View})`}
        >
          <div style={{ overflowX: "auto" }}>
            <table style={table.table}>
              <thead>
                <tr>
                  <th style={table.th}>Submitted</th>
                  <th style={table.th}>Business</th>
                  <th style={table.th}>Store</th>
                  <th style={table.th}>Position</th>
                  <th style={table.th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {apps.length === 0 ? (
                  <tr>
                    <td style={table.td} colSpan={5}>
                      No applications found.
                    </td>
                  </tr>
                ) : (
                  apps.map((a) => (
                    <tr key={a.id}>
                      <td style={table.td}>{fmtDate(a.submitted_at)}</td>
                      <td style={table.td}>{a.business_name}</td>
                      <td style={table.td}>{a.store_number || "—"}</td>
                      <td style={table.td}>{a.position_title || "—"}</td>
                      <td style={table.td}>
                        <span style={table.status}>{a.status.toLowerCase()}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      ) : null}
    </div>
  );
}

function fmtDate(v: string | null) {
  if (!v) return "—";
  try {
    return new Date(v).toLocaleString();
  } catch {
    return v;
  }
}

const grid: Record<string, React.CSSProperties> = {
  wrap: {
    display: "grid",
    gap: 12,
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  },
};

const table: Record<string, React.CSSProperties> = {
  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    textAlign: "left",
    padding: "10px 8px",
    fontSize: 12,
    opacity: 0.75,
    borderBottom: "1px solid rgba(255,255,255,0.10)",
    whiteSpace: "nowrap",
  },
  td: {
    padding: "10px 8px",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    verticalAlign: "top",
  },
  status: {
    padding: "4px 8px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.16)",
    fontSize: 12,
    fontWeight: 900,
    textTransform: "capitalize",
    whiteSpace: "nowrap",
    display: "inline-block",
  },
};
