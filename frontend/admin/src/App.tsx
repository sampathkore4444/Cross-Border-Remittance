import { Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import { AuthProvider, useAuth } from './auth/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Treasury from './pages/Treasury';
import Agents from './pages/Agents';
import Compliance from './pages/Compliance';
import Users from './pages/Users';
import LoginPage from './pages/LoginPage';

export type Page = 'dashboard' | 'transactions' | 'treasury' | 'agents' | 'compliance' | 'users';

function ProtectedLayout() {
  const { isAuthenticated, logout } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const pageComponents: Record<Page, JSX.Element> = {
    dashboard: <Dashboard />,
    transactions: <Transactions />,
    treasury: <Treasury />,
    agents: <Agents />,
    compliance: <Compliance />,
    users: <Users />,
  };

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#F0F2F5' }}>
      <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} onLogout={logout} />
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
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/*" element={<ProtectedLayout />} />
      </Routes>
    </AuthProvider>
  );
}
