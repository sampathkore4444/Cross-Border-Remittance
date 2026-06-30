import type { Page } from '../App';

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  onLogout: () => void;
}

const NAV: { key: Page; label: string; icon: string }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: '📊' },
  { key: 'transactions', label: 'Transactions', icon: '💳' },
  { key: 'treasury', label: 'Treasury', icon: '💰' },
  { key: 'agents', label: 'Agents', icon: '🏪' },
  { key: 'users', label: 'Users', icon: '👥' },
  { key: 'compliance', label: 'Compliance', icon: '🛡️' },
];

export default function Sidebar({ currentPage, onNavigate, onLogout }: SidebarProps) {
  return (
    <aside style={{ width: 240, background: '#1A1A2E', color: '#FFF', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: 24, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>NgoenSai</h1>
        <p style={{ fontSize: 12, opacity: 0.6, margin: '4px 0 0' }}>Admin Panel</p>
      </div>
      <nav style={{ flex: 1, padding: 12 }}>
        {NAV.map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => onNavigate(key)}
            style={{
              display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '12px 16px',
              border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 14, fontWeight: 600,
              background: currentPage === key ? 'rgba(26,140,255,0.2)' : 'transparent',
              color: currentPage === key ? '#1A8CFF' : 'rgba(255,255,255,0.7)',
              marginBottom: 4, transition: 'all 0.2s',
            }}
          >
            <span>{icon}</span>
            <span>{label}</span>
          </button>
        ))}
      </nav>
      <div style={{ padding: 16, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <button
          onClick={onLogout}
          style={{
            display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 16px',
            border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, cursor: 'pointer',
            fontSize: 13, fontWeight: 600, background: 'transparent', color: 'rgba(255,255,255,0.6)',
            transition: 'all 0.2s',
          }}
        >
          Sign Out
        </button>
      </div>
    </aside>
  );
}
