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
  return http<VerifySearchResult>(`/verify/search`, {
    method: 'POST',
    accessKey,
    body: JSON.stringify(input)
  });
}
