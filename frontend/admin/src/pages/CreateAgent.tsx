import { useState } from 'react';
import { createAgent } from '../api/client';
import { useToast } from '../components/Toast';

interface CreateAgentProps {
  onBack: () => void;
}

export default function CreateAgent({ onBack }: CreateAgentProps) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    user_id: '', name: '', phone: '', province: '',
    shop_name: '', shop_address: '', shop_province: '',
    country: 'LA', agent_type: 'cash_out_agent', commission_rate: '1.0',
  });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.user_id.trim()) errs.user_id = 'User ID is required';
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.shop_name.trim()) errs.shop_name = 'Shop name is required';
    if (!form.agent_type) errs.agent_type = 'Agent type is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await createAgent({
        user_id: form.user_id,
        name: form.name,
        phone: form.phone || undefined,
        province: form.province || undefined,
        shop_name: form.shop_name,
        shop_address: form.shop_address || undefined,
        shop_province: form.shop_province || undefined,
        country: form.country || undefined,
        agent_type: form.agent_type,
        commission_rate: parseFloat(form.commission_rate) || 0,
      });
      toast('Agent created successfully');
      onBack();
    } catch (e: any) {
      toast(e.response?.data?.error || 'Failed to create agent', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle = (field: string): React.CSSProperties => ({
    width: '100%', padding: '10px 14px', borderRadius: 8, border: `1px solid ${errors[field] ? '#FF3D00' : 'var(--border-color)'}`,
    background: 'var(--bg-primary)', color: 'var(--text-primary)',
    fontSize: 14, outline: 'none', boxSizing: 'border-box',
  });

  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6,
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <button onClick={onBack} style={{
          padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border-color)',
          background: 'transparent', color: 'var(--text-primary)', cursor: 'pointer', fontSize: 14, fontWeight: 600,
        }}>&larr; Back</button>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Create Agent</h1>
      </div>

      <form onSubmit={handleSubmit} style={{
        background: 'var(--card-bg)', borderRadius: 12, padding: 28,
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)', maxWidth: 560,
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
          <div>
            <label style={labelStyle}>User ID *</label>
            <input value={form.user_id} onChange={set('user_id')} placeholder="e.g. usr_abc123" style={inputStyle('user_id')} />
            {errors.user_id && <p style={{ fontSize: 12, color: '#FF3D00', margin: '4px 0 0' }}>{errors.user_id}</p>}
          </div>
          <div>
            <label style={labelStyle}>Name *</label>
            <input value={form.name} onChange={set('name')} placeholder="Full name" style={inputStyle('name')} />
            {errors.name && <p style={{ fontSize: 12, color: '#FF3D00', margin: '4px 0 0' }}>{errors.name}</p>}
          </div>
          <div>
            <label style={labelStyle}>Phone</label>
            <input value={form.phone} onChange={set('phone')} placeholder="+85620..." style={inputStyle('phone')} />
          </div>
          <div>
            <label style={labelStyle}>Province</label>
            <input value={form.province} onChange={set('province')} placeholder="e.g. Vientiane" style={inputStyle('province')} />
          </div>
          <div>
            <label style={labelStyle}>Shop Name *</label>
            <input value={form.shop_name} onChange={set('shop_name')} placeholder="Shop name" style={inputStyle('shop_name')} />
            {errors.shop_name && <p style={{ fontSize: 12, color: '#FF3D00', margin: '4px 0 0' }}>{errors.shop_name}</p>}
          </div>
          <div>
            <label style={labelStyle}>Shop Province</label>
            <input value={form.shop_province} onChange={set('shop_province')} placeholder="Shop province" style={inputStyle('shop_province')} />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>Shop Address</label>
            <input value={form.shop_address} onChange={set('shop_address')} placeholder="Street address" style={inputStyle('shop_address')} />
          </div>
          <div>
            <label style={labelStyle}>Agent Type *</label>
            <select value={form.agent_type} onChange={set('agent_type')} style={inputStyle('agent_type')}>
              <option value="cash_out_agent">Cash-Out Agent</option>
              <option value="cash_in_agent">Cash-In Agent</option>
            </select>
            {errors.agent_type && <p style={{ fontSize: 12, color: '#FF3D00', margin: '4px 0 0' }}>{errors.agent_type}</p>}
          </div>
          <div>
            <label style={labelStyle}>Country</label>
            <select value={form.country} onChange={set('country')} style={inputStyle('country')}>
              <option value="LA">Laos (LA)</option>
              <option value="TH">Thailand (TH)</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Commission Rate (%)</label>
            <input type="number" step="0.1" min="0" value={form.commission_rate} onChange={set('commission_rate')} style={inputStyle('commission_rate')} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button type="button" onClick={onBack} style={{
            padding: '10px 24px', borderRadius: 8, border: '1px solid var(--border-color)',
            background: 'transparent', color: 'var(--text-primary)', fontWeight: 600, cursor: 'pointer', fontSize: 14,
          }}>Cancel</button>
          <button type="submit" disabled={submitting} style={{
            padding: '10px 24px', borderRadius: 8, border: 'none',
            background: submitting ? '#93C5FD' : '#1A8CFF', color: '#FFF',
            cursor: submitting ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 600,
          }}>{submitting ? 'Creating...' : 'Create Agent'}</button>
        </div>
      </form>
    </div>
  );
}
