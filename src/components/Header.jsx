// Header.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/header.css';

const Header = ({
  userName = "Usuario",
  userBalance = null,
  userAvatar = null,
  onMenuClick,
  onSearch,
  onUserClick,
  onCartClick,
  cartItemsCount = 0
}) => {
  const navigate = useNavigate();

  const handleSearch = (e) => {
    if (onSearch) onSearch(e.target.value);
  };

  const handleWalletClick = () => {
    navigate('/wallet');
  };

  const getInitials = (name) =>
    name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  const formatBalance = (balance) => {
    if (balance === null || balance === undefined) return '...';
    return new Intl.NumberFormat('es-PY', {
      style: 'currency',
      currency: 'PYG',
      minimumFractionDigits: 0,
    }).format(balance);
  };

  return (
    <header className="header">
      <button className="burger-button" onClick={onMenuClick} aria-label="Abrir menú">
        <span className="burger-line"></span>
        <span className="burger-line"></span>
        <span className="burger-line"></span>
      </button>

      <div className="logo">
        <span className="logo-easy">EASY</span>
        <span className="logo-drop">DROP</span>
      </div>

      <div className="search-container">
        <svg className="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          className="search-input"
          placeholder="Buscar productos o proveedores..."
          onChange={handleSearch}
        />
      </div>

      <div className="header-actions">
        <button className="wallet" onClick={handleWalletClick} aria-label="Ir a billetera">
          <svg className="wallet-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
          <span>{formatBalance(userBalance)}</span>
        </button>

        <button className="cart-button" onClick={onCartClick} aria-label="Abrir carrito">
          <svg
            className="cart-icon"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            width="20"
            height="20"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          {cartItemsCount > 0 && (
            <span className="cart-badge">{cartItemsCount}</span>
          )}
        </button>

        <button className="user-button" onClick={onUserClick}>
          <div className="user-avatar">
            {userAvatar ? (
              <img src={userAvatar} alt={userName} />
            ) : (
              getInitials(userName)
            )}
          </div>
          <span className="user-name">{userName}</span>
        </button>
      </div>
    </header>
  );
};

export default Header;