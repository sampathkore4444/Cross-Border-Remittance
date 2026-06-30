import { useTheme } from '../auth/ThemeContext';
import type { Page } from '../App';

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  onLogout: () => void;
  role: string | null;
}

const ALL_NAV: { key: Page; label: string; icon: string; roles: string[] }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: '📊', roles: [] },
  { key: 'transactions', label: 'Transactions', icon: '💳', roles: [] },
  { key: 'treasury', label: 'Treasury', icon: '💰', roles: ['super_admin', 'admin', 'treasury_manager'] },
  { key: 'agents', label: 'Agents', icon: '🏪', roles: [] },
  { key: 'users', label: 'Users', icon: '👥', roles: ['super_admin', 'admin', 'support'] },
  { key: 'compliance', label: 'Compliance', icon: '🛡️', roles: ['super_admin', 'admin', 'compliance_officer'] },
  { key: 'kyc_review', label: 'KYC Review', icon: '📋', roles: ['super_admin', 'admin', 'compliance_officer'] },
  { key: 'admin_users', label: 'Admin Users', icon: '🔐', roles: ['super_admin'] },
  { key: 'notifications', label: 'Notifications', icon: '🔔', roles: ['super_admin', 'admin'] },
  { key: 'health', label: 'System Health', icon: '❤️', roles: [] },
  { key: 'webhook_logs', label: 'Webhook Logs', icon: '🔗', roles: ['super_admin', 'admin', 'support'] },
];

export default function Sidebar({ currentPage, onNavigate, onLogout, role }: SidebarProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  const NAV = ALL_NAV.filter((item) => item.roles.length === 0 || (role && item.roles.includes(role)));

  return (
    <aside style={{
      width: 240, background: 'var(--sidebar-bg)', color: 'var(--sidebar-text)',
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ padding: 24, borderBottom: '1px solid var(--border-color)' }}>
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
              background: currentPage === key ? 'var(--nav-active-bg)' : 'transparent',
              color: currentPage === key ? 'var(--nav-active-text)' : 'var(--nav-text)',
              marginBottom: 4, transition: 'all 0.2s',
            }}
          >
            <span>{icon}</span>
            <span>{label}</span>
          </button>
        ))}
      </nav>
      <div style={{ padding: 16, borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button
          onClick={toggleTheme}
          style={{
            display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 16px',
            border: '1px solid var(--border-color)', borderRadius: 8, cursor: 'pointer',
            fontSize: 13, fontWeight: 600, background: 'transparent', color: 'var(--sidebar-text)',
          }}
        >
          {isDark ? '☀️ Light Mode' : '🌙 Dark Mode'}
        </button>
        <button
          onClick={onLogout}
          style={{
            display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 16px',
            border: '1px solid var(--border-color)', borderRadius: 8, cursor: 'pointer',
            fontSize: 13, fontWeight: 600, background: 'transparent', color: 'var(--sidebar-text)',
          }}
        >
          Sign Out
        </button>
      </div>
    </aside>
  );
}
