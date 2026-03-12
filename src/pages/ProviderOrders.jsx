import React, { useState, useEffect } from 'react';
import { Package, Eye, CheckCircle, XCircle, Truck, Clock, Search, Filter } from 'lucide-react';
import { useUser } from '../App';
import { getOrdersBySupplierApi, confirmOrderSupplier, cancelOrderSupplier } from '../services/api';
import OrderDetailsModal from '../components/Orderdetailsmodal';
import '../styles/providerorders.css';

const statusConfig = {
  pending: {
    label: 'Pendiente',
    icon: Clock,
    color: '#d97706',
    bgColor: '#fffbeb'
  },
  confirmed: {
    label: 'Confirmado por Admin',
    icon: CheckCircle,
    color: '#2563eb',
    bgColor: '#eff6ff'
  },
  processing: {
    label: 'En proceso',
    icon: Package,
    color: '#8b5cf6',
    bgColor: '#f5f3ff'
  },
  cancelled: {
    label: 'Cancelado',
    icon: XCircle,
    color: '#dc2626',
    bgColor: '#fef2f2'
  },
  completed: {
    label: 'Completado',
    icon: CheckCircle,
    color: '#059669',
    bgColor: '#d1fae5'
  },
};

const ProviderOrders = () => {
  const { user }                          = useUser();
  const [orders, setOrders]               = useState([]);
  const [loading, setLoading]             = useState(true);
  const [searchTerm, setSearchTerm]       = useState('');
  const [statusFilter, setStatusFilter]   = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal]         = useState(false);

  useEffect(() => {
    if (user?.user_id) fetchOrders();
  }, [user]);

  const fetchOrders = async () => {
    try {
      const data = await getOrdersBySupplierApi(user.user_id);
      setOrders(data || []);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (v) =>
    new Intl.NumberFormat('es-PY', {
      style: 'currency', currency: 'PYG', minimumFractionDigits: 0
    }).format(v);

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '—';
    return new Intl.DateTimeFormat('es-PY', {
      year: 'numeric', month: 'short', day: 'numeric'
    }).format(date);
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      if (newStatus === 'processing') {
        await confirmOrderSupplier(orderId);
      } else if (newStatus === 'cancelled') {
        await cancelOrderSupplier(orderId);
      }
      setOrders(prev =>
        prev.map(o => o.order_id === orderId ? { ...o, status: newStatus } : o)
      );
      setShowModal(false);
    } catch {
      alert('Ocurrió un error. Intentá de nuevo.');
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch =
      String(order.order_id).includes(searchTerm) ||
      (order.recipient_name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total:      orders.length,
    pending:    orders.filter(o => o.status === 'pending').length,
    confirmed:  orders.filter(o => o.status === 'confirmed').length,
    processing: orders.filter(o => o.status === 'processing').length,
    completed:  orders.filter(o => o.status === 'completed').length,
  };

  if (loading) return (
    <div className="provider-orders-page">
      <div className="provider-orders-container">
        <p style={{ color: '#9ca3af', textAlign: 'center', paddingTop: '60px' }}>
          Cargando órdenes...
        </p>
      </div>
    </div>
  );

  return (
    <div className="provider-orders-page">
      <div className="provider-orders-container">

        {/* Header */}
        <div className="provider-orders-header">
          <div className="header-content">
            <div className="header-title">
              <Package size={32} />
              <div>
                <h1>Gestión de Pedidos</h1>
                <p>Administrá y procesá las órdenes de tus clientes</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon total"><Package size={24} /></div>
            <div className="stat-info">
              <span className="stat-label">Total</span>
              <span className="stat-value">{stats.total}</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon pending"><Clock size={24} /></div>
            <div className="stat-info">
              <span className="stat-label">Pendientes</span>
              <span className="stat-value">{stats.pending}</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon preparing"><Package size={24} /></div>
            <div className="stat-info">
              <span className="stat-label">En Proceso</span>
              <span className="stat-value">{stats.processing}</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon ready"><Truck size={24} /></div>
            <div className="stat-info">
              <span className="stat-label">Completados</span>
              <span className="stat-value">{stats.completed}</span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="filters-section">
          <div className="search-box">
            <Search className="search-icon" size={20} />
            <input
              type="text"
              placeholder="Buscar por orden o destinatario..."
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
                <option value="confirmed">Confirmados por Admin</option>
                <option value="processing">En Proceso</option>
                <option value="cancelled">Cancelados</option>
                <option value="completed">Completados</option>
              </select>
            </div>
          </div>
        </div>

        {/* Orders List */}
        <div className="orders-list">
          {filteredOrders.length === 0 ? (
            <div className="empty-state">
              <Package size={64} />
              <h3>No se encontraron pedidos</h3>
              <p>Intentá ajustar los filtros de búsqueda</p>
            </div>
          ) : (
            filteredOrders.map(order => {
              const cfg        = statusConfig[order.status] || statusConfig.pending;
              const StatusIcon = cfg.icon;
              return (
                <div key={order.order_id} className="order-card">
                  <div className="order-main">
                    <div className="order-info">
                      <div className="order-header-row">
                        <div className="order-id">
                          <span className="id-label">ORDEN:</span>
                          <span className="id-value">#{order.order_id}</span>
                        </div>
                        <div className="order-date">
                          <span>{formatDate(order.created_at)}</span>
                        </div>
                      </div>
                      <div className="order-meta">
                        <div className="meta-item">
                          <span className="meta-label">Destinatario:</span>
                          <span className="meta-value">{order.recipient_name || '—'}</span>
                        </div>
                        <div className="meta-item">
                          <span className="meta-label">Ciudad:</span>
                          <span className="meta-value">{order.recipient_city || '—'}</span>
                        </div>
                        <div className="meta-item">
                          <span className="meta-label">Total:</span>
                          <span className="meta-value amount">{formatCurrency(order.final_price)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="order-actions">
                      <div className="status-badge" style={{
                        backgroundColor: cfg.bgColor,
                        color: cfg.color
                      }}>
                        <StatusIcon size={16} />
                        <span>{cfg.label}</span>
                      </div>
                      <button
                        className="btn-view-details"
                        onClick={() => { setSelectedOrder(order); setShowModal(true); }}
                      >
                        <Eye size={18} />
                        <span>Ver Detalles</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {showModal && selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => setShowModal(false)}
          onUpdateStatus={handleUpdateOrderStatus}
          statusConfig={statusConfig}
          formatCurrency={formatCurrency}
          formatDate={formatDate}
        />
      )}
    </div>
  );
};

export default ProviderOrders;