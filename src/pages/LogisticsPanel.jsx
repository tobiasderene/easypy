import React, { useState, useEffect } from 'react';
import { useUser } from '../App';
import { useNavigate } from 'react-router-dom';
import { getMyLogistics, getOrdersByLogistics, getLogisticsEfectividad, pickedUpOrder, outForDeliveryOrder,
         getFixyStatus,
         redeliveryWithReason, retryDeliveryOrder, deliverOrder, cancelOrderAdmin, createReturn } from '../services/api';
import '../styles/logisticspanel.css';

const STATUS_LABELS = {
  pending:            { label: 'Pendiente',             color: '#6b7280', bg: '#f3f4f6' },
  confirmed:          { label: 'Para retirar',           color: '#16a34a', bg: '#dcfce7' },
  ready_for_pickup:   { label: 'Listo para retirar',     color: '#16a34a', bg: '#dcfce7' },
  picked_up:          { label: 'Retirado del proveedor', color: '#056EB7', bg: '#eff6ff' },
  out_for_delivery:   { label: 'Yendo a entregar',       color: '#d97706', bg: '#fef3c7' },
  in_transit:         { label: 'En camino',              color: '#d97706', bg: '#fef3c7' },
  redelivery:         { label: 'Reagendado',             color: '#f97316', bg: '#fff7ed' },
  completed:          { label: 'Entregado',              color: '#7c3aed', bg: '#f5f3ff' },
  cancelled:          { label: 'Cancelado',              color: '#dc2626', bg: '#fef2f2' },
  return_in_progress: { label: 'Devolución en curso',    color: '#dc2626', bg: '#fef2f2' },
};

const FILTERS = ['all', 'ready_for_pickup', 'picked_up', 'out_for_delivery', 'in_transit', 'redelivery', 'completed', 'cancelled'];

const STATS_CONFIG = [
  { key: 'ready_for_pickup', label: 'Para retirar', color: '#16a34a', bg: '#dcfce7', border: '#16a34a20' },
  { key: 'picked_up',        label: 'Retirados',    color: '#056EB7', bg: '#eff6ff', border: '#056EB720' },
  { key: 'out_for_delivery', label: 'En camino',    color: '#d97706', bg: '#fef3c7', border: '#d9770620' },
  { key: 'completed',        label: 'Entregados',   color: '#7c3aed', bg: '#f5f3ff', border: '#7c3aed20' },
];

const LogisticsPanel = () => {
  const { user } = useUser();
  const navigate = useNavigate();

  const [logistic, setLogistic]       = useState(null);
  const [orders, setOrders]           = useState([]);
  const [loading, setLoading]         = useState(true);
  const [filter, setFilter]           = useState('all');
  const [updating, setUpdating]       = useState(null);
  const [error, setError]             = useState('');
  const [efectividad, setEfectividad] = useState(null);
  const [isFixy, setIsFixy]           = useState(false);
  const [fixyStatuses, setFixyStatuses] = useState({});
  const [loadingFixy, setLoadingFixy] = useState(null);

  // Selección de estado (azul)
  const [selected, setSelected]       = useState(new Set());
  const [bulkUpdating, setBulkUpdating] = useState(false);

  // Selección de impresión (verde/violeta)
  const [printIds, setPrintIds]             = useState(new Set());
  const [printingBulk, setPrintingBulk]     = useState(false);
  const [printingRemitos, setPrintingRemitos] = useState(false);

  // Modales
  const [redeliveryModal, setRedeliveryModal] = useState(null);
  const [redeliveryReason, setRedeliveryReason] = useState('');
  const [returnModal, setReturnModal]   = useState(null);
  const [returnReason, setReturnReason] = useState('');

  useEffect(() => {
    if (!user || user.user_role !== 'logistics') { navigate('/'); return; }
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const logisticData = await getMyLogistics();
      setLogistic(logisticData);
      const ordersData = await getOrdersByLogistics(logisticData.logistic_id);
      setOrders(ordersData || []);
      const ef = await getLogisticsEfectividad(logisticData.logistic_id).catch(() => null);
      setEfectividad(ef);
      setIsFixy(logisticData.api_type === 'fixy');
    } catch {
      setError('No se pudieron cargar las órdenes.');
    } finally {
      setLoading(false);
    }
  };

  // ── Fixy ─────────────────────────────────────────────────────────────────
  const fetchFixyStatus = async (orderId) => {
    setLoadingFixy(orderId);
    try {
      const data = await getFixyStatus(orderId);
      setFixyStatuses(prev => ({ ...prev, [orderId]: data }));
    } catch (e) {
      alert('No se pudo obtener el estado de Fixy: ' + (e.message || ''));
    } finally {
      setLoadingFixy(null);
    }
  };

  // ── Selección de impresión ────────────────────────────────────────────────
  const togglePrint = (orderId) => {
    setPrintIds(prev => {
      const next = new Set(prev);
      next.has(orderId) ? next.delete(orderId) : next.add(orderId);
      return next;
    });
  };

  const handleBulkEtiquetas = async () => {
    if (printIds.size === 0) return;
    setPrintingBulk(true);
    try {
      const token = localStorage.getItem('auth_token');
      const base  = import.meta.env.VITE_API_URL || 'https://easypy-backend-430520813248.us-central1.run.app';
      const res   = await fetch(`${base}/orders/etiquetas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ order_ids: [...printIds] }),
      });
      if (!res.ok) throw new Error('Error al obtener etiquetas');
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url; a.download = 'etiquetas.pdf';
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch (err) { alert(err.message || 'Error'); }
    finally { setPrintingBulk(false); }
  };

  const handleBulkRemitos = async () => {
    if (printIds.size === 0) return;
    setPrintingRemitos(true);
    try {
      const token = localStorage.getItem('auth_token');
      const base  = import.meta.env.VITE_API_URL || 'https://easypy-backend-430520813248.us-central1.run.app';
      const res   = await fetch(`${base}/orders/remitos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ order_ids: [...printIds] }),
      });
      if (!res.ok) throw new Error('Error al generar remitos');
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url; a.download = 'remitos.pdf';
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch (err) { alert(err.message || 'Error'); }
    finally { setPrintingRemitos(false); }
  };

  // ── Selección de estado ───────────────────────────────────────────────────
  const toggleSelect = (orderId) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(orderId) ? next.delete(orderId) : next.add(orderId);
      return next;
    });
  };

  const handleBulkUpdate = async (fn, newStatus) => {
    if (selected.size === 0) return;
    setBulkUpdating(true);
    const ids = [...selected];
    await Promise.all(ids.map(id => fn(id).catch(() => {})));
    setOrders(prev => prev.map(o => selected.has(o.order_id) ? { ...o, status: newStatus } : o));
    setSelected(new Set());
    setBulkUpdating(false);
  };

  // ── Acciones individuales ─────────────────────────────────────────────────
  const update = async (orderId, fn, newStatus) => {
    setUpdating(orderId);
    try {
      await fn(orderId);
      setOrders(prev => prev.map(o => o.order_id === orderId ? { ...o, status: newStatus } : o));
    } catch (e) {
      alert(e.message || 'Error al actualizar la orden');
    } finally {
      setUpdating(null);
    }
  };

  const handleRedeliveryConfirm = async () => {
    if (!redeliveryReason.trim()) { alert('Ingresá el motivo del reagendamiento'); return; }
    const orderId = redeliveryModal;
    setUpdating(orderId);
    setRedeliveryModal(null);
    try {
      await redeliveryWithReason(orderId, redeliveryReason);
      setOrders(prev => prev.map(o => o.order_id === orderId ? { ...o, status: 'redelivery', redelivery_reason: redeliveryReason } : o));
      setRedeliveryReason('');
    } catch (e) {
      alert(e.message || 'Error al reagendar');
    } finally {
      setUpdating(null);
    }
  };

  const handleCancel = async (orderId) => {
    if (!window.confirm('¿Cancelás esta orden? El cliente solicitó cancelación.')) return;
    update(orderId, cancelOrderAdmin, 'cancelled');
  };

  const handleReturnConfirm = async () => {
    if (!returnReason.trim()) { alert('Ingresá el motivo de la devolución'); return; }
    const orderId = returnModal;
    setUpdating(orderId);
    setReturnModal(null);
    try {
      await createReturn({ order_id: orderId, reason: returnReason });
      setOrders(prev => prev.map(o => o.order_id === orderId ? { ...o, status: 'return_in_progress' } : o));
      setReturnReason('');
    } catch (e) {
      alert(e.message || 'Error al iniciar devolución');
    } finally {
      setUpdating(null);
    }
  };

  // ── Downloads ─────────────────────────────────────────────────────────────
  const downloadLabel = async (order) => {
    try {
      const token = localStorage.getItem('auth_token');
      const base  = import.meta.env.VITE_API_URL || 'https://easypy-backend-430520813248.us-central1.run.app';
      const endpoint = order.tracking_number
        ? `/orders/${order.order_id}/etiqueta?token=${token}`
        : `/orders/${order.order_id}/etiqueta-manual?token=${token}`;
      const res  = await fetch(`${base}${endpoint}`);
      if (!res.ok) throw new Error('Error al obtener etiqueta');
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url; a.download = `guia-${order.order_id}.pdf`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch { alert('No se pudo descargar la etiqueta'); }
  };

  const downloadRemito = async (orderId) => {
    try {
      const token = localStorage.getItem('auth_token');
      const base  = import.meta.env.VITE_API_URL || 'https://easypy-backend-430520813248.us-central1.run.app';
      const res   = await fetch(`${base}/orders/${orderId}/remito?token=${token}`);
      if (!res.ok) throw new Error('Error al generar remito');
      const blob  = await res.blob();
      const url   = URL.createObjectURL(blob);
      const a     = document.createElement('a');
      a.href = url; a.download = `remito-${orderId}.pdf`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch { alert('No se pudo generar el remito'); }
  };

  const formatCurrency = (v) =>
    new Intl.NumberFormat('es-PY', { style: 'currency', currency: 'PYG', minimumFractionDigits: 0 }).format(v);

  const formatDate = (d) => {
    if (!d) return '—';
    try { return new Intl.DateTimeFormat('es-PY', { day: '2-digit', month: 'short', year: 'numeric', timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone }).format(new Date(d)); }
    catch { return '—'; }
  };

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter);
  const stats = {
    ready_for_pickup: orders.filter(o => o.status === 'ready_for_pickup').length,
    picked_up:        orders.filter(o => o.status === 'picked_up').length,
    out_for_delivery: orders.filter(o => ['out_for_delivery','in_transit'].includes(o.status)).length,
    completed:        orders.filter(o => o.status === 'completed').length,
  };

  if (loading) return <div className="lp-loading">Cargando panel...</div>;

  const printable = filtered.filter(o => !['pending','cancelled'].includes(o.status));
  const allPrint  = printable.length > 0 && printIds.size === printable.length;

  return (
    <div className="lp-page">

      {/* Modal reagendamiento */}
      {redeliveryModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '28px', maxWidth: '420px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '8px', color: '#111827' }}>Reagendar entrega</h3>
            <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px' }}>Indicá el motivo por el que no se pudo entregar</p>
            <select style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', marginBottom: '10px', background: 'white' }}
              value={redeliveryReason} onChange={e => setRedeliveryReason(e.target.value)}>
              <option value="">Seleccioná un motivo...</option>
              <option value="Cliente no contesta">Cliente no contesta</option>
              <option value="Cliente no estaba en casa">Cliente no estaba en casa</option>
              <option value="Dirección incorrecta">Dirección incorrecta</option>
              <option value="Cliente solicitó cambiar horario">Cliente solicitó cambiar horario</option>
              <option value="Zona de difícil acceso">Zona de difícil acceso</option>
              <option value="Otro">Otro</option>
            </select>
            {redeliveryReason === 'Otro' && (
              <input style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', marginBottom: '10px' }}
                placeholder="Describí el motivo..." onInput={e => setRedeliveryReason(e.target.value)} />
            )}
            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
              <button onClick={() => { setRedeliveryModal(null); setRedeliveryReason(''); }}
                style={{ flex: 1, padding: '10px', border: '1.5px solid #e5e7eb', borderRadius: '9px', background: 'white', color: '#6b7280', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>
                Cancelar
              </button>
              <button onClick={handleRedeliveryConfirm}
                style={{ flex: 2, padding: '10px', border: 'none', borderRadius: '9px', background: '#f97316', color: 'white', fontWeight: '800', fontSize: '13px', cursor: 'pointer' }}>
                Confirmar reagendamiento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal devolución */}
      {returnModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '28px', maxWidth: '420px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '8px', color: '#111827' }}>Iniciar devolución</h3>
            <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px' }}>El producto será devuelto al proveedor. Indicá el motivo.</p>
            <select style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', marginBottom: '10px', background: 'white' }}
              value={returnReason} onChange={e => setReturnReason(e.target.value)}>
              <option value="">Seleccioná un motivo...</option>
              <option value="Cliente no contesta">Cliente no contesta</option>
              <option value="Cliente rechazó el producto">Cliente rechazó el producto</option>
              <option value="Producto dañado">Producto dañado</option>
              <option value="Producto incorrecto">Producto incorrecto</option>
              <option value="Cliente desistió de la compra">Cliente desistió de la compra</option>
              <option value="Otro">Otro</option>
            </select>
            {returnReason === 'Otro' && (
              <input style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', marginBottom: '10px' }}
                placeholder="Describí el motivo..." onInput={e => setReturnReason(e.target.value)} />
            )}
            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
              <button onClick={() => { setReturnModal(null); setReturnReason(''); }}
                style={{ flex: 1, padding: '10px', border: '1.5px solid #e5e7eb', borderRadius: '9px', background: 'white', color: '#6b7280', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>
                Cancelar
              </button>
              <button onClick={handleReturnConfirm}
                style={{ flex: 2, padding: '10px', border: 'none', borderRadius: '9px', background: '#dc2626', color: 'white', fontWeight: '800', fontSize: '13px', cursor: 'pointer' }}>
                Iniciar devolución
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="lp-header">
        <h1 className="lp-title">Panel Logístico</h1>
        <p className="lp-subtitle">{logistic?.name || '—'} — Gestión de envíos</p>
      </div>

      {error && <div className="lp-error">{error}</div>}

      {efectividad && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'white', border: '1.5px solid #e5e7eb', borderRadius: '12px', padding: '14px 20px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '120px' }}>
            <p style={{ fontSize: '11px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Efectividad de entregas</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
              <div style={{ flex: 1, height: '8px', background: '#f3f4f6', borderRadius: '100px', overflow: 'hidden' }}>
                <div style={{ width: `${efectividad.efectividad}%`, height: '100%', background: efectividad.efectividad >= 80 ? '#16a34a' : efectividad.efectividad >= 60 ? '#d97706' : '#dc2626', borderRadius: '100px', transition: 'width 0.5s ease' }} />
              </div>
              <span style={{ fontSize: '20px', fontWeight: '800', color: efectividad.efectividad >= 80 ? '#16a34a' : efectividad.efectividad >= 60 ? '#d97706' : '#dc2626', minWidth: '52px' }}>
                {efectividad.efectividad}%
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            {[
              { label: 'Entregadas',  value: efectividad.completed,  color: '#16a34a' },
              { label: 'Reagendadas', value: efectividad.redelivery,  color: '#f97316' },
              { label: 'Canceladas',  value: efectividad.cancelled,   color: '#dc2626' },
              { label: 'Total',       value: efectividad.total,       color: '#6b7280' },
            ].map((s, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '18px', fontWeight: '800', color: s.color }}>{s.value}</p>
                <p style={{ fontSize: '10px', color: '#9ca3af', fontWeight: '600' }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="lp-stats">
        {STATS_CONFIG.map(s => (
          <div key={s.key} className="lp-stat" style={{ background: s.bg, borderColor: s.border }}>
            <p className="lp-stat-label" style={{ color: s.color }}>{s.label}</p>
            <p className="lp-stat-value" style={{ color: s.color }}>{stats[s.key]}</p>
          </div>
        ))}
      </div>

      <div className="lp-filters">
        {FILTERS.map(f => (
          <button key={f} className={`lp-filter-btn ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
            {f === 'all' ? 'Todas' : STATUS_LABELS[f]?.label || f}
            {f !== 'all' && <span className="lp-filter-count">({orders.filter(o => o.status === f).length})</span>}
          </button>
        ))}
      </div>

      {/* Barra de selección de impresión */}
      {printable.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#f9fafb', border: '1.5px solid #e5e7eb', borderRadius: '10px', padding: '10px 14px', marginBottom: '10px' }}>
          <button onClick={() => allPrint ? setPrintIds(new Set()) : setPrintIds(new Set(printable.map(o => o.order_id)))}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '700', fontSize: '13px', color: '#374151' }}>
            <svg width="16" height="16" fill={allPrint ? '#374151' : 'none'} stroke="#374151" viewBox="0 0 24 24">
              <rect x="3" y="3" width="18" height="18" rx="3" strokeWidth="2"/>
              {allPrint && <path d="M7 12l4 4 6-6" strokeWidth="2.5" stroke="white"/>}
            </svg>
            {allPrint ? 'Deseleccionar todo' : `Seleccionar ${printable.length} para imprimir`}
          </button>
          {printIds.size > 0 && <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '700' }}>{printIds.size} seleccionada{printIds.size !== 1 ? 's' : ''}</span>}
        </div>
      )}

      {/* Barra de selección masiva de estado */}
      {selected.size > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#056EB7', color: 'white', padding: '12px 16px', borderRadius: '10px', marginBottom: '12px', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: '700', fontSize: '13px' }}>{selected.size} orden{selected.size > 1 ? 'es' : ''} seleccionada{selected.size > 1 ? 's' : ''}</span>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginLeft: 'auto' }}>
            <button onClick={() => handleBulkUpdate(pickedUpOrder, 'picked_up')} disabled={bulkUpdating}
              style={{ padding: '6px 12px', background: 'white', color: '#056EB7', border: 'none', borderRadius: '7px', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}>
              ✓ Marcar retiradas
            </button>
            <button onClick={() => handleBulkUpdate(outForDeliveryOrder, 'out_for_delivery')} disabled={bulkUpdating}
              style={{ padding: '6px 12px', background: 'white', color: '#d97706', border: 'none', borderRadius: '7px', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}>
              🚚 Salir a entregar
            </button>
            <button onClick={() => handleBulkUpdate(deliverOrder, 'completed')} disabled={bulkUpdating}
              style={{ padding: '6px 12px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '7px', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}>
              ✓ Confirmar entregas
            </button>
            <button onClick={() => setSelected(new Set())} disabled={bulkUpdating}
              style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.4)', borderRadius: '7px', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="lp-empty">No hay órdenes en este estado</div>
      ) : (
        <div className="lp-orders">
          {filtered.map(order => {
            const st         = STATUS_LABELS[order.status] || { label: order.status, color: '#6b7280', bg: '#f3f4f6' };
            const isUpdating = updating === order.order_id;

            return (
              <div key={order.order_id} className="lp-order" style={{ position: 'relative' }}>

                {/* Checkbox estado (azul) */}
                <input type="checkbox" checked={selected.has(order.order_id)} onChange={() => toggleSelect(order.order_id)}
                  style={{ position: 'absolute', top: '12px', left: '12px', width: '16px', height: '16px', cursor: 'pointer', zIndex: 1 }}
                  onClick={e => e.stopPropagation()} />

                {/* Checkbox impresión (verde) */}
                {!['pending','cancelled'].includes(order.status) && (
                  <input type="checkbox" checked={printIds.has(order.order_id)} onChange={() => togglePrint(order.order_id)}
                    style={{ position: 'absolute', top: '12px', left: '34px', width: '16px', height: '16px', cursor: 'pointer', zIndex: 1, accentColor: '#16a34a' }}
                    onClick={e => e.stopPropagation()} />
                )}

                <div className="lp-order-info">
                  <div className="lp-order-top">
                    <span className="lp-order-id">Orden #{order.order_id}</span>
                    <span className="lp-badge" style={{ background: st.bg, color: st.color }}>{st.label}</span>
                    {order.collection_type === 'con_recaudo' && (
                      <span className="lp-badge" style={{ background: '#fef3c7', color: '#d97706' }}>Con recaudo</span>
                    )}
                    {isFixy && order.tracking_number && (
                      fixyStatuses[order.order_id] ? (
                        <span style={{ padding: '2px 10px', borderRadius: '100px', fontSize: '11px', fontWeight: '700', background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }}>
                          Fixy: {fixyStatuses[order.order_id].fixy_label}
                        </span>
                      ) : (
                        <button onClick={() => fetchFixyStatus(order.order_id)} disabled={loadingFixy === order.order_id}
                          style={{ padding: '2px 10px', borderRadius: '100px', fontSize: '11px', fontWeight: '700', background: '#eff6ff', color: '#056EB7', border: '1px solid #bfdbfe', cursor: 'pointer' }}>
                          {loadingFixy === order.order_id ? 'Consultando...' : '📡 Ver estado Fixy'}
                        </button>
                      )
                    )}
                  </div>

                  <div className="lp-order-grid">
                    <p className="lp-order-field"><strong>Destinatario:</strong> {order.recipient_name || '—'}</p>
                    <p className="lp-order-field"><strong>Teléfono:</strong> {order.recipient_phone || '—'}</p>
                    <p className="lp-order-field"><strong>Ciudad:</strong> {order.recipient_city || '—'}, {order.recipient_region || '—'}</p>
                    <p className="lp-order-field"><strong>Fecha:</strong> {formatDate(order.created_at)}</p>
                    <p className="lp-order-field full"><strong>Dirección:</strong> {order.recipient_address || '—'} {order.recipient_address_complement || ''}</p>

                    {order.recipient_lat && order.recipient_lng && (
                      <p className="lp-order-field full">
                        <a href={`https://www.google.com/maps?q=${order.recipient_lat},${order.recipient_lng}`}
                          target="_blank" rel="noopener noreferrer" className="lp-maps-link">
                          Ver ubicación del cliente en Maps
                        </a>
                      </p>
                    )}

                    {order.supplier_city && (
                      <p className="lp-order-field full" style={{ marginTop: '4px' }}>
                        <strong>Retiro:</strong>{' '}
                        <a href={`https://www.google.com/maps/search/${encodeURIComponent([order.supplier_address, order.supplier_height, order.supplier_city, 'Paraguay'].filter(Boolean).join(' '))}`}
                          target="_blank" rel="noopener noreferrer" style={{ color: '#8b5cf6', fontWeight: '600', textDecoration: 'none' }}>
                          {[order.supplier_address, order.supplier_height, order.supplier_city].filter(Boolean).join(', ')}
                        </a>
                        {order.supplier_phone && <span style={{ marginLeft: '8px', color: '#6b7280' }}>· {order.supplier_phone}</span>}
                      </p>
                    )}

                    {isFixy && fixyStatuses[order.order_id]?.eventos?.length > 0 && (
                      <div style={{ marginTop: '8px', padding: '8px 12px', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                        <p style={{ fontSize: '11px', fontWeight: '700', color: '#16a34a', marginBottom: '4px' }}>HISTORIAL FIXY</p>
                        {fixyStatuses[order.order_id].eventos.map((ev, i) => (
                          <p key={i} style={{ fontSize: '11px', color: '#374151', marginBottom: '2px' }}>
                            {ev.fecha || ev.created_at || ''} — {ev.estado_descripcion || ev.estado || ev.codigo || '—'}
                          </p>
                        ))}
                      </div>
                    )}

                    {order.redelivery_reason && (
                      <p className="lp-order-field full" style={{ marginTop: '4px' }}>
                        <span style={{ fontSize: '12px', color: '#f97316', fontWeight: '600' }}>
                          Motivo: {order.redelivery_reason}
                        </span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="lp-order-actions">
                  <div>
                    <p className="lp-price-label">Total</p>
                    <p className="lp-price-value">{formatCurrency(order.final_price)}</p>
                  </div>

                  {!['pending','cancelled'].includes(order.status) && (
                    <button className="lp-btn" onClick={() => downloadLabel(order)} disabled={isUpdating}
                      style={{ background: '#f3f4f6', color: '#374151', border: '1.5px solid #e5e7eb', fontSize: '12px' }}>
                      Etiqueta
                    </button>
                  )}

                  {!['pending','cancelled'].includes(order.status) && (
                    <button className="lp-btn" onClick={() => downloadRemito(order.order_id)} disabled={isUpdating}
                      style={{ background: '#f5f3ff', color: '#7c3aed', border: '1.5px solid #c4b5fd', fontSize: '12px' }}>
                      Remito
                    </button>
                  )}

                  {order.status === 'ready_for_pickup' && (
                    <button className="lp-btn pickup" onClick={() => update(order.order_id, pickedUpOrder, 'picked_up')} disabled={isUpdating}>
                      {isUpdating ? 'Procesando...' : 'Retirar del proveedor'}
                    </button>
                  )}

                  {order.status === 'picked_up' && (
                    <button className="lp-btn pickup" onClick={() => update(order.order_id, outForDeliveryOrder, 'out_for_delivery')} disabled={isUpdating}>
                      {isUpdating ? 'Procesando...' : 'Salir a entregar'}
                    </button>
                  )}

                  {['out_for_delivery', 'in_transit'].includes(order.status) && (
                    <>
                      <button className="lp-btn deliver" onClick={() => update(order.order_id, deliverOrder, 'completed')} disabled={isUpdating}>
                        {isUpdating ? 'Procesando...' : 'Confirmar entrega'}
                      </button>
                      <button className="lp-btn redelivery" onClick={() => setRedeliveryModal(order.order_id)} disabled={isUpdating}>
                        No entregado
                      </button>
                    </>
                  )}

                  {order.status === 'redelivery' && (
                    <>
                      <button className="lp-btn pickup" onClick={() => update(order.order_id, retryDeliveryOrder, 'out_for_delivery')} disabled={isUpdating}>
                        {isUpdating ? 'Procesando...' : 'Reintentar entrega'}
                      </button>
                      <button className="lp-btn redelivery" onClick={() => setReturnModal(order.order_id)} disabled={isUpdating}
                        style={{ background: '#fef2f2', color: '#dc2626', border: '1.5px solid #fecaca' }}>
                        Iniciar devolución
                      </button>
                      <button className="lp-btn cancel" onClick={() => handleCancel(order.order_id)} disabled={isUpdating}>
                        Cliente cancela
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Barra flotante de impresión */}
      {printIds.size > 0 && (
        <div style={{ position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: '10px', background: '#111827', borderRadius: '16px', padding: '12px 20px', boxShadow: '0 8px 32px rgba(0,0,0,0.3)', zIndex: 100 }}>
          <span style={{ fontSize: '13px', fontWeight: '700', color: 'white' }}>{printIds.size} orden{printIds.size !== 1 ? 'es' : ''} seleccionada{printIds.size !== 1 ? 's' : ''}</span>
          <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.2)' }} />
          <button onClick={handleBulkEtiquetas} disabled={printingBulk}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '9px', fontWeight: '700', fontSize: '12px', cursor: 'pointer', opacity: printingBulk ? 0.6 : 1 }}>
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
            {printingBulk ? 'Generando...' : 'Etiquetas'}
          </button>
          <button onClick={handleBulkRemitos} disabled={printingRemitos}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: '#7c3aed', color: 'white', border: 'none', borderRadius: '9px', fontWeight: '700', fontSize: '12px', cursor: 'pointer', opacity: printingRemitos ? 0.6 : 1 }}>
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            {printingRemitos ? 'Generando...' : 'Remitos'}
          </button>
          <button onClick={() => setPrintIds(new Set())}
            style={{ padding: '8px 10px', background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', borderRadius: '9px', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}>
            ✕
          </button>
        </div>
      )}

    </div>
  );
};

export default LogisticsPanel;
