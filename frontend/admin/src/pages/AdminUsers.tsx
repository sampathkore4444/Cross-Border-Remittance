import { useEffect, useState } from 'react';
import { fetchAdminUsers, createAdminUser, updateAdminUser, deleteAdminUser, type AdminUser } from '../api/client';
import Loading from '../components/Loading';

export default function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [form, setForm] = useState({ username: '', password: '', role: 'admin' });

  const load = () => {
    setLoading(true);
    setError('');
    fetchAdminUsers()
      .then((res) => setUsers(res.admin_users))
      .catch((e) => setError(e.response?.data?.error || e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    try {
      if (editing) {
        await updateAdminUser(editing.id, form.password ? form : { ...form, password: undefined } as any);
      } else {
        await createAdminUser(form.username, form.password, form.role);
      }
      setShowModal(false);
      setEditing(null);
      setForm({ username: '', password: '', role: 'admin' });
      load();
    } catch (e: any) {
      alert(e.response?.data?.error || e.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this admin user?')) return;
    try {
      await deleteAdminUser(id);
      load();
    } catch (e: any) {
      alert(e.response?.data?.error || e.message);
    }
  };

  const openEdit = (u: AdminUser) => {
    setEditing(u);
    setForm({ username: u.username, password: '', role: u.role });
    setShowModal(true);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Admin Users</h1>
        <button onClick={() => { setEditing(null); setForm({ username: '', password: '', role: 'admin' }); setShowModal(true); }} style={{
          padding: '10px 20px', borderRadius: 8, border: 'none', background: '#1A8CFF', color: '#FFF', fontWeight: 600, cursor: 'pointer', fontSize: 14,
        }}>+ Add User</button>
      </div>
      {loading ? <Loading text="Loading admin users..." /> : error ? <ErrorState message={error} onRetry={load} /> : (
        <div style={{ background: 'var(--card-bg)', borderRadius: 12, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                {['Username', 'Role', 'Active', 'Created', 'Actions'].map((h) => (
                  <th key={h} style={{ padding: '12px 16px', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-primary)' }}>{u.username}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-primary)' }}>{u.role}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      padding: '4px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600,
                      background: u.is_active ? '#E8F5E9' : '#FFEBEE',
                      color: u.is_active ? '#2E7D32' : '#C62828',
                    }}>{u.is_active ? 'Active' : 'Inactive'}</span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-secondary)' }}>{new Date(u.created_at).toLocaleDateString()}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => openEdit(u)} style={{
                        padding: '6px 14px', borderRadius: 6, border: '1px solid var(--border-color)',
                        background: 'transparent', color: 'var(--text-primary)', fontWeight: 600, cursor: 'pointer', fontSize: 12,
                      }}>Edit</button>
                      <button onClick={() => handleDelete(u.id)} style={{
                        padding: '6px 14px', borderRadius: 6, border: 'none', background: '#C62828', color: '#FFF', fontWeight: 600, cursor: 'pointer', fontSize: 12,
                      }}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }} onClick={() => setShowModal(false)}>
          <div style={{ background: 'var(--card-bg)', borderRadius: 16, padding: 32, width: 400, maxWidth: '90vw' }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 20px' }}>{editing ? 'Edit Admin User' : 'Create Admin User'}</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input placeholder="Username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })}
                style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: 14 }} />
              <input placeholder={editing ? 'New password (leave blank to keep)' : 'Password'} type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: 14 }} />
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
                style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: 14 }}>
                <option value="admin">Admin</option>
                <option value="super_admin">Super Admin</option>
                <option value="compliance_officer">Compliance Officer</option>
                <option value="treasury_manager">Treasury Manager</option>
                <option value="support">Support</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
              <button onClick={() => setShowModal(false)} style={{
                padding: '10px 20px', borderRadius: 8, border: '1px solid var(--border-color)',
                background: 'transparent', color: 'var(--text-primary)', fontWeight: 600, cursor: 'pointer', fontSize: 14,
              }}>Cancel</button>
              <button onClick={handleSave} style={{
                padding: '10px 20px', borderRadius: 8, border: 'none', background: '#1A8CFF', color: '#FFF', fontWeight: 600, cursor: 'pointer', fontSize: 14,
              }}>{editing ? 'Update' : 'Create'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div style={{ padding: 40, textAlign: 'center' }}>
      <p style={{ color: '#FF3D00', fontSize: 14, marginBottom: 16 }}>{message}</p>
      <button onClick={onRetry} style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: '#1A8CFF', color: '#FFF', fontWeight: 600, cursor: 'pointer' }}>Retry</button>
    </div>
  );
}
