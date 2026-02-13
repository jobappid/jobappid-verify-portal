export type VerifySearchInput = {
  first_name?: string;
  last_name?: string;
  badge_last4?: string;
  badge_token?: string;
  patron_code?: string;
  dob?: string; // future
  reason?: string;
};

export type VerifyApplication = {
  id: string;
  submitted_at: string | null;
  status: string;
  business_name: string;
  store_number?: string | null;
  position_title?: string | null;
};

export type VerifySearchResult = {
  patron: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    badge_last4: string | null;
  };
  applications: VerifyApplication[];
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

function mustApiBaseUrl() {
  const v = String(API_BASE_URL || "").trim();
  if (!v) throw new Error("Missing VITE_API_BASE_URL. Set it in your .env and restart.");
  return v.replace(/\/+$/, "");
}

async function http<T>(
  path: string,
  opts: RequestInit & {
    accessKey?: string; // verify endpoints
    agencyToken?: string; // agency dashboard endpoints
  }
) {
  const base = mustApiBaseUrl();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(opts.headers as any),
  };

  if (opts.accessKey) headers["X-VERIFY-KEY"] = opts.accessKey;
  if (opts.agencyToken) headers["Authorization"] = `Bearer ${opts.agencyToken}`;

  const res = await fetch(base + path, { ...opts, headers });

  const text = await res.text();
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }

  if (!res.ok) {
    const msg = json?.error?.message || json?.message || json?.error || `HTTP ${res.status}`;
    throw new Error(msg);
  }

  return json as T;
}

// =========================
// Verify endpoints (Agent Search)
// =========================
export async function verifyHealth(accessKey: string): Promise<{ ok: true }> {
  return http<{ ok: true }>(`/verify/health`, { method: "GET", accessKey });
}

export async function verifySearch(accessKey: string, input: VerifySearchInput): Promise<VerifySearchResult> {
  const raw = await http<any>(`/verify/search`, {
    method: "POST",
    accessKey,
    body: JSON.stringify(input),
  });

  if (raw?.ok === false) throw new Error(raw?.message || raw?.error || "Search failed");

  const patron = raw?.patron || null;
  const badge = raw?.badge || null;
  const applications = Array.isArray(raw?.applications) ? raw.applications : [];

  return {
    patron: {
      id: patron?.id,
      first_name: patron?.first_name ?? null,
      last_name: patron?.last_name ?? null,
      badge_last4: badge?.badge_last4 ?? null,
    },
    applications: applications.map((a: any) => ({
      id: a.id,
      submitted_at: a.submitted_at ?? null,
      status: a.status,
      business_name: a.business?.name ?? "—",
      store_number: a.business?.store_number ?? null,
      position_title: a.position?.title ?? null,
    })),
  };
}

// =========================
// Agency auth + dashboard
// =========================

export type AgencyLoginResult = {
  ok: true;
  agency_id: string;
  agency_name: string;
  agency_token: string;
};

export async function agencyLogin(agency_name: string, agency_password: string): Promise<AgencyLoginResult> {
  return http<AgencyLoginResult>(`/agency/login`, {
    method: "POST",
    body: JSON.stringify({ agency_name, agency_password }),
  });
}

export type AgentLoginResult = { ok: true; officeName: string; accessKey: string };

export async function agentLogin(agency_name: string, username: string, password: string): Promise<AgentLoginResult> {
  return http<AgentLoginResult>(`/agency/agent/login`, {
    method: "POST",
    body: JSON.stringify({ agency_name, username, password }),
  });
}

export type AgencyAgentsListResult = {
  ok: true;
  agents: { id: string; username: string; is_active: boolean; created_at: string; last_login_at?: string | null }[];
};

export async function agencyAgentsList(agencyToken: string): Promise<AgencyAgentsListResult> {
  return http<AgencyAgentsListResult>(`/agency/agents`, { method: "GET", agencyToken });
}

export type AgencyAgentCreateResult = {
  ok: true;
  agent: { id: string; username: string; is_active: boolean; created_at: string };
  password: string; // returned ONCE
};

export async function agencyAgentCreate(
  agencyToken: string,
  args: { username: string; password?: string; generate_password?: boolean }
): Promise<AgencyAgentCreateResult> {
  return http<AgencyAgentCreateResult>(`/agency/agents/create`, {
    method: "POST",
    agencyToken,
    body: JSON.stringify(args),
  });
}

export async function agencyAgentDisable(agencyToken: string, agent_id: string): Promise<{ ok: true }> {
  return http<{ ok: true }>(`/agency/agents/disable`, {
    method: "POST",
    agencyToken,
    body: JSON.stringify({ agent_id }),
  });
}
