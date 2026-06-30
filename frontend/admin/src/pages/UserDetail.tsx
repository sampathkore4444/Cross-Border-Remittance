import { useEffect, useState } from 'react';
import { fetchUserDetail, type UserDetailResponse } from '../api/client';
import Loading from '../components/Loading';

interface Props {
  userId: string;
  onBack: () => void;
}

export default function UserDetail({ userId, onBack }: Props) {
  const [data, setData] = useState<UserDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'profile' | 'kyc' | 'transactions' | 'agent'>('profile');

  useEffect(() => {
    setLoading(true);
    fetchUserDetail(userId)
      .then(setData)
      .catch((e) => setError(e.response?.data?.error || e.message))
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) return <Loading text="Loading user detail..." />;
  if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />;
  if (!data?.user) return <ErrorState message="User not found" onRetry={onBack} />;

  const u = data.user;
  const tabs = [
    { key: 'profile' as const, label: 'Profile' },
    { key: 'kyc' as const, label: `KYC (${(data.kyc_documents || []).length})` },
    { key: 'transactions' as const, label: `Transactions (${(data.transactions || []).length})` },
    { key: 'agent' as const, label: 'Agent' },
  ];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button onClick={onBack} style={{
          padding: '8px 14px', borderRadius: 8, border: '1px solid var(--border-color)',
          background: 'transparent', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 600, fontSize: 13,
        }}>← Back</button>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{u.name || u.phone || u.id}</h1>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding: '8px 18px', borderRadius: 8, border: '1px solid var(--border-color)',
            background: tab === t.key ? 'var(--nav-active-bg)' : 'transparent',
            color: tab === t.key ? 'var(--nav-active-text)' : 'var(--text-primary)',
            fontWeight: 600, cursor: 'pointer', fontSize: 13,
          }}>{t.label}</button>
        ))}
      </div>

      <div style={{ background: 'var(--card-bg)', borderRadius: 12, padding: 24 }}>
        {tab === 'profile' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Field label="ID" value={u.id} />
            <Field label="Phone" value={u.phone} />
            <Field label="Name" value={u.name} />
            <Field label="Role" value={u.role} />
            <Field label="KYC Level" value={u.kyc_level} />
            <Field label="Language" value={u.language} />
            <Field label="Status" value={u.is_active ? 'Active' : 'Suspended'} />
            <Field label="Country" value={u.country_code} />
            <Field label="Created" value={u.created_at ? new Date(u.created_at).toLocaleString() : '—'} />
          </div>
        )}

        {tab === 'kyc' && (
          <div>
            {(data.kyc_documents || []).length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>No KYC documents</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                    {['ID', 'Type', 'Number', 'Status', 'Submitted'].map((h) => (
                      <th key={h} style={{ padding: '10px 14px', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(data.kyc_documents || []).map((d: any) => (
                    <tr key={d.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '10px 14px', fontSize: 13, color: 'var(--text-primary)' }}>{d.id}</td>
                      <td style={{ padding: '10px 14px', fontSize: 13, color: 'var(--text-primary)' }}>{d.doc_type}</td>
                      <td style={{ padding: '10px 14px', fontSize: 13, color: 'var(--text-primary)' }}>{d.doc_number || '—'}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <Badge label={d.status} color={d.status === 'approved' ? '#2E7D32' : d.status === 'rejected' ? '#C62828' : '#E65100'} bg={d.status === 'approved' ? '#E8F5E9' : d.status === 'rejected' ? '#FFEBEE' : '#FFF3E0'} />
                      </td>
                      <td style={{ padding: '10px 14px', fontSize: 12, color: 'var(--text-secondary)' }}>{d.created_at ? new Date(d.created_at).toLocaleDateString() : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {tab === 'transactions' && (
          <div>
            {(data.transactions || []).length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>No transactions</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                    {['Ref', 'Amount', 'Recipient', 'Status', 'Date'].map((h) => (
                      <th key={h} style={{ padding: '10px 14px', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(data.transactions || []).map((tx: any) => (
                    <tr key={tx.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '10px 14px', fontSize: 12, fontFamily: 'monospace', color: 'var(--text-primary)' }}>{tx.transaction_ref || tx.id}</td>
                      <td style={{ padding: '10px 14px', fontSize: 13, color: 'var(--text-primary)' }}>{(tx.source_amount ?? 0).toLocaleString()} {tx.source_currency || 'THB'}</td>
                      <td style={{ padding: '10px 14px', fontSize: 13, color: 'var(--text-primary)' }}>{tx.recipient_name || '—'}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <Badge label={tx.payout_status || tx.payment_status || 'pending'} color={tx.payout_status === 'completed' ? '#2E7D32' : '#E65100'} bg={tx.payout_status === 'completed' ? '#E8F5E9' : '#FFF3E0'} />
                      </td>
                      <td style={{ padding: '10px 14px', fontSize: 12, color: 'var(--text-secondary)' }}>
                        {tx.created_at ? new Date(tx.created_at).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {tab === 'agent' && (
          <div>
            {!data.agent ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Not an agent</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Field label="Shop Name" value={(data.agent as any).shop_name} />
                <Field label="Name" value={(data.agent as any).name} />
                <Field label="Phone" value={(data.agent as any).phone} />
                <Field label="Province" value={(data.agent as any).province} />
                <Field label="Float Balance" value={(data.agent as any).float_balance_lak?.toLocaleString() + ' LAK'} />
                <Field label="Status" value={(data.agent as any).is_active ? 'Active' : 'Suspended'} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: '0 0 2px', textTransform: 'uppercase', fontWeight: 600 }}>{label}</p>
      <p style={{ fontSize: 14, color: 'var(--text-primary)', margin: 0, fontWeight: 500 }}>{value || '—'}</p>
    </div>
  );
}

function Badge({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <span style={{ padding: '3px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600, background: bg, color }}>{label}</span>
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
