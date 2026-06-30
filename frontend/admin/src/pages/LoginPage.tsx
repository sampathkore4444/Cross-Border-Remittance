import { useState, type FormEvent } from 'react';
import { useAuth } from '../auth/AuthContext';
import { Navigate } from 'react-router-dom';

export default function LoginPage() {
  const { isAuthenticated, login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) return <Navigate to="/" replace />;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Username and password are required');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await login(username, password);
    } catch {
      setError('Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#F0F2F5',
    }}>
      <div style={{
        background: '#FFF', borderRadius: 16, padding: 40, width: 400,
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#1A1A2E', margin: '0 0 4px' }}>NgoenSai</h1>
          <p style={{ fontSize: 14, color: '#6B7280', margin: 0 }}>Admin Panel</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Username</label>
            <input
              type="text" value={username} onChange={(e) => setUsername(e.target.value)}
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #D1D5DB',
                fontSize: 14, outline: 'none', boxSizing: 'border-box',
              }}
              autoFocus
            />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Password</label>
            <input
              type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #D1D5DB',
                fontSize: 14, outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>
          {error && (
            <p style={{ color: '#FF3D00', fontSize: 13, margin: '0 0 16px' }}>{error}</p>
          )}
          <button
            type="submit" disabled={loading}
            style={{
              width: '100%', padding: '12px', borderRadius: 8, border: 'none',
              background: loading ? '#93C5FD' : '#1A8CFF', color: '#FFF',
              fontWeight: 700, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
