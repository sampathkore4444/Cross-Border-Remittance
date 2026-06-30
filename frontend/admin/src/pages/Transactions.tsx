import { useState, useEffect, useRef } from 'react';
import { fetchTransactions, searchTransactions, fetchTransactionDetail, type TransactionResponse, type TransactionDetailResponse } from '../api/client';
import Loading from '../components/Loading';

const STATUS_COLORS: Record<string, string> = {
  completed: '#00C853', pending: '#FFB300', failed: '#FF3D00', refunded: '#9CA3AF',
};

export default function Transactions() {
  const [data, setData] = useState<TransactionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState<TransactionDetailResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const limit = 20;

  const [q, setQ] = useState('');
  const [sender, setSender] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const load = (p: number) => {
    setLoading(true);
    setError('');
    const hasSearch = q || sender || from || to;
    const fetcher = hasSearch ? searchTransactions(p, limit, q, sender, from, to) : fetchTransactions(p, limit);
    fetcher
      .then(setData)
      .catch((e) => setError(e.response?.data?.error || e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(page); }, [page]);

  useEffect(() => {
    if (autoRefresh && !detail) {
      intervalRef.current = setInterval(() => load(page), 30000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [autoRefresh, detail, page]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    load(1);
  };

  const openDetail = async (ref: string) => {
    setDetailLoading(true);
    setError('');
    try {
      const res = await fetchTransactionDetail(ref);
      setDetail(res);
    } catch {
      setError('Failed to load transaction detail');
    } finally {
      setDetailLoading(false);
    }
  };

  const exportCSV = () => {
    const txs = data?.transactions ?? [];
    if (txs.length === 0) return;
    const headers = ['Ref', 'Sender', 'Recipient', 'Source Amount', 'Target Amount', 'Payment Status', 'Payout Status', 'Created At'];
    const rows = txs.map((tx: any) => [
      tx.transaction_ref || '',
      tx.sender_id || '',
      tx.recipient_name || '',
      `${tx.source_amount ?? 0} ${tx.source_currency || 'THB'}`,
      `${tx.target_amount ?? 0} ${tx.target_currency || 'LAK'}`,
      tx.payment_status || '',
      tx.payout_status || '',
      tx.created_at ? new Date(tx.created_at).toISOString() : '',
    ]);
    const csv = [headers.join(','), ...rows.map((r: string[]) => r.map((c: string) => `"${c.replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `transactions-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  if (loading) return <Loading text="Loading transactions..." />;
  if (error) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <p style={{ color: '#FF3D00', fontSize: 14, marginBottom: 16 }}>{error}</p>
        <button onClick={() => load(page)} style={{
          padding: '10px 24px', borderRadius: 8, border: 'none',
          background: '#1A8CFF', color: '#FFF', fontWeight: 600, cursor: 'pointer',
        }}>Retry</button>
      </div>
    );
  }

  const txs = data?.transactions ?? [];
  const totalPages = Math.ceil((data?.total ?? 0) / limit);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Transactions</h1>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{data?.total ?? 0} total</span>
          <button onClick={() => { setPage(1); load(1); }} style={{
            padding: '8px 16px', borderRadius: 8, border: '1px solid #D1D5DB',
            background: '#FFF', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#374151',
          }}>Refresh</button>
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            style={{
              padding: '8px 16px', borderRadius: 8, border: '1px solid #D1D5DB',
              background: autoRefresh ? '#E8F5E9' : '#FFF',
              color: autoRefresh ? '#2E7D32' : '#374151',
              fontWeight: 600, cursor: 'pointer', fontSize: 13,
            }}
          >
            {autoRefresh ? 'Auto-Refresh On' : 'Auto-Refresh Off'}
          </button>
          <button onClick={exportCSV} style={{
            padding: '8px 16px', borderRadius: 8, border: '1px solid #D1D5DB',
            background: '#FFF', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#374151',
          }}>Export CSV</button>
        </div>
      </div>

      <form onSubmit={handleSearch} style={{
        display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap',
      }}>
        <input placeholder="Search ref/recipient..." value={q} onChange={(e) => setQ(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #D1D5DB', fontSize: 13, flex: 1, minWidth: 160 }} />
        <input placeholder="Sender phone..." value={sender} onChange={(e) => setSender(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #D1D5DB', fontSize: 13, flex: 1, minWidth: 140 }} />
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #D1D5DB', fontSize: 13 }} />
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #D1D5DB', fontSize: 13 }} />
        <button type="submit" style={{
          padding: '8px 20px', borderRadius: 8, border: 'none',
          background: '#1A8CFF', color: '#FFF', fontWeight: 600, cursor: 'pointer', fontSize: 13,
        }}>Search</button>
        {(q || sender || from || to) && (
          <button type="button" onClick={() => { setQ(''); setSender(''); setFrom(''); setTo(''); setPage(1); load(1); }} style={{
            padding: '8px 16px', borderRadius: 8, border: '1px solid #D1D5DB',
            background: '#FFF', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#6B7280',
          }}>Clear</button>
        )}
      </form>

      <div style={{ background: 'var(--card-bg)', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', overflow: 'auto' }}>
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 1fr',
          padding: '14px 20px', borderBottom: '1px solid var(--border-color)',
          fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase',
        }}>
          <span>Ref</span><span>Sender</span><span>Recipient</span>
          <span>Amount</span><span>Status</span><span>Time</span>
        </div>
        {txs.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF' }}>No transactions found</div>
        ) : (
          txs.map((tx, i) => (
            <div
              key={tx.id || i}
              onClick={() => openDetail(tx.transaction_ref || tx.id)}
              style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 1fr',
                padding: '14px 20px', borderBottom: '1px solid var(--border-color)',
                fontSize: 14, color: 'var(--text-primary)', alignItems: 'center', cursor: 'pointer',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#F8F9FA')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '')}
            >
              <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>{tx.transaction_ref || tx.id?.slice(0, 8) || '—'}</span>
              <span>{tx.sender_id?.slice(0, 8) || '—'}</span>
              <span>{tx.recipient_name || '—'}</span>
              <span>
                <div>{(tx.source_amount ?? 0).toLocaleString()} {tx.source_currency || 'THB'}</div>
                <div style={{ fontSize: 12, color: '#9CA3AF' }}>→ {(tx.target_amount ?? 0).toLocaleString()} {tx.target_currency || 'LAK'}</div>
              </span>
              <span style={{ fontWeight: 600, color: STATUS_COLORS[(tx.payout_status || tx.payment_status || '').toLowerCase()] || '#6B7280' }}>
                {tx.payout_status || tx.payment_status || 'pending'}
              </span>
              <span style={{ color: '#9CA3AF', fontSize: 13 }}>
                {tx.created_at ? new Date(tx.created_at).toLocaleDateString() : '—'}
              </span>
            </div>
          ))
        )}
      </div>
      {totalPages > 1 && (
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      )}

      {detail && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }} onClick={() => setDetail(null)}>
          <div style={{
            background: '#FFF', borderRadius: 16, padding: 32, width: 640,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)', maxWidth: '95vw', maxHeight: '90vh', overflow: 'auto',
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1A1A2E', margin: 0 }}>Transaction Detail</h3>
              <button onClick={() => setDetail(null)} style={{
                padding: '6px 14px', borderRadius: 6, border: '1px solid #D1D5DB',
                background: '#FFF', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#374151',
              }}>Close</button>
            </div>

            {detailLoading ? (
              <Loading text="Loading detail..." />
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
                  <Field label="Ref" value={detail.transaction?.transaction_ref} />
                  <Field label="Sender" value={detail.transaction?.sender_id} />
                  <Field label="Recipient" value={detail.transaction?.recipient_name} />
                  <Field label="Recipient Phone" value={detail.transaction?.recipient_phone} />
                  <Field label="Source" value={`${(detail.transaction?.source_amount ?? 0).toLocaleString()} ${detail.transaction?.source_currency || 'THB'}`} />
                  <Field label="Target" value={`${(detail.transaction?.target_amount ?? 0).toLocaleString()} ${detail.transaction?.target_currency || 'LAK'}`} />
                  <Field label="Exchange Rate" value={detail.transaction?.exchange_rate?.toFixed(4)} />
                  <Field label="Payment Status" value={detail.transaction?.payment_status} />
                  <Field label="Payout Status" value={detail.transaction?.payout_status} />
                  <Field label="Payment Ref" value={detail.transaction?.payment_reference} />
                  <Field label="Payout Ref" value={detail.transaction?.payout_reference} />
                  <Field label="Created" value={detail.transaction?.created_at ? new Date(detail.transaction.created_at).toLocaleString() : '—'} />
                </div>

                <h4 style={{ fontSize: 15, fontWeight: 700, color: '#1A1A2E', margin: '0 0 12px' }}>Status Timeline</h4>
                {(detail.logs ?? []).length === 0 ? (
                  <p style={{ color: '#9CA3AF', fontSize: 13 }}>No status logs</p>
                ) : (
                  <div style={{ borderLeft: '2px solid #E5E7EB', paddingLeft: 16 }}>
                    {detail.logs.map((log: any, i: number) => (
                      <div key={log.id || i} style={{ marginBottom: 12, position: 'relative' }}>
                        <div style={{
                          position: 'absolute', left: -22, top: 4, width: 10, height: 10,
                          borderRadius: '50%', background: '#1A8CFF', border: '2px solid #FFF',
                        }} />
                        <p style={{ fontSize: 13, fontWeight: 600, color: '#1A1A2E', margin: 0 }}>
                          {log.status_from || '—'} → {log.status_to}
                        </p>
                        <p style={{ fontSize: 12, color: '#6B7280', margin: '2px 0 0' }}>
                          by {log.changed_by || 'system'}
                          {log.reason ? ` — ${log.reason}` : ''}
                        </p>
                        <p style={{ fontSize: 11, color: '#9CA3AF', margin: '1px 0 0' }}>
                          {log.created_at ? new Date(log.created_at).toLocaleString() : '—'}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <p style={{ fontSize: 11, color: '#9CA3AF', margin: '0 0 2px', textTransform: 'uppercase', fontWeight: 600 }}>{label}</p>
      <p style={{ fontSize: 14, color: '#1A1A2E', margin: 0, fontWeight: 500 }}>{value || '—'}</p>
    </div>
  );
}

function Pagination({ page, totalPages, onPageChange }: { page: number; totalPages: number; onPageChange: (p: number) => void }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8,
      padding: '16px 20px', borderTop: '1px solid #E5E7EB',
    }}>
      <button
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        style={pageBtnStyle(page <= 1)}
      >
        Previous
      </button>
      <span style={{ fontSize: 13, color: '#6B7280' }}>
        Page {page} of {totalPages}
      </span>
      <button
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        style={pageBtnStyle(page >= totalPages)}
      >
        Next
      </button>
    </div>
  );
}

function pageBtnStyle(disabled: boolean): React.CSSProperties {
  return {
    padding: '6px 14px', borderRadius: 6, border: '1px solid #D1D5DB',
    background: disabled ? '#F3F4F6' : '#FFF', color: disabled ? '#9CA3AF' : '#374151',
    fontSize: 13, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer',
  };
}
