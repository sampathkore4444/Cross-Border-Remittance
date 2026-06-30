import { useEffect, useState } from 'react';
import { fetchTreasury, type BalanceSummary } from '../api/client';
import Loading from '../components/Loading';

export default function Treasury() {
  const [data, setData] = useState<BalanceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    setError('');
    fetchTreasury()
      .then(setData)
      .catch((e) => setError(e.response?.data?.error || e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  if (loading) return <Loading text="Loading treasury..." />;
  if (error) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <p style={{ color: '#FF3D00', fontSize: 14, marginBottom: 16 }}>{error}</p>
        <button onClick={load} style={{
          padding: '10px 24px', borderRadius: 8, border: 'none',
          background: '#1A8CFF', color: '#FFF', fontWeight: 600, cursor: 'pointer',
        }}>Retry</button>
      </div>
    );
  }

  const balances = [
    { bank: 'Kasikorn (THB)', balance: (data?.kasikorn_thb ?? 0).toLocaleString(), target: '10,000,000', color: '#FFB300' },
    { bank: 'BCEL (LAK)', balance: (data?.bcel_lak ?? 0).toLocaleString(), target: '500,000,000', color: '#1A8CFF' },
  ];

  const fx = data?.fx_position;

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1A1A2E', marginBottom: 24 }}>Treasury Dashboard</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        {balances.map((b, i) => (
          <div key={i} style={{ background: '#FFF', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <p style={{ fontSize: 14, color: '#6B7280', margin: '0 0 4px' }}>{b.bank}</p>
            <p style={{ fontSize: 28, fontWeight: 800, color: '#1A1A2E', margin: '0 0 4px' }}>{b.balance}</p>
            <p style={{ fontSize: 13, color: '#9CA3AF', margin: '0 0 8px' }}>Target: {b.target}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        <div style={{ background: '#FFF', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1A1A2E', margin: '0 0 16px' }}>FX Position</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              ['Pending Sells', fx?.pending_sells?.toLocaleString() ?? '—'],
              ['Avg Rate Locked', fx?.avg_rate_locked?.toFixed(2) ?? '—'],
              ['Current Market', fx?.current_market?.toFixed(2) ?? '—'],
              ['Unrealized P&L', fx?.unrealized_pnl?.toFixed(2) ?? '—'],
            ].map(([label, val], i) => (
              <div key={i}>
                <p style={{ fontSize: 12, color: '#6B7280', margin: '0 0 4px' }}>{label}</p>
                <p style={{ fontSize: 18, fontWeight: 700, color: '#1A1A2E', margin: 0 }}>{val}</p>
              </div>
            ))}
          </div>
        </div>
        <div style={{ background: '#FFF', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1A1A2E', margin: '0 0 16px' }}>Today's Summary</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              ['Volume THB', (data?.today_volume ?? 0).toLocaleString()],
              ['Volume LAK', (data?.today_volume_lak ?? 0).toLocaleString()],
              ['Current Rate', data?.current_rate?.toFixed(2) ?? '—'],
            ].map(([label, val], i) => (
              <div key={i}>
                <p style={{ fontSize: 12, color: '#6B7280', margin: '0 0 4px' }}>{label}</p>
                <p style={{ fontSize: 18, fontWeight: 700, color: '#1A1A2E', margin: 0 }}>{val}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ background: '#FFF', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1A1A2E', margin: '0 0 16px' }}>Reconciliation</h3>
        <p style={{ fontSize: 14, color: '#6B7280', margin: 0 }}>
          {data?.today_volume
            ? `Auto-reconciled — ${(data.today_volume).toLocaleString()} THB / ${(data.today_volume_lak ?? 0).toLocaleString()} LAK`
            : 'No reconciliation data for today'}
        </p>
      </div>
    </div>
  );
}
