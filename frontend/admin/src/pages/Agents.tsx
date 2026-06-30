import { useState, useEffect } from 'react';
import { fetchAgents, updateAgentStatus, depositAgentFloat, type AgentResponse } from '../api/client';
import { downloadCSV } from '../utils/csv';
import { useToast } from '../components/Toast';
import ConfirmDialog from '../components/ConfirmDialog';
import Loading from '../components/Loading';
import CreateAgent from './CreateAgent';

export default function Agents() {
  const { toast } = useToast();
  const [data, setData] = useState<AgentResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [floatTarget, setFloatTarget] = useState<{ id: string; name: string } | null>(null);
  const [floatAmount, setFloatAmount] = useState('');
  const [floatSubmitting, setFloatSubmitting] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<{ id: string; name: string; action: 'suspend' | 'activate' } | null>(null);
  const [country, setCountry] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<'suspend' | 'activate' | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const load = () => {
    setLoading(true);
    setError('');
    fetchAgents(1, 50, country)
      .then(setData)
      .catch((e) => setError(e.response?.data?.error || e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [country]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    const agents = data?.agents ?? [];
    if (selected.size === agents.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(agents.map((a: any) => a.id)));
    }
  };

  const handleBulkAction = async () => {
    if (!bulkAction) return;
    const newActive = bulkAction === 'activate';
    let success = 0;
    for (const id of selected) {
      try {
        await updateAgentStatus(id, newActive);
        success++;
      } catch {}
    }
    toast(`${success} of ${selected.size} agents ${bulkAction}d`);
    setBulkAction(null);
    setSelected(new Set());
    load();
  };

  const handleToggleStatus = async () => {
    if (!confirmTarget) return;
    const newActive = confirmTarget.action === 'activate';
    try {
      await updateAgentStatus(confirmTarget.id, newActive);
      toast(newActive ? 'Agent activated' : 'Agent suspended');
      setConfirmTarget(null);
      load();
    } catch {
      toast('Failed to update agent status', 'error');
    }
  };

  const submitFloat = async () => {
    if (!floatTarget || !floatAmount) return;
    const amount = parseInt(floatAmount, 10);
    if (isNaN(amount) || amount <= 0) return;
    setFloatSubmitting(true);
    try {
      await depositAgentFloat(floatTarget.id, amount);
      toast(`Deposited ${amount.toLocaleString()} LAK to ${floatTarget.name}`);
      setFloatTarget(null);
      setFloatAmount('');
      load();
    } catch {
      toast('Failed to deposit float', 'error');
    } finally {
      setFloatSubmitting(false);
    }
  };

  const exportCSV = () => {
    const agents = data?.agents ?? [];
    if (agents.length === 0) { toast('No agents to export', 'info'); return; }
    const headers = ['Shop Name', 'Owner', 'Type', 'Location', 'Float (LAK)', 'Status', 'KYC'];
    const rows = agents.map((a: any) => [
      a.shop_name || '', a.name || a.user_id || '', a.agent_type === 'cash_out_agent' ? 'Cash-Out' : 'Cash-In',
      a.province || '', String(a.float_balance_lak ?? 0), a.is_active ? 'Active' : 'Suspended', 'Verified',
    ]);
    downloadCSV(headers, rows, 'agents');
    toast('Agents exported');
  };

  if (showCreateForm) {
    return <CreateAgent onBack={() => { setShowCreateForm(false); load(); }} />;
  }

  if (loading) return <Loading text="Loading agents..." />;

  const agents = data?.agents ?? [];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Agent Management</h1>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{data?.total ?? 0} agents</span>
          <select value={country} onChange={(e) => setCountry(e.target.value)} style={{
            padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-color)',
            background: 'var(--card-bg)', color: 'var(--text-primary)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}>
            <option value="">All Countries</option>
            <option value="LA">Laos</option>
            <option value="TH">Thailand</option>
          </select>
          <button onClick={() => setShowCreateForm(true)} style={{
            padding: '8px 16px', borderRadius: 8, border: 'none',
            background: '#1A8CFF', color: '#FFF', fontWeight: 600, cursor: 'pointer', fontSize: 13,
          }}>+ Create Agent</button>
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

      {selected.size > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px',
          background: '#E8F5E9', borderRadius: 8, marginBottom: 16,
        }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#2E7D32' }}>{selected.size} selected</span>
          <button onClick={() => setBulkAction('activate')} style={{
            padding: '6px 14px', borderRadius: 6, border: '1px solid #2E7D32',
            background: 'transparent', color: '#2E7D32', fontWeight: 600, cursor: 'pointer', fontSize: 13,
          }}>Activate All</button>
          <button onClick={() => setBulkAction('suspend')} style={{
            padding: '6px 14px', borderRadius: 6, border: '1px solid #E65100',
            background: 'transparent', color: '#E65100', fontWeight: 600, cursor: 'pointer', fontSize: 13,
          }}>Suspend All</button>
          <button onClick={() => setSelected(new Set())} style={{
            padding: '6px 14px', borderRadius: 6, border: '1px solid var(--border-color)',
            background: 'transparent', color: 'var(--text-primary)', fontWeight: 600, cursor: 'pointer', fontSize: 13,
          }}>Clear</button>
        </div>
      )}

      <div style={{ background: 'var(--card-bg)', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', overflow: 'auto' }}>
        <div style={{
          display: 'grid', gridTemplateColumns: '40px 1.5fr 1fr 1fr 1fr 1fr 1fr 1fr 120px',
          padding: '14px 20px', borderBottom: '1px solid var(--border-color)',
          fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', alignItems: 'center',
        }}>
          <input type="checkbox" checked={agents.length > 0 && selected.size === agents.length}
            onChange={toggleSelectAll} style={{ cursor: 'pointer' }} />
          <span>Shop Name</span><span>Owner</span><span>Type</span><span>Location</span><span>Float (LAK)</span><span>Status</span><span>KYC</span><span>Actions</span>
        </div>
        {agents.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>No agents found</div>
        ) : (
          agents.map((a, i) => (
            <div key={a.id || i} style={{
              display: 'grid', gridTemplateColumns: '40px 1.5fr 1fr 1fr 1fr 1fr 1fr 1fr 120px',
              padding: '14px 20px', borderBottom: '1px solid var(--border-color)',
              fontSize: 14, color: 'var(--text-primary)', alignItems: 'center',
            }}>
              <input type="checkbox" checked={selected.has(a.id)} onChange={() => toggleSelect(a.id)} style={{ cursor: 'pointer' }} />
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
                }}>{a.is_active ? 'Active' : 'Suspended'}</span>
              </span>
              <span style={{ fontWeight: 600, color: '#00C853' }}>Verified</span>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={() => setConfirmTarget({ id: a.id, name: a.shop_name || a.id, action: a.is_active ? 'suspend' : 'activate' })}
                  style={{
                    padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border-color)',
                    background: 'transparent', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                    color: a.is_active ? '#E65100' : '#2E7D32',
                  }}
                >
                  {a.is_active ? 'Suspend' : 'Activate'}
                </button>
                <button
                  onClick={() => setFloatTarget({ id: a.id, name: a.shop_name || a.id })}
                  style={{
                    padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border-color)',
                    background: 'transparent', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#1A8CFF',
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
            background: 'var(--card-bg)', borderRadius: 16, padding: 32, width: 380,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)', maxWidth: '90vw',
          }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px' }}>Deposit Float</h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 20px' }}>{floatTarget.name}</p>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>Amount (LAK)</label>
            <input
              type="number" value={floatAmount}
              onChange={(e) => setFloatAmount(e.target.value)}
              placeholder="e.g. 1000000"
              min="1"
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-color)',
                background: 'var(--bg-primary)', color: 'var(--text-primary)',
                fontSize: 14, outline: 'none', boxSizing: 'border-box', marginBottom: 20,
              }}
              autoFocus
            />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setFloatTarget(null)} style={{
                padding: '10px 20px', borderRadius: 8, border: '1px solid var(--border-color)',
                background: 'transparent', color: 'var(--text-primary)', fontWeight: 600, cursor: 'pointer', fontSize: 14,
              }}>Cancel</button>
              <button onClick={submitFloat} disabled={floatSubmitting} style={{
                padding: '10px 20px', borderRadius: 8, border: 'none',
                background: floatSubmitting ? '#93C5FD' : '#1A8CFF',
                color: '#FFF', cursor: floatSubmitting ? 'not-allowed' : 'pointer',
                fontSize: 14, fontWeight: 600,
              }}>{floatSubmitting ? 'Depositing...' : 'Deposit'}</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!confirmTarget}
        title={confirmTarget?.action === 'suspend' ? 'Suspend Agent' : 'Activate Agent'}
        message={`Are you sure you want to ${confirmTarget?.action} "${confirmTarget?.name}"?`}
        confirmLabel={confirmTarget?.action === 'suspend' ? 'Suspend' : 'Activate'}
        danger={confirmTarget?.action === 'suspend'}
        onConfirm={handleToggleStatus}
        onCancel={() => setConfirmTarget(null)}
      />

      <ConfirmDialog
        open={!!bulkAction}
        title={bulkAction === 'suspend' ? 'Suspend Agents' : 'Activate Agents'}
        message={`Are you sure you want to ${bulkAction} ${selected.size} selected agents?`}
        confirmLabel={bulkAction === 'suspend' ? 'Suspend All' : 'Activate All'}
        danger={bulkAction === 'suspend'}
        onConfirm={handleBulkAction}
        onCancel={() => setBulkAction(null)}
      />
    </div>
  );
}
