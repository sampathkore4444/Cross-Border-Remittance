import { useEffect, useState } from 'react';
import FXChart from '../components/FXChart';
import VolumeChart from '../components/VolumeChart';
import { fetchStats, type AdminStats } from '../api/client';
import Loading from '../components/Loading';

export default function Dashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    setError('');
    fetchStats()
      .then(setStats)
      .catch((e) => setError(e.response?.data?.error || e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  if (loading) return <Loading text="Loading dashboard..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  const cards = [
    { label: 'Today Volume', value: stats?.today_volume ?? '—', change: '+12%' },
    { label: 'Transactions', value: stats?.transactions_today ?? '—', change: '+8%' },
    { label: 'Active Agents', value: String(stats?.active_agents ?? '—'), change: '+3' },
    { label: 'Total Users', value: String(stats?.total_users ?? '—'), change: '+5%' },
  ];

  return (
    <div>
      <h1 style={styles.pageTitle}>Dashboard</h1>
      <div style={styles.statsGrid}>
        {cards.map((s, i) => (
          <div key={i} style={styles.statCard}>
            <p style={styles.statLabel}>{s.label}</p>
            <p style={styles.statValue}>{s.value}</p>
          </div>
        ))}
      </div>
      <div style={styles.chartsRow}>
        <div style={{ flex: 1 }}><FXChart /></div>
        <div style={{ flex: 1 }}><VolumeChart /></div>
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

const styles: Record<string, React.CSSProperties> = {
  pageTitle: { fontSize: 24, fontWeight: 700, color: '#1A1A2E', marginBottom: 24 },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 },
  statCard: { background: '#FFF', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' },
  statLabel: { fontSize: 13, color: '#6B7280', margin: '0 0 8px' },
  statValue: { fontSize: 22, fontWeight: 700, color: '#1A1A2E', margin: '0 0 4px' },
  chartsRow: { display: 'flex', gap: 16 },
};
