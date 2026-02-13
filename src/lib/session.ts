export type VerifySession = {
  officeName: string;
  accessKey: string;
};

const KEY = "jobappid_verify_session_v1";

export function getSession(): VerifySession | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);

    if (
      !parsed ||
      typeof parsed.officeName !== "string" ||
      typeof parsed.accessKey !== "string"
    ) {
      return null;
    }

    return {
      officeName: parsed.officeName,
      accessKey: parsed.accessKey,
    };
  } catch {
    return null;
  }
}

export function setSession(s: VerifySession) {
  localStorage.setItem(KEY, JSON.stringify(s));
}

export function clearSession() {
  localStorage.removeItem(KEY);
}
