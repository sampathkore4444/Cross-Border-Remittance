const flagged = [
  { ref: 'TXN-042', sender: 'Unknown', amount: '50,000 THB', reason: 'Large amount + new device', severity: 'High', time: '10 min ago' },
  { ref: 'TXN-038', sender: 'Somchai', amount: '9,999 THB', reason: 'Unusual round amount pattern', severity: 'Medium', time: '1 hour ago' },
  { ref: 'TXN-035', sender: 'Anousone', amount: '15,000 THB', reason: 'IP from Laos, should be Thailand', severity: 'Medium', time: '3 hours ago' },
  { ref: 'TXN-029', sender: 'Phone Phengsy', amount: '5,000 THB', reason: 'Name matched sanctions list (false positive)', severity: 'Low', time: '5 hours ago' },
];

const sanctions = [
  { type: 'UN Sanctions', lastRun: 'Today 10:00', hits: 0, status: 'Passed' },
  { type: 'OFAC List', lastRun: 'Today 10:00', hits: 0, status: 'Passed' },
  { type: 'Internal Watchlist', lastRun: 'Today 10:00', hits: 1, status: 'Review Required' },
];

export default function Compliance() {
  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1A1A2E', marginBottom: 24 }}>Compliance</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 24 }}>
        {sanctions.map((s, i) => (
          <div key={i} style={{ background: '#FFF', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <p style={{ fontSize: 14, color: '#6B7280', margin: '0 0 8px' }}>{s.type}</p>
            <p style={{ fontSize: 13, color: '#9CA3AF', margin: '0 0 8px' }}>Last: {s.lastRun}</p>
            <p style={{ fontSize: 13, color: '#9CA3AF', margin: '0 0 8px' }}>Hits: {s.hits}</p>
            <span style={{ padding: '4px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, background: s.status === 'Passed' ? '#E8F5E9' : '#FFF3E0', color: s.status === 'Passed' ? '#2E7D32' : '#E65100' }}>{s.status}</span>
          </div>
        ))}
      </div>

      <div style={{ background: '#FFF', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', marginBottom: 24 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #E5E7EB' }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1A1A2E', margin: 0 }}>Flagged Transactions</h3>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1.5fr 1fr 1fr', padding: '14px 20px', borderBottom: '1px solid #E5E7EB', fontSize: 12, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase' }}>
          <span>Ref</span><span>Sender</span><span>Amount</span><span>Reason</span><span>Severity</span><span>Time</span>
        </div>
        {flagged.map((f, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1.5fr 1fr 1fr', padding: '14px 20px', borderBottom: '1px solid #F0F0F0', fontSize: 14, color: '#1A1A2E', alignItems: 'center' }}>
            <span style={{ fontWeight: 600 }}>{f.ref}</span>
            <span>{f.sender}</span>
            <span>{f.amount}</span>
            <span style={{ fontSize: 13 }}>{f.reason}</span>
            <span style={{ fontWeight: 600, color: f.severity === 'High' ? '#FF3D00' : f.severity === 'Medium' ? '#FFB300' : '#9CA3AF' }}>{f.severity}</span>
            <span style={{ color: '#9CA3AF' }}>{f.time}</span>
          </div>
        ))}
      </div>

      <div style={{ background: '#FFF', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1A1A2E', margin: '0 0 12px' }}>AML Screening Rules</h3>
        <ul style={{ margin: 0, paddingLeft: 20, color: '#6B7280', fontSize: 14, lineHeight: 2 }}>
          <li>Velocity check: &gt;5 tx/hour from same sender → Flag</li>
          <li>New device + large tx: &gt;10,000 THB → Require KYC Level 2</li>
          <li>Unusual location: Sender IP from Laos → Additional verification</li>
          <li>Amount roundness: Round numbers in suspicious patterns → Flag</li>
          <li>Recipient pattern: Same recipient from many senders → Possible mule → SAR</li>
        </ul>
      </div>
    </div>
  );
}
