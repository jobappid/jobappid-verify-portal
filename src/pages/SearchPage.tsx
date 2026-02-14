import { useMemo, useState } from "react";
import { verifySearch, type VerifySearchResult } from "../lib/api";
import type { AgentSession } from "../lib/session";
import { Alert, Button, Card, Field, Input, Select, Tag, Table, Th, Td } from "../components/UI";

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

  const [msg, setMsg] = useState<{ tone: "neutral" | "danger" | "success" | "warn"; text: string } | null>(null);
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
    setMsg(null);
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
      if (!r.applications.length) setMsg({ tone: "warn", text: "No applications found for this applicant." });
    } catch (e: any) {
      setMsg({ tone: "danger", text: `Search failed: ${e?.message || e}` });
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
    setReason(REASONS[0].value);
    setMsg(null);
    setResult(null);
  }

  const patron = result?.patron ?? null;
  const badgeLast4View = result?.patron?.badge_last4 ?? "—";
  const apps = result?.applications ?? [];

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <Card
        title="Applicant lookup"
        subtitle="Enter either Badge token + PIN, or Name + Badge last 4. All searches are audit logged."
        right={<Tag tone="info">Agent mode</Tag>}
      >
        <div style={grid}>
          <Field label="First name">
            <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          </Field>

          <Field label="Last name">
            <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </Field>

          <Field label="Badge last 4" hint="Required with name">
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

        <div style={actions}>
          <Button onClick={submit} disabled={busy || !canSearch} type="button">
            {busy ? "Searching…" : "Search"}
          </Button>
          <Button variant="secondary" onClick={clear} disabled={busy} type="button">
            Clear
          </Button>
        </div>

        {msg ? <Alert tone={msg.tone}>{msg.text}</Alert> : null}
      </Card>

      {patron ? (
        <Card
          title="Results"
          subtitle={
            <>
              Applicant: <b>{patron.first_name} {patron.last_name}</b> &nbsp;•&nbsp; Badge last4: <b>{badgeLast4View}</b>
            </>
          }
        >
          <Table>
            <thead>
              <tr>
                <Th>Submitted</Th>
                <Th>Business</Th>
                <Th>Store</Th>
                <Th>Position</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {apps.length === 0 ? (
                <tr>
                  <Td>—</Td>
                  <Td colSpan={5}>No applications found.</Td>
                </tr>
              ) : (
                apps.map((a) => (
                  <tr key={a.id}>
                    <Td>{fmtDate(a.submitted_at)}</Td>
                    <Td>{a.business_name}</Td>
                    <Td>{a.store_number || "—"}</Td>
                    <Td>{a.position_title || "—"}</Td>
                    <Td>
                      <Tag tone={a.status.toLowerCase() === "rejected" ? "danger" : "neutral"}>
                        {String(a.status || "").toLowerCase()}
                      </Tag>
                    </Td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
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

const grid: React.CSSProperties = {
  display: "grid",
  gap: 12,
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
};

const actions: React.CSSProperties = {
  display: "flex",
  gap: 10,
  marginTop: 14,
  flexWrap: "wrap",
};
