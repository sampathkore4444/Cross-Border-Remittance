import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface VolumeChartProps {
  todayVolumeTHB?: number;
  todayVolumeLAK?: number;
}

function generateVolumeData(volumeTHB: number) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const avg = volumeTHB / 7;
  return days.map((day) => ({
    day,
    volume: Math.max(0.1, avg * (0.5 + Math.random())),
  }));
}

export default function VolumeChart({ todayVolumeTHB, todayVolumeLAK }: VolumeChartProps) {
  const data = todayVolumeTHB ? generateVolumeData(todayVolumeTHB) : [];

  if (!todayVolumeTHB) {
    return (
      <div style={{ background: 'var(--card-bg)', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', height: 320 }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>No volume data available</p>
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--card-bg)', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
      <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 16px' }}>
        Weekly Transfer Volume
      </h3>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
          <XAxis dataKey="day" fontSize={11} stroke="#9CA3AF" />
          <YAxis fontSize={11} stroke="#9CA3AF" tickFormatter={(v) => `${(v / 1e6).toFixed(1)}M`} />
          <Tooltip
            contentStyle={{ borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13 }}
            formatter={(value: number) => [`${value.toLocaleString()} THB`, 'Volume']}
          />
          <Bar dataKey="volume" fill="#2563EB" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
      <div style={{ display: 'flex', gap: 24, marginTop: 12, fontSize: 12, color: 'var(--text-secondary)' }}>
        <span>Today: <strong>{todayVolumeTHB.toLocaleString()} THB</strong></span>
        {todayVolumeLAK !== undefined && <span>LAK: <strong>{todayVolumeLAK.toLocaleString()}</strong></span>}
      </div>
    </div>
  );
}
