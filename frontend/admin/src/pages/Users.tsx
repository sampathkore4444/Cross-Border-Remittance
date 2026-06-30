import { useState, useEffect } from 'react';
import { fetchUsers, updateUserStatus, type UserResponse } from '../api/client';
import { downloadCSV } from '../utils/csv';
import { useToast } from '../components/Toast';
import ConfirmDialog from '../components/ConfirmDialog';
import UserDetail from './UserDetail';
import Loading from '../components/Loading';

export default function Users() {
  const { toast } = useToast();
  const [data, setData] = useState<UserResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<{ id: string; name: string; action: 'suspend' | 'activate' } | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<'suspend' | 'activate' | null>(null);
  const limit = 20;

  const load = (p: number) => {
    setLoading(true);
    setError('');
    fetchUsers(p, limit)
      .then(setData)
      .catch((e) => setError(e.response?.data?.error || e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(page); }, [page]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    const users = data?.users ?? [];
    if (selected.size === users.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(users.map((u: any) => u.id)));
    }
  };

  const handleBulkAction = async () => {
    if (!bulkAction) return;
    const newActive = bulkAction === 'activate';
    let success = 0;
    for (const id of selected) {
      try {
        await updateUserStatus(id, newActive);
        success++;
      } catch {}
    }
    toast(`${success} of ${selected.size} users ${bulkAction}d`);
    setBulkAction(null);
    setSelected(new Set());
    load(page);
  };

  const handleToggleStatus = async () => {
    if (!confirmTarget) return;
    const newActive = confirmTarget.action === 'activate';
    try {
      await updateUserStatus(confirmTarget.id, newActive);
      toast(newActive ? 'User activated' : 'User suspended');
      setConfirmTarget(null);
      load(page);
    } catch {
      toast('Failed to update user status', 'error');
    }
  };

  const exportCSV = () => {
    const users = data?.users ?? [];
    if (users.length === 0) { toast('No users to export', 'info'); return; }
    const headers = ['ID', 'Name', 'Phone', 'Role', 'KYC Level', 'Status', 'Created'];
    const rows = users.map((u: any) => [
      u.id || '', u.name || '', u.phone || '', u.role || 'sender',
      u.kyc_level || 'unverified', u.is_active ? 'Active' : 'Suspended',
      u.created_at ? new Date(u.created_at).toISOString() : '',
    ]);
    downloadCSV(headers, rows, 'users');
    toast('Users exported');
  };

  if (selectedUserId) {
    return <UserDetail userId={selectedUserId} onBack={() => setSelectedUserId(null)} />;
  }

  if (loading) return <Loading text="Loading users..." />;

  const users = data?.users ?? [];
  const totalPages = Math.ceil((data?.total ?? 0) / limit);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>User Management</h1>
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
          display: 'grid', gridTemplateColumns: '40px 1fr 1fr 1fr 1fr 1fr 1fr 120px',
          padding: '14px 20px', borderBottom: '1px solid var(--border-color)',
          fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', alignItems: 'center',
        }}>
          <input type="checkbox" checked={users.length > 0 && selected.size === users.length}
            onChange={toggleSelectAll} style={{ cursor: 'pointer' }} />
          <span>ID</span><span>Name</span><span>Phone</span><span>Role</span><span>KYC</span><span>Status</span><span>Actions</span>
        </div>
        {users.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>No users found</div>
        ) : (
          users.map((u, i) => (
            <div key={u.id || i} style={{
              display: 'grid', gridTemplateColumns: '40px 1fr 1fr 1fr 1fr 1fr 1fr 120px',
              padding: '14px 20px', borderBottom: '1px solid var(--border-color)',
              fontSize: 14, color: 'var(--text-primary)', alignItems: 'center', cursor: 'pointer',
            }}>
              <div onClick={(e) => e.stopPropagation()}>
                <input type="checkbox" checked={selected.has(u.id)} onChange={() => toggleSelect(u.id)} style={{ cursor: 'pointer' }} />
              </div>
              <span style={{ fontFamily: 'monospace', fontSize: 12 }} onClick={() => setSelectedUserId(u.id)}>{u.id?.slice(0, 12) || '—'}</span>
              <span style={{ fontWeight: 600 }} onClick={() => setSelectedUserId(u.id)}>{u.name || '—'}</span>
              <span onClick={() => setSelectedUserId(u.id)}>{u.phone || '—'}</span>
              <span onClick={() => setSelectedUserId(u.id)}>{u.role || 'sender'}</span>
              <span onClick={() => setSelectedUserId(u.id)}>
                <span style={{
                  padding: '3px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                  background: u.kyc_level === 'unverified' ? '#FFF3E0' : '#E8F5E9',
                  color: u.kyc_level === 'unverified' ? '#E65100' : '#2E7D32',
                }}>{u.kyc_level || 'unverified'}</span>
              </span>
              <span onClick={() => setSelectedUserId(u.id)}>
                <span style={{
                  display: 'inline-block', padding: '3px 10px', borderRadius: 6,
                  fontSize: 12, fontWeight: 600,
                  background: u.is_active ? '#E8F5E9' : '#FFF3E0',
                  color: u.is_active ? '#2E7D32' : '#E65100',
                }}>{u.is_active ? 'Active' : 'Suspended'}</span>
              </span>
              <div style={{ display: 'flex', gap: 6 }} onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => setConfirmTarget({ id: u.id, name: u.name || u.id, action: u.is_active ? 'suspend' : 'activate' })}
                  style={{
                    padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border-color)',
                    background: 'transparent', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                    color: u.is_active ? '#E65100' : '#2E7D32',
                  }}
                >
                  {u.is_active ? 'Suspend' : 'Activate'}
                </button>
              </div>
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

      <ConfirmDialog
        open={!!confirmTarget}
        title={confirmTarget?.action === 'suspend' ? 'Suspend User' : 'Activate User'}
        message={`Are you sure you want to ${confirmTarget?.action} "${confirmTarget?.name}"?`}
        confirmLabel={confirmTarget?.action === 'suspend' ? 'Suspend' : 'Activate'}
        danger={confirmTarget?.action === 'suspend'}
        onConfirm={handleToggleStatus}
        onCancel={() => setConfirmTarget(null)}
      />

      <ConfirmDialog
        open={!!bulkAction}
        title={bulkAction === 'suspend' ? 'Suspend Users' : 'Activate Users'}
        message={`Are you sure you want to ${bulkAction} ${selected.size} selected users?`}
        confirmLabel={bulkAction === 'suspend' ? 'Suspend All' : 'Activate All'}
        danger={bulkAction === 'suspend'}
        onConfirm={handleBulkAction}
        onCancel={() => setBulkAction(null)}
      />
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
