import React from 'react';
import { X, CheckCircle, XCircle, Package, Truck, MapPin, User, Hash } from 'lucide-react';
import '../styles/orderdetailsmodal.css';

const OrderDetailsModal = ({ order, onClose, onUpdateStatus, statusConfig, formatCurrency, formatDate }) => {

  const handleConfirm = () => onUpdateStatus(order.order_id, 'processing');

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
              <XCircle size={18} /> Rechazar Pedido
            </button>
            <button className="btn-action confirm" onClick={handleConfirm}>
              <CheckCircle size={18} /> Confirmar Pedido
            </button>
          </div>
        );
      case 'processing':
        return <div className="info-box"><span>🔄 El pedido está siendo preparado</span></div>;
      case 'ready_for_pickup':
        return <div className="info-box"><span>📦 Listo para ser retirado por la logística</span></div>;
      case 'in_transit':
        return <div className="info-box"><span>🚚 En camino al destinatario</span></div>;
      case 'redelivery':
        return <div className="info-box"><span>🔁 Recoordinando nueva fecha de entrega</span></div>;
      case 'cancelled':
        return <div className="info-box"><span>❌ Este pedido fue cancelado</span></div>;
      case 'completed':
        return <div className="info-box"><span>✅ Pedido entregado exitosamente</span></div>;
      case 'pending':
        return <div className="info-box"><span>⏳ Esperando confirmación del administrador</span></div>;
      default:
        return null;
    }
  };

  const cfg        = statusConfig[order.status] || statusConfig.pending;
  const StatusIcon = cfg?.icon || Package;

  return (
    <div className="order-modal-overlay" onClick={onClose}>
      <div className="order-modal-container" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="order-modal-header">
          <div className="modal-title-section">
            <h2>Detalles del Pedido</h2>
            <span className="order-modal-id">#{order.order_id}</span>
          </div>
          <button className="modal-close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        {/* Status Badge */}
        <div className="order-modal-status">
          <div className="status-badge-large" style={{ backgroundColor: cfg.bgColor, color: cfg.color }}>
            <StatusIcon size={20} />
            <span>{cfg.label}</span>
          </div>
          {/* Tracking number — visible si existe */}
          {order.tracking_number && (
            <div className="tracking-badge">
              <Hash size={14} />
              <span>Guía: <strong>{order.tracking_number}</strong></span>
            </div>
          )}
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
              {order.recipient_lat && order.recipient_lng && (
                <div className="detail-row">
                  <MapPin size={18} />
                  <div>
                    <span className="detail-label">Ubicación</span>
                    <a
                      href={`https://www.google.com/maps?q=${order.recipient_lat},${order.recipient_lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#056EB7', fontWeight: '600', fontSize: '13px' }}
                    >
                      Ver en Google Maps
                    </a>
                  </div>
                </div>
              )}
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
              {order.tracking_number && (
                <div className="detail-item">
                  <span className="detail-label">Número de guía:</span>
                  <span className="detail-value" style={{ fontWeight: '700', color: '#056EB7' }}>
                    {order.tracking_number}
                  </span>
                </div>
              )}
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