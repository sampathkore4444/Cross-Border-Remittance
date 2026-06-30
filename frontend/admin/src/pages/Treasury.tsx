import { useEffect, useState } from 'react';
import { fetchTreasury, fetchFXRate, setFXOverride, clearFXOverride, type BalanceSummary } from '../api/client';
import Loading from '../components/Loading';

export default function Treasury() {
  const [data, setData] = useState<BalanceSummary | null>(null);
  const [fxData, setFxData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showOverride, setShowOverride] = useState(false);
  const [overrideRate, setOverrideRate] = useState('');
  const [overrideMid, setOverrideMid] = useState('');
  const [overrideLoading, setOverrideLoading] = useState(false);

  const load = () => {
    setLoading(true);
    setError('');
    Promise.all([fetchTreasury(), fetchFXRate()])
      .then(([tData, fData]) => {
        setData(tData);
        setFxData(fData);
      })
      .catch((e) => setError(e.response?.data?.error || e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleOverride = async () => {
    const rate = parseFloat(overrideRate);
    const mid = parseFloat(overrideMid);
    if (isNaN(rate) || isNaN(mid)) return;
    setOverrideLoading(true);
    try {
      await setFXOverride(rate, mid);
      setShowOverride(false);
      setOverrideRate('');
      setOverrideMid('');
      load();
    } catch {
      setError('Failed to set FX override');
    } finally {
      setOverrideLoading(false);
    }
  };

  const handleClear = async () => {
    setOverrideLoading(true);
    try {
      await clearFXOverride();
      load();
    } catch {
      setError('Failed to clear FX override');
    } finally {
      setOverrideLoading(false);
    }
  };

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

  const card: React.CSSProperties = {
    background: 'var(--card-bg)', borderRadius: 12, padding: 20,
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Treasury Dashboard</h1>
        <button onClick={load} style={{
          padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border-color)',
          background: 'var(--card-bg)', cursor: 'pointer', fontSize: 13, fontWeight: 600,
          color: 'var(--text-secondary)',
        }}>Refresh</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        {balances.map((b, i) => (
          <div key={i} style={card}>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: '0 0 4px' }}>{b.bank}</p>
            <p style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 4px' }}>{b.balance}</p>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 8px' }}>Target: {b.target}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        <div style={card}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 16px' }}>FX Position</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              ['Pending Sells', fx?.pending_sells?.toLocaleString() ?? '—'],
              ['Avg Rate Locked', fx?.avg_rate_locked?.toFixed(2) ?? '—'],
              ['Current Market', fx?.current_market?.toFixed(2) ?? '—'],
              ['Unrealized P&L', fx?.unrealized_pnl?.toFixed(2) ?? '—'],
            ].map(([label, val], i) => (
              <div key={i}>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '0 0 4px' }}>{label}</p>
                <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{val}</p>
              </div>
            ))}
          </div>
        </div>
        <div style={card}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 16px' }}>Today's Summary</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              ['Volume THB', (data?.today_volume ?? 0).toLocaleString()],
              ['Volume LAK', (data?.today_volume_lak ?? 0).toLocaleString()],
              ['Current Rate', fxData?.rate?.toFixed(2) ?? data?.current_rate?.toFixed(2) ?? '—'],
            ].map(([label, val], i) => (
              <div key={i}>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '0 0 4px' }}>{label}</p>
                <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{val}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>FX Rate Override</h3>
            {!showOverride && (
              <button onClick={() => setShowOverride(true)} style={{
                padding: '6px 14px', borderRadius: 6, border: '1px solid var(--border-color)',
                background: 'var(--card-bg)', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                color: 'var(--text-secondary)',
              }}>Override Rate</button>
            )}
          </div>
          {fxData?.overridden && (
            <div style={{
              padding: '8px 12px', borderRadius: 8, background: '#FFF3E0', marginBottom: 12,
              fontSize: 13, color: '#E65100',
            }}>
              Rate overridden — {fxData.override_rate?.toFixed(4)} / Mid: {fxData.override_mid?.toFixed(4)}
              <button onClick={handleClear} disabled={overrideLoading} style={{
                marginLeft: 12, background: 'none', border: 'none', cursor: 'pointer',
                color: '#E65100', fontWeight: 600, fontSize: 13,
              }}>Clear</button>
            </div>
          )}
          {showOverride && (
            <div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Rate</label>
                  <input type="number" step="0.0001" value={overrideRate}
                    onChange={(e) => setOverrideRate(e.target.value)}
                    style={{
                      width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-color)',
                      fontSize: 14, background: 'var(--card-bg)', color: 'var(--text-primary)',
                    }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Mid Market</label>
                  <input type="number" step="0.0001" value={overrideMid}
                    onChange={(e) => setOverrideMid(e.target.value)}
                    style={{
                      width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-color)',
                      fontSize: 14, background: 'var(--card-bg)', color: 'var(--text-primary)',
                    }}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={handleOverride} disabled={overrideLoading} style={{
                  padding: '8px 20px', borderRadius: 8, border: 'none',
                  background: overrideLoading ? '#93C5FD' : '#1A8CFF',
                  color: '#FFF', cursor: overrideLoading ? 'not-allowed' : 'pointer',
                  fontSize: 13, fontWeight: 600,
                }}>{overrideLoading ? 'Saving...' : 'Apply Override'}</button>
                <button onClick={() => setShowOverride(false)} style={{
                  padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border-color)',
                  background: 'var(--card-bg)', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                  color: 'var(--text-secondary)',
                }}>Cancel</button>
              </div>
            </div>
          )}
        </div>
        <div style={card}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 16px' }}>Reconciliation</h3>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: 0 }}>
            {data?.today_volume
              ? `Auto-reconciled — ${(data.today_volume).toLocaleString()} THB / ${(data.today_volume_lak ?? 0).toLocaleString()} LAK`
              : 'No reconciliation data for today'}
          </p>
        </div>
      </div>
    </div>
  );
}
