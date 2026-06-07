import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProduct, getProductImages, getUser, getProductVariants, getFavorites, toggleFavorite } from '../services/api';
import { useUser } from '../App';
import '../styles/assets.css';
import '../styles/product.css';

const ProductPage = () => {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const { user }   = useUser();

  const [product, setProduct]               = useState(null);
  const [images, setImages]                 = useState([]);
  const [loading, setLoading]               = useState(true);
  const [selectedImage, setSelectedImage]   = useState(0);
  const [quantity, setQuantity]             = useState(1);
  const [isFavorite, setIsFavorite]         = useState(false);
  const [supplierCity, setSupplierCity]     = useState('');
  const [variants, setVariants]             = useState([]);
  const [selectedColor, setSelectedColor]   = useState(null);
  const [selectedTalle, setSelectedTalle]   = useState(null);

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prod, imgs, vars] = await Promise.all([
          getProduct(id),
          getProductImages(id),
          getProductVariants(id).catch(() => []),
        ]);
        setProduct(prod);
        setVariants(vars || []);
        const sorted = [...(imgs || [])].sort((a, b) => b.is_primary - a.is_primary);
        setImages(sorted);
        if (prod?.user_id) {
          try { const s = await getUser(prod.user_id); setSupplierCity(s?.city || ''); } catch {}
        }
      } catch {
      } finally { setLoading(false); }
    };
    fetchData();
  }, [id]);

  // Cargar si está en favoritos
  useEffect(() => {
    if (!user?.user_id) return;
    getFavorites().then(favs => {
      const isFav = (favs || []).some(f => f.product_id === parseInt(id));
      setIsFavorite(isFav);
    }).catch(() => {});
  }, [user, id]);

  const handleToggleFavorite = async () => {
    try {
      const res = await toggleFavorite({ product_id: parseInt(id) });
      setIsFavorite(res.favorited);
    } catch {}
  };

  const formatPrice = (price) =>
    new Intl.NumberFormat('es-PY', { style: 'currency', currency: 'PYG', minimumFractionDigits: 0 }).format(price);

  // Lógica de variantes
  const colors  = [...new Set(variants.filter(v => v.color).map(v => v.color))];
  const talles  = [...new Set(variants.filter(v => v.talle).map(v => v.talle))];
  const hasVariants = variants.length > 0;

  // Variante seleccionada actualmente
  const selectedVariant = hasVariants ? variants.find(v =>
    (!selectedColor || v.color === selectedColor) &&
    (!selectedTalle || v.talle === selectedTalle)
  ) : null;

  // Stock efectivo: si hay variantes, usar la variante; sino usar el producto
  const effectiveStock = hasVariants
    ? (selectedVariant?.stock_available ?? null)
    : (product?.stock_available ?? null);

  // Precio con modificador
  const basePrice     = product ? parseFloat(product.product_base_cost) : 0;
  const priceModifier = selectedVariant ? parseFloat(selectedVariant.price_modifier || 0) : 0;
  const finalPrice    = basePrice + priceModifier;

  // Disponibilidad de talle dado el color seleccionado
  const isTalleAvailable = (talle) => {
    if (!selectedColor) return variants.some(v => v.talle === talle && v.stock_available > 0);
    return variants.some(v => v.color === selectedColor && v.talle === talle && v.stock_available > 0);
  };

  const isColorAvailable = (color) => {
    if (!selectedTalle) return variants.some(v => v.color === color && v.stock_available > 0);
    return variants.some(v => v.talle === selectedTalle && v.color === color && v.stock_available > 0);
  };

  const canBuy = hasVariants
    ? selectedVariant && effectiveStock > 0
    : product?.product_status === 'active' && (product?.stock_available ?? 1) > 0;

  const handleBuy = () => {
    if (!product || !canBuy) return;
    navigate('/order/new', {
      state: {
        initialItem:  { id: product.product_id, name: product.product_name, price: finalPrice, image: images[0]?.image_url || null, quantity, variant_id: selectedVariant?.variant_id || null },
        supplierId:   product.user_id,
        supplierCity: supplierCity,
      }
    });
  };

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

  const currentImage   = images[selectedImage]?.image_url || null;
  const discount       = product.product_discount ? parseFloat(product.product_discount) : 0;
  const originalPrice  = discount > 0 ? basePrice / (1 - discount / 100) : null;
  const suggestedPrice = product.suggested_price ? parseFloat(product.suggested_price) : null;
  const suggestedMargin = suggestedPrice
    ? Math.round(((suggestedPrice - finalPrice) / suggestedPrice) * 100)
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
              <button
                className={`favorite-btn ${isFavorite ? 'active' : ''}`}
                onClick={handleToggleFavorite}
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
                <span className="current-price">{formatPrice(finalPrice)}</span>
                {originalPrice && <span className="original-price">{formatPrice(originalPrice)}</span>}
                {priceModifier > 0 && <span style={{ fontSize: '12px', color: '#16a34a', fontWeight: '600' }}>+{formatPrice(priceModifier)} por esta variante</span>}
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

            {/* ── Selector de colores ── */}
            {colors.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <p style={{ fontSize: '12px', fontWeight: '700', color: '#374151', marginBottom: '8px' }}>
                  Color: <span style={{ color: '#056EB7' }}>{selectedColor || 'Seleccioná uno'}</span>
                </p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {colors.map(color => {
                    const available = isColorAvailable(color);
                    const selected  = selectedColor === color;
                    return (
                      <button key={color} onClick={() => setSelectedColor(selected ? null : color)} disabled={!available}
                        style={{ padding: '6px 14px', border: `2px solid ${selected ? '#056EB7' : available ? '#e5e7eb' : '#f3f4f6'}`, borderRadius: '100px', fontSize: '13px', fontWeight: '600', cursor: available ? 'pointer' : 'not-allowed', background: selected ? '#eff6ff' : 'white', color: selected ? '#056EB7' : available ? '#374151' : '#d1d5db', textDecoration: available ? 'none' : 'line-through', transition: 'all 0.15s' }}>
                        {color}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Selector de talles ── */}
            {talles.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <p style={{ fontSize: '12px', fontWeight: '700', color: '#374151', marginBottom: '8px' }}>
                  Talle: <span style={{ color: '#056EB7' }}>{selectedTalle || 'Seleccioná uno'}</span>
                </p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {talles.map(talle => {
                    const available = isTalleAvailable(talle);
                    const selected  = selectedTalle === talle;
                    return (
                      <button key={talle} onClick={() => setSelectedTalle(selected ? null : talle)} disabled={!available}
                        style={{ minWidth: '44px', padding: '6px 12px', border: `2px solid ${selected ? '#056EB7' : available ? '#e5e7eb' : '#f3f4f6'}`, borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: available ? 'pointer' : 'not-allowed', background: selected ? '#eff6ff' : 'white', color: selected ? '#056EB7' : available ? '#374151' : '#d1d5db', textDecoration: available ? 'none' : 'line-through', transition: 'all 0.15s', position: 'relative' }}>
                        {talle}
                        {!available && <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ position: 'absolute', width: '100%', height: '1.5px', background: '#d1d5db', transform: 'rotate(-20deg)' }} /></span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Aviso si hay variantes sin seleccionar */}
            {hasVariants && !selectedVariant && (
              <p style={{ fontSize: '12px', color: '#dc2626', fontWeight: '600', marginBottom: '12px' }}>
                {colors.length > 0 && !selectedColor && 'Seleccioná un color. '}
                {talles.length > 0 && !selectedTalle && 'Seleccioná un talle.'}
              </p>
            )}

            <div className="quantity-section">
              <div className="variant-label">Cantidad</div>
              <div className="quantity-selector">
                <button className="qty-btn" onClick={() => setQuantity(Math.max(1, quantity - 1))} disabled={quantity <= 1}>−</button>
                <span className="qty-display">{quantity}</span>
                <button className="qty-btn" onClick={() => setQuantity(quantity + 1)} disabled={effectiveStock !== null && quantity >= effectiveStock}>+</button>
              </div>
            </div>

            <div className="stock-info">
              <span className="stock-dot" style={{ background: effectiveStock === 0 ? '#ef4444' : effectiveStock !== null && effectiveStock <= 5 ? '#d97706' : '#16a34a' }} />
              <span className="stock-text">
                {effectiveStock === 0
                  ? 'Sin stock'
                  : effectiveStock !== null && effectiveStock <= 5
                    ? `Últimas ${effectiveStock} unidades`
                    : effectiveStock !== null
                      ? `${effectiveStock} disponibles`
                      : 'Disponible'}
              </span>
            </div>

            <div className="action-buttons">
              <button className="buy-now-btn" style={{ flex: 1 }} onClick={handleBuy} disabled={!canBuy}>
                {effectiveStock === 0 ? 'Sin stock' : hasVariants && !selectedVariant ? 'Seleccioná variante' : 'Comprar'}
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