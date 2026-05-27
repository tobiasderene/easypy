import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProduct, getProductImages, getUser } from '../services/api';
import '../styles/assets.css';
import '../styles/product.css';

const ProductPage = () => {
  const { id }     = useParams();
  const navigate   = useNavigate();

  const [product, setProduct]             = useState(null);
  const [images, setImages]               = useState([]);
  const [loading, setLoading]             = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity]           = useState(1);
  const [isFavorite, setIsFavorite]       = useState(false);
  const [supplierCity, setSupplierCity]   = useState('');

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prod, imgs] = await Promise.all([getProduct(id), getProductImages(id)]);
        setProduct(prod);
        const sorted = [...(imgs || [])].sort((a, b) => b.is_primary - a.is_primary);
        setImages(sorted);
        // Fetchear ciudad del proveedor
        if (prod?.user_id) {
          try {
            const supplier = await getUser(prod.user_id);
            setSupplierCity(supplier?.city || '');
          } catch {}
        }
      } catch {
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleBuy = () => {
    if (!product) return;
    navigate('/order/new', {
      state: {
        initialItem:  { id: product.product_id, name: product.product_name, price: parseFloat(product.product_base_cost), image: images[0]?.image_url || null, quantity },
        supplierId:   product.user_id,
        supplierCity: supplierCity,
      }
    });
  };

  const formatPrice = (price) =>
    new Intl.NumberFormat('es-PY', { style: 'currency', currency: 'PYG', minimumFractionDigits: 0 }).format(price);

  if (loading) return (
    <div className="product-page">
      <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <p style={{ color: '#9ca3af', fontSize: '15px' }}>Cargando producto...</p>
      </div>
    </div>
  );

  if (!product) return (
    <div className="product-page">
      <div className="container" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '400px', gap: '16px' }}>
        <p style={{ color: '#6b7280', fontSize: '15px' }}>No se encontró el producto.</p>
        <button style={{ padding: '8px 20px', background: '#056EB7', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }} onClick={() => navigate('/catalogo')}>
          Volver al catálogo
        </button>
      </div>
    </div>
  );

  const currentImage    = images[selectedImage]?.image_url || null;
  const discount        = product.product_discount ? parseFloat(product.product_discount) : 0;
  const originalPrice   = discount > 0 ? parseFloat(product.product_base_cost) / (1 - discount / 100) : null;
  const suggestedPrice  = product.suggested_price ? parseFloat(product.suggested_price) : null;
  const suggestedMargin = suggestedPrice
    ? Math.round(((suggestedPrice - parseFloat(product.product_base_cost)) / suggestedPrice) * 100)
    : null;

  return (
    <div className="product-page">
      <div className="container">
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
              {discount > 0 && <div className="discount-badge">-{discount}% OFF</div>}
              <button className={`favorite-btn ${isFavorite ? 'active' : ''}`} onClick={() => setIsFavorite(!isFavorite)} aria-label="Agregar a favoritos">
                <svg width="24" height="24" viewBox="0 0 24 24" fill={isFavorite ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </button>
            </div>
            {images.length > 1 && (
              <div className="thumbnails">
                {images.map((img, idx) => (
                  <div key={img.image_id} className={`thumbnail ${selectedImage === idx ? 'active' : ''}`} onClick={() => setSelectedImage(idx)}>
                    <img src={img.image_url} alt={`Vista ${idx + 1}`} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="product-info">
            <div className="breadcrumb">
              <span className="breadcrumb-link" style={{ cursor: 'pointer', fontSize: '13px' }} onClick={() => navigate('/catalogo')}>Catálogo</span>
              <span className="breadcrumb-separator">/</span>
              <span>{product.product_category}</span>
              <span className="breadcrumb-separator">/</span>
              <span>{product.product_name}</span>
            </div>

            <h1 className="product-title">{product.product_name}</h1>

            <div className="price-section">
              <div className="price-row">
                <span className="current-price">{formatPrice(product.product_base_cost)}</span>
                {originalPrice && <span className="original-price">{formatPrice(originalPrice)}</span>}
              </div>
              {discount > 0 && <div className="save-text">Ahorrás {discount}% con este precio</div>}
              {suggestedPrice && (
                <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1.5px dashed #bfdbfe', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <p style={{ fontSize: '11px', fontWeight: '700', color: '#056EB7', textTransform: 'uppercase', letterSpacing: '0.4px', margin: '0 0 2px 0' }}>Precio sugerido de venta</p>
                    <p style={{ fontSize: '22px', fontWeight: '800', color: '#16a34a', margin: 0 }}>{formatPrice(suggestedPrice)}</p>
                  </div>
                  {suggestedMargin > 0 && (
                    <div style={{ background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: '8px', padding: '6px 12px', textAlign: 'center' }}>
                      <p style={{ fontSize: '10px', color: '#16a34a', fontWeight: '600', margin: '0 0 1px 0' }}>Margen estimado</p>
                      <p style={{ fontSize: '16px', fontWeight: '800', color: '#16a34a', margin: 0 }}>{suggestedMargin}%</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {product.product_description && <p className="description">{product.product_description}</p>}
            {product.product_sku && <p style={{ fontSize: '13px', color: '#9ca3af' }}>SKU: {product.product_sku}</p>}

            <div className="quantity-section">
              <div className="variant-label">Cantidad</div>
              <div className="quantity-selector">
                <button className="qty-btn" onClick={() => setQuantity(Math.max(1, quantity - 1))} disabled={quantity <= 1}>−</button>
                <span className="qty-display">{quantity}</span>
                <button className="qty-btn" onClick={() => setQuantity(quantity + 1)}>+</button>
              </div>
            </div>

            <div className="stock-info">
              <span className="stock-dot" style={{ background: product.stock_available === 0 ? '#ef4444' : product.stock_available <= 5 ? '#d97706' : '#16a34a' }} />
              <span className="stock-text">
                {product.stock_available === 0
                  ? 'Sin stock'
                  : product.stock_available <= 5
                    ? `Últimas ${product.stock_available} unidades`
                    : `${product.stock_available} disponibles`}
              </span>
            </div>

            <div className="action-buttons">
              <button className="buy-now-btn" style={{ flex: 1 }}
                onClick={handleBuy}
                disabled={product.product_status !== 'active' || product.stock_available === 0}>
                {product.stock_available === 0 ? 'Sin stock' : 'Comprar'}
              </button>
            </div>
          </div>
        </div>

        <div style={{ marginTop: '40px', marginBottom: '60px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px', color: '#111827' }}>Descripción</h2>
          <p className="description" style={{ lineHeight: '1.8' }}>
            {product.product_description || 'Este producto no tiene descripción disponible.'}
          </p>
        </div>

        <div className="specs-grid">
          {[
            ['Nombre',    product.product_name],
            ['SKU',       product.product_sku],
            ['Categoría', product.product_category],
            ['Estado',    product.product_status === 'active' ? 'Disponible' : 'No disponible'],
            ...(suggestedPrice ? [['Precio sugerido', formatPrice(suggestedPrice)]] : []),
          ].map(([label, value]) => (
            <div key={label} className="spec-item">
              <div className="spec-label">{label}:</div>
              <div className="spec-value">{value || '—'}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProductPage;
