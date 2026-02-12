import React from "react";

export function Card(props: { title?: string; children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div style={styles.card}>
      {(props.title || props.right) && (
        <div style={styles.cardHeader}>
          <div style={styles.cardTitle}>{props.title}</div>
          <div>{props.right}</div>
        </div>
      )}
      <div>{props.children}</div>
    </div>
  );
}

export function Field(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;

  placeholder?: string;
  type?: string;
  maxLength?: number;
  autoComplete?: string;

  // ✅ NEW: allow numeric keyboard / mobile hints
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];

  // ✅ optional niceties (safe + common)
  name?: string;
  disabled?: boolean;
}) {
  return (
    <label style={styles.label}>
      <div style={styles.labelText}>{props.label}</div>
      <input
        style={styles.input}
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        placeholder={props.placeholder}
        type={props.type || "text"}
        maxLength={props.maxLength}
        autoComplete={props.autoComplete}
        inputMode={props.inputMode}
        name={props.name}
        disabled={props.disabled}
      />
    </label>
  );
}

export function Select(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label style={styles.label}>
      <div style={styles.labelText}>{props.label}</div>
      <select style={styles.input} value={props.value} onChange={(e) => props.onChange(e.target.value)}>
        {props.options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function Button(props: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "primary" | "ghost";
  type?: "button" | "submit";
}) {
  const variant = props.variant || "primary";
  const style = variant === "primary" ? styles.buttonPrimary : styles.buttonGhost;

  return (
    <button type={props.type || "button"} onClick={props.onClick} disabled={props.disabled} style={style}>
      {props.children}
    </button>
  );
}

export function Pill(props: { text: string }) {
  return <span style={styles.pill}>{props.text}</span>;
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    background: "#13131a",
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 18,
    padding: 18,
    boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "baseline",
    gap: 12,
    marginBottom: 12,
  },
  cardTitle: { fontSize: 16, fontWeight: 700 },
  label: { display: "block", marginTop: 12 },
  labelText: { fontSize: 12, opacity: 0.75, marginBottom: 6 },
  input: {
    width: "100%",
    padding: "12px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "#0b0b0f",
    color: "#fff",
    outline: "none",
  },
  buttonPrimary: {
    width: "100%",
    marginTop: 14,
    padding: "12px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "#ffffff",
    color: "#0b0b0f",
    fontWeight: 800,
    cursor: "pointer",
  },
  buttonGhost: {
    width: "100%",
    marginTop: 14,
    padding: "12px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.18)",
    background: "transparent",
    color: "#fff",
    fontWeight: 700,
    cursor: "pointer",
  },
  pill: {
    display: "inline-flex",
    alignItems: "center",
    padding: "4px 10px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.16)",
    fontSize: 12,
    opacity: 0.9,
  },
};
