import { Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Treasury from './pages/Treasury';
import Agents from './pages/Agents';
import Compliance from './pages/Compliance';

export type Page = 'dashboard' | 'transactions' | 'treasury' | 'agents' | 'compliance';

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');

  const pageComponents: Record<Page, JSX.Element> = {
    dashboard: <Dashboard />,
    transactions: <Transactions />,
    treasury: <Treasury />,
    agents: <Agents />,
    compliance: <Compliance />,
  };

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#F0F2F5' }}>
      <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />
      <main style={{ flex: 1, overflow: 'auto', padding: 24 }}>
        {pageComponents[currentPage]}
      </main>
    </div>
  );
}
