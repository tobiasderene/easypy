import React from 'react';
import { X, ShoppingCart, Trash2, Plus, Minus, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import '../styles/cartsidebar.css';

const CartSidebar = ({ isOpen, onClose, cart, updateQuantity, removeFromCart, clearCart }) => {
  const navigate = useNavigate();

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-PY', {
      style: 'currency',
      currency: 'PYG',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Get provider name (all items should be from same provider)
  const providerName = cart.length > 0 ? cart[0].provider : '';

  const handleCheckout = () => {
    // Navegar al formulario de orden con los datos del carrito
    navigate('/order/new', { state: { cart, providerName } });
    onClose();
  };

  return (
    <>
      {/* Overlay */}
      <div
        className={`cart-overlay ${isOpen ? 'active' : ''}`}
        onClick={onClose}
      />

      {/* Cart Sidebar */}
      <aside className={`cart-sidebar ${isOpen ? 'active' : ''}`}>
        {/* Header */}
        <div className="cart-header">
          <div className="cart-title">
            <ShoppingCart size={24} />
            <h2>Carrito de Compras</h2>
            {totalItems > 0 && (
              <span className="cart-badge">{totalItems}</span>
            )}
          </div>
          <button className="cart-close" onClick={onClose} aria-label="Cerrar carrito">
            <X size={20} />
          </button>
        </div>

        {/* Cart Content */}
        <div className="cart-content">
          {cart.length === 0 ? (
            // Empty State
            <div className="cart-empty">
              <ShoppingCart size={64} />
              <h3>Tu carrito está vacío</h3>
              <p>Agrega productos para comenzar tu orden</p>
            </div>
          ) : (
            <>
              {/* Provider Info */}
              <div className="cart-provider-info">
                <div className="provider-badge">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="1" y="3" width="15" height="13"></rect>
                    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
                    <circle cx="5.5" cy="18.5" r="2.5"></circle>
                    <circle cx="18.5" cy="18.5" r="2.5"></circle>
                  </svg>
                  <span>Proveedor: {providerName}</span>
                </div>
                <button 
                  className="btn-clear-cart"
                  onClick={clearCart}
                  title="Vaciar carrito"
                >
                  <Trash2 size={16} />
                  Vaciar
                </button>
              </div>

              {/* Cart Items */}
              <div className="cart-items">
                {cart.map((item) => (
                  <div key={item.id} className="cart-item">
                    <div className="cart-item-image">
                      <img src={item.image} alt={item.name} />
                    </div>

                    <div className="cart-item-details">
                      <h4 className="cart-item-name">{item.name}</h4>
                      <p className="cart-item-price">{formatCurrency(item.price)}</p>
                      
                      <div className="cart-item-actions">
                        {/* Quantity Controls */}
                        <div className="quantity-controls">
                          <button
                            className="qty-btn"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                          >
                            <Minus size={14} />
                          </button>
                          <span className="qty-value">{item.quantity}</span>
                          <button
                            className="qty-btn"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          >
                            <Plus size={14} />
                          </button>
                        </div>

                        {/* Remove Button */}
                        <button
                          className="btn-remove"
                          onClick={() => removeFromCart(item.id)}
                          title="Eliminar"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="cart-item-total">
                      {formatCurrency(item.price * item.quantity)}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Cart Footer */}
        {cart.length > 0 && (
          <div className="cart-footer">
            <div className="cart-summary">
              <div className="summary-row">
                <span>Subtotal ({totalItems} {totalItems === 1 ? 'producto' : 'productos'})</span>
                <span className="summary-value">{formatCurrency(subtotal)}</span>
              </div>
            </div>

            <button 
              className="btn-checkout"
              onClick={handleCheckout}
            >
              Proceder al Pago
            </button>
          </div>
        )}
      </aside>
    </>
  );
};

export default CartSidebar;