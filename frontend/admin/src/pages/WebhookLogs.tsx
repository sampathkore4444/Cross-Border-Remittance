import { useState, useEffect } from 'react';
import { fetchWebhookLogs, type LogResponse } from '../api/client';
import { downloadCSV } from '../utils/csv';
import { useToast } from '../components/Toast';
import Loading from '../components/Loading';

export default function WebhookLogs() {
  const { toast } = useToast();
  const [data, setData] = useState<LogResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<string | null>(null);
  const limit = 50;

  const load = (p: number) => {
    setLoading(true);
    setError('');
    fetchWebhookLogs(p, limit)
      .then(setData)
      .catch((e) => setError(e.response?.data?.error || e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(page); }, [page]);

  const exportCSV = () => {
    const logs = data?.logs ?? [];
    if (logs.length === 0) { toast('No logs to export', 'info'); return; }
    const headers = ['Event', 'Source', 'Transaction', 'Status', 'Signature', 'Time'];
    const rows = logs.map((l: any) => [
      l.event_type || '', l.source || '', l.transaction_ref || '',
      String(l.response_status ?? ''), l.signature_valid ? 'Valid' : 'Invalid',
      l.created_at ? new Date(l.created_at).toISOString() : '',
    ]);
    downloadCSV(headers, rows, 'webhook-logs');
    toast('Webhook logs exported');
  };

  if (loading) return <Loading text="Loading webhook logs..." />;
  if (error) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <p style={{ color: '#FF3D00', fontSize: 14, marginBottom: 16 }}>{error}</p>
        <button onClick={() => load(page)} style={{
          padding: '10px 24px', borderRadius: 8, border: 'none',
          background: '#1A8CFF', color: '#FFF', fontWeight: 600, cursor: 'pointer',
        }}>Retry</button>
      </div>
    );
  }

  const logs = data?.logs ?? [];
  const totalPages = Math.ceil((data?.total ?? 0) / limit);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Webhook Logs</h1>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{data?.total ?? 0} total</span>
          <button onClick={() => load(page)} style={{
            padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border-color)',
            background: 'transparent', color: 'var(--text-primary)', fontWeight: 600, cursor: 'pointer', fontSize: 13,
          }}>Refresh</button>
          <button onClick={exportCSV} style={{
            padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border-color)',
            background: 'transparent', color: 'var(--text-primary)', fontWeight: 600, cursor: 'pointer', fontSize: 13,
          }}>Export CSV</button>
        </div>
      </div>

      <div style={{ background: 'var(--card-bg)', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', overflow: 'auto' }}>
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr 1fr 1fr 100px',
          padding: '14px 20px', borderBottom: '1px solid var(--border-color)',
          fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase',
        }}>
          <span>Event</span><span>Source</span><span>Transaction</span><span>Status</span><span>Signature</span><span>Time</span>
        </div>
        {logs.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>No webhook logs found</div>
        ) : (
          logs.map((l: any, i: number) => {
            const id = l.id || `wh-${i}`;
            const isError = l.response_status >= 400;
            return (
              <div key={id}>
                <div
                  onClick={() => setExpanded(expanded === id ? null : id)}
                  style={{
                    display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr 1fr 1fr 100px',
                    padding: '14px 20px', borderBottom: '1px solid var(--border-color)',
                    fontSize: 14, color: 'var(--text-primary)', alignItems: 'center', cursor: 'pointer',
                  }}
                >
                  <span style={{ fontWeight: 600 }}>{l.event_type || '—'}</span>
                  <span>{l.source || '—'}</span>
                  <span style={{ fontFamily: 'monospace', fontSize: 13 }}>{l.transaction_ref || '—'}</span>
                  <span>
                    <span style={{
                      padding: '3px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                      background: isError ? '#FFF0F0' : '#E8F5E9',
                      color: isError ? '#FF3D00' : '#2E7D32',
                    }}>{l.response_status || 200}</span>
                  </span>
                  <span>
                    <span style={{
                      padding: '3px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                      background: l.signature_valid ? '#E8F5E9' : '#FFF3E0',
                      color: l.signature_valid ? '#2E7D32' : '#E65100',
                    }}>{l.signature_valid ? 'Valid' : 'Invalid'}</span>
                  </span>
                  <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
                    {l.created_at ? new Date(l.created_at).toLocaleTimeString() : '—'}
                  </span>
                </div>
                {expanded === id && (
                  <div style={{ padding: '12px 20px 16px', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
                    {l.error && (
                      <div style={{ marginBottom: 8 }}>
                        <p style={{ fontSize: 11, fontWeight: 600, color: '#FF3D00', margin: '0 0 4px' }}>Error</p>
                        <p style={{ fontSize: 13, color: '#FF3D00', margin: 0, fontFamily: 'monospace' }}>{l.error}</p>
                      </div>
                    )}
                    <div>
                      <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', margin: '0 0 4px' }}>Request Body</p>
                      <pre style={{
                        fontSize: 12, color: 'var(--text-primary)', margin: 0, whiteSpace: 'pre-wrap',
                        wordBreak: 'break-all', fontFamily: 'monospace',
                      }}>{l.request_body || '(empty)'}</pre>
                    </div>
                    <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 8 }}>
                      {l.created_at ? new Date(l.created_at).toLocaleString() : '—'}
                    </p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
      {totalPages > 1 && (
        <div style={{
          display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8,
          padding: '16px 20px',
        }}>
          <button disabled={page <= 1} onClick={() => setPage(page - 1)} style={pageBtnStyle(page <= 1)}>Previous</button>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Page {page} of {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} style={pageBtnStyle(page >= totalPages)}>Next</button>
        </div>
      )}
    </div>
  );
}

function pageBtnStyle(disabled: boolean): React.CSSProperties {
  return {
    padding: '6px 14px', borderRadius: 6, border: '1px solid var(--border-color)',
    background: disabled ? 'var(--bg-secondary)' : 'transparent',
    color: disabled ? 'var(--text-secondary)' : 'var(--text-primary)',
    fontSize: 13, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer',
  };
}
