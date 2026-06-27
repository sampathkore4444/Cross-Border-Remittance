import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Config } from '../constants/config';
import type {
  RegisterRequest,
  VerifyRequest,
  AuthResponse,
  QuoteRequest,
  QuoteResponse,
  SendRequest,
  SendResponse,
  Transaction,
} from '../types/api';

class ApiService {
  client: AxiosInstance;
  private _demoMode = false;

  constructor() {
    this.client = axios.create({
      baseURL: Config.API_BASE_URL,
      timeout: 15000,
      headers: { 'Content-Type': 'application/json' },
    });

    this.client.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
      if (this._demoMode) return config;
      const token = await SecureStore.getItemAsync('access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    this.client.interceptors.response.use(
      (res) => res,
      async (error) => {
        if (this._demoMode) return Promise.reject(error);
        if (error.response?.status === 401) {
          const refreshed = await this.tryRefreshToken();
          if (refreshed) {
            return this.client.request(error.config);
          }
          SecureStore.deleteItemAsync('access_token');
          SecureStore.deleteItemAsync('refresh_token');
        }
        return Promise.reject(error);
      }
    );
  }

  enableDemoMode() {
    this._demoMode = true;
  }

  // Auth
  async register(data: RegisterRequest) {
    if (this._demoMode) return { data: { message: 'OTP sent (demo)' } };
    return this.client.post('/auth/register', data);
  }

  async verify(data: VerifyRequest): Promise<AuthResponse> {
    if (this._demoMode) {
      return {
        access_token: 'demo_access_token',
        refresh_token: 'demo_refresh_token',
        expires_in: 99999,
        user: { id: 'demo-001', phone: data.phone, name: 'Demo User', kyc_level: 'level_2', is_new: false },
      };
    }
    const res = await this.client.post('/auth/verify', data);
    const auth: AuthResponse = res.data;
    await SecureStore.setItemAsync('access_token', auth.access_token);
    await SecureStore.setItemAsync('refresh_token', auth.refresh_token);
    return auth;
  }

  async tryRefreshToken(): Promise<boolean> {
    if (this._demoMode) return true;
    try {
      const refresh = await SecureStore.getItemAsync('refresh_token');
      if (!refresh) return false;
      const res = await this.client.post('/auth/refresh', { refresh_token: refresh });
      await SecureStore.setItemAsync('access_token', res.data.access_token);
      return true;
    } catch {
      return false;
    }
  }

  async logout() {
    if (this._demoMode) return;
    await SecureStore.deleteItemAsync('access_token');
    await SecureStore.deleteItemAsync('refresh_token');
  }

  // Quotes
  async getQuote(data: QuoteRequest): Promise<QuoteResponse> {
    if (this._demoMode) {
      const expiresAt = new Date(Date.now() + Config.RATE_EXPIRY_SECONDS * 1000).toISOString();
      return {
        quote_id: 'demo-quote-001',
        source_amount: data.source_amount,
        exchange_rate: 1.25,
        target_amount: Math.round(data.source_amount * 1.25),
        fee_breakdown: { fx_margin: 50, payout_fee: 30, total_fee_percent: 1.6 },
        payout_options: [
          { method: 'bcel_cash', target_amount: Math.round(data.source_amount * 1.25), pickup_time: '1-2 hours' },
          { method: 'seven_eleven_cash', target_amount: Math.round(data.source_amount * 1.23), pickup_time: '2-4 hours' },
          { method: 'bcel_wallet', target_amount: Math.round(data.source_amount * 1.24), pickup_time: 'Instant' },
        ],
        rate_expires_at: expiresAt,
      };
    }
    const res = await this.client.post('/quote', data);
    return res.data;
  }

  // Transactions
  async send(data: SendRequest): Promise<SendResponse> {
    if (this._demoMode) {
      const expiresAt = new Date(Date.now() + 900000).toISOString();
      return {
        transaction_ref: 'DEMO-' + Date.now().toString(36).toUpperCase(),
        status: 'pending_payment',
        payment: {
          method: 'promptpay_qr',
          qr_code: '',
          amount: data.quote_id ? 5000 : 0,
          expires_at: expiresAt,
        },
      };
    }
    const res = await this.client.post('/transactions/send', data, {
      headers: { 'X-Idempotency-Key': data.idempotency_key },
    });
    return res.data;
  }

  async getHistory(page = 1, limit = 20): Promise<{ transactions: Transaction[] }> {
    if (this._demoMode) {
      return {
        transactions: [
          { transaction_ref: 'DEMO-A1B2C3', source_amount: 5000, source_currency: 'THB', target_amount: 6250, target_currency: 'LAK', exchange_rate: 1.25, recipient_name: 'Souliphone Chanthavong', recipient_phone: '856209876543', status: 'completed', created_at: new Date(Date.now() - 86400000).toISOString(), paid_at: new Date(Date.now() - 82800000).toISOString(), completed_at: new Date(Date.now() - 81000000).toISOString(), picked_up_at: new Date(Date.now() - 80000000).toISOString(), pickup_code: 'LAO-8421' },
          { transaction_ref: 'DEMO-D4E5F6', source_amount: 3000, source_currency: 'THB', target_amount: 3720, target_currency: 'LAK', exchange_rate: 1.24, recipient_name: 'Anousone Keovongvichith', recipient_phone: '856205551234', status: 'pending_payment', created_at: new Date(Date.now() - 3600000).toISOString(), paid_at: undefined, completed_at: undefined, picked_up_at: undefined, pickup_code: undefined },
          { transaction_ref: 'DEMO-G7H8I9', source_amount: 10000, source_currency: 'THB', target_amount: 12600, target_currency: 'LAK', exchange_rate: 1.26, recipient_name: 'Bouasone Phengphachanh', recipient_phone: '856204447777', status: 'completed', created_at: new Date(Date.now() - 604800000).toISOString(), paid_at: new Date(Date.now() - 590000000).toISOString(), completed_at: new Date(Date.now() - 580000000).toISOString(), picked_up_at: new Date(Date.now() - 570000000).toISOString(), pickup_code: 'LAO-5513' },
        ],
      };
    }
    const res = await this.client.get(`/transactions?page=${page}&limit=${limit}`);
    return res.data;
  }

  async getTransaction(ref: string): Promise<Transaction> {
    if (this._demoMode) {
      return { transaction_ref: ref, source_amount: 5000, source_currency: 'THB', target_amount: 6250, target_currency: 'LAK', exchange_rate: 1.25, recipient_name: 'Souliphone Chanthavong', recipient_phone: '856209876543', status: 'completed', created_at: new Date(Date.now() - 86400000).toISOString(), paid_at: new Date(Date.now() - 82800000).toISOString(), completed_at: new Date(Date.now() - 81000000).toISOString(), picked_up_at: new Date(Date.now() - 80000000).toISOString(), pickup_code: 'LAO-8421' };
    }
    const res = await this.client.get(`/transactions/${ref}`);
    return res.data;
  }
}

export const api = new ApiService();
