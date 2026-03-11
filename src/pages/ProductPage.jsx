import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProduct, getProductImages } from '../services/api';
import { useCart } from '../App';
import '../styles/assets.css';
import '../styles/product.css';

const ProductPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [product, setProduct]         = useState(null);
  const [images, setImages]           = useState([]);
  const [loading, setLoading]         = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity]       = useState(1);
  const [activeTab, setActiveTab]     = useState('description');
  const [isFavorite, setIsFavorite]   = useState(false);

  // ── Scroll al top al entrar ──────────────────────
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  // ── Fetch producto e imágenes ────────────────────
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prod, imgs] = await Promise.all([
          getProduct(id),
          getProductImages(id),
        ]);
        setProduct(prod);
        // ordenar: primaria primero
        const sorted = [...(imgs || [])].sort((a, b) => b.is_primary - a.is_primary);
        setImages(sorted);
      } catch {
        // si falla dejamos producto null y mostramos error
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleAddToCart = () => {
    if (!product) return;
    addToCart(
      { id: product.product_id, name: product.product_name, price: product.product_base_cost, quantity },
      product.user_id
    );
  };

  const handleBuyNow = () => {
    navigate('/order/new');
  };

  const formatPrice = (price) =>
    new Intl.NumberFormat('es-PY', { style: 'currency', currency: 'PYG', minimumFractionDigits: 0 }).format(price);

  // ── Loading ──────────────────────────────────────
  if (loading) {
    return (
      <div className="product-page">
        <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <p style={{ color: '#9ca3af', fontSize: '15px' }}>Cargando producto...</p>
        </div>
      </div>
    );
  }

  // ── Error / no encontrado ────────────────────────
  if (!product) {
    return (
      <div className="product-page">
        <div className="container" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '400px', gap: '16px' }}>
          <p style={{ color: '#6b7280', fontSize: '15px' }}>No se encontró el producto.</p>
          <button
            style={{
              padding: '8px 20px',
              background: '#056EB7',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
            onClick={() => navigate('/catalogo')}
          >
            Volver al catálogo
          </button>
        </div>
      </div>
    );
  }

  const currentImage = images[selectedImage]?.image_url || null;
  const discount = product.product_discount ? parseFloat(product.product_discount) : 0;
  const originalPrice = discount > 0
    ? parseFloat(product.product_base_cost) / (1 - discount / 100)
    : null;

  return (
    <div className="product-page">
      <div className="container">

        {/* Product Grid */}
        <div className="product-grid">

          {/* Gallery */}
          <div className="gallery">
            <div className="main-image-container">
              {currentImage ? (
                <img src={currentImage} alt={product.product_name} className="main-image" />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6' }}>
                  <svg width="64" height="64" fill="none" stroke="#d1d5db" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}

              {discount > 0 && (
                <div className="discount-badge">-{discount}% OFF</div>
              )}

              <button
                className={`favorite-btn ${isFavorite ? 'active' : ''}`}
                onClick={() => setIsFavorite(!isFavorite)}
                aria-label="Agregar a favoritos"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill={isFavorite ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </button>
            </div>

            {images.length > 1 && (
              <div className="thumbnails">
                {images.map((img, idx) => (
                  <div
                    key={img.image_id}
                    className={`thumbnail ${selectedImage === idx ? 'active' : ''}`}
                    onClick={() => setSelectedImage(idx)}
                  >
                    <img src={img.image_url} alt={`Vista ${idx + 1}`} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="product-info">
            <div className="breadcrumb">
              <span
                className="breadcrumb-link"
                style={{ cursor: 'pointer', fontSize: '13px' }}
                onClick={() => navigate('/catalogo')}
              >
                Catálogo
              </span>
              <span className="breadcrumb-separator">/</span>
              <span>{product.product_category}</span>
              <span className="breadcrumb-separator">/</span>
              <span>{product.product_name}</span>
            </div>

            <h1 className="product-title">{product.product_name}</h1>

            <div className="price-section">
              <div className="price-row">
                <span className="current-price">{formatPrice(product.product_base_cost)}</span>
                {originalPrice && (
                  <span className="original-price">{formatPrice(originalPrice)}</span>
                )}
              </div>
              {discount > 0 && (
                <div className="save-text">Ahorrás {discount}% con este precio</div>
              )}
            </div>

            {product.product_description && (
              <p className="description">{product.product_description}</p>
            )}

            {product.product_sku && (
              <p style={{ fontSize: '13px', color: '#9ca3af' }}>SKU: {product.product_sku}</p>
            )}

            {/* Quantity */}
            <div className="quantity-section">
              <div className="variant-label">Cantidad</div>
              <div className="quantity-selector">
                <button
                  className="qty-btn"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                  aria-label="Disminuir cantidad"
                >
                  −
                </button>
                <span className="qty-display">{quantity}</span>
                <button
                  className="qty-btn"
                  onClick={() => setQuantity(quantity + 1)}
                  aria-label="Aumentar cantidad"
                >
                  +
                </button>
              </div>
            </div>

            {/* Stock */}
            <div className="stock-info">
              <span className="stock-dot"></span>
              <span className="stock-text">
                {product.product_status === 'active' ? 'Disponible' : 'No disponible'}
              </span>
            </div>

            {/* Action Buttons */}
            <div className="action-buttons">
              <button
                className="add-to-cart-btn"
                onClick={handleAddToCart}
                disabled={product.product_status !== 'active'}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="9" cy="21" r="1" />
                  <circle cx="20" cy="21" r="1" />
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                </svg>
                Agregar al carrito
              </button>
              <button
                className="buy-now-btn"
                onClick={handleBuyNow}
                disabled={product.product_status !== 'active'}
              >
                Comprar ahora
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs-section">
          <div className="tabs-header">
            <button
              className={`tab-btn ${activeTab === 'description' ? 'active' : ''}`}
              onClick={() => setActiveTab('description')}
            >
              Descripción
            </button>
            <button
              className={`tab-btn ${activeTab === 'specs' ? 'active' : ''}`}
              onClick={() => setActiveTab('specs')}
            >
              Especificaciones
            </button>

          </div>

          {/* Description */}
          {/* Descripción */}
          <div style={{ marginTop: '40px', marginBottom: '60px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px', color: '#111827' }}>
              Descripción
            </h2>
            <p className="description" style={{ lineHeight: '1.8' }}>
              {product.product_description || 'Este producto no tiene descripción disponible.'}
            </p>
          </div>

          {/* Specs */}
          <div className={`tab-content ${activeTab === 'specs' ? 'active' : ''}`}>
            <div className="specs-grid">
              {[
                ['Nombre',     product.product_name],
                ['SKU',        product.product_sku],
                ['Categoría',  product.product_category],
                ['Estado',     product.product_status === 'active' ? 'Disponible' : 'No disponible'],
              ].map(([label, value]) => (
                <div key={label} className="spec-item">
                  <div className="spec-label">{label}:</div>
                  <div className="spec-value">{value || '—'}</div>
                </div>
              ))}
            </div>
          </div>


        </div>

      </div>
    </div>
  );
};

export default ProductPage;