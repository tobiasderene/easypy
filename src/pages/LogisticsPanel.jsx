// LogisticsPanel.jsx
import React, { useState, useEffect } from 'react';
import { useUser } from '../App';
import { useNavigate } from 'react-router-dom';
import { getMyLogistics, getOrdersByLogistics, pickupOrder, deliverOrder } from '../services/api';
import '../styles/logistics.css';

const STATUS_LABELS = {
  pending:    { label: 'Pendiente',  color: '#2563eb', bg: '#eff6ff' },
  confirmed:  { label: 'Para retirar', color: '#16a34a', bg: '#dcfce7' },
  processing: { label: 'En camino',  color: '#d97706', bg: '#fef3c7' },
  completed:  { label: 'Entregado',  color: '#7c3aed', bg: '#f5f3ff' },
  cancelled:  { label: 'Cancelado',  color: '#dc2626', bg: '#fef2f2' },
};

const FILTERS = ['all', 'confirmed', 'processing', 'completed', 'cancelled'];

const STATS_CONFIG = [
  { key: 'total',      label: 'Total órdenes',  color: '#056EB7', bg: '#eff6ff', border: '#056EB720' },
  { key: 'confirmed',  label: 'Para retirar',   color: '#16a34a', bg: '#dcfce7', border: '#16a34a20' },
  { key: 'processing', label: 'En camino',      color: '#d97706', bg: '#fef3c7', border: '#d9770620' },
  { key: 'completed',  label: 'Entregadas',     color: '#7c3aed', bg: '#f5f3ff', border: '#7c3aed20' },
];

const LogisticsPanel = () => {
  const { user }   = useUser();
  const navigate   = useNavigate();

  const [logistic, setLogistic] = useState(null);
  const [orders, setOrders]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('all');
  const [updating, setUpdating] = useState(null);
  const [error, setError]       = useState('');

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
      setError('No se pudieron cargar las órdenes. Verificá tu conexión.');
    } finally {
      setLoading(false);
    }
  };

  const handlePickup = async (orderId) => {
    setUpdating(orderId);
    try {
      await pickupOrder(orderId);
      setOrders(prev => prev.map(o => o.order_id === orderId ? { ...o, status: 'processing' } : o));
    } catch (e) {
      alert('Error al confirmar retiro: ' + (e.message || 'Error desconocido'));
    } finally {
      setUpdating(null);
    }
  };

  const handleDeliver = async (orderId) => {
    setUpdating(orderId);
    try {
      await deliverOrder(orderId);
      setOrders(prev => prev.map(o => o.order_id === orderId ? { ...o, status: 'completed' } : o));
    } catch (e) {
      alert('Error al confirmar entrega: ' + (e.message || 'Error desconocido'));
    } finally {
      setUpdating(null);
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
    total:      orders.length,
    confirmed:  orders.filter(o => o.status === 'confirmed').length,
    processing: orders.filter(o => o.status === 'processing').length,
    completed:  orders.filter(o => o.status === 'completed').length,
  };

  if (loading) return <div className="lp-loading">Cargando panel...</div>;

  return (
    <div className="lp-page">

      {/* Header */}
      <div className="lp-header">
        <h1 className="lp-title">Panel Logístico</h1>
        <p className="lp-subtitle">{logistic?.name || '—'} — Gestión de envíos</p>
      </div>

      {error && <div className="lp-error">{error}</div>}

      {/* Stats */}
      <div className="lp-stats">
        {STATS_CONFIG.map(s => (
          <div key={s.key} className="lp-stat" style={{ background: s.bg, borderColor: s.border }}>
            <p className="lp-stat-label" style={{ color: s.color }}>{s.label}</p>
            <p className="lp-stat-value" style={{ color: s.color }}>{stats[s.key]}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="lp-filters">
        {FILTERS.map(f => (
          <button
            key={f}
            className={`lp-filter-btn ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? 'Todas' : STATUS_LABELS[f]?.label || f}
            {f !== 'all' && (
              <span className="lp-filter-count">
                ({orders.filter(o => o.status === f).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <div className="lp-empty">No hay órdenes en este estado</div>
      ) : (
        <div className="lp-orders">
          {filtered.map(order => {
            const st         = STATUS_LABELS[order.status] || { label: order.status, color: '#6b7280', bg: '#f3f4f6' };
            const isUpdating = updating === order.order_id;

            return (
              <div key={order.order_id} className="lp-order">

                {/* Info */}
                <div className="lp-order-info">
                  <div className="lp-order-top">
                    <span className="lp-order-id">Orden #{order.order_id}</span>
                    <span className="lp-badge" style={{ background: st.bg, color: st.color }}>
                      {st.label}
                    </span>
                    {order.collection_type === 'con_recaudo' && (
                      <span className="lp-badge" style={{ background: '#fef3c7', color: '#d97706' }}>
                        Con recaudo
                      </span>
                    )}
                  </div>

                  <div className="lp-order-grid">
                    <p className="lp-order-field">
                      <strong>Destinatario:</strong> {order.recipient_name || '—'}
                    </p>
                    <p className="lp-order-field">
                      <strong>Teléfono:</strong> {order.recipient_phone || '—'}
                    </p>
                    <p className="lp-order-field">
                      <strong>Ciudad:</strong> {order.recipient_city || '—'}, {order.recipient_region || '—'}
                    </p>
                    <p className="lp-order-field">
                      <strong>Fecha:</strong> {formatDate(order.created_at)}
                    </p>
                    <p className="lp-order-field full">
                      <strong>Dirección:</strong> {order.recipient_address || '—'} {order.recipient_address_complement || ''}
                    </p>
                    {order.recipient_lat && order.recipient_lng && (
                      <p className="lp-order-field full">
                        <a
                          href={`https://www.google.com/maps?q=${order.recipient_lat},${order.recipient_lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="lp-maps-link"
                        >
                          Ver ubicación en Google Maps
                        </a>
                      </p>
                    )}
                  </div>
                </div>

                {/* Acciones */}
                <div className="lp-order-actions">
                  <div>
                    <p className="lp-price-label">Total</p>
                    <p className="lp-price-value">{formatCurrency(order.final_price)}</p>
                  </div>

                  {order.status === 'confirmed' && (
                    <button
                      className="lp-btn pickup"
                      onClick={() => handlePickup(order.order_id)}
                      disabled={isUpdating}
                    >
                      {isUpdating ? 'Procesando...' : 'Confirmar retiro'}
                    </button>
                  )}

                  {order.status === 'processing' && (
                    <button
                      className="lp-btn deliver"
                      onClick={() => handleDeliver(order.order_id)}
                      disabled={isUpdating}
                    >
                      {isUpdating ? 'Procesando...' : 'Confirmar entrega'}
                    </button>
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