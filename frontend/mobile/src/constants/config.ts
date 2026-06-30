export const Config = {
  API_BASE_URL: __DEV__ ? 'http://192.168.1.100:8080/v1' : 'https://api.ngoensai.la/v1',
  OTP_RESEND_INTERVAL: 60,
  RATE_EXPIRY_SECONDS: 900,
  MAX_RETRY_ATTEMPTS: 3,
  SENTRY_DSN: __DEV__ ? '' : 'https://xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx@o123456.ingest.sentry.io/654321',
  APP_VERSION: '1.0.0',
};
