// src/components/UI.tsx
import React from "react";

export function Container({ children }: { children: React.ReactNode }) {
  return <div style={ui.container}>{children}</div>;
}

export function Card({
  children,
  title,
  subtitle,
  right,
}: {
  children: React.ReactNode;
  title?: string;
  subtitle?: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <div style={ui.card}>
      {(title || subtitle || right) && (
        <div style={ui.cardHeader}>
          <div>
            {title ? <div style={ui.cardTitle}>{title}</div> : null}
            {subtitle ? <div style={ui.cardSubtitle}>{subtitle}</div> : null}
          </div>
          {right ? <div>{right}</div> : null}
        </div>
      )}
      <div>{children}</div>
    </div>
  );
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return <div style={ui.sectionTitle}>{children}</div>;
}

export function Tabs({
  tabs,
  value,
  onChange,
}: {
  tabs: { key: string; label: string }[];
  value: string;
  onChange: (k: string) => void;
}) {
  return (
    <div style={ui.tabsWrap}>
      <div style={ui.tabs}>
        {tabs.map((t) => {
          const active = value === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => onChange(t.key)}
              style={{ ...ui.tab, ...(active ? ui.tabActive : {}) }}
            >
              {t.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "grid", gap: 6 }}>
      <div style={ui.labelRow}>
        <label style={ui.label}>{label}</label>
        {hint ? <div style={ui.hint}>{hint}</div> : null}
      </div>
      {children}
    </div>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} style={{ ...ui.input, ...(props.style || {}) }} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} style={{ ...ui.input, ...(props.style || {}) }} />;
}

export function Button({
  variant = "primary",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger";
}) {
  const base = ui.btn;
  const v =
    variant === "secondary"
      ? ui.btnSecondary
      : variant === "danger"
      ? ui.btnDanger
      : ui.btnPrimary;

  return <button {...props} style={{ ...base, ...v, ...(props.style || {}) }} />;
}

export function Alert({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "danger" | "success" | "warn";
}) {
  const s =
    tone === "danger"
      ? ui.alertDanger
      : tone === "success"
      ? ui.alertSuccess
      : tone === "warn"
      ? ui.alertWarn
      : ui.alert;

  return <div style={{ ...ui.alertBase, ...s }}>{children}</div>;
}

export function Divider() {
  return <div style={ui.divider} />;
}

const ui: Record<string, React.CSSProperties> = {
  container: { maxWidth: 980, margin: "0 auto", padding: "22px" },

  card: {
    background: "rgba(19,19,26,0.92)",
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 20,
    padding: 18,
    boxShadow: "0 18px 50px rgba(0,0,0,0.40)",
    backdropFilter: "blur(8px)",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: 14,
    alignItems: "flex-start",
    marginBottom: 14,
  },
  cardTitle: { fontSize: 16, fontWeight: 900, letterSpacing: 0.2 },
  cardSubtitle: { marginTop: 4, fontSize: 13, opacity: 0.78, lineHeight: 1.35 },

  sectionTitle: { marginTop: 4, fontSize: 13, fontWeight: 900, opacity: 0.9 },

  tabsWrap: {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 16,
    padding: 6,
  },
  tabs: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 6,
  },
  tab: {
    padding: "10px 10px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "transparent",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 900,
    fontSize: 12,
    letterSpacing: 0.2,
  },
  tabActive: { background: "#fff", color: "#111" },

  labelRow: { display: "flex", justifyContent: "space-between", gap: 12 },
  label: { fontSize: 12, opacity: 0.85 },
  hint: { fontSize: 12, opacity: 0.55 },

  input: {
    width: "100%",
    padding: "12px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(0,0,0,0.35)",
    color: "#fff",
    outline: "none",
  },

  btn: {
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.14)",
    cursor: "pointer",
    fontWeight: 900,
  },
  btnPrimary: { background: "#fff", color: "#111" },
  btnSecondary: { background: "transparent", color: "#fff", border: "1px solid rgba(255,255,255,0.18)" },
  btnDanger: {
    background: "rgba(255,157,157,0.18)",
    border: "1px solid rgba(255,157,157,0.50)",
    color: "#fff",
  },

  alertBase: {
    marginTop: 12,
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.04)",
    lineHeight: 1.35,
  },
  alert: {},
  alertDanger: { border: "1px solid rgba(255,157,157,0.35)", background: "rgba(255,157,157,0.10)" },
  alertSuccess: { border: "1px solid rgba(157,255,176,0.30)", background: "rgba(157,255,176,0.08)" },
  alertWarn: { border: "1px solid rgba(245,201,55,0.30)", background: "rgba(245,201,55,0.10)" },

  divider: { height: 1, background: "rgba(255,255,255,0.08)", margin: "14px 0" },
};
