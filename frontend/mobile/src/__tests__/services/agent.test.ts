import { api } from '../../services/api';

describe('Agent API (demo mode)', () => {
  beforeEach(() => {
    api.enableDemoMode();
  });

  describe('registerAgent', () => {
    it('returns demo agent id in demo mode', async () => {
      const res = await api.registerAgent({
        shop_name: 'Test Shop',
        shop_province: 'Vientiane',
        country: 'LA',
        agent_type: 'cash_out_agent',
      });
      expect(res.agent_id).toBe('demo-agent-001');
    });
  });

  describe('getAgentCommission', () => {
    it('returns commission data', async () => {
      const res = await api.getAgentCommission();
      expect(res).toHaveProperty('commission_rate');
      expect(res).toHaveProperty('commission_total');
    });
  });

  describe('depositFloat', () => {
    it('does not throw in demo mode', async () => {
      await expect(api.depositFloat('agent-1', 100000, 'bank_transfer')).resolves.not.toThrow();
    });
  });
});
