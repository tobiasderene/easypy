import React from 'react';
import { X, CheckCircle, XCircle, Package, Truck, MapPin, User } from 'lucide-react';
import '../styles/orderdetailsmodal.css';

const OrderDetailsModal = ({ order, onClose, onUpdateStatus, statusConfig, formatCurrency, formatDate }) => {

  const handleConfirm = () => {
    onUpdateStatus(order.order_id, 'processing');
  };

  const handleReject = () => {
    if (window.confirm('¿Estás seguro de rechazar este pedido?')) {
      onUpdateStatus(order.order_id, 'cancelled');
    }
  };

  const renderActionButtons = () => {
    switch (order.status) {
      case 'confirmed':
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
      case 'processing':
        return (
          <div className="info-box">
            <span>🔄 Este pedido está siendo procesado</span>
          </div>
        );
      case 'cancelled':
        return (
          <div className="info-box">
            <span>❌ Este pedido fue cancelado</span>
          </div>
        );
      case 'completed':
        return (
          <div className="info-box">
            <span>✅ Este pedido ya fue completado</span>
          </div>
        );
      case 'pending':
        return (
          <div className="info-box">
            <span>⏳ Esperando confirmación del administrador</span>
          </div>
        );
      default:
        return null;
    }
  };

  const cfg        = statusConfig[order.status] || statusConfig.pending;
  const StatusIcon = cfg.icon;

  return (
    <div className="order-modal-overlay" onClick={onClose}>
      <div className="order-modal-container" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="order-modal-header">
          <div className="modal-title-section">
            <h2>Detalles del Pedido</h2>
            <span className="order-modal-id">#{order.order_id}</span>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Status Badge */}
        <div className="order-modal-status">
          <div
            className="status-badge-large"
            style={{ backgroundColor: cfg.bgColor, color: cfg.color }}
          >
            <StatusIcon size={20} />
            <span>{cfg.label}</span>
          </div>
        </div>

        {/* Body */}
        <div className="order-modal-body">

          {/* Items */}
          {order.items && order.items.length > 0 && (
            <div className="details-section">
              <h3 className="section-title">Productos</h3>
              {order.items.map(item => (
                <div key={item.item_id} className="product-details">
                  <div className="product-info-details">
                    <div className="product-specs">
                      <div className="spec-item">
                        <span className="spec-label">Producto ID:</span>
                        <span className="spec-value">{item.product_id}</span>
                      </div>
                      <div className="spec-item">
                        <span className="spec-label">Cantidad:</span>
                        <span className="spec-value">{item.quantity} unidades</span>
                      </div>
                      <div className="spec-item">
                        <span className="spec-label">Costo proveedor:</span>
                        <span className="spec-value">{formatCurrency(item.supplier_cost)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Destinatario */}
          <div className="details-section">
            <h3 className="section-title">Información del Destinatario</h3>
            <div className="customer-details">
              <div className="detail-row">
                <User size={18} />
                <div>
                  <span className="detail-label">Nombre</span>
                  <span className="detail-value">{order.recipient_name || '—'}</span>
                </div>
              </div>
              <div className="detail-row">
                <MapPin size={18} />
                <div>
                  <span className="detail-label">Dirección</span>
                  <span className="detail-value">
                    {order.recipient_address || '—'}
                    {order.recipient_address_complement ? `, ${order.recipient_address_complement}` : ''}
                  </span>
                </div>
              </div>
              <div className="detail-row">
                <MapPin size={18} />
                <div>
                  <span className="detail-label">Ciudad / Región</span>
                  <span className="detail-value">
                    {order.recipient_city || '—'}{order.recipient_region ? `, ${order.recipient_region}` : ''}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Detalles financieros */}
          <div className="details-section">
            <h3 className="section-title">Detalles del Pedido</h3>
            <div className="order-details-info">
              <div className="detail-item">
                <span className="detail-label">Fecha:</span>
                <span className="detail-value">{formatDate(order.created_at)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Total:</span>
                <span className="detail-value">{formatCurrency(order.final_price)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Tipo de cobro:</span>
                <span className="detail-value">
                  {order.collection_type === 'con_recaudo' ? 'Con recaudo' : 'Sin recaudo'}
                </span>
              </div>
            </div>
          </div>

          {/* Acciones */}
          {renderActionButtons()}

        </div>

        {/* Footer */}
        <div className="order-modal-footer">
          <button className="btn-close" onClick={onClose}>Cerrar</button>
        </div>

      </div>
    </div>
  );
};

export default OrderDetailsModal;