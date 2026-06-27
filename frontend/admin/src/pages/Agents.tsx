const agents = [
  { shop: 'Lao Grocery Store', name: 'Bounma', type: 'Cash-In', province: 'Bangkok', float: '45,000 THB', status: 'Active', kyc: 'Verified' },
  { shop: 'Phone Shop', name: 'Somsak', type: 'Cash-In', province: 'Samut Prakan', float: '20,000 THB', status: 'Active', kyc: 'Verified' },
  { shop: 'Village Shop Touy', name: 'Touy', type: 'Cash-Out', province: 'Savannakhet', float: '3,200,000 LAK', status: 'Active', kyc: 'Verified' },
  { shop: 'BCEL Branch Savan', name: 'BCEL', type: 'Cash-Out', province: 'Savannakhet', float: '50,000,000 LAK', status: 'Active', kyc: 'Verified' },
  { shop: '7-Eleven Vientiane', name: '7-Eleven', type: 'Cash-Out', province: 'Vientiane', float: '20,000,000 LAK', status: 'Active', kyc: 'Verified' },
  { shop: 'Nong Khai Market', name: 'Seng', type: 'Cash-In', province: 'Nong Khai', float: '10,000 THB', status: 'Pending', kyc: 'Pending' },
];

export default function Agents() {
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
