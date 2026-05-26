import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProducts, getProductImages, getProviders } from '../services/api';
import '../styles/catalog.css';

const Catalog = () => {
  const navigate = useNavigate();
  const [activeFilters, setActiveFilters] = useState(['all']);
  const [products, setProducts]           = useState([]);
  const [loading, setLoading]             = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const [data, providers] = await Promise.all([getProducts(), getProviders()]);

        // Map user_id → provider name
        const providerMap = {};
        (providers || []).forEach(p => { providerMap[p.user_id] = { name: p.user_nickname, city: p.city || '' }; });

        if (data && data.length > 0) {
          const activeData = data.filter(p => p.product_status === 'active');
          const withImages = await Promise.all(
            activeData.map(async (p) => {
              let imageUrl = null;
              try {
                const images  = await getProductImages(p.product_id);
                const primary = images.find(img => img.is_primary) || images[0];
                imageUrl      = primary?.image_url || null;
              } catch {}

              return {
                id:             p.product_id,
                name:           p.product_name,
                provider:       p.user_id,
                providerName:   providerMap[p.user_id]?.name || `Proveedor #${p.user_id}`,
                providerCity:   providerMap[p.user_id]?.city || '',
                price:          parseFloat(p.product_base_cost),
                suggestedPrice: p.suggested_price ? parseFloat(p.suggested_price) : null,
                stock:          p.stock_available ?? null,
                status:         p.product_status,
                image:          imageUrl,
                badge:          null,
                category:       p.product_category,
              };
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
  const filters    = categories.map(cat => ({
    id:    cat,
    label: cat === 'all' ? 'Todos' : cat.charAt(0).toUpperCase() + cat.slice(1),
  }));

  const toggleFilter = (catId) => {
    if (catId === 'all') { setActiveFilters(['all']); return; }
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
        initialItem:  { id: product.id, name: product.name, price: product.price, image: product.image, quantity: 1 },
        supplierId:   product.provider,
        supplierCity: product.providerCity,
      }
    });
  };

  const StockBadge = ({ stock, status }) => {
    if (status === 'out_of_stock' || stock === 0) return (
      <span style={{ fontSize: '10px', fontWeight: '700', color: '#dc2626', background: '#fee2e2', padding: '2px 8px', borderRadius: '100px' }}>
        Sin stock
      </span>
    );
    if (stock !== null && stock <= 5) return (
      <span style={{ fontSize: '10px', fontWeight: '700', color: '#d97706', background: '#fef3c7', padding: '2px 8px', borderRadius: '100px' }}>
        Últimas {stock} unidades
      </span>
    );
    if (stock !== null) return (
      <span style={{ fontSize: '10px', fontWeight: '600', color: '#6b7280' }}>
        {stock} disponibles
      </span>
    );
    return null;
  };

  const ProductCard = ({ product }) => {
    const outOfStock = product.status === 'out_of_stock' || product.stock === 0;

    return (
      <div
        className="product-card"
        onClick={() => navigate(`/product/${product.id}`)}
        style={{ cursor: 'pointer', opacity: outOfStock ? 0.75 : 1 }}
      >
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
          {outOfStock && (
            <div style={{
              position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ background: '#dc2626', color: 'white', fontSize: '11px', fontWeight: '800', padding: '4px 12px', borderRadius: '100px', letterSpacing: '0.4px' }}>
                SIN STOCK
              </span>
            </div>
          )}
        </div>

        <div className="product-info">
          <h3 className="product-name">{product.name}</h3>

          {/* Proveedor */}
          <div className="product-provider">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            {product.providerName}
          </div>

          <div className="product-footer">
            <div>
              <div className="product-price-label">Precio de compra</div>
              <div className="product-price">{formatPrice(product.price)}</div>
              {product.suggestedPrice && (
                <div className="product-suggested-price">
                  Venta sugerida: {formatPrice(product.suggestedPrice)}
                </div>
              )}
              {/* Stock */}
              <div style={{ marginTop: '4px' }}>
                <StockBadge stock={product.stock} status={product.status} />
              </div>
            </div>
            <button
              className="add-to-cart-btn"
              onClick={(e) => handleBuy(product, e)}
              disabled={outOfStock}
              style={{ opacity: outOfStock ? 0.5 : 1, cursor: outOfStock ? 'not-allowed' : 'pointer' }}
            >
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="13" height="13">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
              </svg>
              <span>{outOfStock ? 'Sin stock' : 'Comprar'}</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="catalog-container">
      <div className="catalog-filters">
        {filters.map(filter => (
          <button
            key={filter.id}
            className={`filter-button ${activeFilters.includes(filter.id) ? 'active' : ''}`}
            onClick={() => toggleFilter(filter.id)}
          >
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
