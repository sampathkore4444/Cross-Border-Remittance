import { Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { ThemeProvider } from './auth/ThemeContext';
import ErrorBoundary from './components/ErrorBoundary';
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
import Health from './pages/Health';
import LoginPage from './pages/LoginPage';

export type Page = 'dashboard' | 'transactions' | 'treasury' | 'agents' | 'compliance' | 'users' | 'webhook_logs' | 'kyc_review' | 'admin_users' | 'notifications' | 'health';

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
    health: <Health />,
  };

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg-primary)' }}>
      <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} onLogout={logout} role={role} />
      <main style={{ flex: 1, overflow: 'auto', padding: 24 }}>
        <ErrorBoundary>
          {pageComponents[currentPage]}
        </ErrorBoundary>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/*" element={<ProtectedLayout />} />
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  );
}
