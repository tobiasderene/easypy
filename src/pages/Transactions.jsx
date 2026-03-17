import React, { useState, useEffect } from 'react';
import { Package, Truck, CheckCircle, Clock, AlertCircle, Search, Filter, Calendar } from 'lucide-react';
import { useUser } from '../App';
import { getOrdersByBuyer } from '../services/api';
import '../styles/transactions.css';

const statusConfig = {
  pending: {
    label: 'Pendiente',
    icon: Clock,
    bgColor: '#eff6ff',
    textColor: '#2563eb'
  },
  confirmed: {
    label: 'Confirmado',
    icon: CheckCircle,
    bgColor: '#f0fdf4',
    textColor: '#16a34a'
  },
  processing: {
    label: 'En proceso',
    icon: Truck,
    bgColor: '#fffbeb',
    textColor: '#d97706'
  },
  completed: {
    label: 'Completado',
    icon: CheckCircle,
    bgColor: '#f0fdf4',
    textColor: '#16a34a'
  },
  cancelled: {
    label: 'Cancelado',
    icon: AlertCircle,
    bgColor: '#fef2f2',
    textColor: '#dc2626'
  },
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

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('es-PY', { style: 'currency', currency: 'PYG', minimumFractionDigits: 0 }).format(amount || 0);

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '—';
    return new Intl.DateTimeFormat('es-PY', { year: 'numeric', month: 'short', day: 'numeric' }).format(date);
  };

  const filteredOrders = orders.filter(order => {
    const itemNames = order.items?.map(i => `producto #${i.product_id}`).join(' ') || '';
    const matchesSearch =
      String(order.order_id).includes(searchTerm) ||
      itemNames.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

    let matchesDate = true;
    if (dateFilter !== 'all') {
      const orderDate = order.created_at ? new Date(order.created_at) : null;
      if (!orderDate || isNaN(orderDate.getTime())) {
        matchesDate = true;
      } else {
        const daysDiff = Math.floor((new Date() - orderDate) / (1000 * 60 * 60 * 24));
        if (dateFilter === 'today') matchesDate = daysDiff === 0;
        if (dateFilter === 'week')  matchesDate = daysDiff <= 7;
        if (dateFilter === 'month') matchesDate = daysDiff <= 30;
      }
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  const stats = {
    total:      orders.length,
    confirmed:  orders.filter(o => o.status === 'confirmed').length,
    processing: orders.filter(o => o.status === 'processing').length,
    pending:    orders.filter(o => o.status === 'pending').length,
  };

  return (
    <div className="transactions-page">
      <div className="transactions-container">

        {/* Header */}
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

        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon total"><Package size={24} /></div>
            <div className="stat-info">
              <span className="stat-label">Total Pedidos</span>
              <span className="stat-value">{stats.total}</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon success"><CheckCircle size={24} /></div>
            <div className="stat-info">
              <span className="stat-label">Confirmados</span>
              <span className="stat-value">{stats.confirmed}</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon warning"><Truck size={24} /></div>
            <div className="stat-info">
              <span className="stat-label">En Proceso</span>
              <span className="stat-value">{stats.processing}</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon info"><Clock size={24} /></div>
            <div className="stat-info">
              <span className="stat-label">Pendientes</span>
              <span className="stat-value">{stats.pending}</span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="filters-section">
          <div className="search-box">
            <Search className="search-icon" size={20} />
            <input
              type="text"
              placeholder="Buscar por ID o producto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="filter-group">
            <div className="filter-item">
              <Filter size={18} />
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">Todos los estados</option>
                <option value="pending">Pendientes</option>
                <option value="confirmed">Confirmados</option>
                <option value="processing">En proceso</option>
                <option value="completed">Completados</option>
                <option value="cancelled">Cancelados</option>
              </select>
            </div>
            <div className="filter-item">
              <Calendar size={18} />
              <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}>
                <option value="all">Todas las fechas</option>
                <option value="today">Hoy</option>
                <option value="week">Última semana</option>
                <option value="month">Último mes</option>
              </select>
            </div>
          </div>
        </div>

        {/* List */}
        <div className="transactions-list">
          {loading ? (
            <div className="empty-state">
              <p style={{ color: '#9ca3af' }}>Cargando transacciones...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="empty-state">
              <Package size={64} />
              <h3>No se encontraron transacciones</h3>
              <p>Intentá ajustar los filtros de búsqueda</p>
            </div>
          ) : (
            filteredOrders.map(order => {
              const cfg        = statusConfig[order.status] || statusConfig.pending;
              const StatusIcon = cfg.icon;
              const itemCount  = order.items?.reduce((s, i) => s + i.quantity, 0) || 0;

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
                            Producto #{item.product_id}
                            {item.quantity > 1 && ` ×${item.quantity}`}
                            {idx < order.items.length - 1 && ','}
                          </span>
                        ))}
                      </div>

                      <div className="provider-info">
                        <Package size={14} />
                        <span>Proveedor #{order.supplier_id}</span>
                      </div>
                    </div>

                    <div className="transaction-details">
                      <div className="detail-item">
                        <span className="detail-label">Fecha</span>
                        <span className="detail-value">{formatDate(order.created_at)}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Precio final</span>
                        <span className="detail-value amount">{formatCurrency(order.final_price)}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Ganancia</span>
                        <span className="detail-value" style={{ color: '#16a34a' }}>{formatCurrency(order.buyer_profit)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="transaction-footer">
                    <div className="status-badge" style={{ backgroundColor: cfg.bgColor, color: cfg.textColor }}>
                      <StatusIcon size={15} />
                      <span>{cfg.label}</span>
                    </div>
                    {order.recipient_name && (
                      <div className="tracking-info">
                        <Truck size={15} />
                        <span>{order.recipient_name} — {order.recipient_city}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Summary */}
        {filteredOrders.length > 0 && (
          <div className="transactions-summary">
            <div className="summary-item">
              <span>Total mostrado:</span>
              <strong>{filteredOrders.length} transacciones</strong>
            </div>
            <div className="summary-item">
              <span>Monto total:</span>
              <strong className="total-amount">
                {formatCurrency(filteredOrders.reduce((s, o) => s + parseFloat(o.final_price || 0), 0))}
              </strong>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Transactions;