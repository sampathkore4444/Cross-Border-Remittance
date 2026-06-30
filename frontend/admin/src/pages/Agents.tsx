import { useState, useEffect } from 'react';
import api from '../api/client';

interface AgentRow {
  shop: string;
  name: string;
  type: string;
  province: string;
  float: string;
  status: string;
  kyc: string;
}

export default function Agents() {
  const [agents, setAgents] = useState<AgentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    api.get('/v1/admin/agents')
      .then((res) => {
        if (!mounted) return;
        const data = Array.isArray(res.data) ? res.data : (res.data?.agents ?? []);
        setAgents(data.map((a: any) => ({
          shop: a.shop_name || a.name || '—',
          name: a.owner_name || a.user_id?.slice(0, 8) || '—',
          type: a.agent_type === 'cash_out_agent' ? 'Cash-Out' : 'Cash-In',
          province: a.province || a.shop_province || '—',
          float: a.agent_type?.includes('cash_out') ? `${(a.float_balance_lak ?? 0).toLocaleString()} LAK` : `${(a.float_balance_thb ?? 0).toLocaleString()} THB`,
          status: a.is_active ? 'Active' : 'Inactive',
          kyc: a.kyc_status === 'verified' ? 'Verified' : 'Pending',
        })));
      })
      .catch(() => {
        if (!mounted) return;
        const mock = [
          { shop: 'Lao Grocery Store', name: 'Bounma', type: 'Cash-In', province: 'Bangkok', float: '45,000 THB', status: 'Active', kyc: 'Verified' },
          { shop: 'Phone Shop', name: 'Somsak', type: 'Cash-In', province: 'Samut Prakan', float: '20,000 THB', status: 'Active', kyc: 'Verified' },
          { shop: 'Village Shop Touy', name: 'Touy', type: 'Cash-Out', province: 'Savannakhet', float: '3,200,000 LAK', status: 'Active', kyc: 'Verified' },
          { shop: 'BCEL Branch Savan', name: 'BCEL', type: 'Cash-Out', province: 'Savannakhet', float: '50,000,000 LAK', status: 'Active', kyc: 'Verified' },
          { shop: '7-Eleven Vientiane', name: '7-Eleven', type: 'Cash-Out', province: 'Vientiane', float: '20,000,000 LAK', status: 'Active', kyc: 'Verified' },
          { shop: 'Nong Khai Market', name: 'Seng', type: 'Cash-In', province: 'Nong Khai', float: '10,000 THB', status: 'Pending', kyc: 'Pending' },
        ];
        setAgents(mock);
      })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  if (loading) return <div style={{ padding: 24 }}><p>Loading agents...</p></div>;
  if (error) return <div style={{ padding: 24 }}><p style={{ color: '#FF3D00' }}>Error: {error}</p></div>;

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1A1A2E', marginBottom: 24 }}>Agent Management</h1>
      <div style={{ background: '#FFF', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', overflow: 'auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1fr 1fr 1fr', padding: '14px 20px', borderBottom: '1px solid #E5E7EB', fontSize: 12, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase' }}>
          <span>Shop Name</span><span>Owner</span><span>Type</span><span>Location</span><span>Float</span><span>Status</span><span>KYC</span>
        </div>
        {agents.map((a, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1fr 1fr 1fr', padding: '14px 20px', borderBottom: '1px solid #F0F0F0', fontSize: 14, color: '#1A1A2E', alignItems: 'center' }}>
            <span style={{ fontWeight: 600 }}>{a.shop}</span>
            <span>{a.name}</span>
            <span>{a.type}</span>
            <span>{a.province}</span>
            <span>{a.float}</span>
            <span style={{ fontWeight: 600, color: a.status === 'Active' ? '#00C853' : '#FFB300' }}>{a.status}</span>
            <span style={{ fontWeight: 600, color: a.kyc === 'Verified' ? '#00C853' : '#FFB300' }}>{a.kyc}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
