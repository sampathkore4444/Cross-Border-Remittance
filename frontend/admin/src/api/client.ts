import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      sessionStorage.removeItem('admin_token');
    }
    return Promise.reject(err);
  }
);

export interface AdminStats {
  today_volume: string;
  transactions_today: string;
  active_agents: number;
  revenue_today: string;
  total_users: number;
  today_volume_thb: number;
  today_volume_lak: number;
  current_rate: number;
}

export interface BalanceSummary {
  kasikorn_thb: number;
  bcel_lak: number;
  today_volume: number;
  today_volume_lak: number;
  current_rate: number;
  fx_position: {
    pending_sells: number;
    avg_rate_locked: number;
    current_market: number;
    unrealized_pnl: number;
  };
}

export async function login(username: string, password: string): Promise<string> {
  const { data } = await api.post('/v1/admin/login', { username, password });
  sessionStorage.setItem('admin_token', data.access_token);
  return data.access_token;
}

export async function fetchStats(): Promise<AdminStats> {
  const { data } = await api.get('/v1/admin/stats');
  return data;
}

export async function fetchTreasury(): Promise<BalanceSummary> {
  const { data } = await api.get('/v1/admin/treasury');
  return data;
}

export async function checkSanctions(name: string): Promise<{ status: string; reason?: string }> {
  const { data } = await api.post('/v1/admin/sanctions/check', { name });
  return data;
}

export default api;
