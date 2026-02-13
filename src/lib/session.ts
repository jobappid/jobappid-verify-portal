export type VerifySession = {
  officeName: string;     // agency display name
  accessKey: string;      // X-VERIFY-KEY
};

export type AgencySession = {
  agency_name: string;
  agency_id: string;
  agency_token: string;   // Bearer token for dashboard endpoints
};

const VERIFY_KEY = "jobappid_verify_session_v2";
const AGENCY_KEY = "jobappid_agency_session_v1";

// ---- Agent session (search) ----
export function getVerifySession(): VerifySession | null {
  try {
    const raw = localStorage.getItem(VERIFY_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw);
    if (!p || typeof p.officeName !== "string" || typeof p.accessKey !== "string") return null;
    return { officeName: p.officeName, accessKey: p.accessKey };
  } catch {
    return null;
  }
}
export function setVerifySession(s: VerifySession) {
  localStorage.setItem(VERIFY_KEY, JSON.stringify(s));
}
export function clearVerifySession() {
  localStorage.removeItem(VERIFY_KEY);
}

// ---- Agency session (dashboard) ----
export function getAgencySession(): AgencySession | null {
  try {
    const raw = localStorage.getItem(AGENCY_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw);
    if (!p || typeof p.agency_token !== "string" || typeof p.agency_id !== "string" || typeof p.agency_name !== "string") return null;
    return { agency_id: p.agency_id, agency_name: p.agency_name, agency_token: p.agency_token };
  } catch {
    return null;
  }
}
export function setAgencySession(s: AgencySession) {
  localStorage.setItem(AGENCY_KEY, JSON.stringify(s));
}
export function clearAgencySession() {
  localStorage.removeItem(AGENCY_KEY);
}
