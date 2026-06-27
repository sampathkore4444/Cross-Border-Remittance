export default function Treasury() {
  const balances = [
    { bank: 'Kasikorn (THB)', balance: '8,450,000', target: '10,000,000', status: 'UNDER', color: '#FFB300' },
    { bank: 'BCEL (LAK)', balance: '452,000,000', target: '500,000,000', status: 'NEAR TARGET', color: '#1A8CFF' },
  ];

  const fx = {
    pendingSells: '2,150,000 THB',
    avgRate: '574.5',
    currentMarket: '577.0',
    pnl: '+5,375 LAK',
  };

  const today = {
    transactions: '1,245',
    volume: '8.9M THB',
    revenue: '245,670 THB',
    cost: '42,100 THB',
    margin: '2.3%',
  };

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1A1A2E', marginBottom: 24 }}>Treasury Dashboard</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        {balances.map((b, i) => (
          <div key={i} style={{ background: '#FFF', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <p style={{ fontSize: 14, color: '#6B7280', margin: '0 0 4px' }}>{b.bank}</p>
            <p style={{ fontSize: 28, fontWeight: 800, color: '#1A1A2E', margin: '0 0 4px' }}>{b.balance}</p>
            <p style={{ fontSize: 13, color: '#9CA3AF', margin: '0 0 8px' }}>Target: {b.target}</p>
            <span style={{ background: `${b.color}20`, color: b.color, padding: '4px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600 }}>{b.status}</span>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        <div style={{ background: '#FFF', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1A1A2E', margin: '0 0 16px' }}>FX Position</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              ['Pending Sells', fx.pendingSells],
              ['Avg Rate Locked', fx.avgRate],
              ['Current Market', fx.currentMarket],
              ['P&L', fx.pnl],
            ].map(([label, val], i) => (
              <div key={i}>
                <p style={{ fontSize: 12, color: '#6B7280', margin: '0 0 4px' }}>{label}</p>
                <p style={{ fontSize: 18, fontWeight: 700, color: '#1A1A2E', margin: 0 }}>{val}</p>
              </div>
            ))}
          </div>
        </div>
        <div style={{ background: '#FFF', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1A1A2E', margin: '0 0 16px' }}>Today's Performance</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              ['Transactions', today.transactions],
              ['Volume', today.volume],
              ['Revenue', today.revenue],
              ['Cost', today.cost],
              ['Margin', today.margin],
            ].map(([label, val], i) => (
              <div key={i}>
                <p style={{ fontSize: 12, color: '#6B7280', margin: '0 0 4px' }}>{label}</p>
                <p style={{ fontSize: 18, fontWeight: 700, color: '#1A1A2E', margin: 0 }}>{val}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ background: '#FFF', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1A1A2E', margin: '0 0 16px' }}>Reconciliation</h3>
        <p style={{ fontSize: 14, color: '#6B7280', margin: 0 }}>Last reconciliation: Today 18:00 — All matched ✓</p>
      </div>
    </div>
  );
}
