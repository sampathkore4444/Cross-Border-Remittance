import axios from 'axios';
import type { AxiosError, InternalAxiosRequestConfig } from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = sessionStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRedirecting = false;

api.interceptors.response.use(
  (res) => res,
  async (err: AxiosError) => {
    if (err.response?.status === 401 && !isRedirecting) {
      isRedirecting = true;
      sessionStorage.removeItem('admin_token');
      window.location.href = '/login';
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

export interface PaginatedResponse<T> {
  total: number;
  page: number;
  limit: number;
}

export interface TransactionResponse extends PaginatedResponse<never> {
  transactions: any[];
}

export interface AgentResponse extends PaginatedResponse<never> {
  agents: any[];
}

export interface FlaggedResponse {
  transactions: any[];
  total: number;
}

export interface UserResponse extends PaginatedResponse<never> {
  users: any[];
}

export interface LogResponse extends PaginatedResponse<never> {
  logs: any[];
}

export interface TransactionDetailResponse {
  transaction: any;
  logs: any[];
}

export async function login(username: string, password: string): Promise<{ access_token: string; refresh_token: string; expires_in: number }> {
  const { data } = await api.post('/v1/admin/login', { username, password });
  sessionStorage.setItem('admin_token', data.access_token);
  return data;
}

export async function fetchStats(): Promise<AdminStats> {
  const { data } = await api.get('/v1/admin/stats');
  return data;
}

export async function fetchTreasury(): Promise<BalanceSummary> {
  const { data } = await api.get('/v1/admin/treasury');
  return data;
}

export async function fetchTransactions(page = 1, limit = 20): Promise<TransactionResponse> {
  const { data } = await api.get(`/v1/admin/transactions?page=${page}&limit=${limit}`);
  return data;
}

export async function fetchAgents(page = 1, limit = 20, country = ''): Promise<AgentResponse> {
  const query = country ? `?page=${page}&limit=${limit}&country=${country}` : `?page=${page}&limit=${limit}`;
  const { data } = await api.get(`/v1/admin/agents${query}`);
  return data;
}

export async function fetchFlagged(status = 'flagged'): Promise<FlaggedResponse> {
  const { data } = await api.get(`/v1/admin/flagged?status=${status}`);
  return data;
}

export async function checkSanctions(name: string): Promise<{ status: string; reason?: string }> {
  const { data } = await api.post('/v1/admin/sanctions/check', { name });
  return data;
}

export async function updateAgentStatus(id: string, isActive: boolean): Promise<{ status: string }> {
  const { data } = await api.put(`/v1/admin/agents/${id}/status`, { is_active: isActive });
  return data;
}

export async function depositAgentFloat(id: string, amount: number): Promise<{ status: string; amount: number }> {
  const { data } = await api.post(`/v1/admin/agents/${id}/float`, { amount });
  return data;
}

export async function reviewFlagged(id: string, action: 'dismiss' | 'escalate'): Promise<{ status: string }> {
  const { data } = await api.put(`/v1/admin/flagged/${id}/review`, { action });
  return data;
}

export async function fetchTransactionDetail(ref: string): Promise<TransactionDetailResponse> {
  const { data } = await api.get(`/v1/admin/transactions/${ref}`);
  return data;
}

export async function searchTransactions(
  page = 1, limit = 20,
  q = '', sender = '', from = '', to = ''
): Promise<TransactionResponse> {
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('limit', String(limit));
  if (q) params.set('q', q);
  if (sender) params.set('sender', sender);
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  const { data } = await api.get(`/v1/admin/transactions?${params.toString()}`);
  return data;
}

export async function fetchUsers(page = 1, limit = 20): Promise<UserResponse> {
  const { data } = await api.get(`/v1/admin/users?page=${page}&limit=${limit}`);
  return data;
}

export async function updateUserStatus(id: string, isActive: boolean): Promise<{ status: string }> {
  const { data } = await api.put(`/v1/admin/users/${id}/status`, { is_active: isActive });
  return data;
}

export async function fetchAdminLogs(page = 1, limit = 50): Promise<LogResponse> {
  const { data } = await api.get(`/v1/admin/logs?page=${page}&limit=${limit}`);
  return data;
}

export async function fetchWebhookLogs(page = 1, limit = 50): Promise<LogResponse> {
  const { data } = await api.get(`/v1/admin/webhook-logs?page=${page}&limit=${limit}`);
  return data;
}

export async function fetchFXRate(): Promise<any> {
  const { data } = await api.get('/v1/admin/fx/rate');
  return data;
}

export async function setFXOverride(rate: number, midMarket: number): Promise<{ status: string }> {
  const { data } = await api.post('/v1/admin/fx/rate', { rate, mid_market: midMarket });
  return data;
}

export async function clearFXOverride(): Promise<{ status: string }> {
  const { data } = await api.delete('/v1/admin/fx/rate');
  return data;
}

export default api;
