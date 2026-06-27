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

  constructor() {
    this.client = axios.create({
      baseURL: Config.API_BASE_URL,
      timeout: 15000,
      headers: { 'Content-Type': 'application/json' },
    });

    this.client.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
      const token = await SecureStore.getItemAsync('access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    this.client.interceptors.response.use(
      (res) => res,
      async (error) => {
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

  // Auth
  async register(data: RegisterRequest) {
    return this.client.post('/auth/register', data);
  }

  async verify(data: VerifyRequest): Promise<AuthResponse> {
    const res = await this.client.post('/auth/verify', data);
    const auth: AuthResponse = res.data;
    await SecureStore.setItemAsync('access_token', auth.access_token);
    await SecureStore.setItemAsync('refresh_token', auth.refresh_token);
    return auth;
  }

  async tryRefreshToken(): Promise<boolean> {
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
    await SecureStore.deleteItemAsync('access_token');
    await SecureStore.deleteItemAsync('refresh_token');
  }

  // Quotes
  async getQuote(data: QuoteRequest): Promise<QuoteResponse> {
    const res = await this.client.post('/quote', data);
    return res.data;
  }

  // Transactions
  async send(data: SendRequest): Promise<SendResponse> {
    const res = await this.client.post('/transactions/send', data, {
      headers: { 'X-Idempotency-Key': data.idempotency_key },
    });
    return res.data;
  }

  async getHistory(page = 1, limit = 20): Promise<{ transactions: Transaction[] }> {
    const res = await this.client.get(`/transactions?page=${page}&limit=${limit}`);
    return res.data;
  }

  async getTransaction(ref: string): Promise<Transaction> {
    const res = await this.client.get(`/transactions/${ref}`);
    return res.data;
  }
}

export const api = new ApiService();
