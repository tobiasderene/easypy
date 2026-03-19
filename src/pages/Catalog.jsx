import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProducts, getProductImages } from '../services/api';
import '../styles/catalog.css';

const Catalog = () => {
  const navigate = useNavigate();
  const [activeFilters, setActiveFilters] = useState(['all']);
  const [products, setProducts]         = useState([]);
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await getProducts();
        if (data && data.length > 0) {
          const withImages = await Promise.all(
            data.map(async (p) => {
              try {
                const images  = await getProductImages(p.product_id);
                const primary = images.find(img => img.is_primary) || images[0];
                return { id: p.product_id, name: p.product_name, provider: p.user_id, price: parseFloat(p.product_base_cost), image: primary?.image_url || null, badge: null, category: p.product_category };
              } catch {
                return { id: p.product_id, name: p.product_name, provider: p.user_id, price: parseFloat(p.product_base_cost), image: null, badge: null, category: p.product_category };
              }
            })
          );
          setProducts(withImages);
        }
      } catch {
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const categories = ['all', ...new Set(products.map(p => p.category))];
  const filters    = categories.map(cat => ({ id: cat, label: cat === 'all' ? 'Todos' : cat.charAt(0).toUpperCase() + cat.slice(1) }));

  const toggleFilter = (catId) => {
    if (catId === 'all') {
      setActiveFilters(['all']);
      return;
    }
    setActiveFilters(prev => {
      const withoutAll = prev.filter(f => f !== 'all');
      if (withoutAll.includes(catId)) {
        const next = withoutAll.filter(f => f !== catId);
        return next.length === 0 ? ['all'] : next;
      }
      return [...withoutAll, catId];
    });
  };

  const filtered = activeFilters.includes('all')
    ? products
    : products.filter(p => activeFilters.includes(p.category));

  const formatPrice = (price) =>
    new Intl.NumberFormat('es-PY', { style: 'currency', currency: 'PYG', minimumFractionDigits: 0 }).format(price);

  const handleBuy = (product, e) => {
    e.stopPropagation();
    navigate('/order/new', {
      state: {
        initialItem: { id: product.id, name: product.name, price: product.price, image: product.image, quantity: 1 },
        supplierId:  product.provider,
      }
    });
  };

  const ProductCard = ({ product }) => (
    <div className="product-card" onClick={() => navigate(`/product/${product.id}`)} style={{ cursor: 'pointer' }}>
      <div className="product-image-container">
        {product.image ? (
          <img src={product.image} alt={product.name} className="product-image" />
        ) : (
          <div style={{ width: '100%', height: '100%', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="40" height="40" fill="none" stroke="#d1d5db" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        {product.badge && <span className="product-badge">{product.badge}</span>}
      </div>

      <div className="product-info">
        <h3 className="product-name">{product.name}</h3>
        <div className="product-provider">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          Proveedor #{product.provider}
        </div>
        <div className="product-footer">
          <div>
            <div className="product-price-label">Precio</div>
            <div className="product-price">{formatPrice(product.price)}</div>
          </div>
          <button className="add-to-cart-btn" onClick={(e) => handleBuy(product, e)}>
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="13" height="13">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
            </svg>
            <span>Comprar</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="catalog-container">
      <div className="catalog-filters">
        {filters.map(filter => (
          <button key={filter.id} className={`filter-button ${activeFilters.includes(filter.id) ? 'active' : ''}`} onClick={() => toggleFilter(filter.id)}>
            {filter.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{ textAlign: 'center', color: '#9ca3af', marginTop: '40px', fontSize: '13px' }}>Cargando productos...</p>
      ) : filtered.length === 0 ? (
        <div className="catalog-empty">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <h3>No hay productos disponibles</h3>
          <p>Aún no hay productos publicados en esta categoría</p>
        </div>
      ) : (
        <div className="catalog-grid">
          {filtered.map(product => <ProductCard key={product.id} product={product} />)}
        </div>
      )}
    </div>
  );
};

export default Catalog;