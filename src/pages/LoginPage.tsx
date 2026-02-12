import { useState } from "react";
import { verifyHealth } from "../lib/api";
import type { VerifySession } from "../lib/session";

export function LoginPage({ onLogin }: { onLogin: (s: VerifySession) => void }) {
  const [officeName, setOfficeName] = useState("");
  const [accessKey, setAccessKey] = useState("");
  const [msg, setMsg] = useState<string>("");
  const [busy, setBusy] = useState(false);

  async function submit() {
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

  return (
    <div style={styles.card}>
      <div style={styles.brandRow}>
        <img src="/JobAppID-Logo.png" alt="JobAppID" style={styles.logo} />
      </div>

      <h2 style={styles.h2}>Verification Sign-In</h2>
      <p style={styles.p}>This portal is for authorized verification staff only. All searches are audited.</p>

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

      <button style={styles.button} onClick={submit} disabled={busy}>
        {busy ? "Signing in…" : "Sign in"}
      </button>

      {msg ? <div style={styles.msg}>{msg}</div> : null}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    background: "rgba(19,19,26,0.95)",
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 18,
    padding: 22,
    boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
    maxWidth: 520,
    margin: "0 auto"
  },
  brandRow: {
    display: "flex",
    justifyContent: "center",
    marginBottom: 10
  },
  logo: {
    width: 84,
    height: 84,
    objectFit: "contain",
    filter: "drop-shadow(0 6px 18px rgba(0,0,0,0.35))"
  },
  h2: { margin: 0, fontSize: 20, textAlign: "center" },
  p: { marginTop: 8, marginBottom: 18, opacity: 0.8, textAlign: "center" },
  label: { display: "block", marginTop: 12, fontSize: 13, opacity: 0.85 },
  input: {
    width: "100%",
    marginTop: 6,
    padding: "12px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(0,0,0,0.35)",
    color: "#fff",
    outline: "none"
  },
  button: {
    width: "100%",
    marginTop: 16,
    padding: "12px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "#fff",
    color: "#111",
    fontWeight: 700,
    cursor: "pointer"
  },
  msg: {
    marginTop: 12,
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,157,157,0.35)",
    background: "rgba(255,157,157,0.10)"
  }
};
