import React from 'react';
import { X, CheckCircle, XCircle, Package, Truck, MapPin, User, Hash, Clock } from 'lucide-react';
import '../styles/orderdetailsmodal.css';

const STATUS_INFO = {
  pending:          'Esperando que el administrador apruebe la orden.',
  confirmed:        'El admin aprobó la orden. Aceptala para empezar a prepararla.',
  processing:       'Estás preparando este pedido. Marcalo como listo cuando esté empaquetado.',
  ready_for_pickup: 'El pedido está listo. La logística pasará a retirarlo.',
  picked_up:        'La logística ya retiró el paquete de tu depósito.',
  out_for_delivery: 'El paquete está en camino al destinatario.',
  redelivery:       'No se pudo entregar. La logística va a reintentar la entrega.',
  completed:        'El pedido fue entregado exitosamente al cliente.',
  cancelled:        'Esta orden fue cancelada.',
};

const OrderDetailsModal = ({ order, onClose, onUpdateStatus, statusConfig, formatCurrency, formatDate }) => {

  const handleConfirm = () => onUpdateStatus(order.order_id, 'processing');
  const handleReject  = () => {
    if (window.confirm('¿Estás seguro de rechazar este pedido?')) onUpdateStatus(order.order_id, 'cancelled');
  };

  const renderActionButtons = () => {
    const info = STATUS_INFO[order.status] || '';
    const infoBox = info ? (
      <div className="info-box" style={{ marginBottom: '8px' }}><span>{info}</span></div>
    ) : null;

    if (order.status === 'confirmed') {
      return (
        <>
          {infoBox}
          <div className="modal-actions">
            <button className="btn-action reject" onClick={handleReject}><XCircle size={18} /> Rechazar</button>
            <button className="btn-action confirm" onClick={handleConfirm}><CheckCircle size={18} /> Aceptar pedido</button>
          </div>
        </>
      );
    }
    return infoBox;
  };

  const cfg        = statusConfig[order.status] || statusConfig.pending;
  const StatusIcon = cfg?.icon || Package;

  return (
    <div className="order-modal-overlay" onClick={onClose}>
      <div className="order-modal-container" onClick={e => e.stopPropagation()}>

        <div className="order-modal-header">
          <div className="modal-title-section">
            <h2>Detalles del Pedido</h2>
            <span className="order-modal-id">#{order.order_id}</span>
          </div>
          <button className="modal-close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="order-modal-status">
          <div className="status-badge-large" style={{ backgroundColor: cfg.bgColor, color: cfg.color }}>
            <StatusIcon size={20} />
            <span>{cfg.label}</span>
          </div>
          {order.tracking_number && (
            <div className="tracking-badge">
              <Hash size={14} />
              <span>Guía: <strong>{order.tracking_number}</strong></span>
            </div>
          )}
          {order.redelivery_reason && (
            <div style={{ fontSize: '12px', color: '#f97316', fontWeight: '600', marginTop: '6px' }}>
              Motivo reagendamiento: {order.redelivery_reason}
            </div>
          )}
        </div>

        <div className="order-modal-body">

          {order.items && order.items.length > 0 && (
            <div className="details-section">
              <h3 className="section-title">Productos</h3>
              <div className="customer-details">
                {order.items.map(item => (
                  <div key={item.item_id} className="detail-row">
                    <Package size={18} />
                    <div>
                      <span className="detail-label">
                        {item.product_name}
                        {item.product_sku && (
                          <span style={{ marginLeft: '8px', fontSize: '11px', fontWeight: '600', color: '#6b7280', background: '#f3f4f6', padding: '1px 6px', borderRadius: '5px' }}>
                            SKU: {item.product_sku}
                          </span>
                        )}
                      </span>
                      <span className="detail-value">{item.quantity} {item.quantity === 1 ? 'unidad' : 'unidades'} · {formatCurrency(item.supplier_cost)} c/u</span>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: '#056EB7' }}>Subtotal: {formatCurrency(parseFloat(item.supplier_cost) * item.quantity)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="details-section">
            <h3 className="section-title">Destinatario</h3>
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
                  <span className="detail-value">{order.recipient_address || '—'}{order.recipient_address_complement ? `, ${order.recipient_address_complement}` : ''}</span>
                </div>
              </div>
              <div className="detail-row">
                <MapPin size={18} />
                <div>
                  <span className="detail-label">Ciudad</span>
                  <span className="detail-value">{order.recipient_city || '—'}{order.recipient_region ? `, ${order.recipient_region}` : ''}</span>
                </div>
              </div>
              {order.recipient_lat && order.recipient_lng && (
                <div className="detail-row">
                  <MapPin size={18} />
                  <div>
                    <span className="detail-label">Ubicación</span>
                    <a href={`https://www.google.com/maps?q=${order.recipient_lat},${order.recipient_lng}`} target="_blank" rel="noopener noreferrer" style={{ color: '#056EB7', fontWeight: '600', fontSize: '13px' }}>
                      Ver en Google Maps
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="details-section">
            <h3 className="section-title">Detalles</h3>
            <div className="order-details-info">
              <div className="detail-item">
                <span className="detail-label">Fecha:</span>
                <span className="detail-value">{formatDate(order.created_at)}</span>
              </div>
              {order.tracking_number && (
                <div className="detail-item">
                  <span className="detail-label">Número de guía:</span>
                  <span className="detail-value" style={{ fontWeight: '700', color: '#056EB7' }}>{order.tracking_number}</span>
                </div>
              )}
            </div>
          </div>

          {renderActionButtons()}

        </div>
      </div>
    </div>
  );
};

export default OrderDetailsModal;