// ProviderSidebar.jsx
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { logout } from '../services/api';
import { useUser } from '../App';
import '../styles/sidebar.css';

const ProviderSidebar = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useUser();

  const activePage = location.pathname.split('/')[1] || 'provider-orders';

  const handleLinkClick = (path) => { navigate(path); onClose(); };

  const handleLogout = async () => {
    localStorage.removeItem('auth_token');
    setUser(null);
    navigate('/', { replace: true });
    onClose();
    try { await logout(); } catch {}
  };

  return (
    <>
      <div className={`sidebar-overlay ${isOpen ? 'active' : ''}`} onClick={onClose} />
      <aside className={`sidebar ${isOpen ? 'active' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <img src="/full-logo.png" alt="EasyPy" className="sidebar-logo-img" />
          </div>
          <button className="sidebar-close" onClick={onClose} aria-label="Cerrar menú">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="sidebar-content">
          <ul className="sidebar-menu">
            <li className="sidebar-item">
              <button className={`sidebar-link ${activePage === 'provider-orders' ? 'active' : ''}`} onClick={() => handleLinkClick('/provider-orders')}>
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                <span>Pedidos</span>
              </button>
            </li>
            <li className="sidebar-item">
              <button className={`sidebar-link ${activePage === 'provider-catalog' ? 'active' : ''}`} onClick={() => handleLinkClick('/provider-catalog')}>
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                <span>Mi Catálogo</span>
              </button>
            </li>
            <li className="sidebar-item">
              <button className={`sidebar-link ${activePage === 'devoluciones' ? 'active' : ''}`} onClick={() => handleLinkClick('/devoluciones')}>
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z" /></svg>
                <span>Devoluciones</span>
              </button>
            </li>
            <li className="sidebar-item">
              <button className={`sidebar-link ${activePage === 'analytics' ? 'active' : ''}`} onClick={() => handleLinkClick('/analytics')}>
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                <span>Analytics</span>
              </button>
            </li>
            <li className="sidebar-item">
              <button className={`sidebar-link ${activePage === 'wallet' ? 'active' : ''}`} onClick={() => handleLinkClick('/wallet')}>
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                <span>Billetera</span>
              </button>
            </li>
            <li className="sidebar-item">
              <button className={`sidebar-link ${activePage === 'configuracion' ? 'active' : ''}`} onClick={() => handleLinkClick('/configuracion')}>
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                <span>Configuración</span>
              </button>
            </li>
          </ul>
          <div className="sidebar-footer">
            <button className="sidebar-logout" onClick={handleLogout}>
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </nav>
      </aside>
    </>
  );
};

export default ProviderSidebar;