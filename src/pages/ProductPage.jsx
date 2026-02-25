import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../styles/assets.css';
import '../styles/product.css';

const ProductPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState('black');
  const [selectedSize, setSelectedSize] = useState('M');
  const [activeTab, setActiveTab] = useState('description');
  const [isFavorite, setIsFavorite] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  const images = [
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1560343090-f0409e92791a?w=800&h=800&fit=crop'
  ];

  const specs = [
    { label: 'Material', value: 'Acero inoxidable premium' },
    { label: 'Dimensiones', value: '15 x 10 x 5 cm' },
    { label: 'Peso', value: '350 gramos' },
    { label: 'Color disponible', value: 'Negro, Azul, Rojo, Blanco' },
    { label: 'Origen', value: 'Fabricado en Alemania' },
    { label: 'Garantía', value: '2 años del fabricante' }
  ];

  const reviews = [
    {
      name: 'María González',
      date: '5 de febrero, 2026',
      rating: 5,
      text: '¡Excelente producto! La calidad es increíble y llegó muy rápido. Totalmente recomendado para cualquiera que busque algo duradero y elegante.'
    },
    {
      name: 'Carlos Ramírez',
      date: '1 de febrero, 2026',
      rating: 5,
      text: 'Superó mis expectativas. El diseño es moderno y funcional. Vale cada centavo invertido.'
    },
    {
      name: 'Ana Martínez',
      date: '28 de enero, 2026',
      rating: 4,
      text: 'Muy buen producto, aunque tardó un poco más de lo esperado en llegar. La calidad es excelente.'
    }
  ];

  const handleAddToCart = () => {
    setCartCount(cartCount + quantity);
    alert(`¡${quantity} producto(s) agregado(s) al carrito!`);
  };

  const handleBuyNow = () => {
    navigate('/order/new');
  };

  return (
    <div className="product-page">
      <div className="container">
        

        {/* Product Grid */}
        <div className="product-grid">
          {/* Gallery */}
          <div className="gallery">
            <div className="main-image-container">
              <img 
                src={images[selectedImage]} 
                alt="Producto principal" 
                className="main-image"
              />
              <div className="discount-badge">-35% OFF</div>
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
            
            <div className="thumbnails">
              {images.map((img, idx) => (
                <div 
                  key={idx}
                  className={`thumbnail ${selectedImage === idx ? 'active' : ''}`}
                  onClick={() => setSelectedImage(idx)}
                >
                  <img src={img} alt={`Vista ${idx + 1}`} />
                </div>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div className="product-info">
            <div className="breadcrumb">
              <a href="#" className="breadcrumb-link">Inicio</a>
              <span className="breadcrumb-separator">/</span>
              <a href="#" className="breadcrumb-link">Electrónicos</a>
              <span className="breadcrumb-separator">/</span>
              <span>Producto Premium</span>
            </div>

            <h1 className="product-title">
              Reloj Inteligente Premium Serie 5 Pro
            </h1>

            <div className="rating-section">
              <div className="stars">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                ))}
              </div>
              <span className="rating-text">4.9/5.0</span>
              <a href="#reviews" className="reviews-link">(324 reseñas)</a>
            </div>

            <div className="price-section">
              <div className="price-row">
                <span className="current-price">$129.99</span>
                <span className="original-price">$199.99</span>
              </div>
              <div className="save-text">Ahorras $70.00 (35%)</div>
            </div>

            <p className="description">
              Experimenta la tecnología de última generación con nuestro reloj inteligente premium. 
              Diseñado para quienes buscan estilo y funcionalidad, combina materiales de alta calidad 
              con características avanzadas para acompañarte en tu día a día. Monitor de salud 24/7, 
              resistencia al agua y batería de larga duración.
            </p>

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

            {/* Stock Info */}
            <div className="stock-info">
              <span className="stock-dot"></span>
              <span className="stock-text">En stock - Solo quedan 12 unidades</span>
            </div>

            {/* Action Buttons */}
            <div className="action-buttons">
              <button className="add-to-cart-btn" onClick={handleAddToCart}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="9" cy="21" r="1" />
                  <circle cx="20" cy="21" r="1" />
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                </svg>
                Agregar al carrito
              </button>
              <button className="buy-now-btn" onClick={handleBuyNow}>
                Comprar ahora
              </button>
            </div>
          </div>
        </div>

        {/* Tabs Section */}
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
            <button 
              className={`tab-btn ${activeTab === 'reviews' ? 'active' : ''}`}
              onClick={() => setActiveTab('reviews')}
            >
              Reseñas (324)
            </button>
            <button 
              className={`tab-btn ${activeTab === 'shipping' ? 'active' : ''}`}
              onClick={() => setActiveTab('shipping')}
            >
              Envío
            </button>
          </div>

          {/* Description Tab */}
          <div className={`tab-content ${activeTab === 'description' ? 'active' : ''}`}>
            <h2 className="product-title" style={{ fontSize: '24px', marginBottom: '20px' }}>
              Acerca de este producto
            </h2>
            <p className="description" style={{ marginBottom: '16px' }}>
              El Reloj Inteligente Premium Serie 5 Pro representa la culminación de años de innovación 
              en tecnología wearable. Diseñado meticulosamente para ofrecer la mejor experiencia posible, 
              cada aspecto ha sido optimizado para rendimiento y estilo.
            </p>
            <p className="description" style={{ marginBottom: '16px' }}>
              Con una pantalla AMOLED de alta resolución, el brillo se ajusta automáticamente para 
              ofrecer la mejor visibilidad en cualquier condición de iluminación. El procesador de 
              última generación garantiza una experiencia fluida y responsiva.
            </p>
            <p className="description">
              La batería de larga duración te permite usar el reloj durante días sin preocuparte por 
              cargarlo constantemente. Además, la carga rápida te da horas de uso con solo minutos 
              de carga.
            </p>
          </div>

          {/* Specs Tab */}
          <div className={`tab-content ${activeTab === 'specs' ? 'active' : ''}`}>
            <h2 className="product-title" style={{ fontSize: '24px', marginBottom: '20px' }}>
              Especificaciones técnicas
            </h2>
            <div className="specs-grid">
              {specs.map((spec, idx) => (
                <div key={idx} className="spec-item">
                  <div className="spec-label">{spec.label}:</div>
                  <div className="spec-value">{spec.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Reviews Tab */}
          <div className={`tab-content ${activeTab === 'reviews' ? 'active' : ''}`} id="reviews">
            <div className="review-summary">
              <div className="review-stats">
                <div>
                  <div className="rating-large">4.9</div>
                  <div className="stars" style={{ marginTop: '8px' }}>
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="description" style={{ marginBottom: '8px' }}>
                    Basado en 324 reseñas verificadas
                  </p>
                  <p className="description">
                    98% de los clientes recomiendan este producto
                  </p>
                </div>
              </div>
            </div>

            {reviews.map((review, idx) => (
              <div key={idx} className="review-card">
                <div className="review-header">
                  <div>
                    <div className="reviewer-name">{review.name}</div>
                    <div className="stars" style={{ marginTop: '4px' }}>
                      {[...Array(review.rating)].map((_, i) => (
                        <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                      ))}
                    </div>
                  </div>
                  <div className="review-date">{review.date}</div>
                </div>
                <p className="review-text">{review.text}</p>
              </div>
            ))}
          </div>

          {/* Shipping Tab */}
          <div className={`tab-content ${activeTab === 'shipping' ? 'active' : ''}`}>
            <h2 className="product-title" style={{ fontSize: '24px', marginBottom: '20px' }}>
              Información de envío
            </h2>
            <div className="description" style={{ marginBottom: '24px' }}>
              <p style={{ marginBottom: '16px' }}>
                <strong>Envío estándar gratuito</strong> en pedidos superiores a $50. 
                Tiempo estimado de entrega: 5-7 días hábiles.
              </p>
              <p style={{ marginBottom: '16px' }}>
                <strong>Envío express disponible</strong> con entrega en 2-3 días hábiles por $12.99.
              </p>
              <p style={{ marginBottom: '16px' }}>
                <strong>Envío internacional</strong> disponible para la mayoría de países. 
                Los tiempos y costos varían según el destino.
              </p>
              <p>
                Todos los envíos incluyen número de rastreo y seguro completo del producto.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductPage;