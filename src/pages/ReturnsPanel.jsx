import React, { useState, useEffect } from 'react';
import { useUser } from '../App';
import { getReturns, updateReturn, getClaims, updateClaim } from '../services/api';

const STATUS_RETURN = {
  pending:               { label: 'Pendiente retiro',        color: '#d97706', bg: '#fef3c7' },
  picked_up_from_client: { label: 'Retirado del cliente',    color: '#056EB7', bg: '#eff6ff' },
  delivered_to_supplier: { label: 'En tu depósito',          color: '#16a34a', bg: '#dcfce7' },
  resolved:              { label: 'Resuelto',                color: '#7c3aed', bg: '#f5f3ff' },
};

const STATUS_CLAIM = {
  open:       { label: 'Abierto',     color: '#dc2626', bg: '#fef2f2' },
  reviewing:  { label: 'En revisión', color: '#d97706', bg: '#fef3c7' },
  approved:   { label: 'Aprobado',    color: '#16a34a', bg: '#dcfce7' },
  resolved:   { label: 'Resuelto',    color: '#7c3aed', bg: '#f5f3ff' },
  rejected:   { label: 'Rechazado',   color: '#6b7280', bg: '#f3f4f6' },
};

const TABS = ['Devoluciones', 'Reclamos'];

const ReturnsPanel = () => {
  const { user }          = useUser();
  const isProvider        = user?.user_role === 'provider';
  const [tab, setTab]     = useState(0);
  const [returns, setReturns] = useState([]);
  const [claims, setClaims]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [resolution, setResolution] = useState('');
  const [saving, setSaving] = useState(null);

  const formatCurrency = (v) =>
    new Intl.NumberFormat('es-PY', { style: 'currency', currency: 'PYG', minimumFractionDigits: 0 }).format(v || 0);

  const formatDate = (d) => {
    if (!d) return '—';
    try { return new Date(d).toLocaleDateString('es-PY', { day: '2-digit', month: 'short', year: 'numeric' }); }
    catch { return '—'; }
  };

  useEffect(() => {
    Promise.all([getReturns().catch(() => []), getClaims().catch(() => [])])
      .then(([r, c]) => { setReturns(r || []); setClaims(c || []); })
      .finally(() => setLoading(false));
  }, [user]);

  const handleReturnStatus = async (returnId, status) => {
    setSaving(returnId);
    try {
      const updated = await updateReturn(returnId, { status });
      setReturns(prev => prev.map(r => r.return_id === returnId ? { ...r, ...updated } : r));
    } catch { alert('Error al actualizar'); }
    finally { setSaving(null); }
  };

  const handleClaimResolve = async (claimId, status) => {
    if (!resolution.trim() && status === 'resolved') { alert('Ingresá una resolución'); return; }
    setSaving(claimId);
    try {
      const updated = await updateClaim(claimId, { status, resolution });
      setClaims(prev => prev.map(c => c.claim_id === claimId ? { ...c, ...updated } : c));
      setResolution('');
      setExpanded(null);
    } catch { alert('Error al actualizar'); }
    finally { setSaving(null); }
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>Cargando...</div>;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px 16px' }}>
      <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#111827', marginBottom: '4px' }}>
        {isProvider ? 'Devoluciones y Reclamos' : 'Mis Reclamos'}
      </h1>
      <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '20px' }}>
        {isProvider ? 'Gestión de productos devueltos y reclamos de garantía' : 'Reclamos de garantía de tus órdenes'}
      </p>

      {/* Tabs */}
      {isProvider && (
        <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', background: '#f3f4f6', borderRadius: '10px', padding: '4px' }}>
          {TABS.map((t, i) => (
            <button key={i} onClick={() => setTab(i)}
              style={{ flex: 1, padding: '8px', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s',
                background: tab === i ? 'white' : 'transparent',
                color:      tab === i ? '#111827' : '#6b7280',
                boxShadow:  tab === i ? '0 1px 4px rgba(0,0,0,0.1)' : 'none' }}>
              {t} {i === 0 ? `(${returns.length})` : `(${claims.length})`}
            </button>
          ))}
        </div>
      )}

      {/* ── Devoluciones ── */}
      {(tab === 0 || !isProvider) && tab === 0 && isProvider && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {returns.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>Sin devoluciones activas</div>
          ) : returns.map(r => {
            const st = STATUS_RETURN[r.status] || { label: r.status, color: '#6b7280', bg: '#f3f4f6' };
            return (
              <div key={r.return_id} style={{ border: '1.5px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden', background: 'white' }}>
                <div style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <span style={{ fontWeight: '700', color: '#111827' }}>Orden #{r.order_id}</span>
                      <span style={{ padding: '2px 10px', borderRadius: '100px', fontSize: '11px', fontWeight: '700', background: st.bg, color: st.color }}>{st.label}</span>
                    </div>
                    <p style={{ fontSize: '13px', color: '#6b7280' }}>Motivo: {r.reason}</p>
                    {r.recipient_name && <p style={{ fontSize: '12px', color: '#6b7280' }}>Cliente: {r.recipient_name} · {r.recipient_phone}</p>}
                    {r.recipient_address && (
                      <p style={{ fontSize: '12px', color: '#6b7280' }}>
                        Dirección: {r.recipient_address}, {r.recipient_city}
                        {r.recipient_lat && r.recipient_lng && (
                          <a href={`https://www.google.com/maps?q=${r.recipient_lat},${r.recipient_lng}`}
                            target="_blank" rel="noopener noreferrer"
                            style={{ marginLeft: '8px', color: '#056EB7', fontWeight: '600' }}>Maps</a>
                        )}
                      </p>
                    )}
                    <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>{formatDate(r.created_at)}</p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end' }}>
                    <span style={{ fontWeight: '800', color: '#056EB7', fontSize: '16px' }}>{formatCurrency(r.final_price)}</span>
                    {r.status === 'delivered_to_supplier' && (
                      <button onClick={() => handleReturnStatus(r.return_id, 'resolved')} disabled={saving === r.return_id}
                        style={{ padding: '7px 14px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}>
                        {saving === r.return_id ? '...' : 'Marcar resuelto'}
                      </button>
                    )}
                  </div>
                </div>
                {r.notes && (
                  <div style={{ padding: '10px 16px', background: '#f9fafb', borderTop: '1px solid #f3f4f6', fontSize: '12px', color: '#6b7280' }}>
                    Notas logística: {r.notes}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Reclamos ── */}
      {(tab === 1 || !isProvider) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {claims.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>Sin reclamos</div>
          ) : claims.map(c => {
            const st  = STATUS_CLAIM[c.status] || { label: c.status, color: '#6b7280', bg: '#f3f4f6' };
            const exp = expanded === c.claim_id;
            const expired = new Date(c.expires_at) < new Date();
            return (
              <div key={c.claim_id} style={{ border: '1.5px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden', background: 'white' }}>
                <div style={{ padding: '16px', cursor: 'pointer' }} onClick={() => setExpanded(exp ? null : c.claim_id)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: '700', color: '#111827' }}>Orden #{c.order_id}</span>
                        <span style={{ padding: '2px 10px', borderRadius: '100px', fontSize: '11px', fontWeight: '700', background: st.bg, color: st.color }}>{st.label}</span>
                        {expired && c.status === 'open' && (
                          <span style={{ padding: '2px 10px', borderRadius: '100px', fontSize: '11px', fontWeight: '700', background: '#fef2f2', color: '#dc2626' }}>Vencido</span>
                        )}
                      </div>
                      <p style={{ fontSize: '13px', color: '#374151', fontWeight: '600' }}>{c.reason}</p>
                      {c.description && <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>{c.description}</p>}
                      {!isProvider && c.recipient_name && <p style={{ fontSize: '12px', color: '#6b7280' }}>Cliente: {c.recipient_name}</p>}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontWeight: '800', color: '#056EB7' }}>{formatCurrency(c.final_price)}</p>
                      <p style={{ fontSize: '11px', color: '#9ca3af' }}>{formatDate(c.created_at)}</p>
                      <p style={{ fontSize: '10px', color: '#9ca3af' }}>Vence: {formatDate(c.expires_at)}</p>
                    </div>
                  </div>
                </div>

                {exp && (
                  <div style={{ padding: '16px', background: '#f9fafb', borderTop: '1.5px solid #f3f4f6' }}>
                    {c.evidence_url && (
                      <div style={{ marginBottom: '12px' }}>
                        <p style={{ fontSize: '11px', fontWeight: '700', color: '#6b7280', marginBottom: '6px' }}>PRUEBA DEL CLIENTE</p>
                        <a href={c.evidence_url} target="_blank" rel="noopener noreferrer"
                          style={{ color: '#056EB7', fontSize: '13px', fontWeight: '600' }}>Ver prueba</a>
                      </div>
                    )}
                    {c.recipient_address && isProvider && (
                      <div style={{ marginBottom: '12px' }}>
                        <p style={{ fontSize: '11px', fontWeight: '700', color: '#6b7280', marginBottom: '4px' }}>DIRECCIÓN CLIENTE (para retiro)</p>
                        <p style={{ fontSize: '13px', color: '#374151' }}>{c.recipient_address}, {c.recipient_city}</p>
                        {c.recipient_lat && c.recipient_lng && (
                          <a href={`https://www.google.com/maps?q=${c.recipient_lat},${c.recipient_lng}`}
                            target="_blank" rel="noopener noreferrer"
                            style={{ color: '#056EB7', fontSize: '12px', fontWeight: '600' }}>Ver en Maps</a>
                        )}
                        {c.recipient_phone && <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>Tel: {c.recipient_phone}</p>}
                      </div>
                    )}
                    {c.resolution && (
                      <div style={{ background: '#dcfce7', borderRadius: '8px', padding: '10px 12px', marginBottom: '12px' }}>
                        <p style={{ fontSize: '11px', fontWeight: '700', color: '#16a34a', marginBottom: '4px' }}>RESOLUCIÓN</p>
                        <p style={{ fontSize: '13px', color: '#374151' }}>{c.resolution}</p>
                      </div>
                    )}
                    {/* Proveedor puede responder si está open/reviewing */}
                    {isProvider && ['open','reviewing'].includes(c.status) && (
                      <div style={{ marginTop: '8px' }}>
                        <textarea
                          value={resolution}
                          onChange={e => setResolution(e.target.value)}
                          placeholder="Describí la solución para el reenvío..."
                          rows={3}
                          style={{ width: '100%', padding: '10px', border: '1.5px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', marginBottom: '8px', boxSizing: 'border-box' }}
                        />
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => handleClaimResolve(c.claim_id, 'reviewing')} disabled={saving === c.claim_id}
                            style={{ flex: 1, padding: '9px', background: '#f3f4f6', border: '1.5px solid #e5e7eb', borderRadius: '8px', fontWeight: '700', fontSize: '12px', cursor: 'pointer', color: '#374151' }}>
                            En revisión
                          </button>
                          <button onClick={() => handleClaimResolve(c.claim_id, 'resolved')} disabled={saving === c.claim_id}
                            style={{ flex: 2, padding: '9px', background: '#056EB7', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '12px', cursor: 'pointer', color: 'white' }}>
                            {saving === c.claim_id ? 'Guardando...' : 'Marcar resuelto'}
                          </button>
                          <button onClick={() => handleClaimResolve(c.claim_id, 'rejected')} disabled={saving === c.claim_id}
                            style={{ flex: 1, padding: '9px', background: '#fef2f2', border: '1.5px solid #fecaca', borderRadius: '8px', fontWeight: '700', fontSize: '12px', cursor: 'pointer', color: '#dc2626' }}>
                            Rechazar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ReturnsPanel;
