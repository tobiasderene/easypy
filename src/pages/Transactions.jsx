import React, { useState, useEffect } from 'react';
import { Package, Truck, CheckCircle, Clock, AlertCircle, Search, Filter, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { useUser } from '../App';
import { getOrdersByBuyer, getOrderHistory, getClaims, getLogistics, submitRedeliveryNote } from '../services/api';
import '../styles/transactions.css';

const STATUS_CONFIG = {
  pending:          { label: 'Pendiente de aprobación',       detail: 'El administrador está revisando tu orden',                    icon: Clock,        bg: '#eff6ff', color: '#2563eb' },
  confirmed:        { label: 'Aprobado',                      detail: 'El proveedor fue notificado y va a preparar tu pedido',       icon: CheckCircle,  bg: '#f0fdf4', color: '#16a34a' },
  processing:       { label: 'En preparación',                detail: 'El proveedor está preparando tu pedido',                      icon: Package,      bg: '#faf5ff', color: '#7c3aed' },
  ready_for_pickup: { label: 'Listo para retiro',             detail: 'Esperando que la logística retire el paquete',                icon: Package,      bg: '#fefce8', color: '#ca8a04' },
  picked_up:        { label: 'Retirado por logística',        detail: 'La logística ya retiró el paquete',                          icon: Truck,        bg: '#eff6ff', color: '#2563eb' },
  out_for_delivery: { label: 'En camino',                     detail: 'El paquete está siendo entregado al destinatario',           icon: Truck,        bg: '#fff7ed', color: '#d97706' },
  redelivery:       { label: 'Reagendado',                    detail: 'No se pudo entregar',                   icon: AlertCircle,  bg: '#fff7ed', color: '#f97316' },
  completed:        { label: 'Entregado ✓',                   detail: 'El pedido fue entregado exitosamente',                       icon: CheckCircle,  bg: '#f0fdf4', color: '#16a34a' },
  cancelled:        { label: 'Cancelado',                     detail: 'Esta orden fue cancelada',                                   icon: AlertCircle,  bg: '#fef2f2', color: '#dc2626' },
  return_in_progress:{ label: 'Devolución en curso',          detail: 'El producto está siendo devuelto al proveedor',              icon: AlertCircle,  bg: '#fef2f2', color: '#dc2626' },
};

const STATUS_STEP_ORDER = ['pending','confirmed','processing','ready_for_pickup','picked_up','out_for_delivery','completed'];

const Transactions = () => {
  const { user } = useUser();
  const [orders, setOrders]             = useState([]);
  const [loading, setLoading]           = useState(true);
  const [searchTerm, setSearchTerm]     = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter]     = useState('all');
  const [expanded, setExpanded]         = useState(null);
  const [histories, setHistories]       = useState({});
  const [claims, setClaims]             = useState([]);
  const [logisticsMap, setLogisticsMap] = useState({});
  const [redeliveryNotes, setRedeliveryNotes] = useState({}); // { order_id: note text }
  const [submittingNote, setSubmittingNote]   = useState(null);

  useEffect(() => {
    if (!user?.user_id) return;
    Promise.all([
      getOrdersByBuyer(user.user_id),
      getClaims().catch(() => []),
      getLogistics().catch(() => []),
    ])
      .then(([ords, cls, logs]) => {
        setOrders(ords || []);
        setClaims(cls || []);
        const map = {};
        (logs || []).forEach(l => { map[l.logistic_id] = l; });
        setLogisticsMap(map);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const toggleExpand = async (orderId) => {
    if (expanded === orderId) { setExpanded(null); return; }
    setExpanded(orderId);
    if (!histories[orderId]) {
      try {
        const h = await getOrderHistory(orderId);
        setHistories(prev => ({ ...prev, [orderId]: h || [] }));
      } catch { setHistories(prev => ({ ...prev, [orderId]: [] })); }
    }
  };

  const formatCurrency = (v) =>
    new Intl.NumberFormat('es-PY', { style: 'currency', currency: 'PYG', minimumFractionDigits: 0 }).format(v || 0);

  const formatDate = (d) => {
    if (!d) return '—';
    const date = new Date(d);
    if (isNaN(date.getTime())) return '—';
    return new Intl.DateTimeFormat('es-PY', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(date);
  };

  const formatDateShort = (d) => {
    if (!d) return '—';
    const date = new Date(d);
    if (isNaN(date.getTime())) return '—';
    return new Intl.DateTimeFormat('es-PY', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(date);
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch =
      String(order.order_id).includes(searchTerm) ||
      (order.recipient_name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    let matchesDate = true;
    if (dateFilter !== 'all' && order.created_at) {
      const days = Math.floor((new Date() - new Date(order.created_at)) / 86400000);
      if (dateFilter === 'today') matchesDate = days === 0;
      if (dateFilter === 'week')  matchesDate = days <= 7;
      if (dateFilter === 'month') matchesDate = days <= 30;
    }
    return matchesSearch && matchesStatus && matchesDate;
  });

  const active = ['confirmed','processing','ready_for_pickup','picked_up','out_for_delivery','redelivery'];
  const stats = {
    total:     orders.length,
    active:    orders.filter(o => active.includes(o.status)).length,
    completed: orders.filter(o => o.status === 'completed').length,
    pending:   orders.filter(o => o.status === 'pending').length,
  };

  return (
    <div className="transactions-page">
      <div className="transactions-container">

        <div className="transactions-header">
          <div className="header-content">
            <div className="header-title">
              <Package size={32} />
              <div><h1>Mis Transacciones</h1><p>Historial de pedidos y envíos</p></div>
            </div>
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon total"><Package size={24} /></div>
            <div className="stat-info"><span className="stat-label">Total</span><span className="stat-value">{stats.total}</span></div>
          </div>
          <div className="stat-card">
            <div className="stat-icon warning"><Truck size={24} /></div>
            <div className="stat-info"><span className="stat-label">En curso</span><span className="stat-value">{stats.active}</span></div>
          </div>
          <div className="stat-card">
            <div className="stat-icon success"><CheckCircle size={24} /></div>
            <div className="stat-info"><span className="stat-label">Completados</span><span className="stat-value">{stats.completed}</span></div>
          </div>
          <div className="stat-card">
            <div className="stat-icon info"><Clock size={24} /></div>
            <div className="stat-info"><span className="stat-label">Pendientes</span><span className="stat-value">{stats.pending}</span></div>
          </div>
        </div>

        <div className="filters-section">
          <div className="search-box">
            <Search className="search-icon" size={20} />
            <input type="text" placeholder="Buscar por ID o destinatario..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
          <div className="filter-group">
            <div className="filter-item">
              <Filter size={18} />
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="all">Todos los estados</option>
                <option value="pending">Pendiente aprobación</option>
                <option value="confirmed">Aprobado</option>
                <option value="processing">En preparación</option>
                <option value="ready_for_pickup">Listo para retiro</option>
                <option value="picked_up">Retirado por logística</option>
                <option value="out_for_delivery">En camino</option>
                <option value="redelivery">Reagendado</option>
                <option value="completed">Entregado</option>
                <option value="cancelled">Cancelado</option>
                <option value="return_in_progress">Devolución</option>
              </select>
            </div>
            <div className="filter-item">
              <Calendar size={18} />
              <select value={dateFilter} onChange={e => setDateFilter(e.target.value)}>
                <option value="all">Todas las fechas</option>
                <option value="today">Hoy</option>
                <option value="week">Última semana</option>
                <option value="month">Último mes</option>
              </select>
            </div>
          </div>
        </div>

        <div className="transactions-list">
          {loading ? (
            <div className="empty-state"><p style={{ color: '#9ca3af' }}>Cargando transacciones...</p></div>
          ) : filteredOrders.length === 0 ? (
            <div className="empty-state"><Package size={64} /><h3>No se encontraron transacciones</h3><p>Intentá ajustar los filtros</p></div>
          ) : filteredOrders.map(order => {
            const cfg        = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
            const StatusIcon = cfg.icon;
            const isExpanded = expanded === order.order_id;
            const logistic   = logisticsMap[order.logistic_id];
            const orderClaims = claims.filter(c => c.order_id === order.order_id);
            const hasClaim   = orderClaims.length > 0;
            const currentStep = STATUS_STEP_ORDER.indexOf(order.status);

            return (
              <div key={order.order_id} className="transaction-card" style={{ cursor: 'pointer' }} onClick={() => toggleExpand(order.order_id)}>

                {/* Header */}
                <div className="transaction-main">
                  <div className="transaction-info">
                    <div className="transaction-id">
                      <span className="id-label">Orden</span>
                      <span className="id-value">#{order.order_id}</span>
                      {hasClaim && <span style={{ fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '100px', background: '#fef2f2', color: '#dc2626', marginLeft: '8px' }}>Reclamo abierto</span>}
                    </div>
                    <div className="order-items-row">
                      {order.items?.map((item, idx) => (
                        <span key={item.item_id} className="order-item-chip">
                          {item.product_name || `Producto #${item.product_id}`}
                          {item.quantity > 1 && ` ×${item.quantity}`}
                          {idx < order.items.length - 1 && ','}
                        </span>
                      ))}
                    </div>
                    {order.recipient_name && (
                      <div className="provider-info">
                        <Truck size={14} />
                        <span>{order.recipient_name} — {order.recipient_city}</span>
                      </div>
                    )}
                    {/* Transportadora y guía */}
                    {logistic && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '12px', color: '#6b7280' }}>{logistic.name}</span>
                        {order.tracking_number && (
                          <span style={{ fontSize: '12px', fontWeight: '700', color: '#056EB7', background: '#eff6ff', padding: '2px 8px', borderRadius: '6px' }}>
                            Guía: {order.tracking_number}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="transaction-details">
                    <div className="detail-item">
                      <span className="detail-label">Fecha</span>
                      <span className="detail-value">{formatDate(order.created_at)}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Total a recaudar</span>
                      <span className="detail-value amount">{formatCurrency(order.final_price)}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Ganancia estimada</span>
                      <span className="detail-value" style={{ color: '#16a34a', fontWeight: '700' }}>{formatCurrency(order.buyer_profit)}</span>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="transaction-footer">
                  <div className="status-badge" style={{ backgroundColor: cfg.bg, color: cfg.color }}>
                    <StatusIcon size={15} />
                    <span style={{ fontWeight: '700' }}>{cfg.label}</span>
                  </div>
                  <span style={{ fontSize: '12px', color: '#6b7280', flex: 1 }}>{cfg.detail}</span>
                  {order.redelivery_reason && (
                    <span style={{ fontSize: '12px', color: '#f97316', fontWeight: '600' }}>Motivo: {order.redelivery_reason}</span>
                  )}
                  <span style={{ color: '#9ca3af', marginLeft: 'auto' }}>
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </span>
                </div>

                {/* Detalle expandido */}
                {isExpanded && (
                  <div style={{ borderTop: '1.5px solid #f3f4f6', padding: '16px', background: '#fafafa' }} onClick={e => e.stopPropagation()}>

                    {/* Barra de progreso */}
                    {order.status !== 'cancelled' && order.status !== 'return_in_progress' && (
                      <div style={{ marginBottom: '16px' }}>
                        <p style={{ fontSize: '11px', fontWeight: '700', color: '#6b7280', marginBottom: '8px', textTransform: 'uppercase' }}>Progreso del envío</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0' }}>
                          {STATUS_STEP_ORDER.map((step, i) => {
                            const done    = i <= currentStep;
                            const current = i === currentStep;
                            const cfg2    = STATUS_CONFIG[step];
                            return (
                              <React.Fragment key={step}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: done ? '#056EB7' : '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', border: current ? '3px solid #056EB7' : 'none', boxShadow: current ? '0 0 0 3px #bfdbfe' : 'none' }}>
                                    {done ? <CheckCircle size={14} color="white" /> : <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#d1d5db' }} />}
                                  </div>
                                  <span style={{ fontSize: '9px', color: done ? '#056EB7' : '#9ca3af', fontWeight: done ? '700' : '400', textAlign: 'center', marginTop: '3px', maxWidth: '56px' }}>
                                    {cfg2?.label?.split(' ')[0]}
                                  </span>
                                </div>
                                {i < STATUS_STEP_ORDER.length - 1 && (
                                  <div style={{ flex: 1, height: '2px', background: i < currentStep ? '#056EB7' : '#e5e7eb', margin: '0 2px', marginBottom: '16px' }} />
                                )}
                              </React.Fragment>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Historial de estados */}
                    <div style={{ marginBottom: '12px' }}>
                      <p style={{ fontSize: '11px', fontWeight: '700', color: '#6b7280', marginBottom: '8px', textTransform: 'uppercase' }}>Historial de estados</p>
                      {!histories[order.order_id] ? (
                        <p style={{ fontSize: '12px', color: '#9ca3af' }}>Cargando...</p>
                      ) : histories[order.order_id].length === 0 ? (
                        <p style={{ fontSize: '12px', color: '#9ca3af' }}>Sin historial registrado</p>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {histories[order.order_id].map((h, i) => {
                            const newCfg = STATUS_CONFIG[h.new_status];
                            return (
                              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                                <span style={{ color: '#9ca3af', minWidth: '100px' }}>{formatDateShort(h.created_at)}</span>
                                <span style={{ padding: '1px 8px', borderRadius: '100px', fontSize: '11px', fontWeight: '700', background: newCfg?.bg || '#f3f4f6', color: newCfg?.color || '#6b7280' }}>
                                  {newCfg?.label || h.new_status}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Reclamos */}
                    {hasClaim && (
                      <div style={{ background: '#fef2f2', border: '1.5px solid #fecaca', borderRadius: '8px', padding: '12px', marginBottom: '12px' }}>
                        <p style={{ fontSize: '12px', fontWeight: '700', color: '#dc2626', marginBottom: '6px' }}>Reclamos de garantía</p>
                        {orderClaims.map(c => (
                          <div key={c.claim_id}>
                            <p style={{ fontSize: '12px', color: '#374151' }}>{c.reason}</p>
                            {c.resolution && <p style={{ fontSize: '12px', color: '#16a34a', marginTop: '4px', fontWeight: '600' }}>Resolución: {c.resolution}</p>}
                            <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>Estado: {c.status} · Vence: {formatDateShort(c.expires_at)}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Si está reagendado — panel de respuesta del vendedor */}
                    {order.status === 'redelivery' && (
                      <div style={{ background: '#fff7ed', border: '1.5px solid #fed7aa', borderRadius: '10px', padding: '14px' }}>
                        <p style={{ fontSize: '13px', fontWeight: '800', color: '#d97706', marginBottom: '4px' }}>Envío no entregado</p>
                        <p style={{ fontSize: '12px', color: '#374151', marginBottom: '2px' }}>
                          Motivo logística: <strong>{order.redelivery_reason || '—'}</strong>
                        </p>
                        <p style={{ fontSize: '12px', color: '#374151', marginBottom: '10px' }}>
                          Cliente: {order.recipient_name} · {order.recipient_phone}
                          {order.recipient_phone && (
                            <a href={`https://wa.me/${order.recipient_phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
                              style={{ marginLeft: '8px', color: '#16a34a', fontWeight: '700' }}>WhatsApp</a>
                          )}
                        </p>

                        {order.redelivery_requested ? (
                          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '10px' }}>
                            <p style={{ fontSize: '12px', color: '#16a34a', fontWeight: '700' }}>✓ Reenvío solicitado — esperando que la logística lo procese</p>
                            {order.redelivery_note && <p style={{ fontSize: '12px', color: '#374151', marginTop: '4px' }}>Tu nota: {order.redelivery_note}</p>}
                          </div>
                        ) : (
                          <>
                            <p style={{ fontSize: '12px', fontWeight: '700', color: '#374151', marginBottom: '6px' }}>
                              Escribí una observación para la reentrega:
                            </p>
                            <textarea
                              value={redeliveryNotes[order.order_id] || ''}
                              onChange={e => setRedeliveryNotes(prev => ({ ...prev, [order.order_id]: e.target.value }))}
                              placeholder="Ej: El cliente estará disponible después de las 15hs en la misma dirección..."
                              rows={3}
                              style={{ width: '100%', padding: '8px 10px', border: '1.5px solid #fed7aa', borderRadius: '8px', fontSize: '12px', marginBottom: '10px', boxSizing: 'border-box', resize: 'vertical' }}
                            />
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button
                                disabled={submittingNote === order.order_id || !redeliveryNotes[order.order_id]?.trim()}
                                onClick={async () => {
                                  setSubmittingNote(order.order_id);
                                  try {
                                    await submitRedeliveryNote(order.order_id, redeliveryNotes[order.order_id], 'retry');
                                    setOrders(prev => prev.map(o => o.order_id === order.order_id ? { ...o, redelivery_requested: true, redelivery_note: redeliveryNotes[order.order_id] } : o));
                                  } catch (e) { alert(e.message || 'Error'); }
                                  finally { setSubmittingNote(null); }
                                }}
                                style={{ flex: 2, padding: '9px', background: '#056EB7', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}>
                                {submittingNote === order.order_id ? 'Procesando...' : '🔄 Solicitar reenvío'}
                              </button>
                              <button
                                disabled={submittingNote === order.order_id || !redeliveryNotes[order.order_id]?.trim()}
                                onClick={async () => {
                                  if (!window.confirm('¿Cancelás el pedido? Se descontarán los costos logísticos de tu wallet.')) return;
                                  setSubmittingNote(order.order_id);
                                  try {
                                    await submitRedeliveryNote(order.order_id, redeliveryNotes[order.order_id], 'cancel');
                                    setOrders(prev => prev.map(o => o.order_id === order.order_id ? { ...o, status: 'cancelled' } : o));
                                  } catch (e) { alert(e.message || 'Error'); }
                                  finally { setSubmittingNote(null); }
                                }}
                                style={{ flex: 1, padding: '9px', background: '#fef2f2', color: '#dc2626', border: '1.5px solid #fecaca', borderRadius: '8px', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}>
                                Cancelar pedido
                              </button>
                            </div>
                            <p style={{ fontSize: '10px', color: '#9ca3af', marginTop: '6px' }}>Al cancelar se descontarán los costos logísticos (${order.logistic_cost ? new Intl.NumberFormat('es-PY',{style:'currency',currency:'PYG',minimumFractionDigits:0}).format(order.logistic_cost) : '—'}) de tu wallet.</p>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {filteredOrders.length > 0 && (
          <div className="transactions-summary">
            <div className="summary-item"><span>Total mostrado:</span><strong>{filteredOrders.length} transacciones</strong></div>
            <div className="summary-item"><span>Monto total:</span><strong className="total-amount">{formatCurrency(filteredOrders.reduce((s, o) => s + parseFloat(o.final_price || 0), 0))}</strong></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Transactions;
