import { useEffect, useState } from 'react';
import FXChart from '../components/FXChart';
import VolumeChart from '../components/VolumeChart';
import { fetchStats, type AdminStats } from '../api/client';

export default function Dashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetchStats()
      .then((data) => { if (mounted) setStats(data); })
      .catch((e) => { if (mounted) setError(e.message); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  if (loading) {
    return <div style={{ padding: 24 }}><p>Loading dashboard...</p></div>;
  }
  if (error) {
    return <div style={{ padding: 24 }}><p style={{ color: '#FF3D00' }}>Error: {error}</p></div>;
  }

  const cards = [
    { label: 'Today Volume', value: stats?.today_volume ?? '—', change: '+12%' },
    { label: 'Transactions', value: stats?.transactions_today ?? '—', change: '+8%' },
    { label: 'Active Agents', value: String(stats?.active_agents ?? '—'), change: '+3' },
    { label: 'Revenue', value: stats?.revenue_today ?? '—', change: '+15%' },
  ];

  return (
    <div>
      <h1 style={styles.pageTitle}>Dashboard</h1>
      <div style={styles.statsGrid}>
        {cards.map((s, i) => (
          <div key={i} style={styles.statCard}>
            <p style={styles.statLabel}>{s.label}</p>
            <p style={styles.statValue}>{s.value}</p>
            <p style={{ ...styles.statChange, color: s.change.startsWith('+') ? '#00C853' : '#FF3D00' }}>{s.change}</p>
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

const styles: Record<string, React.CSSProperties> = {
  pageTitle: { fontSize: 24, fontWeight: 700, color: '#1A1A2E', marginBottom: 24 },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 },
  statCard: { background: '#FFF', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' },
  statLabel: { fontSize: 13, color: '#6B7280', margin: '0 0 8px' },
  statValue: { fontSize: 22, fontWeight: 700, color: '#1A1A2E', margin: '0 0 4px' },
  statChange: { fontSize: 12, fontWeight: 600, margin: 0 },
  chartsRow: { display: 'flex', gap: 16 },
};
