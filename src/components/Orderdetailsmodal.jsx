    import React from 'react';
import { X, CheckCircle, XCircle, Package, Truck, MapPin, User, Phone, MessageSquare } from 'lucide-react';
import '../styles/OrderDetailsModal.css';

const OrderDetailsModal = ({ order, onClose, onUpdateStatus, statusConfig, formatCurrency, formatDate }) => {
  
  const handleConfirm = () => {
    onUpdateStatus(order.id, 'confirmed');
  };

  const handleReject = () => {
    if (window.confirm('¿Estás seguro de rechazar este pedido?')) {
      onUpdateStatus(order.id, 'rejected');
    }
  };

  const handleStartPreparing = () => {
    onUpdateStatus(order.id, 'preparing');
  };

  const handleMarkReady = () => {
    onUpdateStatus(order.id, 'ready');
  };

  const handleComplete = () => {
    if (window.confirm('¿Confirmar que el pedido ha sido entregado?')) {
      onUpdateStatus(order.id, 'completed');
    }
  };

  // Renderizar botones según el estado
  const renderActionButtons = () => {
    switch (order.status) {
      case 'pending':
        return (
          <div className="modal-actions">
            <button className="btn-action reject" onClick={handleReject}>
              <XCircle size={18} />
              Rechazar Pedido
            </button>
            <button className="btn-action confirm" onClick={handleConfirm}>
              <CheckCircle size={18} />
              Confirmar Pedido
            </button>
          </div>
        );
      
      case 'confirmed':
        return (
          <div className="modal-actions">
            <button className="btn-action preparing" onClick={handleStartPreparing}>
              <Package size={18} />
              Iniciar Preparación
            </button>
          </div>
        );
      
      case 'preparing':
        return (
          <div className="modal-actions">
            <button className="btn-action ready" onClick={handleMarkReady}>
              <Truck size={18} />
              Marcar como Listo
            </button>
          </div>
        );
      
      case 'ready':
        return (
          <div className="modal-actions">
            <button className="btn-action complete" onClick={handleComplete}>
              <CheckCircle size={18} />
              Confirmar Entrega
            </button>
          </div>
        );
      
      case 'rejected':
      case 'completed':
        return (
          <div className="info-box">
            <span>
              {order.status === 'completed' 
                ? '✅ Este pedido ya fue completado' 
                : '❌ Este pedido fue rechazado'}
            </span>
          </div>
        );
      
      default:
        return null;
    }
  };

  const StatusIcon = statusConfig[order.status].icon;

  return (
    <div className="order-modal-overlay" onClick={onClose}>
      <div className="order-modal-container" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="order-modal-header">
          <div className="modal-title-section">
            <h2>Detalles del Pedido</h2>
            <span className="order-modal-id">{order.id}</span>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Status Badge */}
        <div className="order-modal-status">
          <div 
            className="status-badge-large"
            style={{
              backgroundColor: statusConfig[order.status].bgColor,
              color: statusConfig[order.status].color
            }}
          >
            <StatusIcon size={20} />
            <span>{statusConfig[order.status].label}</span>
          </div>
        </div>

        {/* Body */}
        <div className="order-modal-body">
          
          {/* Product Details */}
          <div className="details-section">
            <h3 className="section-title">Información del Producto</h3>
            <div className="product-details">
              <div className="product-image-large">
                <img src={order.product.image} alt={order.product.name} />
              </div>
              <div className="product-info-details">
                <h4>{order.product.name}</h4>
                <div className="product-specs">
                  <div className="spec-item">
                    <span className="spec-label">SKU:</span>
                    <span className="spec-value">{order.product.sku}</span>
                  </div>
                  <div className="spec-item">
                    <span className="spec-label">Cantidad:</span>
                    <span className="spec-value">{order.product.quantity} unidades</span>
                  </div>
                  <div className="spec-item">
                    <span className="spec-label">Precio unitario:</span>
                    <span className="spec-value">{formatCurrency(order.product.unitPrice)}</span>
                  </div>
                  <div className="spec-item total">
                    <span className="spec-label">Total:</span>
                    <span className="spec-value">{formatCurrency(order.product.total)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Customer Details */}
          <div className="details-section">
            <h3 className="section-title">Información del Cliente</h3>
            <div className="customer-details">
              <div className="detail-row">
                <User size={18} />
                <div>
                  <span className="detail-label">Cliente</span>
                  <span className="detail-value">{order.buyer}</span>
                </div>
              </div>
              <div className="detail-row">
                <MapPin size={18} />
                <div>
                  <span className="detail-label">Dirección de envío</span>
                  <span className="detail-value">{order.shippingAddress}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Order Details */}
          <div className="details-section">
            <h3 className="section-title">Detalles del Pedido</h3>
            <div className="order-details-info">
              <div className="detail-item">
                <span className="detail-label">Fecha del pedido:</span>
                <span className="detail-value">{formatDate(order.date)} - {order.time}</span>
              </div>
              {order.notes && (
                <div className="detail-item notes">
                  <MessageSquare size={18} />
                  <div>
                    <span className="detail-label">Notas especiales:</span>
                    <span className="detail-value">{order.notes}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          {renderActionButtons()}

        </div>

        {/* Footer */}
        <div className="order-modal-footer">
          <button className="btn-close" onClick={onClose}>
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};

export default OrderDetailsModal;