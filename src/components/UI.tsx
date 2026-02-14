// src/components/UI.tsx
import React from "react";

export const GOV_THEME = {
  pageBg: "#f5f7fb",
  headerBg: "#ffffff",
  cardBg: "#ffffff",
  text: "#0f172a",
  muted: "#475569",
  faint: "#64748b",
  border: "#e2e8f0",
  borderSoft: "#edf2f7",
  inputBg: "#ffffff",
  inputBorder: "#cbd5e1",
  focus: "#2563eb",
  dangerBg: "#fff1f2",
  dangerBorder: "#fecdd3",
  shadow: "0 10px 30px rgba(15,23,42,0.08)",
} as const;

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return <div style={ui.sectionTitle}>{children}</div>;
}

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
  subtitle?: React.ReactNode;
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

export function Divider() {
  return <div style={ui.divider} />;
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
  const v =
    variant === "secondary"
      ? ui.btnSecondary
      : variant === "danger"
      ? ui.btnDanger
      : ui.btnPrimary;

  return <button {...props} style={{ ...ui.btn, ...v, ...(props.style || {}) }} />;
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
  );
}

/** Tables */
export function Table(props: React.TableHTMLAttributes<HTMLTableElement>) {
  return <table {...props} style={{ ...ui.table, ...(props.style || {}) }} />;
}
export function Th(props: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return <th {...props} style={{ ...ui.th, ...(props.style || {}) }} />;
}
export function Td(props: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return <td {...props} style={{ ...ui.td, ...(props.style || {}) }} />;
}

export function Tag({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "info" | "success" | "warn" | "danger";
}) {
  const s =
    tone === "danger"
      ? ui.tagDanger
      : tone === "warn"
      ? ui.tagWarn
      : tone === "success"
      ? ui.tagSuccess
      : tone === "info"
      ? ui.tagInfo
      : ui.tag;

  return <span style={{ ...ui.tagBase, ...s }}>{children}</span>;
}

const ui: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: 1080,
    margin: "0 auto",
    padding: "28px 18px",
  },

  sectionTitle: { fontSize: 12, fontWeight: 800, color: GOV_THEME.muted, textTransform: "uppercase", letterSpacing: 0.8 },

  card: {
    background: GOV_THEME.cardBg,
    border: `1px solid ${GOV_THEME.border}`,
    borderRadius: 16,
    padding: 18,
    boxShadow: GOV_THEME.shadow,
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "flex-start",
    paddingBottom: 12,
    marginBottom: 14,
    borderBottom: `1px solid ${GOV_THEME.borderSoft}`,
  },
  cardTitle: { fontSize: 16, fontWeight: 800, color: GOV_THEME.text },
  cardSubtitle: { fontSize: 13, color: GOV_THEME.muted, lineHeight: 1.35 },

  divider: { height: 1, background: GOV_THEME.borderSoft, margin: "14px 0" },

  labelRow: { display: "flex", justifyContent: "space-between", gap: 12 },
  label: { fontSize: 12, fontWeight: 700, color: GOV_THEME.text },
  hint: { fontSize: 12, color: GOV_THEME.faint },

  // ✅ fixes overflow everywhere
  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px 12px",
    borderRadius: 12,
    border: `1px solid ${GOV_THEME.inputBorder}`,
    background: GOV_THEME.inputBg,
    color: GOV_THEME.text,
    outline: "none",
  },

  btn: {
    padding: "12px 14px",
    borderRadius: 12,
    border: `1px solid ${GOV_THEME.border}`,
    cursor: "pointer",
    fontWeight: 800,
    boxSizing: "border-box",
  },
  btnPrimary: { background: GOV_THEME.focus, border: `1px solid ${GOV_THEME.focus}`, color: "#fff" },
  btnSecondary: { background: "#fff", color: GOV_THEME.text },
  btnDanger: { background: GOV_THEME.dangerBg, border: `1px solid ${GOV_THEME.dangerBorder}`, color: "#9f1239" },

  alertBase: {
    marginTop: 12,
    padding: "10px 12px",
    borderRadius: 12,
    border: `1px solid ${GOV_THEME.border}`,
    background: "#fff",
    color: GOV_THEME.text,
    lineHeight: 1.35,
  },
  alert: {},
  alertDanger: { border: `1px solid ${GOV_THEME.dangerBorder}`, background: GOV_THEME.dangerBg, color: "#9f1239" },
  alertSuccess: { border: "1px solid #bbf7d0", background: "#f0fdf4", color: "#166534" },
  alertWarn: { border: "1px solid #fde68a", background: "#fffbeb", color: "#92400e" },

  // ✅ tabs that look like a government portal (segmented control)
  tabsWrap: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 8,
    marginTop: 10,
  },
  tab: {
    padding: "10px 10px",
    borderRadius: 12,
    border: `1px solid ${GOV_THEME.border}`,
    background: "#fff",
    color: GOV_THEME.text,
    cursor: "pointer",
    fontWeight: 800,
    fontSize: 12,
    boxSizing: "border-box",
  },
  tabActive: { background: GOV_THEME.text, border: `1px solid ${GOV_THEME.text}`, color: "#fff" },

  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    textAlign: "left",
    padding: "10px 10px",
    fontSize: 12,
    color: GOV_THEME.muted,
    borderBottom: `1px solid ${GOV_THEME.border}`,
    whiteSpace: "nowrap",
  },
  td: {
    padding: "10px 10px",
    borderBottom: `1px solid ${GOV_THEME.borderSoft}`,
    color: GOV_THEME.text,
    verticalAlign: "top",
  },

  tagBase: {
    display: "inline-flex",
    alignItems: "center",
    padding: "4px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 800,
    border: `1px solid ${GOV_THEME.border}`,
    background: "#fff",
    color: GOV_THEME.text,
  },
  tag: {},
  tagInfo: { background: "#f1f5f9" },
  tagSuccess: { border: "1px solid #bbf7d0", background: "#f0fdf4", color: "#166534" },
  tagWarn: { border: "1px solid #fde68a", background: "#fffbeb", color: "#92400e" },
  tagDanger: { border: `1px solid ${GOV_THEME.dangerBorder}`, background: GOV_THEME.dangerBg, color: "#9f1239" },
};
