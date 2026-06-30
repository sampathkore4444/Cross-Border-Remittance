import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface FXChartProps {
  currentRate?: number;
  midMarket?: number;
  spread?: number;
}

function generateRateData(rate: number, midMarket: number) {
  const now = new Date();
  return Array.from({ length: 12 }, (_, i) => {
    const t = new Date(now);
    t.setHours(t.getHours() - (11 - i) * 2);
    const hour = t.getHours().toString().padStart(2, '0') + ':00';
    const drift = (Math.random() - 0.5) * 2;
    return { time: hour, rate: rate + drift, midMarket: midMarket + drift * 0.3 };
  });
}

export default function FXChart({ currentRate, midMarket, spread }: FXChartProps) {
  const data = currentRate ? generateRateData(currentRate, midMarket ?? currentRate + 1.5) : [];

  if (!currentRate) {
    return (
      <div style={{ background: 'var(--card-bg)', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', height: 320 }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>No rate data available</p>
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--card-bg)', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
      <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 16px' }}>
        THB &rarr; LAK Exchange Rate (24h)
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
      <div style={{ display: 'flex', gap: 24, marginTop: 12, fontSize: 12, color: 'var(--text-secondary)' }}>
        <span><span style={{ color: '#2563EB', fontWeight: 700 }}>&bull;</span> NgoenSai Rate: {currentRate.toFixed(2)}</span>
        <span><span style={{ color: '#9CA3AF', fontWeight: 700 }}>&bull;</span> Mid Market: {(midMarket ?? currentRate + 1.5).toFixed(2)}</span>
        {spread !== undefined && (
          <span style={{ marginLeft: 'auto', fontWeight: 600, color: 'var(--text-primary)' }}>Spread: {spread.toFixed(2)} LAK</span>
        )}
      </div>
    </div>
  );
}
