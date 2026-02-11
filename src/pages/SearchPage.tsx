import { useMemo, useState } from "react";
import { verifySearch } from "../lib/api";
import type { VerifySession } from "../lib/session";
import type { VerifySearchResult } from "../lib/api";

const REASONS = [
  { value: "unemployment", label: "Unemployment verification" },
  { value: "public_aid", label: "Public aid / work requirement" },
  { value: "housing", label: "Housing / case management" },
  { value: "other", label: "Other" },
];

export function SearchPage({ session }: { session: VerifySession }) {
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

    // Allowed combos:
    // A) token + pin
    // B) name + last4 (pin optional)
    return (hasToken && hasPin) || (hasName && hasLast4);
  }, [badgeToken, patronCode, firstName, lastName, badgeLast4]);

  async function submit() {
    setMsg("");
    setResult(null);

    const input: any = {
      reason,
      // Mode B:
      first_name: firstName.trim() || undefined,
      last_name: lastName.trim() || undefined,
      badge_last4: badgeLast4.trim() || undefined,
      // Mode A:
      badge_token: badgeToken.trim() || undefined,
      patron_code: patronCode.trim() || undefined,
    };

    setBusy(true);
    try {
      // ✅ THIS matches your lib/api.ts signature
      const r = await verifySearch(session.accessKey, input);
      setResult(r);

      // ✅ Never crash the UI on ok:false
      if (!r || (r as any).ok === false) {
        const err = (r as any)?.error;
        setMsg(`Search failed: ${err?.code || "error"}: ${err?.message || "Unknown error"}`);
        return;
      }

      // ok:true but no apps
      const apps = (r as any).applications || [];
      if (!apps.length) setMsg("No applications found for this applicant.");
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

  // Helpers for both possible shapes (flattened vs nested)
  const ok = !!result && (result as any).ok !== false;
  const patron = ok ? (result as any).patron : null;
  const badgeLast4View =
    ok ? ((result as any).badge?.badge_last4 ?? (result as any).patron?.badge_last4 ?? "—") : "—";

  const apps = ok ? ((result as any).applications || []) : [];

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div style={styles.card}>
        <h2 style={styles.h2}>Applicant lookup</h2>
        <p style={styles.p}>
          Enter either <b>Badge token + PIN</b> or <b>Name + Badge last 4</b>.
        </p>

        <div style={styles.grid}>
          <div>
            <label style={styles.label}>First name</label>
            <input style={styles.input} value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          </div>

          <div>
            <label style={styles.label}>Last name</label>
            <input style={styles.input} value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </div>

          <div>
            <label style={styles.label}>Badge last 4</label>
            <input
              style={styles.input}
              value={badgeLast4}
              onChange={(e) => setBadgeLast4(e.target.value.replace(/\D/g, "").slice(0, 4))}
              placeholder="####"
              inputMode="numeric"
            />
          </div>

          <div>
            <label style={styles.label}>Badge token (optional alt)</label>
            <input
              style={styles.input}
              value={badgeToken}
              onChange={(e) => setBadgeToken(e.target.value)}
              placeholder="badge_xxx"
              autoComplete="off"
            />
          </div>

          <div>
            <label style={styles.label}>Applicant PIN (required with token)</label>
            <input
              style={styles.input}
              value={patronCode}
              onChange={(e) => setPatronCode(e.target.value.replace(/\D/g, "").slice(0, 8))}
              placeholder="####"
              inputMode="numeric"
              autoComplete="off"
            />
          </div>

          <div>
            <label style={styles.label}>Reason for lookup</label>
            <select style={styles.input} value={reason} onChange={(e) => setReason(e.target.value)}>
              {REASONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
          <button style={styles.primary} onClick={submit} disabled={busy || !canSearch}>
            {busy ? "Searching…" : "Search"}
          </button>
          <button style={styles.secondary} onClick={clear} disabled={busy}>
            Clear
          </button>

          {!canSearch ? (
            <div style={styles.hint}>
              Requires: <b>Token + PIN</b> OR <b>Name + last 4</b>
            </div>
          ) : null}
        </div>

        {msg ? <div style={styles.msg}>{msg}</div> : null}
      </div>

      {ok && patron ? (
        <div style={styles.card}>
          <h3 style={{ margin: 0, fontSize: 16 }}>Results</h3>

          <div style={{ marginTop: 8, opacity: 0.85 }}>
            Applicant:{" "}
            <b>
              {(patron.first_name || "").toString()} {(patron.last_name || "").toString()}
            </b>{" "}
            <span style={{ opacity: 0.8 }}>(Badge last4: {badgeLast4View})</span>
          </div>

          <div style={{ marginTop: 12, overflowX: "auto" }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Submitted</th>
                  <th style={styles.th}>Business</th>
                  <th style={styles.th}>Store</th>
                  <th style={styles.th}>Position</th>
                  <th style={styles.th}>Status</th>
                </tr>
              </thead>

              <tbody>
                {apps.length === 0 ? (
                  <tr>
                    <td style={styles.td} colSpan={5}>
                      No applications found.
                    </td>
                  </tr>
                ) : (
                  apps.map((a: any) => {
                    const businessName = a.business_name ?? a.business?.name ?? "—";
                    const storeNum = a.store_number ?? a.business?.store_number ?? "—";
                    const posTitle = a.position_title ?? a.position?.title ?? "—";
                    return (
                      <tr key={a.id}>
                        <td style={styles.td}>{fmtDate(a.submitted_at)}</td>
                        <td style={styles.td}>{businessName}</td>
                        <td style={styles.td}>{storeNum || "—"}</td>
                        <td style={styles.td}>{posTitle || "—"}</td>
                        <td style={styles.td}>
                          <span style={styles.status}>{String(a.status || "").toLowerCase() || "—"}</span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: 12, opacity: 0.75, fontSize: 12 }}>
            All access is logged. If information appears incomplete, it may reflect missing business configuration or connectivity issues.
          </div>
        </div>
      ) : null}
    </div>
  );
}

function fmtDate(v: string | null) {
  if (!v) return "—";
  try {
    const d = new Date(v);
    return d.toLocaleString();
  } catch {
    return v;
  }
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    background: "rgba(19,19,26,0.95)",
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 18,
    padding: 22,
    boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
  },
  h2: { margin: 0, fontSize: 20 },
  p: { marginTop: 8, marginBottom: 16, opacity: 0.82 },
  grid: {
    display: "grid",
    gap: 12,
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  },
  label: { display: "block", marginTop: 2, fontSize: 13, opacity: 0.85 },
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
  primary: {
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "#fff",
    color: "#111",
    fontWeight: 800,
    cursor: "pointer",
    minWidth: 140,
  },
  secondary: {
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.18)",
    background: "transparent",
    color: "#fff",
    fontWeight: 700,
    cursor: "pointer",
  },
  hint: { alignSelf: "center", opacity: 0.7, fontSize: 12 },
  msg: {
    marginTop: 12,
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.04)",
  },
  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    textAlign: "left",
    padding: "10px 8px",
    fontSize: 12,
    opacity: 0.75,
    borderBottom: "1px solid rgba(255,255,255,0.10)",
  },
  td: {
    padding: "10px 8px",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    verticalAlign: "top",
  },
  status: {
    display: "inline-block",
    padding: "4px 8px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.16)",
    background: "rgba(0,0,0,0.20)",
    fontSize: 12,
    fontWeight: 700,
    textTransform: "capitalize",
  },
};
