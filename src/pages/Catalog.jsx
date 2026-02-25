import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/catalog.css';

const Catalog = () => {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState('all');
  const [wishlist, setWishlist] = useState([]);

  // Productos de ejemplo (típicos para dropshipping)
  const products = [
    {
      id: 1,
      name: "Smart Watch Serie 8 - Pantalla AMOLED 1.96\"",
      provider: "TechGlobal Suppliers",
      price: 45.99,
      image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80",
      badge: "Trending",
      category: "electronics"
    },
    {
      id: 2,
      name: "Auriculares Inalámbricos Bluetooth 5.0 con Cancelación de Ruido",
      provider: "AudioPro Wholesale",
      price: 29.99,
      image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80",
      badge: "Hot",
      category: "electronics"
    },
    {
      id: 3,
      name: "Botella de Agua Inteligente con Recordatorio LED",
      provider: "HealthLife Direct",
      price: 18.50,
      image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&q=80",
      badge: "New",
      category: "lifestyle"
    },
    {
      id: 4,
      name: "Anillo de Luz LED para Streaming y TikTok - 12 Pulgadas",
      provider: "ContentCreator Supply",
      price: 35.00,
      image: "https://images.unsplash.com/photo-1579389083078-4e7018379f7e?w=800&q=80",
      badge: "Popular",
      category: "electronics"
    },
    {
      id: 5,
      name: "Organizador de Maquillaje Giratorio 360° Acrílico",
      provider: "BeautyHub Wholesale",
      price: 22.99,
      image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&q=80",
      badge: "Trending",
      category: "beauty"
    },
    {
      id: 6,
      name: "Soporte para Laptop Ajustable de Aluminio",
      provider: "OfficeTech Suppliers",
      price: 24.50,
      image: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800&q=80",
      badge: null,
      category: "office"
    },
    {
      id: 7,
      name: "Masajeador Facial de Rodillo de Jade Natural",
      provider: "BeautyHub Wholesale",
      price: 12.99,
      image: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=800&q=80",
      badge: "Hot",
      category: "beauty"
    },
    {
      id: 8,
      name: "Tiras LED RGB 5M Control por App WiFi",
      provider: "SmartHome Direct",
      price: 19.99,
      image: "https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=800&q=80",
      badge: "Trending",
      category: "home"
    },
    {
      id: 9,
      name: "Funda para Móvil con Soporte Magnético para Auto",
      provider: "MobileGear Plus",
      price: 8.99,
      image: "https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=800&q=80",
      badge: null,
      category: "accessories"
    },
    {
      id: 10,
      name: "Mini Proyector Portátil 1080P WiFi",
      provider: "TechGlobal Suppliers",
      price: 89.99,
      image: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=800&q=80",
      badge: "New",
      category: "electronics"
    },
    {
      id: 11,
      name: "Set de Bandas de Resistencia 5 Niveles con Bolsa",
      provider: "FitLife Wholesale",
      price: 15.99,
      image: "https://images.unsplash.com/photo-1598289431512-b97b0917affc?w=800&q=80",
      badge: "Popular",
      category: "fitness"
    },
    {
      id: 12,
      name: "Humidificador de Aire Ultrasónico con Luz LED",
      provider: "SmartHome Direct",
      price: 26.50,
      image: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800&q=80",
      badge: "Trending",
      category: "home"
    }
  ];

  const filters = [
    { id: 'all', label: 'Todos' },
    { id: 'electronics', label: 'Electrónica' },
    { id: 'beauty', label: 'Belleza' },
    { id: 'home', label: 'Hogar' },
    { id: 'fitness', label: 'Fitness' },
    { id: 'lifestyle', label: 'Lifestyle' }
  ];

  const filteredProducts = activeFilter === 'all' 
    ? products 
    : products.filter(p => p.category === activeFilter);

  const toggleWishlist = (productId, e) => {
    e.stopPropagation(); // Evitar que se active la navegación
    setWishlist(prev => 
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleAddToCart = (product, e) => {
    e.stopPropagation(); // Evitar que se active la navegación
    console.log('Añadido al carrito:', product);
    // Aquí puedes implementar la lógica del carrito
  };

  const handleProductClick = (productId) => {
    navigate(`/product/${productId}`);
  };

  return (
    <div className="catalog-container">
      {/* Header */}
      <div className="catalog-header">
        <h1 className="catalog-title">Catálogo de Productos</h1>
      </div>

      {/* Filters */}
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

      {/* Products Grid */}
      {filteredProducts.length > 0 ? (
        <>
          <div className="catalog-grid">
            {filteredProducts.map(product => (
              <div 
                key={product.id} 
                className="product-card"
                onClick={() => handleProductClick(product.id)}
                style={{ cursor: 'pointer' }}
              >
                {/* Image Container */}
                <div className="product-image-container">
                  <img 
                    src={product.image} 
                    alt={product.name}
                    className="product-image"
                  />
                  
                  {/* Badge */}
                  {product.badge && (
                    <span className="product-badge">{product.badge}</span>
                  )}
                  
                  {/* Wishlist Button */}
                  <button 
                    className={`product-wishlist ${wishlist.includes(product.id) ? 'active' : ''}`}
                    onClick={(e) => toggleWishlist(product.id, e)}
                    aria-label="Agregar a favoritos"
                  >
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" 
                      />
                    </svg>
                  </button>
                </div>

                {/* Product Info */}
                <div className="product-info">
                  <h3 className="product-name">{product.name}</h3>
                  
                  <div className="product-provider">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" 
                      />
                    </svg>
                    {product.provider}
                  </div>

                  <div className="product-footer">
                    <div>
                      <div className="product-price-label">Precio</div>
                      <div className="product-price">${product.price}</div>
                    </div>
                    
                    <button 
                      className="add-to-cart-btn"
                      onClick={(e) => handleAddToCart(product, e)}
                    >
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" 
                        />
                      </svg>
                      <span>Añadir</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Load More Button */}
          <div className="load-more-container">
            <button className="load-more-btn">
              Cargar más productos
            </button>
          </div>
        </>
      ) : (
        <div className="catalog-empty">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" 
            />
          </svg>
          <h3>No se encontraron productos</h3>
          <p>Intenta cambiar los filtros de búsqueda</p>
        </div>
      )}
    </div>
  );
};

export default Catalog;