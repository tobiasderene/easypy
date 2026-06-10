import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, Calendar, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import { getAllOrdersAdmin, getLogistics, getUsers, cancelOrderAdmin } from '../services/api';

const STATUS_CONFIG = {
  pending:           { label: 'Pendiente',          color: '#9ca3af', bg: '#f3f4f6' },
  confirmed:         { label: 'Aprobado',            color: '#2563eb', bg: '#eff6ff' },
  processing:        { label: 'En preparación',      color: '#7c3aed', bg: '#f5f3ff' },
  ready_for_pickup:  { label: 'Listo para retiro',   color: '#ca8a04', bg: '#fefce8' },
  picked_up:         { label: 'Retirado',            color: '#2563eb', bg: '#eff6ff' },
  out_for_delivery:  { label: 'En camino',           color: '#d97706', bg: '#fff7ed' },
  redelivery:        { label: 'Reagendado',          color: '#f97316', bg: '#fff7ed' },
  completed:         { label: 'Entregado',           color: '#059669', bg: '#d1fae5' },
  cancelled:         { label: 'Cancelado',           color: '#dc2626', bg: '#fef2f2' },
  return_in_progress:{ label: 'Devolución',          color: '#dc2626', bg: '#fef2f2' },
};

const PAGE_SIZE = 50;

const AdminTransactions = () => {
  const [orders, setOrders]         = useState([]);
  const [total, setTotal]           = useState(0);
  const [loading, setLoading]       = useState(true);
  const [page, setPage]             = useState(0);
  const [expanded, setExpanded]     = useState(null);
  const [cancelling, setCancelling]   = useState(null);

  // Filtros
  const [search, setSearch]         = useState('');
  const [statusFilter, setStatus]   = useState('');
  const [dateFrom, setDateFrom]     = useState('');
  const [dateTo, setDateTo]         = useState('');
  const [logistics, setLogistics]   = useState([]);
  const [logisticFilter, setLogisticFilter] = useState('');

  const fmt = (v) =>
    new Intl.NumberFormat('es-PY', { style: 'currency', currency: 'PYG', minimumFractionDigits: 0 }).format(v || 0);

  const fmtDate = (d) => {
    if (!d) return '—';
    try { return new Intl.DateTimeFormat('es-PY', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone }).format(new Date(d)); }
    catch { return '—'; }
  };

  useEffect(() => {
    getLogistics().then(l => setLogistics(l || [])).catch(() => {});
  }, []);

  const fetchOrders = useCallback(async (p = 0) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        skip:  p * PAGE_SIZE,
        limit: PAGE_SIZE,
        ...(dateFrom     && { date_from:   new Date(dateFrom).toISOString() }),
        ...(dateTo       && { date_to:     new Date(dateTo + 'T23:59:59').toISOString() }),
        ...(logisticFilter && { logistic_id: logisticFilter }),
        ...(statusFilter   && { status:      statusFilter }),
      });
      const data = await getAllOrdersAdmin(
        dateFrom ? new Date(dateFrom).toISOString() : null,
        dateTo   ? new Date(dateTo + 'T23:59:59').toISOString() : null,
        p * PAGE_SIZE,
        PAGE_SIZE,
        logisticFilter || null,
        statusFilter   || null,
      );
      // getAllOrdersAdmin now returns { total, orders }
      if (data?.orders) {
        setOrders(data.orders);
        setTotal(data.total);
      } else {
        setOrders(data || []);
        setTotal((data || []).length);
      }
    } catch { setOrders([]); }
    finally { setLoading(false); }
  }, [dateFrom, dateTo, logisticFilter, statusFilter]);

  useEffect(() => { setPage(0); fetchOrders(0); }, [dateFrom, dateTo, logisticFilter, statusFilter]);

  const handlePageChange = (newPage) => { setPage(newPage); fetchOrders(newPage); };

  // Filtro de búsqueda en frontend (nombre/id)
  const filtered = search.trim()
    ? orders.filter(o =>
        String(o.order_id).includes(search) ||
        (o.buyer_name    || '').toLowerCase().includes(search.toLowerCase()) ||
        (o.supplier_name || '').toLowerCase().includes(search.toLowerCase()) ||
        (o.logistic_name || '').toLowerCase().includes(search.toLowerCase()) ||
        (o.recipient_name|| '').toLowerCase().includes(search.toLowerCase())
      )
    : orders;

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#111827', margin: '0 0 4px 0' }}>
          Transacciones
        </h1>
        <p style={{ fontSize: '13px', color: '#6b7280' }}>
          {total} órdenes totales
        </p>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '16px', background: 'white', padding: '16px', borderRadius: '12px', border: '1.5px solid #e5e7eb' }}>
        {/* Búsqueda */}
        <div style={{ position: 'relative', flex: '2 1 200px' }}>
          <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por ID, vendedor, proveedor..."
            style={{ width: '100%', padding: '8px 12px 8px 32px', border: '1.5px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box' }} />
        </div>

        {/* Estado */}
        <select value={statusFilter} onChange={e => setStatus(e.target.value)}
          style={{ flex: '1 1 150px', padding: '8px 12px', border: '1.5px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', background: 'white' }}>
          <option value="">Todos los estados</option>
          {Object.entries(STATUS_CONFIG).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>

        {/* Logística */}
        <select value={logisticFilter} onChange={e => setLogisticFilter(e.target.value)}
          style={{ flex: '1 1 150px', padding: '8px 12px', border: '1.5px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', background: 'white' }}>
          <option value="">Todas las logísticas</option>
          {logistics.map(l => <option key={l.logistic_id} value={l.logistic_id}>{l.name}</option>)}
        </select>

        {/* Fechas */}
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
          style={{ flex: '1 1 130px', padding: '8px 10px', border: '1.5px solid #e5e7eb', borderRadius: '8px', fontSize: '13px' }} />
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
          style={{ flex: '1 1 130px', padding: '8px 10px', border: '1.5px solid #e5e7eb', borderRadius: '8px', fontSize: '13px' }} />

        {(dateFrom || dateTo || logisticFilter || statusFilter) && (
          <button onClick={() => { setDateFrom(''); setDateTo(''); setLogisticFilter(''); setStatus(''); }}
            style={{ padding: '8px 14px', background: '#fef2f2', color: '#dc2626', border: '1.5px solid #fecaca', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
            Limpiar
          </button>
        )}
      </div>

      {/* Tabla */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#9ca3af' }}>Cargando...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#9ca3af' }}>Sin resultados</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {filtered.map(order => {
            const st  = STATUS_CONFIG[order.status] || { label: order.status, color: '#6b7280', bg: '#f3f4f6' };
            const exp = expanded === order.order_id;
            const supplierCost = (order.items || []).reduce((s, i) => s + parseFloat(i.supplier_cost || 0) * (i.quantity || 1), 0);

            return (
              <div key={order.order_id} style={{ background: 'white', border: '1.5px solid #e5e7eb', borderRadius: '10px', overflow: 'hidden' }}>

                {/* Fila principal */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', cursor: 'pointer', flexWrap: 'wrap' }}
                  onClick={() => setExpanded(exp ? null : order.order_id)}>

                  <span style={{ fontSize: '13px', fontWeight: '800', color: '#111827', minWidth: '70px' }}>
                    #{order.order_id}
                  </span>

                  <span style={{ padding: '2px 10px', borderRadius: '100px', fontSize: '11px', fontWeight: '700', background: st.bg, color: st.color, whiteSpace: 'nowrap' }}>
                    {st.label}
                  </span>

                  <div style={{ flex: 1, display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '12px', color: '#6b7280' }}>
                    <span>👤 <strong style={{ color: '#111827' }}>{order.buyer_name || `#${order.buyer_id}`}</strong></span>
                    <span>🏭 <strong style={{ color: '#111827' }}>{order.supplier_name || `#${order.supplier_id}`}</strong></span>
                    <span>🚚 <strong style={{ color: '#056EB7' }}>{order.logistic_name || '—'}</strong></span>
                    {order.tracking_number && <span style={{ color: '#056EB7' }}>Guía: {order.tracking_number}</span>}
                  </div>

                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: '12px', color: '#6b7280' }}>{fmtDate(order.created_at)}</span>
                    <span style={{ fontSize: '14px', fontWeight: '800', color: '#16a34a' }}>{fmt(order.final_price)}</span>
                    {exp ? <ChevronUp size={16} color="#9ca3af" /> : <ChevronDown size={16} color="#9ca3af" />}
                  </div>
                </div>

                {/* Detalle expandido */}
                {exp && (
                  <div style={{ padding: '14px 16px', borderTop: '1.5px solid #f3f4f6', background: '#fafafa' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px', marginBottom: '12px' }}>
                      {[
                        { label: 'Destinatario',   value: order.recipient_name || '—' },
                        { label: 'Ciudad',         value: `${order.recipient_city || '—'}, ${order.recipient_region || '—'}` },
                        { label: 'Teléfono',       value: order.recipient_phone || '—' },
                        { label: 'Tipo cobro',     value: order.collection_type === 'con_recaudo' ? 'Con recaudo' : 'Sin recaudo' },
                        { label: 'Final price',    value: fmt(order.final_price),    bold: true },
                        { label: 'Costo proveedor',value: fmt(supplierCost) },
                        { label: 'Costo logística',value: fmt(order.logistic_cost) },
                        { label: 'Comisión EasyPy',value: fmt(order.platform_fee),   bold: true, highlight: true },
                        { label: 'Ganancia vendedor', value: fmt(order.buyer_profit) },
                      ].map((f, i) => (
                        <div key={i} style={{ background: f.highlight ? '#eff6ff' : 'white', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '8px 12px' }}>
                          <p style={{ fontSize: '10px', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', marginBottom: '2px' }}>{f.label}</p>
                          <p style={{ fontSize: '13px', fontWeight: f.bold ? '800' : '600', color: f.highlight ? '#056EB7' : '#111827' }}>{f.value}</p>
                        </div>
                      ))}
                    </div>

                    {/* Productos */}
                    {order.items?.length > 0 && (
                      <div>
                        <p style={{ fontSize: '11px', fontWeight: '700', color: '#6b7280', marginBottom: '6px', textTransform: 'uppercase' }}>Productos</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {order.items.map((item, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', padding: '6px 10px', background: 'white', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                              <span>{item.product_name || `Producto #${item.product_id}`} × {item.quantity}</span>
                              <span style={{ fontWeight: '700' }}>{fmt(item.supplier_cost * item.quantity)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Cancelar — solo si no llegó a ready_for_pickup */}
                    {!['ready_for_pickup','picked_up','out_for_delivery','redelivery','completed','cancelled','return_in_progress'].includes(order.status) && (
                      <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #f3f4f6' }}>
                        <button
                          disabled={cancelling === order.order_id}
                          onClick={async () => {
                            if (!window.confirm(`¿Cancelás la orden #${order.order_id}? Esta acción no se puede deshacer.`)) return;
                            setCancelling(order.order_id);
                            try {
                              await cancelOrderAdmin(order.order_id);
                              setOrders(prev => prev.map(o =>
                                o.order_id === order.order_id ? { ...o, status: 'cancelled' } : o
                              ));
                              setExpanded(null);
                            } catch (e) {
                              alert(e.message || 'Error al cancelar la orden');
                            } finally {
                              setCancelling(null);
                            }
                          }}
                          style={{ padding: '8px 16px', background: '#fef2f2', color: '#dc2626', border: '1.5px solid #fecaca', borderRadius: '8px', fontWeight: '700', fontSize: '12px', cursor: 'pointer',
                            opacity: cancelling === order.order_id ? 0.6 : 1 }}>
                          {cancelling === order.order_id ? 'Cancelando...' : '✕ Cancelar orden'}
                        </button>
                        <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>
                          Solo disponible antes de que la logística retire el paquete.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Paginación */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '20px' }}>
          <button onClick={() => handlePageChange(page - 1)} disabled={page === 0}
            style={{ padding: '7px 12px', border: '1.5px solid #e5e7eb', borderRadius: '8px', background: 'white', cursor: page === 0 ? 'not-allowed' : 'pointer', opacity: page === 0 ? 0.4 : 1 }}>
            <ChevronLeft size={16} />
          </button>
          {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
            const p = totalPages <= 7 ? i : page <= 3 ? i : page >= totalPages - 4 ? totalPages - 7 + i : page - 3 + i;
            return (
              <button key={p} onClick={() => handlePageChange(p)}
                style={{ padding: '7px 13px', border: '1.5px solid', borderRadius: '8px', fontWeight: '700', fontSize: '13px', cursor: 'pointer',
                  background:   page === p ? '#056EB7' : 'white',
                  color:        page === p ? 'white'   : '#374151',
                  borderColor:  page === p ? '#056EB7' : '#e5e7eb' }}>
                {p + 1}
              </button>
            );
          })}
          <button onClick={() => handlePageChange(page + 1)} disabled={page >= totalPages - 1}
            style={{ padding: '7px 12px', border: '1.5px solid #e5e7eb', borderRadius: '8px', background: 'white', cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer', opacity: page >= totalPages - 1 ? 0.4 : 1 }}>
            <ChevronRight size={16} />
          </button>
          <span style={{ fontSize: '12px', color: '#6b7280', marginLeft: '8px' }}>
            {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} de {total}
          </span>
        </div>
      )}
    </div>
  );
};

export default AdminTransactions;
