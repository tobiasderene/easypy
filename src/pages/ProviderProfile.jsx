import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getUser, getProductImages, getProfileImage, getProductsByUser } from '../services/api';
import '../styles/providerprofile.css';

const ProviderProfile = () => {
  const { id }    = useParams();
  const navigate  = useNavigate();

  const [provider, setProvider]   = useState(null);
  const [products, setProducts]   = useState([]);
  const [avatar, setAvatar]       = useState(null);
  const [loading, setLoading]     = useState(true);
  const [notFound, setNotFound]   = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const found = await getUser(parseInt(id));
        if (!found) { setNotFound(true); setLoading(false); return; }
        setProvider(found);

        try {
          const img = await getProfileImage(found.user_id);
          if (img?.image_url) setAvatar(img.image_url);
        } catch {}

        const prods = await getProductsByUser(found.user_id);
        const active = (prods || []).filter(p => p.product_status === 'active');

        const withImages = await Promise.all(
          active.map(async (p) => {
            try {
              const imgs    = await getProductImages(p.product_id);
              const primary = imgs.find(i => i.is_primary) || imgs[0];
              return { ...p, imageUrl: primary?.image_url || null };
            } catch {
              return { ...p, imageUrl: null };
            }
          })
        );
        setProducts(withImages);
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const formatPrice = (v) =>
    new Intl.NumberFormat('es-PY', { style: 'currency', currency: 'PYG', minimumFractionDigits: 0 }).format(v);

  const getInitials = (name) =>
    (name || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  const formatDate = (d) => {
    try { return new Date(d).toLocaleDateString('es-PY', { month: 'long', year: 'numeric' }); }
    catch { return ''; }
  };

  const handleBuy = (product) => {
    navigate('/order/new', {
      state: {
        initialItem:  { id: product.product_id, name: product.product_name, price: parseFloat(product.product_base_cost), image: product.imageUrl, quantity: 1 },
        supplierId:   provider.user_id,
        supplierCity: provider.city || '',
      }
    });
  };

  if (loading) return (
    <div className="pp-page">
      <div className="pp-loading">Cargando perfil...</div>
    </div>
  );

  if (notFound) return (
    <div className="pp-page">
      <div className="pp-not-found">
        <p>Proveedor no encontrado</p>
        <button onClick={() => navigate('/proveedores')}>Ver todos los proveedores</button>
      </div>
    </div>
  );

  const categories = [...new Set(products.map(p => p.product_category))];

  return (
    <div className="pp-page">

      {/* ── Hero banner ── */}
      <div className="pp-hero">
        <div className="pp-hero-bg" />
        <div className="pp-hero-content">
          <div className="pp-avatar">
            {avatar
              ? <img src={avatar} alt={provider.user_nickname} />
              : <span>{getInitials(provider.user_nickname)}</span>
            }
          </div>
          <div className="pp-hero-info">
            <h1 className="pp-name">{provider.user_nickname}</h1>
            <div className="pp-meta">
              <span className="pp-role-badge">Proveedor</span>
              {provider.city && (
                <span className="pp-location">
                  <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {provider.city}{provider.country ? `, ${provider.country}` : ''}
                </span>
              )}
              {provider.created_at && (
                <span className="pp-since">Miembro desde {formatDate(provider.created_at)}</span>
              )}
            </div>
          </div>
          <div className="pp-stats">
            <div className="pp-stat">
              <span className="pp-stat-value">{products.length}</span>
              <span className="pp-stat-label">Productos</span>
            </div>
            <div className="pp-stat">
              <span className="pp-stat-value">{categories.length}</span>
              <span className="pp-stat-label">Categorías</span>
            </div>
          </div>
        </div>
      </div>

      <div className="pp-body">

        {provider.user_description && (
          <div className="pp-card">
            <h2 className="pp-card-title">Sobre el proveedor</h2>
            <p className="pp-description">{provider.user_description}</p>
          </div>
        )}

        {categories.length > 0 && (
          <div className="pp-card">
            <h2 className="pp-card-title">Categorías</h2>
            <div className="pp-categories">
              {categories.map(cat => (
                <span key={cat} className="pp-category-tag">
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="pp-card">
          <h2 className="pp-card-title">
            Catálogo
            <span className="pp-card-count">{products.length} productos</span>
          </h2>

          {products.length === 0 ? (
            <div className="pp-empty">
              <svg width="40" height="40" fill="none" stroke="#d1d5db" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <p>Este proveedor no tiene productos activos</p>
            </div>
          ) : (
            <div className="pp-products-grid">
              {products.map(product => {
                const outOfStock = product.product_status === 'out_of_stock' || product.stock_available === 0;
                return (
                  <div key={product.product_id} className="pp-product-card" onClick={() => navigate(`/product/${product.product_id}`)}>
                    <div className="pp-product-img">
                      {product.imageUrl
                        ? <img src={product.imageUrl} alt={product.product_name} />
                        : <div className="pp-product-img-placeholder"><svg width="32" height="32" fill="none" stroke="#d1d5db" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></div>
                      }
                      {outOfStock && <div className="pp-out-of-stock">Sin stock</div>}
                    </div>
                    <div className="pp-product-info">
                      <p className="pp-product-name">{product.product_name}</p>
                      <p className="pp-product-category">{product.product_category}</p>
                      <div className="pp-product-footer">
                        <span className="pp-product-price">{formatPrice(product.product_base_cost)}</span>
                        <button className="pp-buy-btn" disabled={outOfStock} onClick={(e) => { e.stopPropagation(); handleBuy(product); }}>
                          {outOfStock ? 'Sin stock' : 'Comprar'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default ProviderProfile;