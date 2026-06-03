import React, { useState, useEffect } from 'react';
import { Package, Truck, CheckCircle, Clock, AlertCircle, Search, Filter, Calendar } from 'lucide-react';
import { useUser } from '../App';
import { getOrdersByBuyer } from '../services/api';
import '../styles/transactions.css';

const STATUS_CONFIG = {
  pending:          { label: 'Pendiente de aprobación',      detail: 'El administrador está revisando tu orden',                   icon: Clock,         bg: '#eff6ff', color: '#2563eb' },
  confirmed:        { label: 'Aprobado',                     detail: 'El proveedor fue notificado y va a preparar tu pedido',      icon: CheckCircle,   bg: '#f0fdf4', color: '#16a34a' },
  processing:       { label: 'En preparación',               detail: 'El proveedor está preparando tu pedido',                     icon: Package,       bg: '#faf5ff', color: '#7c3aed' },
  ready_for_pickup: { label: 'Listo para retiro',            detail: 'El paquete está listo y esperando que la logística lo retire', icon: Package,      bg: '#fefce8', color: '#ca8a04' },
  picked_up:        { label: 'Retirado por logística',       detail: 'La logística retiró el paquete del proveedor',               icon: Truck,         bg: '#eff6ff', color: '#2563eb' },
  out_for_delivery: { label: 'En camino',                    detail: 'El paquete está siendo entregado al destinatario',           icon: Truck,         bg: '#fff7ed', color: '#d97706' },
  redelivery:       { label: 'Reagendado',                   detail: 'No se pudo entregar — se va a reintentar',                   icon: AlertCircle,   bg: '#fff7ed', color: '#f97316' },
  completed:        { label: 'Entregado',                    detail: 'El pedido fue entregado exitosamente',                       icon: CheckCircle,   bg: '#f0fdf4', color: '#16a34a' },
  cancelled:        { label: 'Cancelado',                    detail: 'Esta orden fue cancelada',                                   icon: AlertCircle,   bg: '#fef2f2', color: '#dc2626' },
};

const Transactions = () => {
  const { user } = useUser();
  const [orders, setOrders]             = useState([]);
  const [loading, setLoading]           = useState(true);
  const [searchTerm, setSearchTerm]     = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter]     = useState('all');

  useEffect(() => {
    if (!user?.user_id) return;
    getOrdersByBuyer(user.user_id)
      .then(data => setOrders(data || []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [user]);

  const formatCurrency = (v) =>
    new Intl.NumberFormat('es-PY', { style: 'currency', currency: 'PYG', minimumFractionDigits: 0 }).format(v || 0);

  const formatDate = (d) => {
    if (!d) return '—';
    const date = new Date(d);
    if (isNaN(date.getTime())) return '—';
    return new Intl.DateTimeFormat('es-PY', { year: 'numeric', month: 'short', day: 'numeric' }).format(date);
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
              <div>
                <h1>Mis Transacciones</h1>
                <p>Historial de pedidos y envíos</p>
              </div>
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
                <option value="pending">Pendiente de aprobación</option>
                <option value="confirmed">Aprobado</option>
                <option value="processing">En preparación</option>
                <option value="ready_for_pickup">Listo para retiro</option>
                <option value="picked_up">Retirado por logística</option>
                <option value="out_for_delivery">En camino</option>
                <option value="redelivery">Reagendado</option>
                <option value="completed">Entregado</option>
                <option value="cancelled">Cancelado</option>
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

            return (
              <div key={order.order_id} className="transaction-card">
                <div className="transaction-main">
                  <div className="transaction-info">
                    <div className="transaction-id">
                      <span className="id-label">Orden</span>
                      <span className="id-value">#{order.order_id}</span>
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

                <div className="transaction-footer">
                  <div className="status-badge" style={{ backgroundColor: cfg.bg, color: cfg.color }}>
                    <StatusIcon size={15} />
                    <span style={{ fontWeight: '700' }}>{cfg.label}</span>
                  </div>
                  <span style={{ fontSize: '12px', color: '#6b7280' }}>{cfg.detail}</span>
                  {order.redelivery_reason && (
                    <span style={{ fontSize: '12px', color: '#f97316', fontWeight: '600' }}>
                      Motivo: {order.redelivery_reason}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {filteredOrders.length > 0 && (
          <div className="transactions-summary">
            <div className="summary-item">
              <span>Total mostrado:</span>
              <strong>{filteredOrders.length} transacciones</strong>
            </div>
            <div className="summary-item">
              <span>Monto total:</span>
              <strong className="total-amount">{formatCurrency(filteredOrders.reduce((s, o) => s + parseFloat(o.final_price || 0), 0))}</strong>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Transactions;