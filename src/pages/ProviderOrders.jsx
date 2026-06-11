import React, { useState, useEffect } from 'react';
import { Package, Eye, CheckCircle, XCircle, Truck, Clock, Search, Filter, CheckSquare, Square } from 'lucide-react';
import { useUser } from '../App';
import { getOrdersBySupplierApi, confirmOrderSupplier, cancelOrderSupplier, markOrderReadyForPickup, getOrder } from '../services/api';
import OrderDetailsModal from '../components/Orderdetailsmodal';
import '../styles/providerorders.css';

const statusConfig = {
  pending:          { label: 'Pendiente de aprobación', detail: 'Esperando aprobación', icon: Clock, color: '#d97706', bgColor: '#fffbeb' },
  confirmed:        { label: 'Aprobado — aceptar', detail: 'Listo para iniciar', icon: CheckCircle, color: '#2563eb', bgColor: '#eff6ff' },
  processing:       { label: 'En preparación', detail: 'Preparando pedido', icon: Package, color: '#8b5cf6', bgColor: '#f5f3ff' },
  ready_for_pickup: { label: 'Esperando logística', detail: 'Listo para retiro', icon: Truck, color: '#16a34a', bgColor: '#dcfce7' },
  picked_up:        { label: 'Retirado', detail: '', icon: Truck, color: '#2563eb', bgColor: '#eff6ff' },
  completed:        { label: 'Entregado', detail: '', icon: CheckCircle, color: '#059669', bgColor: '#d1fae5' },
  cancelled:        { label: 'Cancelado', detail: '', icon: XCircle, color: '#dc2626', bgColor: '#fef2f2' },
};

const ProviderOrders = () => {
  const { user } = useUser();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const [processingId, setProcessingId] = useState(null);
  const [loadingModal, setLoadingModal] = useState(false);

  // ✅ ÚNICO estado de selección (el bueno)
  const [printIds, setPrintIds] = useState(new Set());
  const [printing, setPrinting] = useState(false);

  useEffect(() => {
    if (user?.user_id) fetchOrders();
  }, [user]);

  const fetchOrders = async () => {
    try {
      const data = await getOrdersBySupplierApi(user.user_id);
      setOrders(data || []);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ FIX: función que te faltaba
  const togglePrint = (orderId) => {
    setPrintIds(prev => {
      const next = new Set(prev);
      next.has(orderId) ? next.delete(orderId) : next.add(orderId);
      return next;
    });
  };

  const formatCurrency = (v) =>
    new Intl.NumberFormat('es-PY', { style: 'currency', currency: 'PYG', minimumFractionDigits: 0 }).format(v);

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return isNaN(date.getTime())
      ? '—'
      : new Intl.DateTimeFormat('es-PY', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        }).format(date);
  };

  const handleReadyForDelivery = async (orderId) => {
    setProcessingId(orderId);
    try {
      await markOrderReadyForPickup(orderId);
      setOrders(prev =>
        prev.map(o => o.order_id === orderId ? { ...o, status: 'ready_for_pickup' } : o)
      );
    } catch (err) {
      alert(err?.message || 'Error');
    } finally {
      setProcessingId(null);
    }
  };

  const handleBulkPrint = async (type) => {
    if (printIds.size === 0) return;

    setPrinting(true);
    try {
      const token = localStorage.getItem('auth_token');
      const base = import.meta.env.VITE_API_URL;

      const endpoint =
        type === 'etiquetas'
          ? `${base}/orders/etiquetas`
          : `${base}/orders/remitos`;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ order_ids: [...printIds] })
      });

      if (!res.ok) throw new Error();

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setTimeout(() => URL.revokeObjectURL(url), 5000);
      setPrintIds(new Set());

    } catch {
      alert('Error generando archivo');
    } finally {
      setPrinting(false);
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch =
      String(order.order_id).includes(searchTerm) ||
      (order.recipient_name || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const printable = filteredOrders.filter(o =>
    !['pending', 'cancelled'].includes(o.status)
  );

  if (loading) {
    return <p style={{ padding: 40 }}>Cargando...</p>;
  }

  return (
    <div className="provider-orders-page">
      <div className="provider-orders-container">

        {/* FILTROS (INTACTO) */}
        <div className="filters-section">
          <div className="search-box">
            <Search size={18} />
            <input
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar..."
            />
          </div>

          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="all">Todos</option>
            <option value="pending">Pendiente</option>
            <option value="confirmed">Confirmado</option>
            <option value="processing">En proceso</option>
            <option value="ready_for_pickup">Listo</option>
          </select>
        </div>

        {/* BARRA SIMPLE (SIN SELECT ALL AGRESIVO) */}
        {printable.length > 0 && (
          <div className="bulk-bar">
            <span>
              {printIds.size} seleccionadas
            </span>

            <button onClick={() => setPrintIds(new Set(printable.map(o => o.order_id)))}>
              Seleccionar todo
            </button>

            <button onClick={() => setPrintIds(new Set())}>
              Limpiar
            </button>

            {printIds.size > 0 && (
              <>
                <button onClick={() => handleBulkPrint('etiquetas')} disabled={printing}>
                  Etiquetas
                </button>
                <button onClick={() => handleBulkPrint('remitos')} disabled={printing}>
                  Remitos
                </button>
              </>
            )}
          </div>
        )}

        {/* LISTA (TU DISEÑO ORIGINAL PRESERVADO) */}
        <div className="orders-list">
          {filteredOrders.map(order => {
            const cfg = statusConfig[order.status] || statusConfig.pending;
            const Icon = cfg.icon;

            return (
              <div key={order.order_id} className="order-card">

                {/* ÚNICO CHECKBOX */}
                {!['pending', 'cancelled'].includes(order.status) && (
                  <div
                    className="order-checkbox"
                    onClick={(e) => {
                      e.stopPropagation();
                      togglePrint(order.order_id);
                    }}
                  >
                    {printIds.has(order.order_id)
                      ? <CheckSquare size={20} />
                      : <Square size={20} />
                    }
                  </div>
                )}

                <div className="order-info">
                  <strong>#{order.order_id}</strong>
                  <div>{order.recipient_name}</div>
                  <div>{formatDate(order.created_at)}</div>
                </div>

                <div className="order-actions">

                  <span style={{ color: cfg.color }}>
                    <Icon size={16} /> {cfg.label}
                  </span>

                  {order.status === 'processing' && (
                    <button
                      onClick={() => handleReadyForDelivery(order.order_id)}
                    >
                      Listo para entrega
                    </button>
                  )}

                  <button
                    onClick={async () => {
                      setLoadingModal(true);
                      const full = await getOrder(order.order_id);
                      setSelectedOrder(full || order);
                      setShowModal(true);
                      setLoadingModal(false);
                    }}
                  >
                    Ver detalles
                  </button>

                </div>
              </div>
            );
          })}
        </div>

        {/* MODAL */}
        {showModal && selectedOrder && (
          <OrderDetailsModal
            order={selectedOrder}
            onClose={() => setShowModal(false)}
          />
        )}

      </div>
    </div>
  );
};

export default ProviderOrders;