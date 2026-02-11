export type VerifySearchInput = {
  first_name?: string;
  last_name?: string;
  badge_last4?: string;
  badge_token?: string;
  patron_code?: string;
  dob?: string; // optional future
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

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

function mustApiBaseUrl() {
  const v = String(API_BASE_URL || '').trim();
  if (!v) {
    throw new Error('Missing VITE_API_BASE_URL. Set it in your .env and restart.');
  }
  return v.replace(/\/+$/, '');
}

async function http<T>(path: string, opts: RequestInit & { accessKey: string }) {
  const base = mustApiBaseUrl();
  const res = await fetch(base + path, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      'X-VERIFY-KEY': opts.accessKey,
      ...(opts.headers || {})
    }
  });

  const text = await res.text();
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }

  if (!res.ok) {
    const msg = json?.error?.message || json?.message || `HTTP ${res.status}`;
    throw new Error(msg);
  }

  return json as T;
}

export async function verifyHealth(accessKey: string): Promise<{ ok: true }>{
  return http<{ ok: true }>(`/verify/health`, { method: 'GET', accessKey });
}

export async function verifySearch(accessKey: string, input: VerifySearchInput): Promise<VerifySearchResult> {
  const raw = await http<any>(`/verify/search`, {
    method: 'POST',
    accessKey,
    body: JSON.stringify(input)
  });

  // ✅ Handle 200 responses that are still failures
  if (raw?.ok === false) {
    throw new Error(raw?.message || raw?.error || 'Search failed');
  }

  // ✅ Normalize server shape -> UI shape
  const patron = raw?.patron || null;
  const badge = raw?.badge || null;
  const applications = Array.isArray(raw?.applications) ? raw.applications : [];

  return {
    patron: {
      id: patron?.id,
      first_name: patron?.first_name ?? null,
      last_name: patron?.last_name ?? null,
      badge_last4: badge?.badge_last4 ?? null
    },
    applications: applications.map((a: any) => ({
      id: a.id,
      submitted_at: a.submitted_at ?? null,
      status: a.status,
      business_name: a.business?.name ?? '—',
      store_number: a.business?.store_number ?? null,
      position_title: a.position?.title ?? null
    }))
  };
}

