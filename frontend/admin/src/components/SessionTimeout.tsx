import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useAuth } from '../auth/AuthContext';

const TIMEOUT_MS = 30 * 60 * 1000;
const WARNING_MS = 60 * 1000;

export default function SessionTimeout({ children }: { children: ReactNode }) {
  const { logout } = useAuth();
  const [showWarning, setShowWarning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (warningRef.current) clearTimeout(warningRef.current);
    setShowWarning(false);

    warningRef.current = setTimeout(() => setShowWarning(true), TIMEOUT_MS - WARNING_MS);
    timerRef.current = setTimeout(() => {
      logout();
    }, TIMEOUT_MS);
  };

  useEffect(() => {
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    resetTimer();
    events.forEach((e) => window.addEventListener(e, resetTimer));
    return () => {
      events.forEach((e) => window.removeEventListener(e, resetTimer));
      if (timerRef.current) clearTimeout(timerRef.current);
      if (warningRef.current) clearTimeout(warningRef.current);
    };
  }, []);

  const extend = () => {
    setShowWarning(false);
    resetTimer();
  };

  return (
    <>
      {children}
      {showWarning && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 9998,
        }}>
          <div style={{
            background: 'var(--card-bg)', borderRadius: 16, padding: 32, width: 400, maxWidth: '90vw',
            textAlign: 'center',
          }}>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px' }}>Session Expiring</h3>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: '0 0 24px' }}>
              Your session will expire in 1 minute due to inactivity.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={logout} style={{
                padding: '10px 24px', borderRadius: 8, border: '1px solid var(--border-color)',
                background: 'transparent', color: 'var(--text-primary)', fontWeight: 600, cursor: 'pointer', fontSize: 14,
              }}>Logout</button>
              <button onClick={extend} style={{
                padding: '10px 24px', borderRadius: 8, border: 'none',
                background: '#1A8CFF', color: '#FFF', fontWeight: 600, cursor: 'pointer', fontSize: 14,
              }}>Stay Logged In</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
