import type { PayoutMethod, PaymentMethod, QuoteResponse, SendResponse, Transaction } from '@types/api';

export type AuthStackParamList = {
  Splash: undefined;
  Login: undefined;
  OTP: { phone: string; countryCode: string };
};

export type MainTabParamList = {
  Home: undefined;
  History: undefined;
  Profile: undefined;
};

export type SendStackParamList = {
  Amount: undefined;
  Recipient: { quote: QuoteResponse } | undefined;
  PayoutMethod: { quote: QuoteResponse; recipient: { phone: string; name: string; province?: string; relationship?: string } };
  Confirm: { quote: QuoteResponse; recipient: { phone: string; name: string; province?: string; relationship?: string }; payoutMethod: PayoutMethod; paymentMethod: PaymentMethod };
  QR: { sendResponse: SendResponse };
  Success: { transactionRef: string; targetAmount: number; pickupCode?: string; recipientName: string };
};

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Send: undefined;
  TransactionDetail: { ref: string };
  AgentDashboard: undefined;
  AutosendSettings: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList { }
  }
}
