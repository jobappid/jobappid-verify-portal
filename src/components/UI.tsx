// src/components/UI.tsx
import React from "react";

/** Layout */
export function Container({ children }: { children: React.ReactNode }) {
  return <div style={ui.container}>{children}</div>;
}

/** Card */
export function Card({
  children,
  title,
  subtitle,
  right,
}: {
  children: React.ReactNode;
  title?: string;
  subtitle?: React.ReactNode; // ✅ allow JSX (fixes your App.tsx error)
  right?: React.ReactNode;
}) {
  return (
    <section style={ui.card}>
      {(title || subtitle || right) && (
        <header style={ui.cardHeader}>
          <div style={{ display: "grid", gap: 4 }}>
            {title ? <div style={ui.cardTitle}>{title}</div> : null}
            {subtitle ? <div style={ui.cardSubtitle}>{subtitle}</div> : null}
          </div>
          {right ? <div>{right}</div> : null}
        </header>
      )}
      <div>{children}</div>
    </section>
  );
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return <div style={ui.sectionTitle}>{children}</div>;
}

/** Tabs */
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

/** Form */
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

/** Alerts */
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

/** Tables (✅ fixes colSpan + missing children errors) */
export function Table(props: React.TableHTMLAttributes<HTMLTableElement>) {
  return <table {...props} style={{ ...ui.table, ...(props.style || {}) }} />;
}

export function Thead(props: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <thead {...props} />;
}

export function Tbody(props: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody {...props} />;
}

export function Tr(props: React.HTMLAttributes<HTMLTableRowElement>) {
  return <tr {...props} />;
}

export function Th(props: React.ThHTMLAttributes<HTMLTableCellElement>) {
  // ✅ children now optional because React.ThHTMLAttributes already includes it
  return <th {...props} style={{ ...ui.th, ...(props.style || {}) }} />;
}

export function Td(props: React.TdHTMLAttributes<HTMLTableCellElement>) {
  // ✅ supports colSpan, rowSpan, etc.
  return <td {...props} style={{ ...ui.td, ...(props.style || {}) }} />;
}

/** Small status tag (optional, if you’re using <Tag tone="...">) */
export function Tag({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "info" | "success" | "warn" | "danger";
}) {
  const toneStyle =
    tone === "danger"
      ? ui.tagDanger
      : tone === "warn"
      ? ui.tagWarn
      : tone === "success"
      ? ui.tagSuccess
      : tone === "info"
      ? ui.tagInfo
      : ui.tag;

  return <span style={{ ...ui.tagBase, ...toneStyle }}>{children}</span>;
}

const ui: Record<string, React.CSSProperties> = {
  container: { maxWidth: 1040, margin: "0 auto", padding: "28px 22px" },

  // Government minimal: restrained, clean, low-contrast depth
  card: {
    background: "rgba(18,18,22,0.78)",
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 16,
    padding: 18,
    boxShadow: "0 10px 28px rgba(0,0,0,0.35)",
    backdropFilter: "blur(10px)",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    alignItems: "flex-start",
    paddingBottom: 12,
    marginBottom: 14,
    borderBottom: "1px solid rgba(255,255,255,0.08)",
  },
  cardTitle: { fontSize: 15, fontWeight: 800, letterSpacing: 0.2 },
  cardSubtitle: { fontSize: 13, opacity: 0.8, lineHeight: 1.35 },

  sectionTitle: { fontSize: 12, fontWeight: 800, opacity: 0.9 },

  tabsWrap: {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 14,
    padding: 6,
  },
  tabs: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 },
  tab: {
    padding: "10px 10px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "transparent",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 800,
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
    background: "rgba(0,0,0,0.28)",
    color: "#fff",
    outline: "none",
  },

  btn: {
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.14)",
    cursor: "pointer",
    fontWeight: 800,
  },
  btnPrimary: { background: "#fff", color: "#111" },
  btnSecondary: { background: "transparent", color: "#fff", border: "1px solid rgba(255,255,255,0.18)" },
  btnDanger: {
    background: "rgba(255,157,157,0.16)",
    border: "1px solid rgba(255,157,157,0.45)",
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

  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    textAlign: "left",
    padding: "10px 10px",
    fontSize: 12,
    opacity: 0.8,
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    whiteSpace: "nowrap",
  },
  td: {
    padding: "10px 10px",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    verticalAlign: "top",
  },

  tagBase: {
    display: "inline-flex",
    alignItems: "center",
    padding: "4px 8px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 800,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.06)",
  },
  tag: {},
  tagInfo: { background: "rgba(255,255,255,0.06)" },
  tagSuccess: { border: "1px solid rgba(157,255,176,0.35)", background: "rgba(157,255,176,0.10)" },
  tagWarn: { border: "1px solid rgba(245,201,55,0.35)", background: "rgba(245,201,55,0.12)" },
  tagDanger: { border: "1px solid rgba(255,157,157,0.40)", background: "rgba(255,157,157,0.12)" },
};

export const GOV_THEME = {
  // core text
  text: "#ffffff",
  muted: "rgba(255,255,255,0.72)",
  faint: "rgba(255,255,255,0.55)",

  bg: "rgba(18,18,22,0.78)",           // card/background surface
  lineSoft: "rgba(255,255,255,0.08)",  // soft divider line

  // surfaces
  pageBg: "radial-gradient(1200px 700px at 15% 0%, #1a1a24 0%, #0b0b0f 55%)",
  headerBg: "rgba(11,11,15,0.65)",
  cardBg: "rgba(18,18,22,0.78)",

  // borders
  border: "rgba(255,255,255,0.12)",
  borderSoft: "rgba(255,255,255,0.08)",

  // controls
  inputBg: "rgba(0,0,0,0.28)",

  // semantic
  dangerBg: "rgba(255,157,157,0.16)",
  dangerBorder: "rgba(255,157,157,0.45)",
} as const;

