import { useMemo, useState } from "react";
import { Button, Card, Field, Pill, Select } from "../components/UI";
import { verifySearch } from "../lib/api";
import type { VerifySearchResult } from "../lib/api";

const REASONS = [
  "SNAP recertification",
  "Unemployment verification",
  "Workforce services",
  "Applicant request",
  "Other",
];

const reasonOptions = REASONS.map((r) => ({ value: r, label: r }));

export function VerifySearch(props: {
  apiBaseUrl: string; // not used by lib/api.ts, keep for now
  accessKey: string;
  onReset: () => void;
}) {
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [last4, setLast4] = useState("");
  const [pin, setPin] = useState("");
  const [reason, setReason] = useState(REASONS[0]);
  const [reasonOther, setReasonOther] = useState("");

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [data, setData] = useState<VerifySearchResult | null>(null);

  const canSearch = useMemo(() => {
    const lnOk = last.trim().length >= 2;
    const last4Ok = /^\d{4}$/.test(last4.trim());
    return lnOk && last4Ok && !loading;
  }, [last, last4, loading]);

  async function runSearch() {
    setErr("");
    setData(null);
    setLoading(true);

    const r = reason === "Other" ? reasonOther.trim() : reason;
    if (!r) {
      setLoading(false);
      setErr("Reason is required (for audit logging).");
      return;
    }

    try {
      const resp = await verifySearch(props.accessKey, {
        first_name: first.trim() || undefined,
        last_name: last.trim(),
        badge_last4: last4.trim(),
        patron_code: pin.trim() || undefined,
        reason: r,
      });
      setData(resp);
    } catch (e: any) {
      setErr(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  function clear() {
    setFirst("");
    setLast("");
    setLast4("");
    setPin("");
    setReason(REASONS[0]);
    setReasonOther("");
    setErr("");
    setData(null);
  }

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <Card
        title="Applicant lookup"
        right={
          <Button variant="ghost" onClick={props.onReset}>
            Change Access Key
          </Button>
        }
      >
        <div style={{ fontSize: 13, opacity: 0.8, marginTop: 6 }}>
          Search by <b>Last Name</b> + <b>Badge Last-4</b>. PIN is recommended to reduce false matches.
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 160px", gap: 10, marginTop: 14 }}>
          <Field label="First name (optional)" value={first} onChange={setFirst} placeholder="John" />
          <Field label="Last name *" value={last} onChange={setLast} placeholder="Smith" />
          <Field
            label="Badge last-4 *"
            value={last4}
            onChange={(v: string) => setLast4(String(v || "").replace(/\D/g, "").slice(0, 4))}
            placeholder="1234"
            inputMode="numeric"
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 10, marginTop: 10 }}>
          <Field
            label="PIN (recommended)"
            value={pin}
            onChange={(v: string) => setPin(String(v || "").replace(/\D/g, "").slice(0, 6))}
            placeholder="4321"
            inputMode="numeric"
          />

          <Select
            label="Reason for lookup (required)"
            value={reason}
            options={reasonOptions}
            onChange={(v: string) => setReason(v)}
          />
        </div>

        {reason === "Other" ? (
          <div style={{ marginTop: 10 }}>
            <Field label="Describe reason *" value={reasonOther} onChange={setReasonOther} placeholder="Enter reason" />
          </div>
        ) : null}

        <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
          <Button disabled={!canSearch} onClick={runSearch}>
            {loading ? "Searching…" : "Search"}
          </Button>

          <Button variant="ghost" onClick={clear}>
            Clear
          </Button>
        </div>

        {err ? <div style={{ marginTop: 12, fontSize: 12, color: "#ffb4b4" }}>{err}</div> : null}
      </Card>

      {data ? <ResultsCard data={data} /> : null}

      <Card title="Policy notes">
        <div style={{ fontSize: 12, opacity: 0.75, lineHeight: 1.5 }}>
          <ul style={{ margin: "8px 0 0 18px" }}>
            <li>Read-only verification. No resume download.</li>
            <li>Every lookup should be audit logged on the API side.</li>
            <li>Rate-limit searches to prevent bulk lookup behavior.</li>
          </ul>
        </div>
      </Card>
    </div>
  );
}

function ResultsCard({ data }: { data: VerifySearchResult }) {
  const fullName = `${(data.patron.first_name || "").trim()} ${(data.patron.last_name || "").trim()}`.trim();

  return (
    <Card title="Results" right={<Pill text={`Badge •••• ${data.patron.badge_last4 || "—"}`} />}>
      <div style={{ fontSize: 13, opacity: 0.8 }}>
        Applicant: <b>{fullName || "—"}</b>
      </div>

      <div style={{ marginTop: 12, overflowX: "auto" }}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Submitted</th>
              <th style={thStyle}>Business</th>
              <th style={thStyle}>Store</th>
              <th style={thStyle}>Position</th>
              <th style={thStyle}>Status</th>
            </tr>
          </thead>
          <tbody>
            {data.applications.length === 0 ? (
              <tr>
                <td style={tdStyle} colSpan={5}>
                  No applications found.
                </td>
              </tr>
            ) : (
              data.applications.map((a) => (
                <tr key={a.id}>
                  <td style={tdStyle}>{formatDate(a.submitted_at)}</td>
                  <td style={tdStyle}>{a.business_name}</td>
                  <td style={tdStyle}>{a.store_number || "—"}</td>
                  <td style={tdStyle}>{a.position_title || "—"}</td>
                  <td style={tdStyle}>{String(a.status || "").toUpperCase()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 10, fontSize: 12, opacity: 0.7 }}>
        This view is for verification only. For disputes, use the JobAppID receipt flow.
      </div>
    </Card>
  );
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

const tableStyle: any = { width: "100%", borderCollapse: "collapse", fontSize: 13 };
const thStyle: any = {
  textAlign: "left",
  padding: "10px 8px",
  borderBottom: "1px solid rgba(255,255,255,0.10)",
  opacity: 0.8,
  fontSize: 12,
};
const tdStyle: any = { padding: "10px 8px", borderBottom: "1px solid rgba(255,255,255,0.08)" };
