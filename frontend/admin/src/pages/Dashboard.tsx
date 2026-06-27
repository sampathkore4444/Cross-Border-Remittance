const stats = [
  { label: 'Today Volume', value: '8.9M THB', change: '+12%' },
  { label: 'Transactions', value: '1,245', change: '+8%' },
  { label: 'Active Agents', value: '48', change: '+3' },
  { label: 'Revenue', value: '245,670 THB', change: '+15%' },
];

const recentTx = [
  { ref: 'TXN-001', sender: 'Khammany', recipient: 'Mae', amount: '5,000 THB', status: 'Completed', time: '2 min ago' },
  { ref: 'TXN-002', sender: 'Nee', recipient: 'Mom', amount: '2,000 THB', status: 'Completed', time: '15 min ago' },
  { ref: 'TXN-003', sender: 'Sompong', recipient: 'Wife', amount: '3,000 THB', status: 'Pending', time: '1 hour ago' },
  { ref: 'TXN-004', sender: 'Khammany', recipient: 'Mae', amount: '8,000 THB', status: 'Failed', time: '2 hours ago' },
];

export default function Dashboard() {
  return (
    <div>
      <h1 style={styles.pageTitle}>Dashboard</h1>
      <div style={styles.statsGrid}>
        {stats.map((s, i) => (
          <div key={i} style={styles.statCard}>
            <p style={styles.statLabel}>{s.label}</p>
            <p style={styles.statValue}>{s.value}</p>
            <p style={{ ...styles.statChange, color: s.change.startsWith('+') ? '#00C853' : '#FF3D00' }}>{s.change}</p>
          </div>
        ))}
      </div>
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Recent Transactions</h2>
        <div style={styles.table}>
          <div style={styles.tableHeader}>
            <span style={styles.th}>Ref</span>
            <span style={styles.th}>Sender</span>
            <span style={styles.th}>Recipient</span>
            <span style={styles.th}>Amount</span>
            <span style={styles.th}>Status</span>
            <span style={styles.th}>Time</span>
          </div>
          {recentTx.map((tx, i) => (
            <div key={i} style={styles.tableRow}>
              <span style={styles.td}>{tx.ref}</span>
              <span style={styles.td}>{tx.sender}</span>
              <span style={styles.td}>{tx.recipient}</span>
              <span style={styles.td}>{tx.amount}</span>
              <span style={{ ...styles.td, ...statusStyle(tx.status) }}>{tx.status}</span>
              <span style={{ ...styles.td, color: '#9CA3AF' }}>{tx.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function statusStyle(status: string) {
  switch (status) {
    case 'Completed': return { color: '#00C853', fontWeight: 600 };
    case 'Pending': return { color: '#FFB300', fontWeight: 600 };
    case 'Failed': return { color: '#FF3D00', fontWeight: 600 };
    default: return {};
  }
}

const styles: Record<string, React.CSSProperties> = {
  pageTitle: { fontSize: 24, fontWeight: 700, color: '#1A1A2E', marginBottom: 24 },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 },
  statCard: { background: '#FFF', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' },
  statLabel: { fontSize: 13, color: '#6B7280', margin: '0 0 8px' },
  statValue: { fontSize: 22, fontWeight: 700, color: '#1A1A2E', margin: '0 0 4px' },
  statChange: { fontSize: 12, fontWeight: 600, margin: 0 },
  section: { background: '#FFF', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' },
  sectionTitle: { fontSize: 18, fontWeight: 700, color: '#1A1A2E', margin: '0 0 16px' },
  table: { display: 'flex', flexDirection: 'column' },
  tableHeader: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 1fr', padding: '12px 0', borderBottom: '1px solid #E5E7EB', fontSize: 12, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase' },
  th: { padding: '0 8px' },
  tableRow: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 1fr', padding: '14px 0', borderBottom: '1px solid #F0F0F0', fontSize: 14, color: '#1A1A2E', alignItems: 'center' },
  td: { padding: '0 8px' },
};
