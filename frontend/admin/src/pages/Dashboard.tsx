import { useEffect, useState, useRef } from 'react';
import FXChart from '../components/FXChart';
import VolumeChart from '../components/VolumeChart';
import { fetchStats, type AdminStats } from '../api/client';
import Loading from '../components/Loading';

export default function Dashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = () => {
    setError('');
    fetchStats()
      .then(setStats)
      .catch((e) => setError(e.response?.data?.error || e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(load, 30000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [autoRefresh]);

  if (loading) return <Loading text="Loading dashboard..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  const cards = [
    { label: 'Today Volume', value: stats?.today_volume ?? '—' },
    { label: 'Transactions', value: stats?.transactions_today ?? '—' },
    { label: 'Active Agents', value: String(stats?.active_agents ?? '—') },
    { label: 'Total Users', value: String(stats?.total_users ?? '—') },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Dashboard</h1>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button onClick={load} style={{
            padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border-color)',
            background: 'transparent', color: 'var(--text-primary)', fontWeight: 600, cursor: 'pointer', fontSize: 13,
          }}>Refresh</button>
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            style={{
              padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border-color)',
              background: autoRefresh ? '#E8F5E9' : 'transparent',
              color: autoRefresh ? '#2E7D32' : 'var(--text-primary)',
              fontWeight: 600, cursor: 'pointer', fontSize: 13,
            }}
          >
            {autoRefresh ? 'Auto-Refresh On' : 'Auto-Refresh Off'}
          </button>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {cards.map((s, i) => (
          <div key={i} style={{ background: 'var(--card-bg)', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 8px' }}>{s.label}</p>
            <p style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{s.value}</p>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 16 }}>
        <div style={{ flex: 1 }}><FXChart currentRate={stats?.current_rate} /></div>
        <div style={{ flex: 1 }}><VolumeChart todayVolumeTHB={stats?.today_volume_thb} todayVolumeLAK={stats?.today_volume_lak} /></div>
      </div>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div style={{ padding: 40, textAlign: 'center' }}>
      <p style={{ color: '#FF3D00', fontSize: 14, marginBottom: 16 }}>{message}</p>
      <button onClick={onRetry} style={{
        padding: '10px 24px', borderRadius: 8, border: 'none',
        background: '#1A8CFF', color: '#FFF', fontWeight: 600, cursor: 'pointer',
      }}>Retry</button>
    </div>
  );
}
