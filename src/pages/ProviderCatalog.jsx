import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, TrendingUp, Edit, Trash2, Plus, Search, Filter, Eye, EyeOff } from 'lucide-react';
import { getMyProducts, deleteProduct, updateProduct, getProductImages } from '../services/api';
import '../styles/providercatalog.css';

const ProviderCatalog = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('es-PY', { style: 'currency', currency: 'PYG', minimumFractionDigits: 0 }).format(amount);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await getMyProducts();
        // Traer imagen primaria de cada producto
        const withImages = await Promise.all(
          data.map(async (p) => {
            try {
              const images = await getProductImages(p.product_id);
              const primary = images.find(img => img.is_primary) || images[0];
              return { ...p, imageUrl: primary?.image_url || null };
            } catch {
              return { ...p, imageUrl: null };
            }
          })
        );
        setProducts(withImages);
      } catch (e) {
        setError('No se pudieron cargar los productos.');
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const toggleProductStatus = async (product) => {
    const newStatus = product.product_status === 'active' ? 'inactive' : 'active';
    try {
      await updateProduct(product.product_id, { product_status: newStatus });
      setProducts(prev =>
        prev.map(p => p.product_id === product.product_id ? { ...p, product_status: newStatus } : p)
      );
    } catch {
      alert('No se pudo actualizar el estado del producto.');
    }
  };

  const handleDelete = async (productId) => {
    if (!confirm('¿Estás seguro que querés eliminar este producto?')) return;
    try {
      await deleteProduct(productId);
      setProducts(prev => prev.filter(p => p.product_id !== productId));
    } catch {
      alert('No se pudo eliminar el producto.');
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch =
      p.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.product_sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.product_status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || p.product_category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const categories = [...new Set(products.map(p => p.product_category))];

  const stats = {
    totalProducts: products.length,
    activeProducts: products.filter(p => p.product_status === 'active').length,
    totalRevenue: 0, // sin datos de ventas por ahora
    lowStock: 0,
  };

  if (loading) return <div className="provider-catalog-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}><p>Cargando productos...</p></div>;

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
                <p>Gestiona tu inventario</p>
              </div>
            </div>
            <button className="btn-add-product" onClick={() => navigate('/add-product')}>
              <Plus size={20} />
              <span>Agregar Producto</span>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="catalog-stats-grid">
          <div className="catalog-stat-card">
            <div className="stat-icon total"><Package size={24} /></div>
            <div className="stat-info">
              <span className="stat-label">Total Productos</span>
              <span className="stat-value">{stats.totalProducts}</span>
            </div>
          </div>
          <div className="catalog-stat-card">
            <div className="stat-icon active"><Eye size={24} /></div>
            <div className="stat-info">
              <span className="stat-label">Productos Activos</span>
              <span className="stat-value">{stats.activeProducts}</span>
            </div>
          </div>
          <div className="catalog-stat-card">
            <div className="stat-icon revenue"><TrendingUp size={24} /></div>
            <div className="stat-info">
              <span className="stat-label">Inactivos</span>
              <span className="stat-value">{stats.totalProducts - stats.activeProducts}</span>
            </div>
          </div>
        </div>

        {error && <div className="error-box" style={{ marginBottom: '16px' }}>{error}</div>}

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
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">Todos los estados</option>
                <option value="active">Activos</option>
                <option value="inactive">Inactivos</option>
              </select>
            </div>
            <div className="filter-item">
              <Filter size={18} />
              <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                <option value="all">Todas las categorías</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
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
              <p>{products.length === 0 ? 'Todavía no agregaste ningún producto.' : 'Intentá ajustar los filtros.'}</p>
            </div>
          ) : (
            filteredProducts.map(product => (
              <div key={product.product_id} className={`catalog-product-card ${product.product_status}`}>
                <div className="catalog-product-image">
                  {product.imageUrl
                    ? <img src={product.imageUrl} alt={product.product_name} />
                    : <div style={{ width: '100%', height: '100%', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Package size={40} color="#d1d5db" /></div>
                  }
                  {product.product_status === 'inactive' && (
                    <div className="out-of-stock-badge">Inactivo</div>
                  )}
                </div>

                <div className="catalog-product-info">
                  <div className="product-header">
                    <span className="product-sku">SKU: {product.product_sku}</span>
                    <button
                      className={`status-toggle ${product.product_status}`}
                      onClick={() => toggleProductStatus(product)}
                      title={product.product_status === 'active' ? 'Desactivar' : 'Activar'}
                    >
                      {product.product_status === 'active' ? <Eye size={16} /> : <EyeOff size={16} />}
                    </button>
                  </div>

                  <h3 className="catalog-product-name">{product.product_name}</h3>

                  <div className="product-details">
                    <div className="detail-row">
                      <span className="detail-label">Precio base:</span>
                      <span className="detail-value price">{formatCurrency(product.product_base_cost)}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Categoría:</span>
                      <span className="detail-value">{product.product_category}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Descuento:</span>
                      <span className="detail-value">{product.product_discount}%</span>
                    </div>
                  </div>

                  <div className="product-actions">
                    <button className="btn-action edit" onClick={() => navigate(`/edit-product/${product.product_id}`)}>
                      <Edit size={16} />
                      <span>Editar</span>
                    </button>
                    <button className="btn-action delete" onClick={() => handleDelete(product.product_id)}>
                      <Trash2 size={16} />
                      <span>Eliminar</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {filteredProducts.length > 0 && (
          <div className="catalog-summary">
            <div className="summary-item">
              <span>Productos mostrados:</span>
              <strong>{filteredProducts.length}</strong>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default ProviderCatalog;