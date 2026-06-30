import { useEffect, useState } from 'react';
import { fetchHealth, type HealthStatus } from '../api/client';
import Loading from '../components/Loading';

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  up: { bg: '#E8F5E9', color: '#2E7D32' },
  down: { bg: '#FFEBEE', color: '#C62828' },
  connected: { bg: '#E8F5E9', color: '#2E7D32' },
};

export default function Health() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    setError('');
    fetchHealth()
      .then(setHealth)
      .catch((e) => setError(e.response?.data?.error || e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  if (loading) return <Loading text="Checking system health..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  const checks = health ? [
    { name: 'Database', key: 'database' as const },
    { name: 'Redis', key: 'redis' as const },
    { name: 'Message Queue', key: 'queue' as const },
  ] : [];

  const allUp = checks.every((c) => health?.[c.key] === 'up' || health?.[c.key] === 'connected');

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>System Health</h1>
        <span style={{
          padding: '4px 12px', borderRadius: 12, fontSize: 12, fontWeight: 700,
          background: allUp ? '#E8F5E9' : '#FFEBEE',
          color: allUp ? '#2E7D32' : '#C62828',
        }}>{allUp ? 'All Systems Operational' : 'Degraded'}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {checks.map((c) => {
          const status = health?.[c.key] || 'unknown';
          const colors = STATUS_COLORS[status] || { bg: '#F5F5F5', color: '#666' };
          return (
            <div key={c.key} style={{ background: 'var(--card-bg)', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 12px', fontWeight: 600, textTransform: 'uppercase' }}>{c.name}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: colors.color }} />
                <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{status}</span>
              </div>
            </div>
          );
        })}
      </div>
      <button onClick={load} style={{
        marginTop: 24, padding: '10px 24px', borderRadius: 8, border: '1px solid var(--border-color)',
        background: 'transparent', color: 'var(--text-primary)', fontWeight: 600, cursor: 'pointer', fontSize: 14,
      }}>Refresh</button>
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
