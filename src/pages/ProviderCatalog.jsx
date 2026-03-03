import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, TrendingUp, Edit, Trash2, Plus, Search, Filter, Eye, EyeOff } from 'lucide-react';
import '../styles/providercatalog.css';

// Mock data de productos del proveedor
const mockProducts = [
  {
    id: 1,
    name: 'Smart Watch Serie 8 - Pantalla AMOLED 1.96"',
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80',
    sku: 'SW-001',
    price: 45000,
    stock: 156,
    unitsSold: 342,
    revenue: 15390000,
    status: 'active', // active, inactive
    category: 'electronics'
  },
  {
    id: 2,
    name: 'Auriculares Inalámbricos Bluetooth 5.0',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80',
    sku: 'AUD-002',
    price: 29900,
    stock: 234,
    unitsSold: 567,
    revenue: 16953300,
    status: 'active',
    category: 'electronics'
  },
  {
    id: 3,
    name: 'Anillo de Luz LED para Streaming - 12"',
    image: 'https://images.unsplash.com/photo-1579389083078-4e7018379f7e?w=400&q=80',
    sku: 'LED-003',
    price: 35000,
    stock: 89,
    unitsSold: 178,
    revenue: 6230000,
    status: 'active',
    category: 'electronics'
  },
  {
    id: 4,
    name: 'Soporte para Laptop Ajustable de Aluminio',
    image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400&q=80',
    sku: 'LAP-004',
    price: 24500,
    stock: 0,
    unitsSold: 423,
    revenue: 10363500,
    status: 'inactive',
    category: 'office'
  },
  {
    id: 5,
    name: 'Mini Proyector Portátil 1080P WiFi',
    image: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=400&q=80',
    sku: 'PRJ-005',
    price: 89990,
    stock: 45,
    unitsSold: 89,
    revenue: 8009110,
    status: 'active',
    category: 'electronics'
  },
  {
    id: 6,
    name: 'Tiras LED RGB 5M Control por App WiFi',
    image: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=400&q=80',
    sku: 'LED-006',
    price: 19990,
    stock: 312,
    unitsSold: 891,
    revenue: 17810190,
    status: 'active',
    category: 'home'
  },
  {
    id: 7,
    name: 'Funda para Móvil con Soporte Magnético',
    image: 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=400&q=80',
    sku: 'FND-007',
    price: 8990,
    stock: 567,
    unitsSold: 1234,
    revenue: 11093660,
    status: 'active',
    category: 'accessories'
  },
  {
    id: 8,
    name: 'Set de Bandas de Resistencia 5 Niveles',
    image: 'https://images.unsplash.com/photo-1598289431512-b97b0917affc?w=400&q=80',
    sku: 'FIT-008',
    price: 15990,
    stock: 145,
    unitsSold: 267,
    revenue: 4269330,
    status: 'active',
    category: 'fitness'
  }
];

const ProviderCatalog = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState(mockProducts);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-PY', {
      style: 'currency',
      currency: 'PYG',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Toggle product status
  const toggleProductStatus = (productId) => {
    setProducts(products.map(product => 
      product.id === productId 
        ? { ...product, status: product.status === 'active' ? 'inactive' : 'active' }
        : product
    ));
  };

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesSearch = 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || product.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Calculate statistics
  const stats = {
    totalProducts: products.length,
    activeProducts: products.filter(p => p.status === 'active').length,
    totalRevenue: products.reduce((sum, p) => sum + p.revenue, 0),
    totalUnitsSold: products.reduce((sum, p) => sum + p.unitsSold, 0),
    lowStock: products.filter(p => p.stock < 50 && p.status === 'active').length
  };

  return (
    <div className="provider-catalog-page">
      <div className="provider-catalog-container">
        
        {/* Header */}
        <div className="provider-catalog-header">
          <div className="header-content">
            <div className="header-title">
              <Package size={32} />
              <div>
                <h1>Mi Catálogo de Productos</h1>
                <p>Gestiona tu inventario y monitorea ventas</p>
              </div>
            </div>
            <button className="btn-add-product" onClick={() => navigate('/add-product')}>
              <Plus size={20} />
              <span>Agregar Producto</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="catalog-stats-grid">
          <div className="catalog-stat-card">
            <div className="stat-icon total">
              <Package size={24} />
            </div>
            <div className="stat-info">
              <span className="stat-label">Total Productos</span>
              <span className="stat-value">{stats.totalProducts}</span>
            </div>
          </div>

          <div className="catalog-stat-card">
            <div className="stat-icon active">
              <Eye size={24} />
            </div>
            <div className="stat-info">
              <span className="stat-label">Productos Activos</span>
              <span className="stat-value">{stats.activeProducts}</span>
            </div>
          </div>

          <div className="catalog-stat-card">
            <div className="stat-icon revenue">
              <TrendingUp size={24} />
            </div>
            <div className="stat-info">
              <span className="stat-label">Ingresos Totales</span>
              <span className="stat-value">{formatCurrency(stats.totalRevenue)}</span>
            </div>
          </div>

          <div className="catalog-stat-card">
            <div className="stat-icon sold">
              <Package size={24} />
            </div>
            <div className="stat-info">
              <span className="stat-label">Unidades Vendidas</span>
              <span className="stat-value">{stats.totalUnitsSold}</span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="catalog-filters-section">
          <div className="search-box">
            <Search className="search-icon" size={20} />
            <input
              type="text"
              placeholder="Buscar por nombre o SKU..."
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
                <option value="active">Activos</option>
                <option value="inactive">Inactivos</option>
              </select>
            </div>

            <div className="filter-item">
              <Filter size={18} />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="all">Todas las categorías</option>
                <option value="electronics">Electrónica</option>
                <option value="home">Hogar</option>
                <option value="office">Oficina</option>
                <option value="fitness">Fitness</option>
                <option value="accessories">Accesorios</option>
              </select>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="catalog-products-grid">
          {filteredProducts.length === 0 ? (
            <div className="empty-state">
              <Package size={64} />
              <h3>No se encontraron productos</h3>
              <p>Intenta ajustar los filtros de búsqueda</p>
            </div>
          ) : (
            filteredProducts.map(product => (
              <div key={product.id} className={`catalog-product-card ${product.status}`}>
                {/* Product Image */}
                <div className="catalog-product-image">
                  <img src={product.image} alt={product.name} />
                  {product.stock === 0 && (
                    <div className="out-of-stock-badge">Sin Stock</div>
                  )}
                  {product.stock > 0 && product.stock < 50 && (
                    <div className="low-stock-badge">Stock Bajo</div>
                  )}
                </div>

                {/* Product Info */}
                <div className="catalog-product-info">
                  <div className="product-header">
                    <span className="product-sku">SKU: {product.sku}</span>
                    <button 
                      className={`status-toggle ${product.status}`}
                      onClick={() => toggleProductStatus(product.id)}
                      title={product.status === 'active' ? 'Desactivar' : 'Activar'}
                    >
                      {product.status === 'active' ? <Eye size={16} /> : <EyeOff size={16} />}
                    </button>
                  </div>

                  <h3 className="catalog-product-name">{product.name}</h3>

                  <div className="product-details">
                    <div className="detail-row">
                      <span className="detail-label">Precio:</span>
                      <span className="detail-value price">{formatCurrency(product.price)}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Stock:</span>
                      <span className={`detail-value stock ${product.stock === 0 ? 'zero' : product.stock < 50 ? 'low' : ''}`}>
                        {product.stock} unidades
                      </span>
                    </div>
                    <div className="detail-row highlight">
                      <span className="detail-label">Vendidos:</span>
                      <span className="detail-value sold">{product.unitsSold} unidades</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Ingresos:</span>
                      <span className="detail-value revenue">{formatCurrency(product.revenue)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="product-actions">
                    <button className="btn-action edit">
                      <Edit size={16} />
                      <span>Editar</span>
                    </button>
                    <button className="btn-action delete">
                      <Trash2 size={16} />
                      <span>Eliminar</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Summary Footer */}
        {filteredProducts.length > 0 && (
          <div className="catalog-summary">
            <div className="summary-item">
              <span>Productos mostrados:</span>
              <strong>{filteredProducts.length}</strong>
            </div>
            <div className="summary-item">
              <span>Unidades vendidas:</span>
              <strong>{filteredProducts.reduce((sum, p) => sum + p.unitsSold, 0)}</strong>
            </div>
            <div className="summary-item">
              <span>Ingresos totales:</span>
              <strong className="total-revenue">
                {formatCurrency(filteredProducts.reduce((sum, p) => sum + p.revenue, 0))}
              </strong>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default ProviderCatalog;