import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProducts, getProductImages } from '../services/api';
import '../styles/catalog.css';

const mockProducts = [
  {
    id: 'mock-1',
    name: "Smart Watch Serie 8 - Pantalla AMOLED 1.96\"",
    provider: "TechGlobal Suppliers",
    price: 45.99,
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80",
    badge: "Trending",
    category: "electronics",
    isMock: true,
  },
  {
    id: 'mock-2',
    name: "Auriculares Inalámbricos Bluetooth 5.0 con Cancelación de Ruido",
    provider: "AudioPro Wholesale",
    price: 29.99,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80",
    badge: "Hot",
    category: "electronics",
    isMock: true,
  },
  {
    id: 'mock-3',
    name: "Botella de Agua Inteligente con Recordatorio LED",
    provider: "HealthLife Direct",
    price: 18.50,
    image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&q=80",
    badge: "New",
    category: "lifestyle",
    isMock: true,
  },
  {
    id: 'mock-4',
    name: "Anillo de Luz LED para Streaming y TikTok - 12 Pulgadas",
    provider: "ContentCreator Supply",
    price: 35.00,
    image: "https://images.unsplash.com/photo-1579389083078-4e7018379f7e?w=800&q=80",
    badge: "Popular",
    category: "electronics",
    isMock: true,
  },
  {
    id: 'mock-5',
    name: "Organizador de Maquillaje Giratorio 360° Acrílico",
    provider: "BeautyHub Wholesale",
    price: 22.99,
    image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&q=80",
    badge: "Trending",
    category: "beauty",
    isMock: true,
  },
  {
    id: 'mock-6',
    name: "Soporte para Laptop Ajustable de Aluminio",
    provider: "OfficeTech Suppliers",
    price: 24.50,
    image: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800&q=80",
    badge: null,
    category: "office",
    isMock: true,
  },
  {
    id: 'mock-7',
    name: "Masajeador Facial de Rodillo de Jade Natural",
    provider: "BeautyHub Wholesale",
    price: 12.99,
    image: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=800&q=80",
    badge: "Hot",
    category: "beauty",
    isMock: true,
  },
  {
    id: 'mock-8',
    name: "Tiras LED RGB 5M Control por App WiFi",
    provider: "SmartHome Direct",
    price: 19.99,
    image: "https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=800&q=80",
    badge: "Trending",
    category: "home",
    isMock: true,
  },
  {
    id: 'mock-9',
    name: "Funda para Móvil con Soporte Magnético para Auto",
    provider: "MobileGear Plus",
    price: 8.99,
    image: "https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=800&q=80",
    badge: null,
    category: "accessories",
    isMock: true,
  },
  {
    id: 'mock-10',
    name: "Mini Proyector Portátil 1080P WiFi",
    provider: "TechGlobal Suppliers",
    price: 89.99,
    image: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=800&q=80",
    badge: "New",
    category: "electronics",
    isMock: true,
  },
  {
    id: 'mock-11',
    name: "Set de Bandas de Resistencia 5 Niveles con Bolsa",
    provider: "FitLife Wholesale",
    price: 15.99,
    image: "https://images.unsplash.com/photo-1598289431512-b97b0917affc?w=800&q=80",
    badge: "Popular",
    category: "fitness",
    isMock: true,
  },
  {
    id: 'mock-12',
    name: "Humidificador de Aire Ultrasónico con Luz LED",
    provider: "SmartHome Direct",
    price: 26.50,
    image: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800&q=80",
    badge: "Trending",
    category: "home",
    isMock: true,
  }
];

const Catalog = () => {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState('all');
  const [wishlist, setWishlist] = useState([]);
  const [realProducts, setRealProducts] = useState([]);
  const [loadingReal, setLoadingReal] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await getProducts();
        if (data && data.length > 0) {
          const withImages = await Promise.all(
            data.map(async (p) => {
              try {
                const images = await getProductImages(p.product_id);
                const primary = images.find(img => img.is_primary) || images[0];
                return {
                  id: p.product_id,
                  name: p.product_name,
                  provider: `Proveedor #${p.user_id}`,
                  price: parseFloat(p.product_base_cost),
                  image: primary?.image_url || null,
                  badge: null,
                  category: p.product_category,
                  isMock: false,
                };
              } catch {
                return {
                  id: p.product_id,
                  name: p.product_name,
                  provider: `Proveedor #${p.user_id}`,
                  price: parseFloat(p.product_base_cost),
                  image: null,
                  badge: null,
                  category: p.product_category,
                  isMock: false,
                };
              }
            })
          );
          setRealProducts(withImages);
        }
      } catch {
        // silencioso — el mockup igual se muestra
      } finally {
        setLoadingReal(false);
      }
    };
    fetchProducts();
  }, []);

  const allProducts = [...mockProducts, ...realProducts];

  const categories = ['all', ...new Set(allProducts.map(p => p.category))];
  const filters = categories.map(cat => ({
    id: cat,
    label: cat === 'all' ? 'Todos' : cat.charAt(0).toUpperCase() + cat.slice(1)
  }));

  const filteredMock = activeFilter === 'all' ? mockProducts : mockProducts.filter(p => p.category === activeFilter);
  const filteredReal = activeFilter === 'all' ? realProducts : realProducts.filter(p => p.category === activeFilter);

  const toggleWishlist = (productId, e) => {
    e.stopPropagation();
    setWishlist(prev =>
      prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]
    );
  };

  const handleAddToCart = (product, e) => {
    e.stopPropagation();
    console.log('Añadido al carrito:', product);
  };

  const handleProductClick = (product) => {
    if (!product.isMock) navigate(`/product/${product.id}`);
  };

  const formatPrice = (price) =>
    new Intl.NumberFormat('es-PY', { style: 'currency', currency: 'PYG', minimumFractionDigits: 0 }).format(price);

  const ProductCard = ({ product }) => (
    <div
      className="product-card"
      onClick={() => handleProductClick(product)}
      style={{ cursor: product.isMock ? 'default' : 'pointer' }}
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
        <button
          className={`product-wishlist ${wishlist.includes(product.id) ? 'active' : ''}`}
          onClick={(e) => toggleWishlist(product.id, e)}
          aria-label="Agregar a favoritos"
        >
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>
      </div>

      <div className="product-info">
        <h3 className="product-name">{product.name}</h3>
        <div className="product-provider">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          {product.provider}
        </div>
        <div className="product-footer">
          <div>
            <div className="product-price-label">Precio</div>
            <div className="product-price">{formatPrice(product.price)}</div>
          </div>
          <button className="add-to-cart-btn" onClick={(e) => handleAddToCart(product, e)}>
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span>Añadir</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="catalog-container">
      <div className="catalog-header">
        <h1 className="catalog-title">Catálogo de Productos</h1>
      </div>

      <div className="catalog-filters">
        {filters.map(filter => (
          <button
            key={filter.id}
            className={`filter-button ${activeFilter === filter.id ? 'active' : ''}`}
            onClick={() => setActiveFilter(filter.id)}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Productos mock */}
      <div className="catalog-grid">
        {filteredMock.map(product => <ProductCard key={product.id} product={product} />)}
      </div>

      {/* Productos reales */}
      {!loadingReal && filteredReal.length > 0 && (
        <>
          <div style={{ margin: '32px 0 16px', maxWidth: '1400px', marginLeft: 'auto', marginRight: 'auto' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#111827' }}>Productos de proveedores</h2>
          </div>
          <div className="catalog-grid">
            {filteredReal.map(product => <ProductCard key={product.id} product={product} />)}
          </div>
        </>
      )}

      {loadingReal && (
        <p style={{ textAlign: 'center', color: '#9ca3af', marginTop: '24px', fontSize: '13px' }}>
          Cargando productos...
        </p>
      )}
    </div>
  );
};

export default Catalog;