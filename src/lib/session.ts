export type AgentSession = {
  kind: "agent";
  officeName: string;
  accessKey: string;
};

export type AgencySession = {
  kind: "agency";
  agencyName: string;
  agencyToken: string;
};

export type AppSession = AgentSession | AgencySession;

const KEY = "jobappid_verify_session_v2";

export function getSession(): AppSession | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);

    if (!parsed || typeof parsed.kind !== "string") return null;

    if (parsed.kind === "agent") {
      if (typeof parsed.officeName !== "string" || typeof parsed.accessKey !== "string") return null;
      return { kind: "agent", officeName: parsed.officeName, accessKey: parsed.accessKey };
    }

    if (parsed.kind === "agency") {
      if (typeof parsed.agencyName !== "string" || typeof parsed.agencyToken !== "string") return null;
      return { kind: "agency", agencyName: parsed.agencyName, agencyToken: parsed.agencyToken };
    }

    return null;
  } catch {
    return null;
  }
}

export function setSession(s: AppSession) {
  localStorage.setItem(KEY, JSON.stringify(s));
}

export function clearSession() {
  localStorage.removeItem(KEY);
}
