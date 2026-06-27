import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { day: 'Mon', volume: 4.2 },
  { day: 'Tue', volume: 3.8 },
  { day: 'Wed', volume: 5.1 },
  { day: 'Thu', volume: 4.7 },
  { day: 'Fri', volume: 6.3 },
  { day: 'Sat', volume: 7.8 },
  { day: 'Sun', volume: 5.9 },
];

export default function VolumeChart() {
  return (
    <div style={{ background: '#FFF', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
      <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1A1A2E', margin: '0 0 16px' }}>
        Weekly Transfer Volume (M THB)
      </h3>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
          <XAxis dataKey="day" fontSize={11} stroke="#9CA3AF" />
          <YAxis fontSize={11} stroke="#9CA3AF" tickFormatter={(v) => `${v}M`} />
          <Tooltip
            contentStyle={{ borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13 }}
            formatter={(value: number) => [`${value}M THB`, 'Volume']}
          />
          <Bar dataKey="volume" fill="#2563EB" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
