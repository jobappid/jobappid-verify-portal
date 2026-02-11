import { useMemo, useState } from 'react';
import { Button, Card, H1, Input, Muted, Pill, Row, Select } from '../components/UI';
import { verifySearch } from '../lib/api';
import type { VerifySearchOk } from '../lib/types';

const REASONS = [
  'SNAP recertification',
  'Unemployment verification',
  'Workforce services',
  'Applicant request',
  'Other'
];

export function VerifySearch(props: { apiBaseUrl: string; accessKey: string; onReset: () => void }) {
  const [first, setFirst] = useState('');
  const [last, setLast] = useState('');
  const [last4, setLast4] = useState('');
  const [pin, setPin] = useState('');
  const [reason, setReason] = useState(REASONS[0]);
  const [reasonOther, setReasonOther] = useState('');

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string>('');
  const [data, setData] = useState<VerifySearchOk | null>(null);

  const canSearch = useMemo(() => {
    const l = last.trim().length >= 2;
    const b = /^\d{4}$/.test(last4.trim());
    return l && b && !loading;
  }, [last, last4, loading]);

  async function runSearch() {
    setErr('');
    setData(null);
    setLoading(true);

    const r = reason === 'Other' ? reasonOther.trim() : reason;
    if (!r) {
      setLoading(false);
      setErr('Reason is required (for audit logging).');
      return;
    }

    const resp = await verifySearch({
      apiBaseUrl: props.apiBaseUrl,
      accessKey: props.accessKey,
      reason: r,
      query: {
        first_name: first.trim() || undefined,
        last_name: last.trim(),
        badge_last4: last4.trim(),
        pin: pin.trim() || undefined
      }
    });

    setLoading(false);

    if (!resp.ok) {
      setErr(`${resp.error.code}: ${resp.error.message}`);
      return;
    }

    setData(resp);
  }

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <Card>
        <Row>
          <div style={{ flex: 1 }}>
            <H1>Applicant lookup</H1>
            <Muted>Search by <b>Last Name</b> + <b>Badge Last-4</b>. PIN is recommended to reduce false matches.</Muted>
          </div>
          <Button kind="ghost" onClick={props.onReset}>
            Change Access Key
          </Button>
        </Row>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 160px', gap: 10, marginTop: 14 }}>
          <div>
            <label style={labelStyle}>First name (optional)</label>
            <Input value={first} onChange={(e) => setFirst(e.target.value)} placeholder="John" />
          </div>
          <div>
            <label style={labelStyle}>Last name *</label>
            <Input value={last} onChange={(e) => setLast(e.target.value)} placeholder="Smith" />
          </div>
          <div>
            <label style={labelStyle}>Badge last-4 *</label>
            <Input value={last4} onChange={(e) => setLast4(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="1234" inputMode="numeric" />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 10, marginTop: 10 }}>
          <div>
            <label style={labelStyle}>PIN (recommended)</label>
            <Input value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="4321" inputMode="numeric" />
          </div>
          <div>
            <label style={labelStyle}>Reason for lookup (required)</label>
            <Select value={reason} onChange={(e) => setReason(e.target.value)}>
              {REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {reason === 'Other' ? (
          <div style={{ marginTop: 10 }}>
            <label style={labelStyle}>Describe reason *</label>
            <Input value={reasonOther} onChange={(e) => setReasonOther(e.target.value)} placeholder="Enter reason" />
          </div>
        ) : null}

        <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
          <Button disabled={!canSearch} onClick={runSearch}>
            {loading ? 'Searching…' : 'Search'}
          </Button>
          <Button
            kind="ghost"
            onClick={() => {
              setFirst('');
              setLast('');
              setLast4('');
              setPin('');
              setErr('');
              setData(null);
            }}
          >
            Clear
          </Button>
        </div>

        {err ? <div style={{ marginTop: 12, fontSize: 12, color: '#ffb4b4' }}>{err}</div> : null}
      </Card>

      {data ? <ResultsCard data={data} /> : null}

      <Card>
        <H1>Policy notes</H1>
        <div style={{ fontSize: 12, opacity: 0.75, lineHeight: 1.5 }}>
          <ul style={{ margin: '8px 0 0 18px' }}>
            <li>Read-only verification. No resume download.</li>
            <li>Every lookup should be audit logged on the API side.</li>
            <li>Rate-limit searches to prevent bulk lookup behavior.</li>
          </ul>
        </div>
      </Card>
    </div>
  );
}

function ResultsCard({ data }: { data: VerifySearchOk }) {
  return (
    <Card>
      <Row>
        <div style={{ flex: 1 }}>
          <H1>Results</H1>
          <Muted>
            Applicant: <b>{(data.patron.first_name || '').trim()} {(data.patron.last_name || '').trim()}</b>
          </Muted>
        </div>
        <Pill>Badge •••• {data.patron.badge_last4}</Pill>
      </Row>

      <div style={{ marginTop: 12, overflowX: 'auto' }}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Submitted</th>
              <th style={thStyle}>Business</th>
              <th style={thStyle}>Store</th>
              <th style={thStyle}>Position</th>
              <th style={thStyle}>Status</th>
            </tr>
          </thead>
          <tbody>
            {data.applications.length === 0 ? (
              <tr>
                <td style={tdStyle} colSpan={5}>
                  No applications found.
                </td>
              </tr>
            ) : (
              data.applications.map((a) => (
                <tr key={a.id}>
                  <td style={tdStyle}>{formatDate(a.submitted_at)}</td>
                  <td style={tdStyle}>{a.business_name}</td>
                  <td style={tdStyle}>{a.store_number || '—'}</td>
                  <td style={tdStyle}>{a.position_title || '—'}</td>
                  <td style={tdStyle}>{String(a.status || '').toUpperCase()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 10, fontSize: 12, opacity: 0.7 }}>
        This view is for verification only. For disputes, use the JobAppID receipt flow.
      </div>
    </Card>
  );
}

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString();
  } catch {
    return iso;
  }
}

const labelStyle: any = { fontSize: 12, opacity: 0.8 };

const tableStyle: any = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: 13
};

const thStyle: any = {
  textAlign: 'left',
  padding: '10px 8px',
  borderBottom: '1px solid rgba(255,255,255,0.10)',
  opacity: 0.8,
  fontSize: 12
};

const tdStyle: any = {
  padding: '10px 8px',
  borderBottom: '1px solid rgba(255,255,255,0.08)'
};
