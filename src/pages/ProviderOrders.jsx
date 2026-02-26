import React, { useState } from 'react';
import { Package, Eye, CheckCircle, XCircle, Truck, Clock, AlertCircle, Search, Filter } from 'lucide-react';
import OrderDetailsModal from '../components/Orderdetailsmodal';
import '../styles/ProviderOrders.css';

// Mock data de órdenes
const mockOrders = [
  {
    id: 'ORD-001',
    date: '2024-02-24',
    time: '14:30',
    buyer: 'Tienda Central',
    product: {
      name: 'Smart Watch Serie 8 - Pantalla AMOLED 1.96"',
      image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80',
      sku: 'SW-001',
      quantity: 12,
      unitPrice: 45000,
      total: 540000
    },
    status: 'pending', // pending, confirmed, preparing, ready, rejected, completed
    shippingAddress: 'Av. España 1234, Asunción',
    notes: 'Por favor verificar stock antes de confirmar'
  },
  {
    id: 'ORD-002',
    date: '2024-02-24',
    time: '10:15',
    buyer: 'Comercial San Blas',
    product: {
      name: 'Auriculares Inalámbricos Bluetooth 5.0',
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80',
      sku: 'AUD-002',
      quantity: 24,
      unitPrice: 29900,
      total: 717600
    },
    status: 'confirmed',
    shippingAddress: 'Ruta 2 Km 18, Capiatá',
    notes: ''
  },
  {
    id: 'ORD-003',
    date: '2024-02-23',
    time: '16:45',
    buyer: 'Distribuidora Norte',
    product: {
      name: 'Anillo de Luz LED para Streaming - 12"',
      image: 'https://images.unsplash.com/photo-1579389083078-4e7018379f7e?w=400&q=80',
      sku: 'LED-003',
      quantity: 8,
      unitPrice: 35000,
      total: 280000
    },
    status: 'preparing',
    shippingAddress: 'Av. Artigas 890, San Lorenzo',
    notes: 'Urgente - Cliente necesita antes del viernes'
  },
  {
    id: 'ORD-004',
    date: '2024-02-23',
    time: '09:00',
    buyer: 'Mega Store',
    product: {
      name: 'Soporte para Laptop Ajustable',
      image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400&q=80',
      sku: 'LAP-004',
      quantity: 15,
      unitPrice: 24500,
      total: 367500
    },
    status: 'ready',
    shippingAddress: 'Centro Comercial Multiplaza, Asunción',
    notes: ''
  },
  {
    id: 'ORD-005',
    date: '2024-02-22',
    time: '18:20',
    buyer: 'Tech Solutions',
    product: {
      name: 'Mini Proyector Portátil 1080P WiFi',
      image: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=400&q=80',
      sku: 'PRJ-005',
      quantity: 5,
      unitPrice: 89990,
      total: 449950
    },
    status: 'rejected',
    shippingAddress: 'Zona Industrial, Luque',
    notes: ''
  },
  {
    id: 'ORD-006',
    date: '2024-02-22',
    time: '11:30',
    buyer: 'Electro Home',
    product: {
      name: 'Tiras LED RGB 5M Control por App WiFi',
      image: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=400&q=80',
      sku: 'LED-006',
      quantity: 30,
      unitPrice: 19990,
      total: 599700
    },
    status: 'completed',
    shippingAddress: 'Av. Eusebio Ayala 2345, Asunción',
    notes: ''
  }
];

const ProviderOrders = () => {
  const [orders, setOrders] = useState(mockOrders);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Status configuration
  const statusConfig = {
    pending: {
      label: 'Pendiente',
      icon: Clock,
      color: '#d97706',
      bgColor: '#fffbeb'
    },
    confirmed: {
      label: 'Confirmado',
      icon: CheckCircle,
      color: '#2563eb',
      bgColor: '#eff6ff'
    },
    preparing: {
      label: 'Preparando',
      icon: Package,
      color: '#8b5cf6',
      bgColor: '#f5f3ff'
    },
    ready: {
      label: 'Listo para entrega',
      icon: Truck,
      color: '#16a34a',
      bgColor: '#f0fdf4'
    },
    rejected: {
      label: 'Rechazado',
      icon: XCircle,
      color: '#dc2626',
      bgColor: '#fef2f2'
    },
    completed: {
      label: 'Completado',
      icon: CheckCircle,
      color: '#059669',
      bgColor: '#d1fae5'
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-PY', {
      style: 'currency',
      currency: 'PYG',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-PY', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  // Filter orders
  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.buyer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.product.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Calculate statistics
  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    confirmed: orders.filter(o => o.status === 'confirmed').length,
    preparing: orders.filter(o => o.status === 'preparing').length,
    ready: orders.filter(o => o.status === 'ready').length
  };

  const handleViewDetails = (order) => {
    setSelectedOrder(order);
    setShowDetailsModal(true);
  };

  const handleUpdateOrderStatus = (orderId, newStatus) => {
    setOrders(orders.map(order => 
      order.id === orderId ? { ...order, status: newStatus } : order
    ));
    setShowDetailsModal(false);
  };

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
                <p>Administra y procesa las órdenes de tus clientes</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon total">
              <Package size={24} />
            </div>
            <div className="stat-info">
              <span className="stat-label">Total Pedidos</span>
              <span className="stat-value">{stats.total}</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon pending">
              <Clock size={24} />
            </div>
            <div className="stat-info">
              <span className="stat-label">Pendientes</span>
              <span className="stat-value">{stats.pending}</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon preparing">
              <Package size={24} />
            </div>
            <div className="stat-info">
              <span className="stat-label">En Preparación</span>
              <span className="stat-value">{stats.preparing}</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon ready">
              <Truck size={24} />
            </div>
            <div className="stat-info">
              <span className="stat-label">Listos</span>
              <span className="stat-value">{stats.ready}</span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="filters-section">
          <div className="search-box">
            <Search className="search-icon" size={20} />
            <input
              type="text"
              placeholder="Buscar por orden, cliente o producto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <div className="filter-item">
              <Filter size={18} />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">Todos los estados</option>
                <option value="pending">Pendientes</option>
                <option value="confirmed">Confirmados</option>
                <option value="preparing">En Preparación</option>
                <option value="ready">Listos para entrega</option>
                <option value="rejected">Rechazados</option>
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
              <p>Intenta ajustar los filtros de búsqueda</p>
            </div>
          ) : (
            filteredOrders.map(order => {
              const StatusIcon = statusConfig[order.status].icon;
              
              return (
                <div key={order.id} className="order-card">
                  <div className="order-main">
                    {/* Product Image */}
                    <div className="order-image">
                      <img src={order.product.image} alt={order.product.name} />
                    </div>

                    {/* Order Info */}
                    <div className="order-info">
                      <div className="order-header-row">
                        <div className="order-id">
                          <span className="id-label">ORDEN:</span>
                          <span className="id-value">{order.id}</span>
                        </div>
                        <div className="order-date">
                          <span>{formatDate(order.date)}</span>
                          <span className="order-time">{order.time}</span>
                        </div>
                      </div>

                      <h3 className="product-name">{order.product.name}</h3>
                      
                      <div className="order-meta">
                        <div className="meta-item">
                          <span className="meta-label">Cliente:</span>
                          <span className="meta-value">{order.buyer}</span>
                        </div>
                        <div className="meta-item">
                          <span className="meta-label">Cantidad:</span>
                          <span className="meta-value">{order.product.quantity} unidades</span>
                        </div>
                        <div className="meta-item">
                          <span className="meta-label">Total:</span>
                          <span className="meta-value amount">{formatCurrency(order.product.total)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Order Actions */}
                    <div className="order-actions">
                      <div className="status-badge" style={{
                        backgroundColor: statusConfig[order.status].bgColor,
                        color: statusConfig[order.status].color
                      }}>
                        <StatusIcon size={16} />
                        <span>{statusConfig[order.status].label}</span>
                      </div>

                      <button 
                        className="btn-view-details"
                        onClick={() => handleViewDetails(order)}
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

      {/* Order Details Modal */}
      {showDetailsModal && selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => setShowDetailsModal(false)}
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