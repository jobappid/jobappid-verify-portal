export type VerifyApplication = {
  id: string;
  submitted_at: string;
  business_name: string;
  store_number?: string | null;
  position_title?: string | null;
  status: 'new' | 'reviewed' | 'interview' | 'hired' | 'not_considered' | string;
};

export type VerifyPatron = {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  badge_last4: string;
};

export type VerifySearchOk = {
  ok: true;
  patron: VerifyPatron;
  applications: VerifyApplication[];
};

export type VerifySearchErr = {
  ok: false;
  error: { code: string; message: string };
};

export type VerifySearchResponse = VerifySearchOk | VerifySearchErr;
