import { useState, useEffect } from 'react';
import { fetchAdminLogs, type LogResponse } from '../api/client';
import { downloadCSV } from '../utils/csv';
import { useToast } from '../components/Toast';
import Loading from '../components/Loading';

export default function AdminLogs() {
  const { toast } = useToast();
  const [data, setData] = useState<LogResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const limit = 50;

  const load = (p: number) => {
    setLoading(true);
    setError('');
    fetchAdminLogs(p, limit)
      .then(setData)
      .catch((e) => setError(e.response?.data?.error || e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(page); }, [page]);

  const exportCSV = () => {
    const logs = data?.logs ?? [];
    if (logs.length === 0) { toast('No logs to export', 'info'); return; }
    const headers = ['Admin', 'Action', 'Target', 'Detail', 'Time'];
    const rows = logs.map((l: any) => [
      l.admin_id || '', l.action || '', l.target_id || '',
      l.detail || '', l.created_at ? new Date(l.created_at).toISOString() : '',
    ]);
    downloadCSV(headers, rows, 'admin-logs');
    toast('Logs exported');
  };

  if (loading) return <Loading text="Loading audit logs..." />;

  const logs = data?.logs ?? [];
  const totalPages = Math.ceil((data?.total ?? 0) / limit);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Admin Audit Logs</h1>
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

      {error && (
        <div style={{ background: '#FFF0F0', color: '#FF3D00', padding: '10px 16px', borderRadius: 8, fontSize: 13, marginBottom: 16 }}>
          {error}
          <button onClick={() => setError('')} style={{ marginLeft: 12, background: 'none', border: 'none', cursor: 'pointer', color: '#FF3D00', fontWeight: 600 }}>Dismiss</button>
        </div>
      )}

      <div style={{ background: 'var(--card-bg)', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', overflow: 'auto' }}>
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 2fr 1fr',
          padding: '14px 20px', borderBottom: '1px solid var(--border-color)',
          fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase',
        }}>
          <span>Admin</span><span>Action</span><span>Target</span><span>Detail</span><span>Time</span>
        </div>
        {logs.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>No audit logs found</div>
        ) : (
          logs.map((l: any, i: number) => (
            <div key={l.id || i} style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 2fr 1fr',
              padding: '14px 20px', borderBottom: '1px solid var(--border-color)',
              fontSize: 14, color: 'var(--text-primary)', alignItems: 'center',
            }}>
              <span style={{ fontFamily: 'monospace', fontSize: 13 }}>{l.admin_id?.slice(0, 12) || '—'}</span>
              <span><code style={{ padding: '2px 8px', borderRadius: 4, background: '#F3F4F6', fontSize: 12 }}>{l.action || '—'}</code></span>
              <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{l.target_id?.slice(0, 12) || '—'}</span>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{l.detail || '—'}</span>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                {l.created_at ? new Date(l.created_at).toLocaleString() : '—'}
              </span>
            </div>
          ))
        )}
      </div>
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, padding: '16px 20px' }}>
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
