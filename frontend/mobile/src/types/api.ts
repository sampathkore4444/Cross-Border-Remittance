export interface RegisterRequest {
  phone: string;
  country_code: string;
  language: string;
}

export interface VerifyRequest {
  phone: string;
  otp: string;
  device_id?: string;
  fcm_token?: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: {
    id: string;
    phone: string;
    name: string;
    kyc_level: string;
    is_new: boolean;
  };
}

export interface QuoteRequest {
  source_amount: number;
  source_currency: string;
  target_currency: string;
  payout_method: PayoutMethod;
  recipient_phone: string;
}

export interface QuoteResponse {
  quote_id: string;
  source_amount: number;
  exchange_rate: number;
  target_amount: number;
  fee_breakdown: {
    fx_margin: number;
    payout_fee: number;
    total_fee_percent: number;
  };
  payout_options: PayoutOption[];
  rate_expires_at: string;
}

export interface PayoutOption {
  method: PayoutMethod;
  target_amount: number;
  pickup_time: string;
}

export type PaymentMethod = 'promptpay_qr' | 'bank_transfer' | 'truemoney' | 'agent_cash';
export type PayoutMethod =
  | 'bcel_cash'
  | 'seven_eleven_cash'
  | 'agent_cash'
  | 'mobile_topup'
  | 'bcel_wallet';

export interface SendRequest {
  idempotency_key: string;
  quote_id: string;
  recipient: {
    phone: string;
    name: string;
    relationship?: string;
    province?: string;
  };
  payout_method: PayoutMethod;
  payment_method: PaymentMethod;
}

export interface SendResponse {
  transaction_ref: string;
  status: string;
  payment: {
    method: string;
    qr_code?: string;
    amount: number;
    expires_at: string;
  };
}

export interface Transaction {
  transaction_ref: string;
  source_amount: number;
  source_currency: string;
  target_amount: number;
  target_currency: string;
  exchange_rate: number;
  recipient_name: string;
  recipient_phone: string;
  status: string;
  created_at: string;
  paid_at?: string;
  completed_at?: string;
  picked_up_at?: string;
  pickup_code?: string;
}

export interface User {
  id: string;
  phone: string;
  name: string;
  kyc_level: string;
  language: string;
}
