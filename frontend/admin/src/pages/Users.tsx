import { useState, useEffect } from 'react';
import { fetchUsers, updateUserStatus, type UserResponse } from '../api/client';
import Loading from '../components/Loading';

export default function Users() {
  const [data, setData] = useState<UserResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
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

  const toggleStatus = async (id: string, current: boolean) => {
    try {
      await updateUserStatus(id, !current);
      load(page);
    } catch {
      setError('Failed to update user status');
    }
  };

  if (loading) return <Loading text="Loading users..." />;

  const users = data?.users ?? [];
  const totalPages = Math.ceil((data?.total ?? 0) / limit);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1A1A2E', margin: 0 }}>User Management</h1>
        <span style={{ fontSize: 13, color: '#6B7280' }}>{data?.total ?? 0} total</span>
      </div>

      {error && (
        <div style={{ background: '#FFF0F0', color: '#FF3D00', padding: '10px 16px', borderRadius: 8, fontSize: 13, marginBottom: 16 }}>
          {error}
          <button onClick={() => setError('')} style={{ marginLeft: 12, background: 'none', border: 'none', cursor: 'pointer', color: '#FF3D00', fontWeight: 600 }}>Dismiss</button>
        </div>
      )}

      <div style={{ background: '#FFF', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', overflow: 'auto' }}>
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 1fr 120px',
          padding: '14px 20px', borderBottom: '1px solid #E5E7EB',
          fontSize: 12, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase',
        }}>
          <span>ID</span><span>Name</span><span>Phone</span><span>Role</span><span>KYC</span><span>Status</span><span>Actions</span>
        </div>
        {users.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF' }}>No users found</div>
        ) : (
          users.map((u, i) => (
            <div key={u.id || i} style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 1fr 120px',
              padding: '14px 20px', borderBottom: '1px solid #F0F0F0',
              fontSize: 14, color: '#1A1A2E', alignItems: 'center',
            }}>
              <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{u.id?.slice(0, 12) || '—'}</span>
              <span style={{ fontWeight: 600 }}>{u.name || '—'}</span>
              <span>{u.phone || '—'}</span>
              <span>{u.role || 'sender'}</span>
              <span>
                <span style={{
                  padding: '3px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                  background: u.kyc_level === 'unverified' ? '#FFF3E0' : '#E8F5E9',
                  color: u.kyc_level === 'unverified' ? '#E65100' : '#2E7D32',
                }}>{u.kyc_level || 'unverified'}</span>
              </span>
              <span>
                <span style={{
                  display: 'inline-block', padding: '3px 10px', borderRadius: 6,
                  fontSize: 12, fontWeight: 600,
                  background: u.is_active ? '#E8F5E9' : '#FFF3E0',
                  color: u.is_active ? '#2E7D32' : '#E65100',
                }}>
                  {u.is_active ? 'Active' : 'Suspended'}
                </span>
              </span>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={() => toggleStatus(u.id, u.is_active)}
                  style={{
                    padding: '6px 10px', borderRadius: 6, border: '1px solid #D1D5DB',
                    background: '#FFF', cursor: 'pointer', fontSize: 12, fontWeight: 600,
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
        <div style={{
          display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8,
          padding: '16px 20px',
        }}>
          <button
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            style={{
              padding: '6px 14px', borderRadius: 6, border: '1px solid #D1D5DB',
              background: page <= 1 ? '#F3F4F6' : '#FFF',
              color: page <= 1 ? '#9CA3AF' : '#374151',
              fontSize: 13, fontWeight: 600, cursor: page <= 1 ? 'not-allowed' : 'pointer',
            }}
          >
            Previous
          </button>
          <span style={{ fontSize: 13, color: '#6B7280' }}>Page {page} of {totalPages}</span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
            style={{
              padding: '6px 14px', borderRadius: 6, border: '1px solid #D1D5DB',
              background: page >= totalPages ? '#F3F4F6' : '#FFF',
              color: page >= totalPages ? '#9CA3AF' : '#374151',
              fontSize: 13, fontWeight: 600, cursor: page >= totalPages ? 'not-allowed' : 'pointer',
            }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
