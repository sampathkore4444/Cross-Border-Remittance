import { useState } from 'react';
import { broadcastNotification } from '../api/client';

export default function Notifications() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ sent: number; total: number } | null>(null);
  const [error, setError] = useState('');

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) return;
    setSending(true);
    setError('');
    setResult(null);
    try {
      const res = await broadcastNotification(title, body);
      setResult(res);
      setTitle('');
      setBody('');
    } catch (e: any) {
      setError(e.response?.data?.error || e.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ maxWidth: 600 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 24 }}>Broadcast Notification</h1>
      <div style={{ background: 'var(--card-bg)', borderRadius: 12, padding: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            placeholder="Notification title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{
              padding: '12px 16px', borderRadius: 8, border: '1px solid var(--border-color)',
              background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: 14, fontWeight: 600,
            }}
          />
          <textarea
            placeholder="Notification body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={5}
            style={{
              padding: '12px 16px', borderRadius: 8, border: '1px solid var(--border-color)',
              background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: 14, resize: 'vertical',
              fontFamily: 'inherit',
            }}
          />
          <button
            onClick={handleSend}
            disabled={sending || !title.trim() || !body.trim()}
            style={{
              padding: '12px 24px', borderRadius: 8, border: 'none',
              background: sending ? '#90CAF9' : '#1A8CFF', color: '#FFF',
              fontWeight: 700, cursor: sending ? 'not-allowed' : 'pointer', fontSize: 14,
            }}
          >
            {sending ? 'Sending...' : 'Send to All Users'}
          </button>
        </div>

        {error && (
          <div style={{ marginTop: 16, padding: 12, borderRadius: 8, background: '#FFEBEE', color: '#C62828', fontSize: 13 }}>
            {error}
          </div>
        )}

        {result && (
          <div style={{ marginTop: 16, padding: 16, borderRadius: 8, background: '#E8F5E9', color: '#2E7D32' }}>
            <p style={{ fontWeight: 700, margin: '0 0 4px', fontSize: 14 }}>Notification sent!</p>
            <p style={{ margin: 0, fontSize: 13 }}>Delivered to {result.sent} of {result.total} users</p>
          </div>
        )}
      </div>
    </div>
  );
}
