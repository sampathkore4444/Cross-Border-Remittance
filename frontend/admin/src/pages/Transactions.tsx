import { useState } from 'react';

const allTxs = Array.from({ length: 20 }, (_, i) => ({
  ref: `TXN-${String(i + 1).padStart(3, '0')}`,
  sender: ['Khammany', 'Nee', 'Sompong', 'Bounmy'][i % 4],
  recipient: ['Mae', 'Mom', 'Wife', 'Friend'][i % 4],
  amount: `${(Math.floor(Math.random() * 10) + 1) * 1000} THB`,
  targetAmount: `${(Math.floor(Math.random() * 50) + 10) * 100000} LAK`,
  status: ['Completed', 'Pending', 'Failed', 'Refunded'][i % 4],
  method: ['PromptPay QR', 'Bank Transfer', 'TrueMoney', 'Agent Cash'][i % 4],
  payout: ['BCEL Cash', '7-Eleven', 'Mobile Top-Up', 'Agent Cash'][i % 4],
  time: `${Math.floor(Math.random() * 24)} hours ago`,
}));

export default function Transactions() {
  const [filter, setFilter] = useState('all');

  const filtered = filter === 'all' ? allTxs : allTxs.filter(tx => tx.status.toLowerCase() === filter);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1A1A2E', margin: 0 }}>Transactions</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          {['all', 'completed', 'pending', 'failed'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '8px 16px', borderRadius: 8, border: '1px solid #E5E7EB', cursor: 'pointer',
              background: filter === f ? '#1A8CFF' : '#FFF', color: filter === f ? '#FFF' : '#6B7280',
              fontWeight: 600, fontSize: 13, textTransform: 'capitalize',
            }}>{f}</button>
          ))}
        </div>
      </div>
      <div style={{ background: '#FFF', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', overflow: 'auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 1fr 1fr', padding: '14px 20px', borderBottom: '1px solid #E5E7EB', fontSize: 12, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase' }}>
          <span>Ref</span><span>Sender</span><span>Recipient</span><span>Amount</span><span>Payout</span><span>Status</span><span>Time</span>
        </div>
        {filtered.map((tx, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 1fr 1fr', padding: '14px 20px', borderBottom: '1px solid #F0F0F0', fontSize: 14, color: '#1A1A2E', alignItems: 'center' }}>
            <span style={{ fontWeight: 600 }}>{tx.ref}</span>
            <span>{tx.sender}</span>
            <span>{tx.recipient}</span>
            <span>
              <div>{tx.amount}</div>
              <div style={{ fontSize: 12, color: '#9CA3AF' }}>{tx.targetAmount}</div>
            </span>
            <span>{tx.payout}</span>
            <span style={{ fontWeight: 600, color: tx.status === 'Completed' ? '#00C853' : tx.status === 'Pending' ? '#FFB300' : '#FF3D00' }}>{tx.status}</span>
            <span style={{ color: '#9CA3AF' }}>{tx.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
