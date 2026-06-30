import { api } from '../../services/api';

describe('ApiService', () => {
  beforeEach(() => {
    api.enableDemoMode();
  });

  describe('register', () => {
    it('returns demo response in demo mode', async () => {
      const res = await api.register({ phone: '8562055551234', country_code: '856', language: 'lo' });
      expect(res.data.message).toBe('OTP sent (demo)');
    });
  });

  describe('verify', () => {
    it('returns demo auth response in demo mode', async () => {
      const res = await api.verify({ phone: '8562055551234', otp: '999999' });
      expect(res.access_token).toBe('demo_access_token');
      expect(res.user.name).toBe('Demo User');
    });
  });

  describe('getQuote', () => {
    it('returns demo quote in demo mode', async () => {
      const res = await api.getQuote({
        source_amount: 5000,
        source_currency: 'THB',
        target_currency: 'LAK',
        payout_method: 'bcel_cash',
        recipient_phone: '',
      });
      expect(res.quote_id).toBe('demo-quote-001');
      expect(res.source_amount).toBe(5000);
      expect(res.payout_options).toHaveLength(3);
    });
  });

  describe('send', () => {
    it('returns demo send response in demo mode', async () => {
      const res = await api.send({
        idempotency_key: 'test-key',
        quote_id: 'demo-quote-001',
        recipient: { phone: '8562055551234', name: 'Test' },
        payout_method: 'bcel_cash',
        payment_method: 'promptpay_qr',
      });
      expect(res.transaction_ref).toContain('DEMO-');
      expect(res.status).toBe('pending_payment');
    });
  });

  describe('getHistory', () => {
    it('returns demo transactions in demo mode', async () => {
      const res = await api.getHistory(1, 5);
      expect(res.transactions).toHaveLength(3);
      expect(res.transactions[0].transaction_ref).toContain('DEMO');
    });
  });

  describe('getTransaction', () => {
    it('returns demo transaction in demo mode', async () => {
      const res = await api.getTransaction('DEMO-TEST');
      expect(res.transaction_ref).toBe('DEMO-TEST');
    });
  });

  describe('getRecipients', () => {
    it('returns demo recipients in demo mode', async () => {
      const res = await api.getRecipients();
      expect(res).toHaveLength(2);
      expect(res[0].name).toBe('Mae');
    });
  });

  describe('saveRecipient', () => {
    it('does not throw in demo mode', async () => {
      await expect(api.saveRecipient({ phone: '8562055551234', name: 'Test' })).resolves.toBeUndefined();
    });
  });
});
