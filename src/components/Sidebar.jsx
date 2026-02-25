// Sidebar.jsx
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/sidebar.css';

const Sidebar = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isProductsOpen, setIsProductsOpen] = useState(false);

  // Detectar la página activa desde la URL
  const activePage = location.pathname.split('/')[1] || 'dashboard';

  const toggleProducts = () => {
    setIsProductsOpen(!isProductsOpen);
  };

  const handleLinkClick = (path) => {
    navigate(path);
    onClose();
  };

  return (
    <>
      {/* Overlay */}
      <div
        className={`sidebar-overlay ${isOpen ? 'active' : ''}`}
        onClick={onClose}
      />

      {/* Sidebar */}
      <aside className={`sidebar ${isOpen ? 'active' : ''}`}>
        {/* Header */}
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <span className="sidebar-logo-easy">EASY</span>
            <span className="sidebar-logo-store">STORE</span>
          </div>
          <button className="sidebar-close" onClick={onClose} aria-label="Cerrar menú">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <nav className="sidebar-content">
          <ul className="sidebar-menu">

            {/* Productos Accordion */}
            <li className="sidebar-item sidebar-accordion">
              <button
                className={`sidebar-accordion-button ${isProductsOpen ? 'active' : ''}`}
                onClick={toggleProducts}
              >
                <div className="sidebar-accordion-title">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                    />
                  </svg>
                  <span>Productos</span>
                </div>
                <svg
                  className={`sidebar-accordion-icon ${isProductsOpen ? 'open' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {/* Submenu */}
              <div className={`sidebar-accordion-content ${isProductsOpen ? 'open' : ''}`}>
                <ul className="sidebar-submenu">
                  <li>
                    <button
                      className={`sidebar-sublink ${activePage === 'catalogo' ? 'active' : ''}`}
                      onClick={() => handleLinkClick('/catalogo')}
                    >
                      Catálogo
                    </button>
                  </li>
                  <li>
                    <button
                      className={`sidebar-sublink ${activePage === 'proveedores' ? 'active' : ''}`}
                      onClick={() => handleLinkClick('/proveedores')}
                    >
                      Proveedores
                    </button>
                  </li>
                </ul>
              </div>
            </li>

            {/* Transacciones */}
            <li className="sidebar-item">
              <button
                className={`sidebar-link ${activePage === 'transacciones' ? 'active' : ''}`}
                onClick={() => handleLinkClick('/transacciones')}
              >
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                  />
                </svg>
                <span>Transacciones</span>
              </button>
            </li>

            {/* Analytics */}
            <li className="sidebar-item">
              <button
                className={`sidebar-link ${activePage === 'analytics' ? 'active' : ''}`}
                onClick={() => handleLinkClick('/analytics')}
              >
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                <span>Analytics</span>
              </button>
            </li>

            {/* Configuración */}
            <li className="sidebar-item">
              <button
                className={`sidebar-link ${activePage === 'configuracion' ? 'active' : ''}`}
                onClick={() => handleLinkClick('/configuracion')}
              >
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <span>Configuración</span>
              </button>
            </li>

          </ul>

          {/* Footer / Logout */}
          <div className="sidebar-footer">
            <button
              className="sidebar-logout"
              onClick={() => {
                localStorage.removeItem('isAuthenticated');
                localStorage.removeItem('userName');
                navigate('/login');
                onClose();
              }}
            >
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;