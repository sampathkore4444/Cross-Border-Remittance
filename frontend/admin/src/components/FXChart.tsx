import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

const data = [
  { time: '00:00', rate: 575.2, midMarket: 577.0 },
  { time: '02:00', rate: 575.8, midMarket: 577.4 },
  { time: '04:00', rate: 574.5, midMarket: 576.2 },
  { time: '06:00', rate: 574.0, midMarket: 575.8 },
  { time: '08:00', rate: 573.5, midMarket: 575.1 },
  { time: '10:00', rate: 574.2, midMarket: 575.9 },
  { time: '12:00', rate: 575.0, midMarket: 576.5 },
  { time: '14:00', rate: 575.8, midMarket: 577.3 },
  { time: '16:00', rate: 576.5, midMarket: 578.0 },
  { time: '18:00', rate: 576.0, midMarket: 577.6 },
  { time: '20:00', rate: 575.5, midMarket: 577.1 },
  { time: '22:00', rate: 575.0, midMarket: 576.8 },
];

export default function FXChart() {
  return (
    <div style={{ background: '#FFF', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
      <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1A1A2E', margin: '0 0 16px' }}>
        THB → LAK Exchange Rate (24h)
      </h3>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="rateGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#2563EB" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="midGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#9CA3AF" stopOpacity={0.1} />
              <stop offset="95%" stopColor="#9CA3AF" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
          <XAxis dataKey="time" fontSize={11} stroke="#9CA3AF" />
          <YAxis domain={['dataMin - 1', 'dataMax + 1']} fontSize={11} stroke="#9CA3AF" tickFormatter={(v) => v.toFixed(1)} />
          <Tooltip
            contentStyle={{ borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13 }}
            formatter={(value: number, name: string) => [value.toFixed(2), name === 'rate' ? 'NgoenSai Rate' : 'Mid Market']}
          />
          <Area type="monotone" dataKey="midMarket" stroke="#9CA3AF" strokeWidth={1.5} fill="url(#midGrad)" dot={false} />
          <Area type="monotone" dataKey="rate" stroke="#2563EB" strokeWidth={2.5} fill="url(#rateGrad)" dot={false} />
        </AreaChart>
      </ResponsiveContainer>
      <div style={{ display: 'flex', gap: 24, marginTop: 12, fontSize: 12, color: '#6B7280' }}>
        <span><span style={{ color: '#2563EB', fontWeight: 700 }}>●</span> NgoenSai Rate</span>
        <span><span style={{ color: '#9CA3AF', fontWeight: 700 }}>●</span> Mid Market</span>
        <span style={{ marginLeft: 'auto', fontWeight: 600, color: '#1A1A2E' }}>Spread: 1.5 LAK</span>
      </div>
    </div>
  );
}
