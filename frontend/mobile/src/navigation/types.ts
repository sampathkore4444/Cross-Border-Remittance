import type { PayoutMethod, PaymentMethod, QuoteResponse, SendResponse, Transaction } from '@app-types/api';

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
  AgentRegistration: undefined;
  AutosendSettings: undefined;
  QRScanner: { transactionRef: string };
  PhotoCapture: { transactionRef: string };
  Terms: undefined;
  Privacy: undefined;
};

export type LinkingConfig = {
  screens: {
    TransactionDetail: 'transaction/:ref';
    Main: { screens: { Home: 'home'; History: 'history'; Profile: 'profile' } };
    Send: { screens: { Amount: 'send'; Success: 'send/success/:transactionRef' } };
  };
};

export const linking = {
  prefixes: ['ngoensai://', 'https://ngoensai.com'],
  config: {
    screens: {
      TransactionDetail: 'transaction/:ref',
      AgentRegistration: 'agent/register',
      Main: {
        screens: {
          Home: 'home',
          History: 'history',
          Profile: 'profile',
        },
      },
      Send: {
        screens: {
          Amount: 'send',
          Success: 'send/success/:transactionRef',
        },
      },
      Terms: 'terms',
      Privacy: 'privacy',
    },
  } as LinkingConfig,
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList { }
  }
}
