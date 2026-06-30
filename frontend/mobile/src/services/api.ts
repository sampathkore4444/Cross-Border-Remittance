import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Config } from '../constants/config';
import { getCached, setCache } from './cache';
import { enqueueRequest, getQueue, dequeueRequest, incrementRetry } from './offline';
import { analytics } from './analytics';
import type {
  RegisterRequest,
  VerifyRequest,
  AuthResponse,
  QuoteRequest,
  QuoteResponse,
  SendRequest,
  SendResponse,
  Transaction,
  Recipient,
  AutosendConfig,
  UploadPhotoResponse,
} from '../types/api';

class ApiService {
  client: AxiosInstance;
  private _demoMode = false;
  private _isProcessingQueue = false;

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
      (res) => {
        if (res.config.method === 'get' && res.status === 200) {
          const url = res.config.url || '';
          setCache(url, res.data, 60 * 1000);
        }
        return res;
      },
      async (error) => {
        if (this._demoMode) return Promise.reject(error);
        if (!error.response && error.config?.method === 'get') {
          const cached = await getCached(error.config.url || '');
          if (cached) return { data: cached };
        }
        if (!error.response && error.config?.method !== 'get') {
          await enqueueRequest({
            method: error.config.method.toUpperCase() as 'POST' | 'PUT' | 'DELETE',
            url: error.config.url || '',
            data: error.config.data ? JSON.parse(error.config.data) : undefined,
          });
        }
        analytics.trackError(error);
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

  async processOfflineQueue(): Promise<void> {
    if (this._isProcessingQueue || this._demoMode) return;
    this._isProcessingQueue = true;
    try {
      const queue = await getQueue();
      for (const req of queue) {
        if (req.retryCount >= Config.MAX_RETRY_ATTEMPTS) {
          await dequeueRequest(req.id);
          continue;
        }
        try {
          await this.client.request({
            method: req.method,
            url: req.url,
            data: req.data,
            headers: req.headers,
          });
          await dequeueRequest(req.id);
        } catch {
          await incrementRetry(req.id);
        }
      }
    } finally {
      this._isProcessingQueue = false;
    }
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

  // Recipients
  async getRecipients(): Promise<Recipient[]> {
    if (this._demoMode) {
      return [
        { phone: '8562055551234', name: 'Mae', province: 'Savannakhet', relationship: 'Mother' },
        { phone: '8562066668888', name: 'Bounmy', province: 'Vientiane', relationship: 'Son' },
      ];
    }
    const res = await this.client.get('/recipients');
    return res.data.recipients;
  }

  async saveRecipient(data: Recipient): Promise<void> {
    if (this._demoMode) return;
    await this.client.post('/recipients', data);
  }

  async getTransaction(ref: string): Promise<Transaction> {
    if (this._demoMode) {
      return { transaction_ref: ref, source_amount: 5000, source_currency: 'THB', target_amount: 6250, target_currency: 'LAK', exchange_rate: 1.25, recipient_name: 'Souliphone Chanthavong', recipient_phone: '856209876543', status: 'completed', created_at: new Date(Date.now() - 86400000).toISOString(), paid_at: new Date(Date.now() - 82800000).toISOString(), completed_at: new Date(Date.now() - 81000000).toISOString(), picked_up_at: new Date(Date.now() - 80000000).toISOString(), pickup_code: 'LAO-8421' };
    }
    const res = await this.client.get(`/transactions/${ref}`);
    return res.data;
  }

  // Autosend
  async getAutosendConfig(): Promise<AutosendConfig> {
    if (this._demoMode) {
      const nextSend = new Date(Date.now() + 7 * 86400000).toISOString();
      return {
        enabled: true,
        amount: 2000,
        frequency: 'weekly',
        recipient_id: 'demo-recipient-001',
        recipient_name: 'Mae',
        next_send_at: nextSend,
      };
    }
    const res = await this.client.get('/autosend');
    return res.data;
  }

  async saveAutosendConfig(data: Omit<AutosendConfig, 'next_send_at'>): Promise<AutosendConfig> {
    if (this._demoMode) {
      const nextSend = new Date(Date.now() + 7 * 86400000).toISOString();
      return { ...data, next_send_at: nextSend };
    }
    const res = await this.client.post('/autosend', data);
    return res.data;
  }

  // Photo upload
  async uploadPhoto(uri: string, transactionRef: string): Promise<UploadPhotoResponse> {
    if (this._demoMode) {
      return { url: 'https://via.placeholder.com/300' };
    }
    const formData = new FormData();
    const filename = uri.split('/').pop() || 'photo.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const ext = match ? match[1] : 'jpg';
    formData.append('photo', {
      uri,
      name: `receipt_${transactionRef}.${ext}`,
      type: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
    } as any);
    formData.append('transaction_ref', transactionRef);
    const res = await this.client.post('/photos/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const pct = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          this._uploadProgressListeners.forEach((fn) => fn(pct));
        }
      },
    });
    return res.data;
  }

  private _uploadProgressListeners: Array<(pct: number) => void> = [];

  onUploadProgress(fn: (pct: number) => void) {
    this._uploadProgressListeners.push(fn);
    return () => {
      this._uploadProgressListeners = this._uploadProgressListeners.filter((f) => f !== fn);
    };
  }
}

export const api = new ApiService();
