import { useState, useEffect } from 'react';
import { fetchFlagged, reviewFlagged, type FlaggedResponse } from '../api/client';
import { downloadCSV } from '../utils/csv';
import { useToast } from '../components/Toast';
import Loading from '../components/Loading';

const SEVERITY_COLORS: Record<string, string> = {
  high: '#FF3D00', medium: '#FFB300', low: '#9CA3AF',
};

export default function Compliance() {
  const { toast } = useToast();
  const [data, setData] = useState<FlaggedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actioning, setActioning] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError('');
    fetchFlagged()
      .then(setData)
      .catch((e) => setError(e.response?.data?.error || e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const exportCSV = () => {
    const flagged = data?.transactions ?? [];
    if (flagged.length === 0) { toast('No flagged transactions to export', 'info'); return; }
    const headers = ['Ref', 'Sender', 'Amount', 'Reason', 'Severity'];
    const rows = flagged.map((f: any) => {
      const severity = (f.source_amount ?? 0) > 30000 ? 'High' : (f.source_amount ?? 0) > 10000 ? 'Medium' : 'Low';
      return [
        f.transaction_ref || '', f.sender_id || '',
        `${(f.source_amount ?? 0).toLocaleString()} ${f.source_currency || 'THB'}`,
        f.reason || f.flagged_reason || 'Automated flag', severity,
      ];
    });
    downloadCSV(headers, rows, 'compliance');
    toast('Compliance data exported');
  };

  const handleReview = async (id: string, action: 'dismiss' | 'escalate') => {
    setActioning(id);
    setError('');
    try {
      await reviewFlagged(id, action);
      toast(`Flagged transaction ${action}ed`);
      load();
    } catch {
      toast('Failed to update', 'error');
    } finally {
      setActioning(null);
    }
  };

  const sanctions = [
    { type: 'UN Sanctions', hits: 0, status: 'Passed' },
    { type: 'OFAC List', hits: 0, status: 'Passed' },
    { type: 'Internal Watchlist', hits: 1, status: 'Review Required' },
  ];

  if (loading) return <Loading text="Loading compliance data..." />;

  const flagged = data?.transactions ?? [];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Compliance</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={load} style={{
            padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border-color)',
            background: 'transparent', color: 'var(--text-primary)', fontWeight: 600, cursor: 'pointer', fontSize: 13,
          }}>Refresh</button>
          <button onClick={exportCSV} style={{
            padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border-color)',
            background: 'transparent', color: 'var(--text-primary)', fontWeight: 600, cursor: 'pointer', fontSize: 13,
          }}>Export CSV</button>
        </div>
      </div>

      {error && (
        <div style={{ background: '#FFF0F0', color: '#FF3D00', padding: '10px 16px', borderRadius: 8, fontSize: 13, marginBottom: 16 }}>
          {error}
          <button onClick={() => setError('')} style={{ marginLeft: 12, background: 'none', border: 'none', cursor: 'pointer', color: '#FF3D00', fontWeight: 600 }}>Dismiss</button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 24 }}>
        {sanctions.map((s, i) => (
          <div key={i} style={{ background: 'var(--card-bg)', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: '0 0 8px' }}>{s.type}</p>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 8px' }}>Hits: {s.hits}</p>
            <span style={{
              padding: '4px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
              background: s.status === 'Passed' ? '#E8F5E9' : '#FFF3E0',
              color: s.status === 'Passed' ? '#2E7D32' : '#E65100',
            }}>{s.status}</span>
          </div>
        ))}
      </div>

      <div style={{ background: 'var(--card-bg)', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', marginBottom: 24 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            Flagged Transactions {flagged.length > 0 && <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--text-secondary)' }}>({flagged.length})</span>}
          </h3>
        </div>
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1.5fr 1fr 120px',
          padding: '14px 20px', borderBottom: '1px solid var(--border-color)',
          fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase',
        }}>
          <span>Ref</span><span>Sender</span><span>Amount</span><span>Reason</span><span>Severity</span><span>Actions</span>
        </div>
        {flagged.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>No flagged transactions — all clear</div>
        ) : (
          flagged.map((f, i) => {
            const id = f.id || f.transaction_ref || `tx-${i}`;
            const severity = (f.source_amount ?? 0) > 30000 ? 'High' : (f.source_amount ?? 0) > 10000 ? 'Medium' : 'Low';
            return (
              <div key={id} style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1.5fr 1fr 120px',
                padding: '14px 20px', borderBottom: '1px solid var(--border-color)',
                fontSize: 14, color: 'var(--text-primary)', alignItems: 'center',
              }}>
                <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>{f.transaction_ref || id.slice(0, 8)}</span>
                <span>{f.sender_id?.slice(0, 8) || 'Unknown'}</span>
                <span>{(f.source_amount ?? 0).toLocaleString()} {f.source_currency || 'THB'}</span>
                <span style={{ fontSize: 13 }}>{f.reason || f.flagged_reason || 'Automated flag'}</span>
                <span style={{ fontWeight: 600, color: SEVERITY_COLORS[severity.toLowerCase()] || '#9CA3AF' }}>{severity}</span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    onClick={() => handleReview(id, 'dismiss')}
                    disabled={actioning === id}
                    style={{
                      padding: '5px 10px', borderRadius: 6, border: '1px solid var(--border-color)',
                      background: 'transparent', cursor: 'pointer', fontSize: 11, fontWeight: 600, color: '#2E7D32',
                    }}
                  >Dismiss</button>
                  <button
                    onClick={() => handleReview(id, 'escalate')}
                    disabled={actioning === id}
                    style={{
                      padding: '5px 10px', borderRadius: 6, border: '1px solid var(--border-color)',
                      background: 'transparent', cursor: 'pointer', fontSize: 11, fontWeight: 600, color: '#E65100',
                    }}
                  >Escalate</button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div style={{ background: 'var(--card-bg)', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 12px' }}>AML Screening Rules</h3>
        <ul style={{ margin: 0, paddingLeft: 20, color: 'var(--text-secondary)', fontSize: 14, lineHeight: 2 }}>
          <li>Velocity check: &gt;5 tx/hour from same sender → Flag</li>
          <li>New device + large tx: &gt;10,000 THB → Require KYC Level 2</li>
          <li>Unusual location: Sender IP from Laos → Additional verification</li>
          <li>Amount roundness: Round numbers in suspicious patterns → Flag</li>
          <li>Recipient pattern: Same recipient from many senders → Possible mule → SAR</li>
        </ul>
      </div>
    </div>
  );
}
