import { useEffect, useState } from 'react';
import { fetchKYCDocuments, reviewKYCDocument, type KYCDocument } from '../api/client';
import Loading from '../components/Loading';

export default function KycReview() {
  const [docs, setDocs] = useState<KYCDocument[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const limit = 20;

  const load = () => {
    setLoading(true);
    setError('');
    fetchKYCDocuments(page, limit, statusFilter)
      .then((res) => { setDocs(res.documents); setTotal(res.total); })
      .catch((e) => setError(e.response?.data?.error || e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [page, statusFilter]);

  const handleReview = async (id: number, status: string) => {
    try {
      await reviewKYCDocument(id, status);
      load();
    } catch (e: any) {
      alert(e.response?.data?.error || e.message);
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 24 }}>KYC Document Review</h1>
      <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
        {['', 'pending', 'approved', 'rejected'].map((s) => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPage(1); }}
            style={{
              padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border-color)',
              background: statusFilter === s ? 'var(--nav-active-bg)' : 'transparent',
              color: statusFilter === s ? 'var(--nav-active-text)' : 'var(--text-primary)',
              fontWeight: 600, cursor: 'pointer', fontSize: 13,
            }}
          >
            {s || 'All'}
          </button>
        ))}
      </div>
      {loading ? <Loading text="Loading KYC documents..." /> : error ? <ErrorState message={error} onRetry={load} /> : (
        <>
          <div style={{ background: 'var(--card-bg)', borderRadius: 12, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                  {['ID', 'User', 'Type', 'Status', 'Submitted', 'Actions'].map((h) => (
                    <th key={h} style={{ padding: '12px 16px', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {docs.map((d) => (
                  <>
                    <tr
                      key={d.id}
                      onClick={() => setExpandedId(expandedId === d.id ? null : d.id)}
                      style={{ borderBottom: '1px solid var(--border-color)', cursor: 'pointer' }}
                    >
                      <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-primary)' }}>{d.id}</td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-primary)' }}>{d.user_id}</td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-primary)' }}>{d.doc_type}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          padding: '4px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600,
                          background: d.status === 'approved' ? '#E8F5E9' : d.status === 'rejected' ? '#FFEBEE' : '#FFF3E0',
                          color: d.status === 'approved' ? '#2E7D32' : d.status === 'rejected' ? '#C62828' : '#E65100',
                        }}>{d.status}</span>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-secondary)' }}>{new Date(d.created_at).toLocaleDateString()}</td>
                      <td style={{ padding: '12px 16px' }}>
                        {d.status === 'pending' && (
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button onClick={(e) => { e.stopPropagation(); handleReview(d.id, 'approved'); }} style={{
                              padding: '6px 14px', borderRadius: 6, border: 'none', background: '#2E7D32', color: '#FFF', fontWeight: 600, cursor: 'pointer', fontSize: 12,
                            }}>Approve</button>
                            <button onClick={(e) => { e.stopPropagation(); handleReview(d.id, 'rejected'); }} style={{
                              padding: '6px 14px', borderRadius: 6, border: 'none', background: '#C62828', color: '#FFF', fontWeight: 600, cursor: 'pointer', fontSize: 12,
                            }}>Reject</button>
                          </div>
                        )}
                      </td>
                    </tr>
                    {expandedId === d.id && (
                      <tr key={`exp-${d.id}`}>
                        <td colSpan={6} style={{ padding: '16px 24px', background: 'var(--bg-secondary)' }}>
                          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                            {d.front_url && <DocPreview label="Front" url={d.front_url} />}
                            {d.back_url && <DocPreview label="Back" url={d.back_url} />}
                            {d.selfie_url && <DocPreview label="Selfie" url={d.selfie_url} />}
                          </div>
                          {d.doc_number && <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 8 }}>Doc #: {d.doc_number}</p>}
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
              <button disabled={page <= 1} onClick={() => setPage(page - 1)} style={pageBtnStyle}>Prev</button>
              <span style={{ padding: '8px 12px', fontSize: 13, color: 'var(--text-secondary)' }}>{page} / {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} style={pageBtnStyle}>Next</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function DocPreview({ label, url }: { label: string; url: string }) {
  return (
    <div>
      <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4, textTransform: 'uppercase' }}>{label}</p>
      <a href={url} target="_blank" rel="noopener noreferrer" style={{
        display: 'inline-block', padding: '8px 16px', borderRadius: 6,
        background: '#1A8CFF', color: '#FFF', fontSize: 12, fontWeight: 600, textDecoration: 'none',
      }}>View</a>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div style={{ padding: 40, textAlign: 'center' }}>
      <p style={{ color: '#FF3D00', fontSize: 14, marginBottom: 16 }}>{message}</p>
      <button onClick={onRetry} style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: '#1A8CFF', color: '#FFF', fontWeight: 600, cursor: 'pointer' }}>Retry</button>
    </div>
  );
}

const pageBtnStyle: React.CSSProperties = {
  padding: '8px 16px', borderRadius: 6, border: '1px solid var(--border-color)',
  background: 'transparent', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 600, fontSize: 13,
};
