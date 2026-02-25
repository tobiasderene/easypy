import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/providers.css';

const Providers = () => {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState('all');
  const [favorites, setFavorites] = useState([]);

  // Proveedores de ejemplo
  const providers = [
    {
      id: 1,
      name: "TechGlobal Suppliers",
      description: "Proveedor líder en electrónica y gadgets tecnológicos con envíos globales",
      location: "Shenzhen, China",
      rating: 4.8,
      totalProducts: 1240,
      minOrder: 50,
      shippingTime: "7-15 días",
      image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80",
      badge: "Verified",
      category: "electronics",
      specialties: ["Smartphones", "Wearables", "Audio"]
    },
    {
      id: 2,
      name: "AudioPro Wholesale",
      description: "Especialistas en audio premium y accesorios de alta calidad",
      location: "Hong Kong, China",
      rating: 4.9,
      totalProducts: 580,
      minOrder: 30,
      shippingTime: "5-12 días",
      image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80",
      badge: "Top Rated",
      category: "electronics",
      specialties: ["Auriculares", "Altavoces", "Micrófonos"]
    },
    {
      id: 3,
      name: "HealthLife Direct",
      description: "Productos para salud, bienestar y estilo de vida saludable",
      location: "Los Angeles, USA",
      rating: 4.7,
      totalProducts: 890,
      minOrder: 25,
      shippingTime: "3-7 días",
      image: "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=800&q=80",
      badge: "Fast Ship",
      category: "health",
      specialties: ["Fitness", "Nutrición", "Wellness"]
    },
    {
      id: 4,
      name: "BeautyHub Wholesale",
      description: "Mayorista de productos de belleza y cuidado personal",
      location: "Seoul, Korea del Sur",
      rating: 4.9,
      totalProducts: 1560,
      minOrder: 40,
      shippingTime: "8-14 días",
      image: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&q=80",
      badge: "Top Rated",
      category: "beauty",
      specialties: ["Skincare", "Maquillaje", "Hair Care"]
    },
    {
      id: 5,
      name: "SmartHome Direct",
      description: "Innovación en domótica y productos para el hogar inteligente",
      location: "Guangzhou, China",
      rating: 4.6,
      totalProducts: 720,
      minOrder: 35,
      shippingTime: "10-18 días",
      image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
      badge: "Verified",
      category: "home",
      specialties: ["IoT", "Iluminación", "Seguridad"]
    },
    {
      id: 6,
      name: "FitLife Wholesale",
      description: "Equipamiento deportivo y accesorios para fitness profesional",
      location: "Bangkok, Tailandia",
      rating: 4.8,
      totalProducts: 650,
      minOrder: 20,
      shippingTime: "6-13 días",
      image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80",
      badge: "Fast Ship",
      category: "fitness",
      specialties: ["Yoga", "Gimnasio", "Outdoor"]
    },
    {
      id: 7,
      name: "OfficeTech Suppliers",
      description: "Soluciones completas para oficina y espacios de trabajo",
      location: "Taipei, Taiwán",
      rating: 4.7,
      totalProducts: 980,
      minOrder: 30,
      shippingTime: "7-14 días",
      image: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800&q=80",
      badge: "Verified",
      category: "office",
      specialties: ["Escritorio", "Accesorios PC", "Organización"]
    },
    {
      id: 8,
      name: "ContentCreator Supply",
      description: "Todo para creadores de contenido y streamers profesionales",
      location: "Singapur",
      rating: 4.9,
      totalProducts: 420,
      minOrder: 15,
      shippingTime: "5-10 días",
      image: "https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?w=800&q=80",
      badge: "Top Rated",
      category: "electronics",
      specialties: ["Streaming", "Iluminación", "Cámaras"]
    },
    {
      id: 9,
      name: "MobileGear Plus",
      description: "Accesorios premium para smartphones y tablets",
      location: "Shenzhen, China",
      rating: 4.6,
      totalProducts: 1100,
      minOrder: 50,
      shippingTime: "8-16 días",
      image: "https://images.unsplash.com/photo-1556656793-08538906a9f8?w=800&q=80",
      badge: "Verified",
      category: "accessories",
      specialties: ["Fundas", "Cargadores", "Protectores"]
    },
    {
      id: 10,
      name: "EcoLife Products",
      description: "Productos ecológicos y sostenibles para el hogar",
      location: "Portland, USA",
      rating: 4.8,
      totalProducts: 340,
      minOrder: 25,
      shippingTime: "4-9 días",
      image: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&q=80",
      badge: "Fast Ship",
      category: "lifestyle",
      specialties: ["Eco-friendly", "Reutilizable", "Orgánico"]
    },
    {
      id: 11,
      name: "PetCare Wholesale",
      description: "Productos y accesorios para mascotas de todas las especies",
      location: "Melbourne, Australia",
      rating: 4.7,
      totalProducts: 780,
      minOrder: 30,
      shippingTime: "10-20 días",
      image: "https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=800&q=80",
      badge: "Verified",
      category: "pets",
      specialties: ["Perros", "Gatos", "Acuarios"]
    },
    {
      id: 12,
      name: "KidsWorld Direct",
      description: "Juguetes educativos y productos para niños",
      location: "Shanghai, China",
      rating: 4.9,
      totalProducts: 920,
      minOrder: 40,
      shippingTime: "7-15 días",
      image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&q=80",
      badge: "Top Rated",
      category: "kids",
      specialties: ["Educativo", "Juguetes", "Ropa infantil"]
    }
  ];

  const filters = [
    { id: 'all', label: 'Todos' },
    { id: 'electronics', label: 'Electrónica' },
    { id: 'beauty', label: 'Belleza' },
    { id: 'home', label: 'Hogar' },
    { id: 'fitness', label: 'Fitness' },
    { id: 'lifestyle', label: 'Lifestyle' },
    { id: 'accessories', label: 'Accesorios' }
  ];

  const filteredProviders = activeFilter === 'all' 
    ? providers 
    : providers.filter(p => p.category === activeFilter);

  const toggleFavorite = (providerId, e) => {
    e.stopPropagation();
    setFavorites(prev => 
      prev.includes(providerId)
        ? prev.filter(id => id !== providerId)
        : [...prev, providerId]
    );
  };

  const handleContactProvider = (provider, e) => {
    e.stopPropagation();
    console.log('Contactar proveedor:', provider);
    // Aquí puedes implementar la lógica de contacto
  };

  const handleProviderClick = (providerId) => {
    navigate(`/proveedor/${providerId}`);
  };

  return (
    <div className="providers-container">
      {/* Header */}
      <div className="providers-header">
        <h1 className="providers-title">Proveedores Verificados</h1>
      </div>

      {/* Filters */}
      <div className="providers-filters">
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

      {/* Providers Grid */}
      {filteredProviders.length > 0 ? (
        <>
          <div className="providers-grid">
            {filteredProviders.map(provider => (
              <div 
                key={provider.id} 
                className="provider-card"
                onClick={() => handleProviderClick(provider.id)}
                style={{ cursor: 'pointer' }}
              >
                {/* Image Container */}
                <div className="provider-image-container">
                  <img 
                    src={provider.image} 
                    alt={provider.name}
                    className="provider-image"
                  />
                  
                  {/* Badge */}
                  {provider.badge && (
                    <span className="provider-badge">{provider.badge}</span>
                  )}
                  
                  {/* Favorite Button */}
                  <button 
                    className={`provider-favorite ${favorites.includes(provider.id) ? 'active' : ''}`}
                    onClick={(e) => toggleFavorite(provider.id, e)}
                    aria-label="Agregar a favoritos"
                  >
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" 
                      />
                    </svg>
                  </button>
                </div>

                {/* Provider Info */}
                <div className="provider-info">
                  <div className="provider-header">
                    <h3 className="provider-name">{provider.name}</h3>
                    <div className="provider-rating">
                      <svg fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span>{provider.rating}</span>
                    </div>
                  </div>
                  
                  <p className="provider-description">{provider.description}</p>

                  <div className="provider-location">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" 
                      />
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" 
                      />
                    </svg>
                    {provider.location}
                  </div>

                  {/* Specialties */}
                  <div className="provider-specialties">
                    {provider.specialties.map((specialty, index) => (
                      <span key={index} className="specialty-tag">
                        {specialty}
                      </span>
                    ))}
                  </div>

                  {/* Stats */}
                  <div className="provider-stats">
                    <div className="stat-item">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" 
                        />
                      </svg>
                      <div>
                        <div className="stat-value">{provider.totalProducts}</div>
                        <div className="stat-label">Productos</div>
                      </div>
                    </div>

                    <div className="stat-item">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" 
                        />
                      </svg>
                      <div>
                        <div className="stat-value">${provider.minOrder}</div>
                        <div className="stat-label">Pedido mín.</div>
                      </div>
                    </div>

                    <div className="stat-item">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" 
                        />
                      </svg>
                      <div>
                        <div className="stat-value">{provider.shippingTime}</div>
                        <div className="stat-label">Envío</div>
                      </div>
                    </div>
                  </div>

                  {/* Contact Button */}
                  <button 
                    className="contact-provider-btn"
                    onClick={(e) => handleContactProvider(provider, e)}
                  >
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" 
                      />
                    </svg>
                    <span>Contactar</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Load More Button */}
          <div className="load-more-container">
            <button className="load-more-btn">
              Cargar más proveedores
            </button>
          </div>
        </>
      ) : (
        <div className="providers-empty">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" 
            />
          </svg>
          <h3>No se encontraron proveedores</h3>
          <p>Intenta cambiar los filtros de búsqueda</p>
        </div>
      )}
    </div>
  );
};

export default Providers;