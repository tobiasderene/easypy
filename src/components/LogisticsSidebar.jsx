// LogisticsSidebar.jsx
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { logout } from '../services/api';
import { useUser } from '../App';
import '../styles/sidebar.css';

const LogisticsSidebar = ({ isOpen, onClose }) => {
  const navigate   = useNavigate();
  const location   = useLocation();
  const { setUser } = useUser();

  const activePage = location.pathname.split('/')[1] || '';

  const handleLinkClick = (path) => {
    navigate(path);
    onClose();
  };

  const handleLogout = async () => {
    localStorage.removeItem('auth_token');
    setUser(null);
    try { await logout(); } catch {}
    navigate('/login', { replace: true });
    onClose();
  };

  return (
    <>
      <div
        className={`sidebar-overlay ${isOpen ? 'active' : ''}`}
        onClick={onClose}
      />

      <aside className={`sidebar ${isOpen ? 'active' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <img src="/full-logo.png" alt="EasyDrop" className="sidebar-logo-img" />
          </div>
          <button className="sidebar-close" onClick={onClose} aria-label="Cerrar menú">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="sidebar-content">
          <ul className="sidebar-menu">

            {/* Panel de envíos */}
            <li className="sidebar-item">
              <button
                className={`sidebar-link ${activePage === 'logistics' ? 'active' : ''}`}
                onClick={() => handleLinkClick('/logistics')}
              >
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                </svg>
                <span>Mis Envíos</span>
              </button>
            </li>

            {/* Configuración */}
            <li className="sidebar-item">
              <button
                className={`sidebar-link ${activePage === 'configuracion' ? 'active' : ''}`}
                onClick={() => handleLinkClick('/configuracion')}
              >
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Configuración</span>
              </button>
            </li>

          </ul>

          <div className="sidebar-footer">
            <button className="sidebar-logout" onClick={handleLogout}>
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </nav>
      </aside>
    </>
  );
};

export default LogisticsSidebar;