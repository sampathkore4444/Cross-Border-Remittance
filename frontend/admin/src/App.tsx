import { Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { ThemeProvider } from './auth/ThemeContext';
import ErrorBoundary from './components/ErrorBoundary';
import { ToastProvider } from './components/Toast';
import SessionTimeout from './components/SessionTimeout';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Treasury from './pages/Treasury';
import Agents from './pages/Agents';
import Compliance from './pages/Compliance';
import Users from './pages/Users';
import WebhookLogs from './pages/WebhookLogs';
import KycReview from './pages/KycReview';
import AdminUsers from './pages/AdminUsers';
import Notifications from './pages/Notifications';
import NotificationHistory from './pages/NotificationHistory';
import AdminLogs from './pages/AdminLogs';
import Health from './pages/Health';
import LoginPage from './pages/LoginPage';

export type Page = 'dashboard' | 'transactions' | 'treasury' | 'agents' | 'compliance' | 'users' | 'webhook_logs' | 'kyc_review' | 'admin_users' | 'notifications' | 'notification_history' | 'admin_logs' | 'health';

function ProtectedLayout() {
  const { isAuthenticated, logout, role } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const pageComponents: Record<Page, JSX.Element> = {
    dashboard: <Dashboard />,
    transactions: <Transactions />,
    treasury: <Treasury />,
    agents: <Agents />,
    compliance: <Compliance />,
    users: <Users />,
    webhook_logs: <WebhookLogs />,
    kyc_review: <KycReview />,
    admin_users: <AdminUsers />,
    notifications: <Notifications />,
    notification_history: <NotificationHistory />,
    admin_logs: <AdminLogs />,
    health: <Health />,
  };

  return (
    <SessionTimeout>
      <div style={{ display: 'flex', height: '100vh', background: 'var(--bg-primary)' }}>
        <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} onLogout={logout} role={role} />
        <main style={{ flex: 1, overflow: 'auto', padding: 24 }}>
          <ErrorBoundary>
            {pageComponents[currentPage]}
          </ErrorBoundary>
        </main>
      </div>
    </SessionTimeout>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/*" element={<ProtectedLayout />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
