import { useMemo, useState } from "react";
import { Button, Card, Field } from "../components/UI";

export function AccessGate(props: {
  apiBaseUrl: string;
  accessKey: string;
  onChangeAccessKey: (v: string) => void;
  onContinue: () => void;

  // ✅ add this (parent will handle switching screens)
  onAgency?: () => void;
}) {
  const [msg, setMsg] = useState("");

  const apiHint = useMemo(() => props.apiBaseUrl, [props.apiBaseUrl]);

  async function quickPing() {
    setMsg("Checking API connectivity...");
    try {
      const res = await fetch(`${props.apiBaseUrl}/verify/health`, { method: "GET" });
      const text = await res.text();
      setMsg(`API responded (${res.status}): ${text.slice(0, 120)}`);
    } catch (e: any) {
      setMsg(`API unreachable: ${String(e?.message || e)}`);
    }
  }

  const canContinue = props.accessKey.trim().length >= 8;

  return (
    <Card title="Office Access">
      <div style={{ fontSize: 13, opacity: 0.8, lineHeight: 1.4 }}>
        Enter the <b>Office Access Key</b> issued by JobAppID. This portal is read-only. All lookups are audit logged.
        <div style={{ marginTop: 8, opacity: 0.9 }}>
          API: <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>{apiHint}</span>
        </div>
      </div>

      <div style={{ marginTop: 14 }}>
        <Field
          label="Office Access Key"
          value={props.accessKey}
          onChange={props.onChangeAccessKey}
          placeholder="verifier_..."
          autoComplete="off"
        />
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
        <Button variant="ghost" onClick={quickPing}>
          Test API
        </Button>

        <Button disabled={!canContinue} onClick={props.onContinue}>
          Continue
        </Button>

        {/* ✅ this is the missing path to Agency Sign Up */}
        {props.onAgency ? (
          <Button variant="ghost" onClick={props.onAgency}>
            Agency Sign Up
          </Button>
        ) : null}
      </div>

      {msg ? <div style={{ marginTop: 12, fontSize: 12, opacity: 0.75 }}>{msg}</div> : null}

      <div style={{ marginTop: 14, fontSize: 12, opacity: 0.65, lineHeight: 1.4 }}>
        Minimum recommended policy: require <b>Last Name + Badge Last-4 + PIN</b>.
      </div>
    </Card>
  );
}
