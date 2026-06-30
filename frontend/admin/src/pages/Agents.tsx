import { useState, useEffect } from 'react';
import { fetchAgents, updateAgentStatus, depositAgentFloat, type AgentResponse } from '../api/client';
import Loading from '../components/Loading';

export default function Agents() {
  const [data, setData] = useState<AgentResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [floatTarget, setFloatTarget] = useState<{ id: string; name: string } | null>(null);
  const [floatAmount, setFloatAmount] = useState('');
  const [floatSubmitting, setFloatSubmitting] = useState(false);

  const load = () => {
    setLoading(true);
    setError('');
    fetchAgents(1, 50)
      .then(setData)
      .catch((e) => setError(e.response?.data?.error || e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const toggleStatus = async (id: string, current: boolean) => {
    try {
      await updateAgentStatus(id, !current);
      load();
    } catch {
      setError('Failed to update agent status');
    }
  };

  const submitFloat = async () => {
    if (!floatTarget || !floatAmount) return;
    const amount = parseInt(floatAmount, 10);
    if (isNaN(amount) || amount <= 0) return;
    setFloatSubmitting(true);
    try {
      await depositAgentFloat(floatTarget.id, amount);
      setFloatTarget(null);
      setFloatAmount('');
      load();
    } catch {
      setError('Failed to deposit float');
    } finally {
      setFloatSubmitting(false);
    }
  };

  const exportCSV = () => {
    const agents = data?.agents ?? [];
    if (agents.length === 0) return;
    const headers = ['Shop Name', 'Owner', 'Type', 'Location', 'Float (LAK)', 'Status', 'KYC'];
    const rows = agents.map((a: any) => [
      a.shop_name || '', a.name || a.user_id || '', a.agent_type === 'cash_out_agent' ? 'Cash-Out' : 'Cash-In',
      a.province || '', String(a.float_balance_lak ?? 0), a.is_active ? 'Active' : 'Suspended', 'Verified',
    ]);
    const csv = [headers.join(','), ...rows.map((r: string[]) => r.map((c: string) => `"${c.replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `agents-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  if (loading) return <Loading text="Loading agents..." />;

  const agents = data?.agents ?? [];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Agent Management</h1>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{data?.total ?? 0} agents</span>
          <button onClick={exportCSV} style={{
            padding: '8px 16px', borderRadius: 8, border: '1px solid #D1D5DB',
            background: '#FFF', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#374151',
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
          display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1fr 1fr 1fr 120px',
          padding: '14px 20px', borderBottom: '1px solid var(--border-color)',
          fontSize: 12, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase',
        }}>
          <span>Shop Name</span><span>Owner</span><span>Type</span><span>Location</span><span>Float (LAK)</span><span>Status</span><span>KYC</span><span>Actions</span>
        </div>
        {agents.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF' }}>No agents found</div>
        ) : (
          agents.map((a, i) => (
            <div key={a.id || i} style={{
              display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1fr 1fr 1fr 120px',
              padding: '14px 20px', borderBottom: '1px solid #F0F0F0',
              fontSize: 14, color: '#1A1A2E', alignItems: 'center',
            }}>
              <span style={{ fontWeight: 600 }}>{a.shop_name || '—'}</span>
              <span>{a.name || a.user_id?.slice(0, 8) || '—'}</span>
              <span>{a.agent_type === 'cash_out_agent' ? 'Cash-Out' : 'Cash-In'}</span>
              <span>{a.province || '—'}</span>
              <span>{(a.float_balance_lak ?? 0).toLocaleString()}</span>
              <span>
                <span style={{
                  display: 'inline-block', padding: '3px 10px', borderRadius: 6,
                  fontSize: 12, fontWeight: 600,
                  background: a.is_active ? '#E8F5E9' : '#FFF3E0',
                  color: a.is_active ? '#2E7D32' : '#E65100',
                }}>
                  {a.is_active ? 'Active' : 'Suspended'}
                </span>
              </span>
              <span style={{ fontWeight: 600, color: '#00C853' }}>Verified</span>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={() => toggleStatus(a.id, a.is_active)}
                  title={a.is_active ? 'Suspend' : 'Activate'}
                  style={{
                    padding: '6px 10px', borderRadius: 6, border: '1px solid #D1D5DB',
                    background: '#FFF', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                    color: a.is_active ? '#E65100' : '#2E7D32',
                  }}
                >
                  {a.is_active ? 'Suspend' : 'Activate'}
                </button>
                <button
                  onClick={() => setFloatTarget({ id: a.id, name: a.shop_name || a.id })}
                  style={{
                    padding: '6px 10px', borderRadius: 6, border: '1px solid #D1D5DB',
                    background: '#FFF', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#1A8CFF',
                  }}
                >
                  Top Up
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {floatTarget && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }} onClick={() => setFloatTarget(null)}>
          <div style={{
            background: '#FFF', borderRadius: 16, padding: 32, width: 380,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)', maxWidth: '90vw',
          }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1A1A2E', margin: '0 0 4px' }}>Deposit Float</h3>
            <p style={{ fontSize: 13, color: '#6B7280', margin: '0 0 20px' }}>{floatTarget.name}</p>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Amount (LAK)</label>
            <input
              type="number" value={floatAmount}
              onChange={(e) => setFloatAmount(e.target.value)}
              placeholder="e.g. 1000000"
              min="1"
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #D1D5DB',
                fontSize: 14, outline: 'none', boxSizing: 'border-box', marginBottom: 20,
              }}
              autoFocus
            />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setFloatTarget(null)}
                style={{
                  padding: '10px 20px', borderRadius: 8, border: '1px solid #D1D5DB',
                  background: '#FFF', cursor: 'pointer', fontSize: 14, fontWeight: 600, color: '#374151',
                }}
              >
                Cancel
              </button>
              <button
                onClick={submitFloat} disabled={floatSubmitting}
                style={{
                  padding: '10px 20px', borderRadius: 8, border: 'none',
                  background: floatSubmitting ? '#93C5FD' : '#1A8CFF',
                  color: '#FFF', cursor: floatSubmitting ? 'not-allowed' : 'pointer',
                  fontSize: 14, fontWeight: 600,
                }}
              >
                {floatSubmitting ? 'Depositing...' : 'Deposit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
