import React, { useState } from 'react';
import { Package, Truck, CheckCircle, Clock, AlertCircle, Search, Filter, Calendar } from 'lucide-react';
import '../styles/transactions.css';

// Mock data de transacciones
const mockTransactions = [
  {
    id: 'TRX-001',
    date: '2024-02-20',
    product: 'Coca Cola 2.5L',
    provider: 'Distribuidora Central',
    quantity: 24,
    total: 720000,
    status: 'delivered', // delivered, in_transit, pending, cancelled
    trackingNumber: 'PY123456789'
  },
  {
    id: 'TRX-002',
    date: '2024-02-21',
    product: 'Arroz Molino 1kg',
    provider: 'Agrocomercial San Juan',
    quantity: 50,
    total: 250000,
    status: 'in_transit',
    trackingNumber: 'PY987654321'
  },
  {
    id: 'TRX-003',
    date: '2024-02-22',
    product: 'Aceite Cocinero 900ml',
    provider: 'Distribuidora Central',
    quantity: 12,
    total: 180000,
    status: 'pending',
    trackingNumber: '-'
  },
  {
    id: 'TRX-004',
    date: '2024-02-19',
    product: 'Azúcar Iporá 1kg',
    provider: 'Mayorista Del Sur',
    quantity: 30,
    total: 150000,
    status: 'delivered',
    trackingNumber: 'PY456789123'
  },
  {
    id: 'TRX-005',
    date: '2024-02-18',
    product: 'Fideos Don Victorio 500g',
    provider: 'Agrocomercial San Juan',
    quantity: 36,
    total: 108000,
    status: 'delivered',
    trackingNumber: 'PY789123456'
  },
  {
    id: 'TRX-006',
    date: '2024-02-23',
    product: 'Leche La Vaquita 1L',
    provider: 'Lácteos del Este',
    quantity: 48,
    total: 336000,
    status: 'in_transit',
    trackingNumber: 'PY321654987'
  },
  {
    id: 'TRX-007',
    date: '2024-02-17',
    product: 'Pan Lactal Bimbo',
    provider: 'Distribuidora Central',
    quantity: 20,
    total: 140000,
    status: 'cancelled',
    trackingNumber: '-'
  },
  {
    id: 'TRX-008',
    date: '2024-02-23',
    product: 'Yerba Selecta 1kg',
    provider: 'Mayorista Del Sur',
    quantity: 15,
    total: 225000,
    status: 'pending',
    trackingNumber: '-'
  }
];

const Transactions = () => {
  const [transactions, setTransactions] = useState(mockTransactions);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  // Status configuration
  const statusConfig = {
    delivered: {
      label: 'Entregado',
      icon: CheckCircle,
      color: 'success',
      bgColor: '#f0fdf4',
      textColor: '#16a34a'
    },
    in_transit: {
      label: 'En tránsito',
      icon: Truck,
      color: 'warning',
      bgColor: '#fffbeb',
      textColor: '#d97706'
    },
    pending: {
      label: 'Pendiente',
      icon: Clock,
      color: 'info',
      bgColor: '#eff6ff',
      textColor: '#2563eb'
    },
    cancelled: {
      label: 'Cancelado',
      icon: AlertCircle,
      color: 'danger',
      bgColor: '#fef2f2',
      textColor: '#dc2626'
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

  // Filter transactions
  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = 
      transaction.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.provider.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || transaction.status === statusFilter;
    
    let matchesDate = true;
    if (dateFilter !== 'all') {
      const transactionDate = new Date(transaction.date);
      const today = new Date();
      const daysDiff = Math.floor((today - transactionDate) / (1000 * 60 * 60 * 24));
      
      if (dateFilter === 'today') matchesDate = daysDiff === 0;
      if (dateFilter === 'week') matchesDate = daysDiff <= 7;
      if (dateFilter === 'month') matchesDate = daysDiff <= 30;
    }
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  // Calculate statistics
  const stats = {
    total: transactions.length,
    delivered: transactions.filter(t => t.status === 'delivered').length,
    inTransit: transactions.filter(t => t.status === 'in_transit').length,
    pending: transactions.filter(t => t.status === 'pending').length,
    totalAmount: transactions.reduce((sum, t) => sum + t.total, 0)
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
            <div className="stat-icon success">
              <CheckCircle size={24} />
            </div>
            <div className="stat-info">
              <span className="stat-label">Entregados</span>
              <span className="stat-value">{stats.delivered}</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon warning">
              <Truck size={24} />
            </div>
            <div className="stat-info">
              <span className="stat-label">En Tránsito</span>
              <span className="stat-value">{stats.inTransit}</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon info">
              <Clock size={24} />
            </div>
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
              placeholder="Buscar por producto, proveedor o ID..."
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
                <option value="delivered">Entregados</option>
                <option value="in_transit">En tránsito</option>
                <option value="pending">Pendientes</option>
                <option value="cancelled">Cancelados</option>
              </select>
            </div>

            <div className="filter-item">
              <Calendar size={18} />
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              >
                <option value="all">Todas las fechas</option>
                <option value="today">Hoy</option>
                <option value="week">Última semana</option>
                <option value="month">Último mes</option>
              </select>
            </div>
          </div>
        </div>

        {/* Transactions List */}
        <div className="transactions-list">
          {filteredTransactions.length === 0 ? (
            <div className="empty-state">
              <Package size={64} />
              <h3>No se encontraron transacciones</h3>
              <p>Intenta ajustar los filtros de búsqueda</p>
            </div>
          ) : (
            filteredTransactions.map(transaction => {
              const StatusIcon = statusConfig[transaction.status].icon;
              
              return (
                <div key={transaction.id} className="transaction-card">
                  <div className="transaction-main">
                    <div className="transaction-info">
                      <div className="transaction-id">
                        <span className="id-label">ID:</span>
                        <span className="id-value">{transaction.id}</span>
                      </div>
                      <h3 className="product-name">{transaction.product}</h3>
                      <div className="provider-info">
                        <Package size={16} />
                        <span>{transaction.provider}</span>
                      </div>
                    </div>

                    <div className="transaction-details">
                      <div className="detail-item">
                        <span className="detail-label">Fecha</span>
                        <span className="detail-value">{formatDate(transaction.date)}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Cantidad</span>
                        <span className="detail-value">{transaction.quantity} unidades</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Total</span>
                        <span className="detail-value amount">{formatCurrency(transaction.total)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="transaction-footer">
                    <div className="status-badge" style={{
                      backgroundColor: statusConfig[transaction.status].bgColor,
                      color: statusConfig[transaction.status].textColor
                    }}>
                      <StatusIcon size={16} />
                      <span>{statusConfig[transaction.status].label}</span>
                    </div>

                    {transaction.trackingNumber !== '-' && (
                      <div className="tracking-info">
                        <Truck size={16} />
                        <span>Tracking: {transaction.trackingNumber}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Summary Footer */}
        {filteredTransactions.length > 0 && (
          <div className="transactions-summary">
            <div className="summary-item">
              <span>Total mostrado:</span>
              <strong>{filteredTransactions.length} transacciones</strong>
            </div>
            <div className="summary-item">
              <span>Monto total:</span>
              <strong className="total-amount">
                {formatCurrency(filteredTransactions.reduce((sum, t) => sum + t.total, 0))}
              </strong>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Transactions;