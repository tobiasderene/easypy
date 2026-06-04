import React, { useState, useEffect } from 'react';
import { useUser } from '../App';
import { useNavigate } from 'react-router-dom';
import { getMyLogistics, getOrdersByLogistics, pickedUpOrder, outForDeliveryOrder,
         redeliveryWithReason, retryDeliveryOrder, deliverOrder, cancelOrderAdmin, createReturn } from '../services/api';
import '../styles/logisticspanel.css';

const STATUS_LABELS = {
  pending:          { label: 'Pendiente',            color: '#6b7280', bg: '#f3f4f6' },
  confirmed:        { label: 'Para retirar',          color: '#16a34a', bg: '#dcfce7' },
  ready_for_pickup: { label: 'Listo para retirar',    color: '#16a34a', bg: '#dcfce7' },
  picked_up:        { label: 'Retirado del proveedor', color: '#056EB7', bg: '#eff6ff' },
  out_for_delivery: { label: 'Yendo a entregar',      color: '#d97706', bg: '#fef3c7' },
  in_transit:       { label: 'En camino',             color: '#d97706', bg: '#fef3c7' },
  redelivery:       { label: 'Reagendado',            color: '#f97316', bg: '#fff7ed' },
  completed:        { label: 'Entregado',             color: '#7c3aed', bg: '#f5f3ff' },
  cancelled:              { label: 'Cancelado',             color: '#dc2626', bg: '#fef2f2' },
  return_in_progress:     { label: 'Devolución en curso',    color: '#dc2626', bg: '#fef2f2' },
};

const FILTERS = ['all', 'ready_for_pickup', 'picked_up', 'out_for_delivery', 'in_transit', 'redelivery', 'completed', 'cancelled'];

const STATS_CONFIG = [
  { key: 'ready_for_pickup', label: 'Para retirar',   color: '#16a34a', bg: '#dcfce7', border: '#16a34a20' },
  { key: 'picked_up',        label: 'Retirados',      color: '#056EB7', bg: '#eff6ff', border: '#056EB720' },
  { key: 'out_for_delivery', label: 'En camino',      color: '#d97706', bg: '#fef3c7', border: '#d9770620' },
  { key: 'completed',        label: 'Entregados',     color: '#7c3aed', bg: '#f5f3ff', border: '#7c3aed20' },
];

const LogisticsPanel = () => {
  const { user } = useUser();
  const navigate = useNavigate();

  const [logistic, setLogistic]         = useState(null);
  const [orders, setOrders]             = useState([]);
  const [loading, setLoading]           = useState(true);
  const [filter, setFilter]             = useState('all');
  const [updating, setUpdating]         = useState(null);
  const [error, setError]               = useState('');

  // Modal reagendamiento
  const [redeliveryModal, setRedeliveryModal] = useState(null);
  const [redeliveryReason, setRedeliveryReason] = useState('');
  const [returnModal, setReturnModal]           = useState(null);
  const [returnReason, setReturnReason]         = useState('');

  useEffect(() => {
    if (!user || user.user_role !== 'logistics') { navigate('/'); return; }
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const logisticData = await getMyLogistics();
      setLogistic(logisticData);
      const ordersData = await getOrdersByLogistics(logisticData.logistic_id);
      setOrders(ordersData || []);
    } catch {
      setError('No se pudieron cargar las órdenes.');
    } finally {
      setLoading(false);
    }
  };

  const update = async (orderId, fn, newStatus) => {
    setUpdating(orderId);
    try {
      await fn(orderId);
      setOrders(prev => prev.map(o => o.order_id === orderId ? { ...o, status: newStatus } : o));
    } catch (e) {
      alert(e.message || 'Error al actualizar la orden');
    } finally {
      setUpdating(null);
    }
  };

  const handleRedeliveryConfirm = async () => {
    if (!redeliveryReason.trim()) { alert('Ingresá el motivo del reagendamiento'); return; }
    const orderId = redeliveryModal;
    setUpdating(orderId);
    setRedeliveryModal(null);
    try {
      await redeliveryWithReason(orderId, redeliveryReason);
      setOrders(prev => prev.map(o => o.order_id === orderId ? { ...o, status: 'redelivery', redelivery_reason: redeliveryReason } : o));
      setRedeliveryReason('');
    } catch (e) {
      alert(e.message || 'Error al reagendar');
    } finally {
      setUpdating(null);
    }
  };

  const handleCancel = async (orderId) => {
    if (!window.confirm('¿Cancelás esta orden? El cliente solicitó cancelación.')) return;
    update(orderId, cancelOrderAdmin, 'cancelled');
  };

  const handleReturnConfirm = async () => {
    if (!returnReason.trim()) { alert('Ingresá el motivo de la devolución'); return; }
    const orderId = returnModal;
    setUpdating(orderId);
    setReturnModal(null);
    try {
      await createReturn({ order_id: orderId, reason: returnReason });
      setOrders(prev => prev.map(o => o.order_id === orderId ? { ...o, status: 'return_in_progress' } : o));
      setReturnReason('');
    } catch (e) {
      alert(e.message || 'Error al iniciar devolución');
    } finally {
      setUpdating(null);
    }
  };

  // Descarga etiqueta
  const downloadLabel = async (order) => {
    try {
      const token = localStorage.getItem('auth_token');
      const base  = import.meta.env.VITE_API_URL || 'https://easypy-backend-430520813248.us-central1.run.app';
      const endpoint = order.tracking_number
        ? `/orders/${order.order_id}/etiqueta?token=${token}`
        : `/orders/${order.order_id}/etiqueta-manual?token=${token}`;
      const res  = await fetch(`${base}${endpoint}`);
      if (!res.ok) throw new Error('Error al obtener etiqueta');
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `guia-${order.order_id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch {
      alert('No se pudo descargar la etiqueta');
    }
  };

  const formatCurrency = (v) =>
    new Intl.NumberFormat('es-PY', { style: 'currency', currency: 'PYG', minimumFractionDigits: 0 }).format(v);

  const formatDate = (d) => {
    if (!d) return '—';
    try { return new Date(d).toLocaleDateString('es-PY', { day: '2-digit', month: 'short', year: 'numeric' }); }
    catch { return '—'; }
  };

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter);

  const stats = {
    ready_for_pickup: orders.filter(o => o.status === 'ready_for_pickup').length,
    picked_up:        orders.filter(o => o.status === 'picked_up').length,
    out_for_delivery: orders.filter(o => ['out_for_delivery','in_transit'].includes(o.status)).length,
    completed:        orders.filter(o => o.status === 'completed').length,
  };

  if (loading) return <div className="lp-loading">Cargando panel...</div>;

  return (
    <div className="lp-page">

      {/* Modal reagendamiento */}
      {redeliveryModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '28px', maxWidth: '420px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '8px', color: '#111827' }}>Reagendar entrega</h3>
            <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px' }}>Indicá el motivo por el que no se pudo entregar</p>
            <select style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', marginBottom: '10px', background: 'white' }}
              value={redeliveryReason} onChange={e => setRedeliveryReason(e.target.value)}>
              <option value="">Seleccioná un motivo...</option>
              <option value="Cliente no estaba en casa">Cliente no estaba en casa</option>
              <option value="Dirección incorrecta">Dirección incorrecta</option>
              <option value="Cliente solicitó cambiar horario">Cliente solicitó cambiar horario</option>
              <option value="Zona de difícil acceso">Zona de difícil acceso</option>
              <option value="Otro">Otro</option>
            </select>
            {redeliveryReason === 'Otro' && (
              <input style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', marginBottom: '10px' }}
                placeholder="Describí el motivo..." onChange={e => setRedeliveryReason(e.target.value)} />
            )}
            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
              <button onClick={() => { setRedeliveryModal(null); setRedeliveryReason(''); }}
                style={{ flex: 1, padding: '10px', border: '1.5px solid #e5e7eb', borderRadius: '9px', background: 'white', color: '#6b7280', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>
                Cancelar
              </button>
              <button onClick={handleRedeliveryConfirm}
                style={{ flex: 2, padding: '10px', border: 'none', borderRadius: '9px', background: '#f97316', color: 'white', fontWeight: '800', fontSize: '13px', cursor: 'pointer' }}>
                Confirmar reagendamiento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal devolución */}
      {returnModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '28px', maxWidth: '420px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '8px', color: '#111827' }}>Iniciar devolución</h3>
            <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px' }}>El producto será devuelto al proveedor. Indicá el motivo.</p>
            <select style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', marginBottom: '10px', background: 'white' }}
              value={returnReason} onChange={e => setReturnReason(e.target.value)}>
              <option value="">Seleccioná un motivo...</option>
              <option value="Cliente rechazó el producto">Cliente rechazó el producto</option>
              <option value="Producto dañado">Producto dañado</option>
              <option value="Producto incorrecto">Producto incorrecto</option>
              <option value="Cliente desistió de la compra">Cliente desistió de la compra</option>
              <option value="Otro">Otro</option>
            </select>
            {returnReason === 'Otro' && (
              <input style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', marginBottom: '10px' }}
                placeholder="Describí el motivo..." onChange={e => setReturnReason(e.target.value)} />
            )}
            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
              <button onClick={() => { setReturnModal(null); setReturnReason(''); }}
                style={{ flex: 1, padding: '10px', border: '1.5px solid #e5e7eb', borderRadius: '9px', background: 'white', color: '#6b7280', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>
                Cancelar
              </button>
              <button onClick={handleReturnConfirm}
                style={{ flex: 2, padding: '10px', border: 'none', borderRadius: '9px', background: '#dc2626', color: 'white', fontWeight: '800', fontSize: '13px', cursor: 'pointer' }}>
                Iniciar devolución
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="lp-header">
        <h1 className="lp-title">Panel Logístico</h1>
        <p className="lp-subtitle">{logistic?.name || '—'} — Gestión de envíos</p>
      </div>

      {error && <div className="lp-error">{error}</div>}

      <div className="lp-stats">
        {STATS_CONFIG.map(s => (
          <div key={s.key} className="lp-stat" style={{ background: s.bg, borderColor: s.border }}>
            <p className="lp-stat-label" style={{ color: s.color }}>{s.label}</p>
            <p className="lp-stat-value" style={{ color: s.color }}>{stats[s.key]}</p>
          </div>
        ))}
      </div>

      <div className="lp-filters">
        {FILTERS.map(f => (
          <button key={f} className={`lp-filter-btn ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
            {f === 'all' ? 'Todas' : STATUS_LABELS[f]?.label || f}
            {f !== 'all' && <span className="lp-filter-count">({orders.filter(o => o.status === f).length})</span>}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="lp-empty">No hay órdenes en este estado</div>
      ) : (
        <div className="lp-orders">
          {filtered.map(order => {
            const st         = STATUS_LABELS[order.status] || { label: order.status, color: '#6b7280', bg: '#f3f4f6' };
            const isUpdating = updating === order.order_id;

            return (
              <div key={order.order_id} className="lp-order">
                <div className="lp-order-info">
                  <div className="lp-order-top">
                    <span className="lp-order-id">Orden #{order.order_id}</span>
                    <span className="lp-badge" style={{ background: st.bg, color: st.color }}>{st.label}</span>
                    {order.collection_type === 'con_recaudo' && (
                      <span className="lp-badge" style={{ background: '#fef3c7', color: '#d97706' }}>Con recaudo</span>
                    )}
                  </div>

                  <div className="lp-order-grid">
                    <p className="lp-order-field"><strong>Destinatario:</strong> {order.recipient_name || '—'}</p>
                    <p className="lp-order-field"><strong>Teléfono:</strong> {order.recipient_phone || '—'}</p>
                    <p className="lp-order-field"><strong>Ciudad:</strong> {order.recipient_city || '—'}, {order.recipient_region || '—'}</p>
                    <p className="lp-order-field"><strong>Fecha:</strong> {formatDate(order.created_at)}</p>
                    <p className="lp-order-field full"><strong>Dirección:</strong> {order.recipient_address || '—'} {order.recipient_address_complement || ''}</p>

                    {/* Ubicación destinatario */}
                    {order.recipient_lat && order.recipient_lng && (
                      <p className="lp-order-field full">
                        <a href={`https://www.google.com/maps?q=${order.recipient_lat},${order.recipient_lng}`}
                          target="_blank" rel="noopener noreferrer" className="lp-maps-link">
                          Ver ubicación del cliente en Maps
                        </a>
                      </p>
                    )}

                    {/* Ubicación proveedor */}
                    {order.supplier_city && (
                      <p className="lp-order-field full" style={{ marginTop: '4px' }}>
                        <strong>Retiro:</strong>{' '}
                        <a href={`https://www.google.com/maps/search/${encodeURIComponent([order.supplier_address, order.supplier_height, order.supplier_city, 'Paraguay'].filter(Boolean).join(' '))}`}
                          target="_blank" rel="noopener noreferrer"
                          style={{ color: '#8b5cf6', fontWeight: '600', textDecoration: 'none' }}>
                          {[order.supplier_address, order.supplier_height, order.supplier_city].filter(Boolean).join(', ')}
                        </a>
                        {order.supplier_phone && (
                          <span style={{ marginLeft: '8px', color: '#6b7280' }}>· {order.supplier_phone}</span>
                        )}
                      </p>
                    )}

                    {/* Motivo reagendamiento */}
                    {order.redelivery_reason && (
                      <p className="lp-order-field full" style={{ marginTop: '4px' }}>
                        <span style={{ fontSize: '12px', color: '#f97316', fontWeight: '600' }}>
                          Motivo: {order.redelivery_reason}
                        </span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="lp-order-actions">
                  <div>
                    <p className="lp-price-label">Total</p>
                    <p className="lp-price-value">{formatCurrency(order.final_price)}</p>
                  </div>

                  {/* Etiqueta — siempre disponible si la orden está activa */}
                  {!['pending','cancelled'].includes(order.status) && (
                    <button className="lp-btn" onClick={() => downloadLabel(order)} disabled={isUpdating}
                      style={{ background: '#f3f4f6', color: '#374151', border: '1.5px solid #e5e7eb', fontSize: '12px' }}>
                      Etiqueta
                    </button>
                  )}

                  {/* Flujo de estados */}
                  {order.status === 'ready_for_pickup' && (
                    <button className="lp-btn pickup" onClick={() => update(order.order_id, pickedUpOrder, 'picked_up')} disabled={isUpdating}>
                      {isUpdating ? 'Procesando...' : 'Retirar del proveedor'}
                    </button>
                  )}

                  {order.status === 'picked_up' && (
                    <button className="lp-btn pickup" onClick={() => update(order.order_id, outForDeliveryOrder, 'out_for_delivery')} disabled={isUpdating}>
                      {isUpdating ? 'Procesando...' : 'Salir a entregar'}
                    </button>
                  )}

                  {['out_for_delivery', 'in_transit'].includes(order.status) && (
                    <>
                      <button className="lp-btn deliver" onClick={() => update(order.order_id, deliverOrder, 'completed')} disabled={isUpdating}>
                        {isUpdating ? 'Procesando...' : 'Confirmar entrega'}
                      </button>
                      <button className="lp-btn redelivery" onClick={() => setRedeliveryModal(order.order_id)} disabled={isUpdating}>
                        No entregado
                      </button>
                    </>
                  )}

                  {order.status === 'redelivery' && (
                    <>
                      <button className="lp-btn pickup" onClick={() => update(order.order_id, retryDeliveryOrder, 'out_for_delivery')} disabled={isUpdating}>
                        {isUpdating ? 'Procesando...' : 'Reintentar entrega'}
                      </button>
                      <button className="lp-btn redelivery" onClick={() => setReturnModal(order.order_id)} disabled={isUpdating}
                        style={{ background: '#fef2f2', color: '#dc2626', border: '1.5px solid #fecaca' }}>
                        Iniciar devolución
                      </button>
                      <button className="lp-btn cancel" onClick={() => handleCancel(order.order_id)} disabled={isUpdating}>
                        Cliente cancela
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LogisticsPanel;
