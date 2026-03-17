import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProviders, getProfileImage } from '../services/api';
import '../styles/providers.css';

const Providers = () => {
  const navigate = useNavigate();
  const [providers, setProviders]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [favorites, setFavorites]   = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    getProviders()
      .then(async (data) => {
        const withImages = await Promise.all(
          (data || []).map(async (p) => {
            try {
              const img = await getProfileImage(p.user_id);
              return { ...p, avatarUrl: img?.image_url || null };
            } catch {
              return { ...p, avatarUrl: null };
            }
          })
        );
        setProviders(withImages);
      })
      .catch(() => setProviders([]))
      .finally(() => setLoading(false));
  }, []);

  const toggleFavorite = (id, e) => {
    e.stopPropagation();
    setFavorites(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const getInitials = (name) =>
    (name || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  const filtered = providers.filter(p =>
    p.user_nickname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.user_description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="providers-container">

      {/* Header */}
      <div className="providers-header">
        <h1 className="providers-title">Proveedores</h1>
        <p className="providers-subtitle">Explorá los proveedores disponibles en la plataforma</p>
      </div>

      {/* Search */}
      <div className="providers-search">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="18" height="18">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Buscar proveedores..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Grid */}
      {loading ? (
        <div className="providers-empty">
          <p style={{ color: '#9ca3af' }}>Cargando proveedores...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="providers-empty">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <h3>No se encontraron proveedores</h3>
          <p>Intentá cambiar los términos de búsqueda</p>
        </div>
      ) : (
        <div className="providers-grid">
          {filtered.map(provider => (
            <div
              key={provider.user_id}
              className="provider-card"
              onClick={() => navigate(`/proveedor/${provider.user_id}`)}
              style={{ cursor: 'pointer' }}
            >
              {/* Avatar / Image */}
              <div className="provider-image-container">
                {provider.avatarUrl ? (
                  <img src={provider.avatarUrl} alt={provider.user_nickname} className="provider-image" />
                ) : (
                  <div className="provider-avatar-placeholder">
                    {getInitials(provider.user_nickname)}
                  </div>
                )}

                {/* Favorite */}
                <button
                  className={`provider-favorite ${favorites.includes(provider.user_id) ? 'active' : ''}`}
                  onClick={(e) => toggleFavorite(provider.user_id, e)}
                  aria-label="Agregar a favoritos"
                >
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                    />
                  </svg>
                </button>
              </div>

              {/* Info */}
              <div className="provider-info">
                <div className="provider-header">
                  <h3 className="provider-name">{provider.user_nickname}</h3>
                </div>

                {provider.user_description && (
                  <p className="provider-description">{provider.user_description}</p>
                )}

                <div className="provider-meta">
                  <span className="provider-meta-item">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="14" height="14">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    {provider.email}
                  </span>
                </div>

                <button
                  className="contact-provider-btn"
                  onClick={(e) => { e.stopPropagation(); navigate(`/proveedor/${provider.user_id}`); }}
                >
                  Ver perfil
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Providers;