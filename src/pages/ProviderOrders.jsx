import React, { useState, useEffect } from 'react';
import { Package, Eye, CheckCircle, XCircle, Truck, Clock, Search, Filter, CheckSquare, Square } from 'lucide-react';
import { useUser } from '../App';
import { getOrdersBySupplierApi, confirmOrderSupplier, cancelOrderSupplier, markOrderReadyForPickup, getOrder } from '../services/api';
import OrderDetailsModal from '../components/Orderdetailsmodal';
import '../styles/providerorders.css';

const statusConfig = {
  pending:          { label: 'Pendiente de aprobación',  detail: 'Esperando que el administrador apruebe la orden',                icon: Clock,        color: '#d97706', bgColor: '#fffbeb' },
  confirmed:        { label: 'Aprobado — aceptar',       detail: 'El admin aprobó la orden. Aceptala para empezar a prepararla',  icon: CheckCircle,  color: '#2563eb', bgColor: '#eff6ff' },
  processing:       { label: 'En preparación',           detail: 'Estás preparando este pedido. Marcalo listo cuando esté',       icon: Package,      color: '#8b5cf6', bgColor: '#f5f3ff' },
  ready_for_pickup: { label: 'Esperando logística',      detail: 'El pedido está listo y esperando que la logística lo retire',   icon: Truck,        color: '#16a34a', bgColor: '#dcfce7' },
  picked_up:        { label: 'Retirado',                 detail: 'La logística ya retiró el paquete de tu depósito',              icon: Truck,        color: '#2563eb', bgColor: '#eff6ff' },
  out_for_delivery: { label: 'En camino al cliente',     detail: 'La logística está entregando el pedido al destinatario',        icon: Truck,        color: '#d97706', bgColor: '#fef3c7' },
  redelivery:       { label: 'Reagendado',               detail: 'No se pudo entregar. La logística va a reintentar',             icon: Clock,        color: '#f97316', bgColor: '#fff7ed' },
  completed:        { label: 'Entregado',                detail: 'El pedido fue entregado exitosamente al cliente',               icon: CheckCircle,  color: '#059669', bgColor: '#d1fae5' },
  cancelled:        { label: 'Cancelado',                detail: 'Esta orden fue cancelada',                                     icon: XCircle,      color: '#dc2626', bgColor: '#fef2f2' },
};

const ProviderOrders = () => {
  const { user }                            = useUser();
  const [orders, setOrders]                 = useState([]);
  const [loading, setLoading]               = useState(true);
  const [searchTerm, setSearchTerm]         = useState('');
  const [statusFilter, setStatusFilter]     = useState('all');
  const [selectedOrder, setSelectedOrder]   = useState(null);
  const [showModal, setShowModal]           = useState(false);
  const [processingId, setProcessingId]     = useState(null);
  const [loadingModal, setLoadingModal]     = useState(false);

  // ── Selección múltiple ───────────────────────────
  const [selectedIds, setSelectedIds]         = useState(new Set());
  const [bulkProcessing, setBulkProcessing]   = useState(false);
  const [etiquetaIds, setEtiquetaIds]         = useState(new Set());
  const [printingEtiquetas, setPrintingEtiquetas] = useState(false);
  const [readyIds, setReadyIds]               = useState(new Set());
  const [bulkReady, setBulkReady]             = useState(false);

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

  const formatCurrency = (v) =>
    new Intl.NumberFormat('es-PY', { style: 'currency', currency: 'PYG', minimumFractionDigits: 0 }).format(v);

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '—';
    return new Intl.DateTimeFormat('es-PY', { year: 'numeric', month: 'short', day: 'numeric' }).format(date);
  };

  // ── Acciones individuales ─────────────────────────
  const handleReadyForDelivery = async (orderId) => {
    setProcessingId(orderId);
    try {
      await markOrderReadyForPickup(orderId);
      setOrders(prev => prev.map(o => o.order_id === orderId ? { ...o, status: 'ready_for_pickup' } : o));
    } catch (err) {
      const msg = err?.message || 'Ocurrió un error. Intentá de nuevo.';
      alert(msg);
      // Si falló la API externa, el backend revirtió a processing — refrescar estado
      if (msg.includes('API logística')) {
        setOrders(prev => prev.map(o => o.order_id === orderId ? { ...o, status: 'processing' } : o));
      }
    } finally {
      setProcessingId(null);
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      if (newStatus === 'processing') await confirmOrderSupplier(orderId);
      else if (newStatus === 'cancelled') await cancelOrderSupplier(orderId);
      setOrders(prev => prev.map(o => o.order_id === orderId ? { ...o, status: newStatus } : o));
      setShowModal(false);
    } catch {
      alert('Ocurrió un error. Intentá de nuevo.');
    }
  };

  // ── Selección múltiple ───────────────────────────
  const confirmableOrders = filteredOrders => filteredOrders.filter(o => o.status === 'confirmed');

  const toggleSelect = (orderId) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(orderId) ? next.delete(orderId) : next.add(orderId);
      return next;
    });
  };

  const toggleSelectAll = (confirmable) => {
    if (selectedIds.size === confirmable.length && confirmable.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(confirmable.map(o => o.order_id)));
    }
  };

  const handleBulkConfirm = async (confirmable) => {
    if (selectedIds.size === 0) return;
    setBulkProcessing(true);
    const results = await Promise.allSettled(
      [...selectedIds].map(id => confirmOrderSupplier(id))
    );
    const succeeded = [...selectedIds].filter((_, i) => results[i].status === 'fulfilled');
    const failed    = results.filter(r => r.status === 'rejected').length;

    setOrders(prev =>
      prev.map(o => succeeded.includes(o.order_id) ? { ...o, status: 'processing' } : o)
    );
    setSelectedIds(new Set());
    setBulkProcessing(false);

    if (failed > 0) alert(`${succeeded.length} órdenes confirmadas. ${failed} fallaron.`);
  };

  // ── Selección salida masiva (processing → ready_for_pickup) ──────────────
  const toggleReady = (orderId) => {
    setReadyIds(prev => {
      const next = new Set(prev);
      next.has(orderId) ? next.delete(orderId) : next.add(orderId);
      return next;
    });
  };

  const toggleSelectAllReady = (readyable) => {
    if (readyIds.size === readyable.length && readyable.length > 0) {
      setReadyIds(new Set());
    } else {
      setReadyIds(new Set(readyable.map(o => o.order_id)));
    }
  };

  const handleBulkReady = async () => {
    if (readyIds.size === 0) return;
    setBulkReady(true);
    const results = await Promise.allSettled(
      [...readyIds].map(id => markOrderReadyForPickup(id))
    );
    const succeeded = [...readyIds].filter((_, i) => results[i].status === 'fulfilled');
    const failed    = results.filter(r => r.status === 'rejected').length;
    setOrders(prev =>
      prev.map(o => succeeded.includes(o.order_id) ? { ...o, status: 'ready_for_pickup' } : o)
    );
    setReadyIds(new Set());
    setBulkReady(false);
    if (failed > 0) alert(`${succeeded.length} órdenes marcadas. ${failed} fallaron.`);
  };

  // ── Selección etiquetas ──────────────────────────
  const printableOrders = filteredOrders => filteredOrders.filter(o => o.tracking_number);

  const toggleEtiqueta = (orderId) => {
    setEtiquetaIds(prev => {
      const next = new Set(prev);
      next.has(orderId) ? next.delete(orderId) : next.add(orderId);
      return next;
    });
  };

  const toggleSelectAllEtiquetas = (printable) => {
    if (etiquetaIds.size === printable.length && printable.length > 0) {
      setEtiquetaIds(new Set());
    } else {
      setEtiquetaIds(new Set(printable.map(o => o.order_id)));
    }
  };

  const handleBulkEtiquetas = async () => {
    if (etiquetaIds.size === 0) return;
    setPrintingEtiquetas(true);
    try {
      const token = localStorage.getItem('auth_token');
      const base  = import.meta.env.VITE_API_URL || 'https://easypy-backend-430520813248.us-central1.run.app';
      const res   = await fetch(`${base}/orders/etiquetas`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body:    JSON.stringify({ order_ids: [...etiquetaIds] }),
      });
      if (!res.ok) throw new Error('Error al obtener etiquetas');
      const blob     = await res.blob();
      const url      = URL.createObjectURL(blob);
      const a        = document.createElement('a');
      a.href         = url;
      a.download     = 'etiquetas.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch (err) {
      alert(err.message || 'Error al imprimir etiquetas');
    } finally {
      setPrintingEtiquetas(false);
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch =
      String(order.order_id).includes(searchTerm) ||
      (order.recipient_name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const printable        = filteredOrders.filter(o => o.tracking_number);
  const allEtiquetas     = printable.length > 0 && etiquetaIds.size === printable.length;
  const someEtiquetas    = etiquetaIds.size > 0;
  const readyable        = filteredOrders.filter(o => o.status === 'processing');
  const allReady         = readyable.length > 0 && readyIds.size === readyable.length;
  const someReady        = readyIds.size > 0;

  const confirmable     = filteredOrders.filter(o => o.status === 'confirmed');
  const allSelected     = confirmable.length > 0 && selectedIds.size === confirmable.length;
  const someSelected    = selectedIds.size > 0;

  const stats = {
    total:      orders.length,
    pending:    orders.filter(o => o.status === 'pending').length,
    confirmed:  orders.filter(o => o.status === 'confirmed').length,
    processing: orders.filter(o => o.status === 'processing').length,
    completed:  orders.filter(o => o.status === 'completed').length,
  };

  if (loading) return (
    <div className="provider-orders-page">
      <div className="provider-orders-container">
        <p style={{ color: '#9ca3af', textAlign: 'center', paddingTop: '60px' }}>Cargando órdenes...</p>
      </div>
    </div>
  );

  return (
    <div className="provider-orders-page">
      <div className="provider-orders-container">

        {/* Header */}
        <div className="provider-orders-header">
          <div className="header-content">
            <div className="header-title">
              <Package size={32} />
              <div>
                <h1>Gestión de Pedidos</h1>
                <p>Administrá y procesá las órdenes de tus clientes</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon total"><Package size={24} /></div>
            <div className="stat-info"><span className="stat-label">Total</span><span className="stat-value">{stats.total}</span></div>
          </div>
          <div className="stat-card">
            <div className="stat-icon pending"><Clock size={24} /></div>
            <div className="stat-info"><span className="stat-label">Pendientes</span><span className="stat-value">{stats.pending}</span></div>
          </div>
          <div className="stat-card">
            <div className="stat-icon preparing"><Package size={24} /></div>
            <div className="stat-info"><span className="stat-label">En Proceso</span><span className="stat-value">{stats.processing}</span></div>
          </div>
          <div className="stat-card">
            <div className="stat-icon ready"><Truck size={24} /></div>
            <div className="stat-info"><span className="stat-label">Completados</span><span className="stat-value">{stats.completed}</span></div>
          </div>
        </div>

        {/* Filters */}
        <div className="filters-section">
          <div className="search-box">
            <Search className="search-icon" size={20} />
            <input
              type="text"
              placeholder="Buscar por orden o destinatario..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="filter-group">
            <div className="filter-item">
              <Filter size={18} />
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">Todos los estados</option>
                <option value="pending">Pendientes</option>
                <option value="confirmed">Confirmados por Admin</option>
                <option value="processing">En Proceso</option>
                <option value="ready_for_pickup">Listo para retirar</option>
                <option value="cancelled">Cancelados</option>
                <option value="completed">Completados</option>
              </select>
            </div>
          </div>
        </div>

        {/* Barra de selección múltiple — aparece solo si hay órdenes confirmadas */}
        {confirmable.length > 0 && (
          <div className="bulk-bar">
            <div className="bulk-bar-left">
              <button className="bulk-select-all" onClick={() => toggleSelectAll(confirmable)}>
                {allSelected ? <CheckSquare size={18} /> : <Square size={18} />}
                <span>{allSelected ? 'Deseleccionar todo' : `Seleccionar las ${confirmable.length} confirmadas`}</span>
              </button>
              {someSelected && (
                <span className="bulk-count">{selectedIds.size} seleccionada{selectedIds.size !== 1 ? 's' : ''}</span>
              )}
            </div>
            {someSelected && (
              <button
                className="bulk-confirm-btn"
                onClick={() => handleBulkConfirm(confirmable)}
                disabled={bulkProcessing}
              >
                {bulkProcessing ? 'Confirmando...' : `Confirmar ${selectedIds.size} orden${selectedIds.size !== 1 ? 'es' : ''}`}
              </button>
            )}
          </div>
        )}

        {/* Barra de salida masiva — aparece si hay órdenes en processing */}
        {readyable.length > 0 && (
          <div className="bulk-bar" style={{ background: '#f5f3ff', borderColor: '#c4b5fd' }}>
            <div className="bulk-bar-left">
              <button className="bulk-select-all" onClick={() => toggleSelectAllReady(readyable)}>
                {allReady ? <CheckSquare size={18} color="#8b5cf6" /> : <Square size={18} color="#8b5cf6" />}
                <span style={{ color: '#8b5cf6' }}>{allReady ? 'Deseleccionar salidas' : `Seleccionar ${readyable.length} en proceso`}</span>
              </button>
              {someReady && (
                <span className="bulk-count" style={{ color: '#8b5cf6' }}>{readyIds.size} seleccionada{readyIds.size !== 1 ? 's' : ''}</span>
              )}
            </div>
            {someReady && (
              <button
                className="bulk-confirm-btn"
                style={{ background: '#8b5cf6' }}
                onClick={handleBulkReady}
                disabled={bulkReady}
              >
                <Truck size={14} style={{ marginRight: '6px' }} />
                {bulkReady ? 'Procesando...' : `Marcar ${readyIds.size} como listas`}
              </button>
            )}
          </div>
        )}

        {/* Barra de etiquetas — aparece si hay órdenes con tracking */}
        {printable.length > 0 && (
          <div className="bulk-bar" style={{ background: '#f0fdf4', borderColor: '#86efac' }}>
            <div className="bulk-bar-left">
              <button className="bulk-select-all" onClick={() => toggleSelectAllEtiquetas(printable)}>
                {allEtiquetas ? <CheckSquare size={18} color="#16a34a" /> : <Square size={18} color="#16a34a" />}
                <span style={{ color: '#16a34a' }}>{allEtiquetas ? 'Deseleccionar etiquetas' : `Seleccionar ${printable.length} etiqueta${printable.length !== 1 ? 's' : ''}`}</span>
              </button>
              {someEtiquetas && (
                <span className="bulk-count" style={{ color: '#16a34a' }}>{etiquetaIds.size} seleccionada{etiquetaIds.size !== 1 ? 's' : ''}</span>
              )}
            </div>
            {someEtiquetas && (
              <button
                className="bulk-confirm-btn"
                style={{ background: '#16a34a' }}
                onClick={handleBulkEtiquetas}
                disabled={printingEtiquetas}
              >
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ marginRight: '6px' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                {printingEtiquetas ? 'Generando...' : `Imprimir ${etiquetaIds.size} etiqueta${etiquetaIds.size !== 1 ? 's' : ''}`}
              </button>
            )}
          </div>
        )}

        {/* Orders List */}
        <div className="orders-list">
          {filteredOrders.length === 0 ? (
            <div className="empty-state">
              <Package size={64} />
              <h3>No se encontraron pedidos</h3>
              <p>Intentá ajustar los filtros de búsqueda</p>
            </div>
          ) : (
            filteredOrders.map(order => {
              const cfg        = statusConfig[order.status] || statusConfig.pending;
              const StatusIcon = cfg.icon;
              const isReady    = processingId === order.order_id;
              const isConfirmable = order.status === 'confirmed';
              const isSelected    = selectedIds.has(order.order_id);

              return (
                <div
                  key={order.order_id}
                  className={`order-card ${isSelected ? 'selected' : ''}`}
                  onClick={isConfirmable ? () => toggleSelect(order.order_id) : undefined}
                  style={{ cursor: isConfirmable ? 'pointer' : 'default' }}
                >
                  <div className="order-main">

                    {/* Checkbox — confirmadas */}
                    {isConfirmable && (
                      <div className="order-checkbox" onClick={(e) => { e.stopPropagation(); toggleSelect(order.order_id); }}>
                        {isSelected
                          ? <CheckSquare size={20} color="#056EB7" />
                          : <Square size={20} color="#d1d5db" />
                        }
                      </div>
                    )}

                    {/* Checkbox — etiquetas */}
                    {order.tracking_number && (
                      <div className="order-checkbox" onClick={(e) => { e.stopPropagation(); toggleEtiqueta(order.order_id); }}>
                        {etiquetaIds.has(order.order_id)
                          ? <CheckSquare size={20} color="#16a34a" />
                          : <Square size={20} color="#86efac" />
                        }
                      </div>
                    )}

                    {/* Checkbox — salida masiva */}
                    {order.status === 'processing' && (
                      <div className="order-checkbox" onClick={(e) => { e.stopPropagation(); toggleReady(order.order_id); }}>
                        {readyIds.has(order.order_id)
                          ? <CheckSquare size={20} color="#8b5cf6" />
                          : <Square size={20} color="#c4b5fd" />
                        }
                      </div>
                    )}

                    <div className="order-info">
                      <div className="order-header-row">
                        <div className="order-id">
                          <span className="id-label">ORDEN:</span>
                          <span className="id-value">#{order.order_id}</span>
                        </div>
                        <div className="order-date"><span>{formatDate(order.created_at)}</span></div>
                      </div>
                      <div className="order-meta">
                        <div className="meta-item">
                          <span className="meta-label">Destinatario:</span>
                          <span className="meta-value">{order.recipient_name || '—'}</span>
                        </div>
                        <div className="meta-item">
                          <span className="meta-label">Ciudad:</span>
                          <span className="meta-value">{order.recipient_city || '—'}</span>
                        </div>
                        <div className="meta-item">
                          <span className="meta-label">A cobrar:</span>
                          <span className="meta-value amount">
                            {formatCurrency(
                              (order.items || []).reduce((sum, item) =>
                                sum + parseFloat(item.supplier_cost) * item.quantity, 0)
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="order-actions">
                      <div className="status-badge" style={{ backgroundColor: cfg.bgColor, color: cfg.color }}>
                        <StatusIcon size={16} />
                        <span>{cfg.label}</span>
                      </div>

                      {order.status === 'processing' && (
                        <button
                          className="btn-ready-delivery"
                          onClick={(e) => { e.stopPropagation(); handleReadyForDelivery(order.order_id); }}
                          disabled={isReady}
                        >
                          <Truck size={16} />
                          <span>{isReady ? 'Procesando...' : 'Listo para entrega'}</span>
                        </button>
                      )}

                      <button
                        className="btn-view-details"
                        onClick={async (e) => {
                          e.stopPropagation();
                          setLoadingModal(true);
                          try {
                            const full = await getOrder(order.order_id);
                            setSelectedOrder(full || order);
                          } catch {
                            setSelectedOrder(order);
                          } finally {
                            setLoadingModal(false);
                            setShowModal(true);
                          }
                        }}
                        disabled={loadingModal}
                      >
                        <Eye size={18} />
                        <span>Ver Detalles</span>
                      </button>

                      {/* Etiqueta manual — para logísticas sin API */}
                      {['ready_for_pickup','in_transit','completed'].includes(order.status) && !order.tracking_number && (
                        <button
                          className="btn-view-details"
                          style={{ background: '#f0fdf4', border: '1.5px solid #86efac', color: '#16a34a' }}
                          onClick={async (e) => {
                            e.stopPropagation();
                            try {
                              const token = localStorage.getItem('auth_token');
                              const base  = import.meta.env.VITE_API_URL || 'https://easypy-backend-430520813248.us-central1.run.app';
                              const res   = await fetch(`${base}/orders/${order.order_id}/etiqueta-manual?token=${token}`);
                              if (!res.ok) throw new Error('Error al generar etiqueta');
                              const blob = await res.blob();
                              const url  = URL.createObjectURL(blob);
                              const a    = document.createElement('a');
                              a.href     = url;
                              a.download = `guia-${order.order_id}.pdf`;
                              document.body.appendChild(a);
                              a.click();
                              document.body.removeChild(a);
                              setTimeout(() => URL.revokeObjectURL(url), 5000);
                            } catch (err) {
                              alert('No se pudo generar la etiqueta');
                            }
                          }}
                        >
                          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                          </svg>
                          <span>Imprimir guía</span>
                        </button>
                      )}

                      {order.tracking_number && (
                        <button
                          className="btn-view-details"
                          style={{ background: '#f0fdf4', border: '1.5px solid #86efac', color: '#16a34a' }}
                          onClick={async (e) => {
                            e.stopPropagation();
                            try {
                              const token = localStorage.getItem('auth_token');
                              const base  = import.meta.env.VITE_API_URL || 'https://easypy-backend-430520813248.us-central1.run.app';
                              const res   = await fetch(`${base}/orders/${order.order_id}/etiqueta?token=${token}`);
                              if (!res.ok) throw new Error('Error al obtener etiqueta');
                              const blob  = await res.blob();
                              const url   = URL.createObjectURL(blob);
                              const a        = document.createElement('a');
                              a.href         = url;
                              const ext      = res.headers.get('content-type')?.includes('pdf') ? 'pdf' : res.headers.get('content-type')?.includes('png') ? 'png' : 'jpg';
                              a.download     = `etiqueta-${order.order_id}.${ext}`;
                              document.body.appendChild(a);
                              a.click();
                              document.body.removeChild(a);
                              setTimeout(() => URL.revokeObjectURL(url), 5000);
                            } catch (err) {
                              alert('No se pudo obtener la etiqueta');
                            }
                          }}
                        >
                          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                          </svg>
                          <span>Etiqueta</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {showModal && selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => setShowModal(false)}
          onUpdateStatus={handleUpdateOrderStatus}
          statusConfig={statusConfig}
          formatCurrency={formatCurrency}
          formatDate={formatDate}
        />
      )}
    </div>
  );
};

export default ProviderOrders;
