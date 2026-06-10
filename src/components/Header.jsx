// Header.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../App';
import { useNotifications } from '../hooks/useNotifications';
import { getProducts, getProductImagesBulk } from '../services/api';
import '../styles/header.css';

const NOTIF_ICONS = {
  order_confirmed:      '✓',
  order_processing:     '→',
  order_completed:      '★',
  order_cancelled:      '✕',
  deposit_approved:     '+',
  deposit_rejected:     '!',
  withdrawal_processed: '↑',
};

const NOTIF_COLORS = {
  order_confirmed:      '#16a34a',
  order_processing:     '#d97706',
  order_completed:      '#7c3aed',
  order_cancelled:      '#dc2626',
  deposit_approved:     '#16a34a',
  deposit_rejected:     '#dc2626',
  withdrawal_processed: '#056EB7',
};

const Header = ({
  userName    = 'Usuario',
  userBalance = null,
  userAvatar  = null,
  onMenuClick,
  onSearch,
  onUserClick,
}) => {
  const navigate                        = useNavigate();
  const { user }                        = useUser();
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications(user);
  const [showNotifs, setShowNotifs]     = useState(false);
  const notifRef                        = useRef(null);

  // ── Buscador ──────────────────────────────────────────────────────────────
  const [searchValue, setSearchValue]   = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching]       = useState(false);
  const [showResults, setShowResults]   = useState(false);
  const searchRef                       = useRef(null);
  const searchTimeoutRef                = useRef(null);

  // Cerrar al click fuera
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifs(false);
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowResults(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearchInput = (value) => {
    setSearchValue(value);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (!value.trim()) { setSearchResults([]); setShowResults(false); return; }

    searchTimeoutRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const data = await getProducts(0, 8, value.trim());
        if (data && data.length > 0) {
          // Bulk images
          const ids = data.map(p => p.product_id);
          let images = {};
          try {
            images = await getProductImagesBulk(ids);
          } catch {}
          setSearchResults(data.map(p => ({
            id:    p.product_id,
            name:  p.product_name,
            price: parseFloat(p.product_base_cost),
            sku:   p.product_sku,
            image: images[p.product_id] || null,
          })));
          setShowResults(true);
        } else {
          setSearchResults([]);
          setShowResults(true); // mostrar "sin resultados"
        }
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 350);
  };

  const handleResultClick = (product) => {
    setSearchValue('');
    setShowResults(false);
    setSearchResults([]);
    navigate(`/product/${product.id}`);
  };

  const handleSearchSubmit = (e) => {
    if (e.key === 'Enter' && searchResults.length === 1) {
      handleResultClick(searchResults[0]);
    }
  };

  const formatPrice = (v) =>
    new Intl.NumberFormat('es-PY', { style: 'currency', currency: 'PYG', minimumFractionDigits: 0 }).format(v);

  const getInitials = (name) =>
    name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  const formatBalance = (balance) => {
    if (balance === null || balance === undefined) return '...';
    return new Intl.NumberFormat('es-PY', {
      style: 'currency', currency: 'PYG', minimumFractionDigits: 0,
    }).format(balance);
  };

  const formatTime = (dateStr) => {
    try {
      const d    = new Date(dateStr);
      const now  = new Date();
      const diff = Math.floor((now - d) / 1000);
      if (diff < 60)    return 'Ahora';
      if (diff < 3600)  return `Hace ${Math.floor(diff / 60)}min`;
      if (diff < 86400) return `Hace ${Math.floor(diff / 3600)}h`;
      return d.toLocaleDateString('es-PY', { day: '2-digit', month: 'short' });
    } catch { return ''; }
  };

  const handleNotifClick = (notif) => {
    if (!notif.is_read) markRead(notif.notification_id);
    if (notif.notif_type?.includes('order') && notif.reference_id) navigate('/transacciones');
    else if (notif.notif_type?.includes('deposit') || notif.notif_type?.includes('withdrawal')) navigate('/wallet');
    setShowNotifs(false);
  };

  return (
    <header className="header">
      <button className="burger-button" onClick={onMenuClick} aria-label="Abrir menú">
        <span className="burger-line" />
        <span className="burger-line" />
        <span className="burger-line" />
      </button>

      <div className="logo" style={{ cursor: 'pointer' }} onClick={() => {
        if (!user) { navigate('/'); return; }
        if (user.user_role === 'provider')  { navigate('/provider-orders'); return; }
        if (user.user_role === 'admin')     { navigate('/admin'); return; }
        if (user.user_role === 'logistics') { navigate('/logistics'); return; }
        navigate('/catalogo');
      }}>
        <img src="/full-logo.png" alt="EasyDrop" className="logo-img" />
      </div>

      {/* ── Buscador con dropdown ── */}
      <div className="search-container" ref={searchRef} style={{ position: 'relative' }}>
        <svg className="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          className="search-input"
          placeholder="Buscar productos..."
          value={searchValue}
          onChange={e => handleSearchInput(e.target.value)}
          onKeyDown={handleSearchSubmit}
          onFocus={() => searchResults.length > 0 && setShowResults(true)}
          autoComplete="off"
        />
        {searching && (
          <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }}>
            <div style={{ width: '14px', height: '14px', border: '2px solid #e5e7eb', borderTopColor: '#056EB7', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
          </div>
        )}

        {/* Dropdown resultados */}
        {showResults && (
          <div style={{
            position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0,
            background: 'white', border: '1.5px solid #e5e7eb', borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)', zIndex: 1000, overflow: 'hidden',
            minWidth: '320px',
          }}>
            {searchResults.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#9ca3af', fontSize: '13px' }}>
                Sin resultados para "{searchValue}"
              </div>
            ) : (
              <>
                {searchResults.map(p => (
                  <div key={p.id} onClick={() => handleResultClick(p)}
                    style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid #f3f4f6', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                    onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                    {p.image
                      ? <img src={p.image} alt={p.name} style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }} />
                      : <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#f3f4f6', flexShrink: 0 }} />
                    }
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '13px', fontWeight: '700', color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</p>
                      <p style={{ fontSize: '11px', color: '#6b7280' }}>SKU: {p.sku}</p>
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: '800', color: '#056EB7', flexShrink: 0 }}>{formatPrice(p.price)}</span>
                  </div>
                ))}
                <div style={{ padding: '10px 14px', textAlign: 'center', fontSize: '12px', color: '#6b7280', borderTop: '1px solid #f3f4f6' }}>
                  {searchResults.length === 8 ? `Mostrando los primeros 8 resultados` : `${searchResults.length} resultado${searchResults.length !== 1 ? 's' : ''}`}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <div className="header-actions">
        {/* Wallet */}
        <button className="wallet" onClick={() => navigate('/wallet')} aria-label="Ir a billetera">
          <svg className="wallet-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
          <span>{formatBalance(userBalance)}</span>
        </button>

        {/* Campanita */}
        <div className="notif-wrap" ref={notifRef}>
          <button className="notif-btn" onClick={() => setShowNotifs(prev => !prev)} aria-label="Notificaciones">
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {unreadCount > 0 && <span className="notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
          </button>

          {showNotifs && (
            <div className="notif-dropdown">
              <div className="notif-dropdown-header">
                <span className="notif-dropdown-title">Notificaciones</span>
                {unreadCount > 0 && <button className="notif-read-all" onClick={markAllRead}>Marcar todas como leídas</button>}
              </div>
              <div className="notif-list">
                {notifications.length === 0 ? (
                  <div className="notif-empty">
                    <svg width="32" height="32" fill="none" stroke="#d1d5db" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    <p>No tenés notificaciones</p>
                  </div>
                ) : (
                  notifications.slice(0, 15).map(notif => {
                    const color = NOTIF_COLORS[notif.notif_type || notif.type] || '#6b7280';
                    const icon  = NOTIF_ICONS[notif.notif_type  || notif.type] || '●';
                    return (
                      <div key={notif.notification_id}
                        className={`notif-item ${!notif.is_read ? 'unread' : ''}`}
                        onClick={() => handleNotifClick(notif)}>
                        <div className="notif-icon" style={{ background: `${color}18`, color }}>{icon}</div>
                        <div className="notif-content">
                          <p className="notif-title">{notif.title}</p>
                          <p className="notif-message">{notif.message}</p>
                          <p className="notif-time">{formatTime(notif.created_at)}</p>
                        </div>
                        {!notif.is_read && <div className="notif-dot" style={{ background: color }} />}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Usuario */}
        <button className="user-button" onClick={onUserClick}>
          <div className="user-avatar">
            {userAvatar ? <img src={userAvatar} alt={userName} /> : getInitials(userName)}
          </div>
          <span className="user-name">{userName}</span>
        </button>
      </div>
    </header>
  );
};

export default Header;