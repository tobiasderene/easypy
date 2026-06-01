import React, { useState, useEffect, useRef } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend
} from 'recharts';
import { useUser } from '../App';
import { getOrdersByBuyer, getOrdersBySupplier, getOrders, getWalletByUser, getTransactionsByWallet, getProductImages } from '../services/api';
import '../styles/analytics.css';

const PERIODS = [
  { label: 'Hoy',      days: 1  },
  { label: '1 semana', days: 7  },
  { label: '1 mes',    days: 30 },
  { label: '3 meses',  days: 90 },
];

const STATUS_COLORS = {
  completed:        '#16a34a',
  confirmed:        '#056EB7',
  processing:       '#d97706',
  ready_for_pickup: '#8b5cf6',
  in_transit:       '#0ea5e9',
  pending:          '#9ca3af',
  cancelled:        '#dc2626',
  redelivery:       '#f97316',
};

const STATUS_LABELS = {
  completed:        'Completado',
  confirmed:        'Confirmado',
  processing:       'En proceso',
  ready_for_pickup: 'Listo para entrega',
  in_transit:       'En tránsito',
  pending:          'Pendiente admin',
  cancelled:        'Cancelado',
  redelivery:       'Recoordinación',
};

const BREAKDOWN_OPTIONS = [
  { id: 'status',    label: 'Por estado' },
  { id: 'logistics', label: 'Por logística' },
  { id: 'supplier',  label: 'Por proveedor' },
  { id: 'buyer',     label: 'Por vendedor' },
];

const Analytics = () => {
  const { user }   = useUser();
  const isProvider = user?.user_role === 'provider';
  const isAdmin    = user?.user_role === 'admin';

  const [period, setPeriod]             = useState(2); // default: 1 mes
  const [customRange, setCustomRange]   = useState(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [tempFrom, setTempFrom]         = useState('');
  const [tempTo, setTempTo]             = useState('');
  const [breakdown, setBreakdown]       = useState('status');
  const [orders, setOrders]             = useState([]);
  const [wallet, setWallet]             = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [topProducts, setTopProducts]   = useState([]);
  const [loading, setLoading]           = useState(true);
  const calendarRef = useRef(null);

  useEffect(() => {
    if (!user?.user_id) return;
    setLoading(true);
    const fetchOrders = isAdmin
      ? getOrders(0, 200)
      : isProvider
        ? getOrdersBySupplier(user.user_id)
        : getOrdersByBuyer(user.user_id);

    const fetchWallet = isAdmin
      ? Promise.resolve(null)
      : getWalletByUser(user.user_id);

    Promise.all([fetchOrders, fetchWallet])
      .then(async ([ords, wal]) => {
        console.log('[analytics] orders fetched:', ords?.length, ords);
        setOrders(ords || []);
        setWallet(wal);
        if (wal?.wallet_id) {
          const txs = await getTransactionsByWallet(wal.wallet_id).catch(() => []);
          setTransactions(txs || []);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  // Top productos
  useEffect(() => {
    if (!orders.length) return;
    const productCount = {};
    const productNames = {};
    orders.forEach(o => {
      (o.items || []).forEach(item => {
        productCount[item.product_id] = (productCount[item.product_id] || 0) + item.quantity;
        if (item.product_name) productNames[item.product_id] = item.product_name;
      });
    });
    const sorted = Object.entries(productCount).sort((a, b) => b[1] - a[1]).slice(0, 3);
    Promise.all(sorted.map(async ([pid, qty]) => {
      let imageUrl = null;
      try {
        const imgs = await getProductImages(pid);
        const primary = imgs.find(i => i.is_primary) || imgs[0];
        imageUrl = primary?.image_url || null;
      } catch {}
      return { product_id: pid, qty, name: productNames[pid] || `Producto #${pid}`, imageUrl };
    })).then(setTopProducts).catch(() => {});
  }, [orders]);

  // Rango activo
  const getRange = () => {
    if (customRange) return customRange;
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - PERIODS[period].days + 1);
    from.setHours(0, 0, 0, 0);
    return { from, to };
  };

  const { from: cutoffFrom, to: cutoffTo } = getRange();

  const filteredOrders = orders.filter(o => {
    if (!o.created_at) return false;
    const d = new Date(o.created_at);
    return !isNaN(d) && d >= cutoffFrom && d <= cutoffTo;
  });

  // ── KPIs base ────────────────────────────────────────
  const totalOrders      = filteredOrders.length;
  const completadas      = filteredOrders.filter(o => o.status === 'completed').length;
  const canceladas       = filteredOrders.filter(o => o.status === 'cancelled').length;
  const inProgress       = ['confirmed','processing','ready_for_pickup','in_transit','redelivery'];
  const activeOrders     = filteredOrders.filter(o => inProgress.includes(o.status)).length;

  const totalRecaudo     = filteredOrders.reduce((s, o) => s + parseFloat(o.final_price    || 0), 0);
  const totalSupplier    = filteredOrders.reduce((s, o) => s + parseFloat(o.logistic_cost  || 0), 0); // logistic_cost en DB
  const totalLogistics   = filteredOrders.reduce((s, o) => s + parseFloat(o.platform_fee   || 0), 0); // platform_fee es comisión EasyPy
  const totalBuyerProfit = filteredOrders.reduce((s, o) => s + parseFloat(o.buyer_profit   || 0), 0);

  // Utilidad EasyPy = platform_fee (comisión de logística)
  const utilidadEasypy   = totalLogistics;

  // Ganancia estimada sellers
  const gananciaEstimada = filteredOrders
    .filter(o => o.status === 'completed' || inProgress.includes(o.status))
    .reduce((s, o) => s + parseFloat(o.buyer_profit || 0), 0);

  // ── Gráfico líneas — ingresos o unidades por día ──────
  const salesByDay = (() => {
    const map = {};
    filteredOrders.forEach(o => {
      if (!o.created_at) return;
      const d = new Date(o.created_at);
      if (isNaN(d)) return;
      const key = d.toLocaleDateString('es-PY', { day: '2-digit', month: 'short' });
      if (isAdmin) {
        if (!map[key]) map[key] = { fecha: key, ingreso: 0, utilidad: 0, costo_logistica: 0 };
        map[key].ingreso          += parseFloat(o.final_price   || 0);
        map[key].utilidad         += parseFloat(o.platform_fee  || 0);
        map[key].costo_logistica  += parseFloat(o.logistic_cost || 0);
      } else {
        const qty = (o.items || []).reduce((s, i) => s + (i.quantity || 1), 0);
        map[key] = (map[key] || 0) + qty;
      }
    });
    if (isAdmin) return Object.values(map);
    return Object.entries(map).map(([fecha, cantidad]) => ({ fecha, cantidad }));
  })();

  // ── Admin breakdown ────────────────────────────────────
  const breakdownData = (() => {
    if (!isAdmin) return [];
    const map = {};
    filteredOrders.forEach(o => {
      let key = '';
      if (breakdown === 'status')    key = STATUS_LABELS[o.status] || o.status;
      if (breakdown === 'logistics') key = o.logistic_id ? `Logística #${o.logistic_id}` : 'Sin logística';
      if (breakdown === 'supplier')  key = `Proveedor #${o.supplier_id}`;
      if (breakdown === 'buyer')     key = `Vendedor #${o.buyer_id}`;
      if (!map[key]) map[key] = { name: key, ingreso: 0, costo_logistica: 0, utilidad: 0, ordenes: 0 };
      map[key].ingreso         += parseFloat(o.final_price   || 0);
      map[key].costo_logistica += parseFloat(o.logistic_cost || 0);
      map[key].utilidad        += parseFloat(o.platform_fee  || 0);
      map[key].ordenes         += 1;
    });
    return Object.values(map).sort((a, b) => b.ingreso - a.ingreso).slice(0, 8);
  })();

  // Pie — distribución de costos (solo admin)
  const costPieData = isAdmin ? [
    { name: 'Costo logística',  value: Math.round(totalSupplier),  color: '#0ea5e9' },
    { name: 'Comisión EasyPy',  value: Math.round(utilidadEasypy), color: '#056EB7' },
    { name: 'Ganancia vendors', value: Math.round(totalBuyerProfit), color: '#16a34a' },
  ].filter(d => d.value > 0) : [];

  // ── Órdenes por estado ────────────────────────────────
  const byStatus = Object.entries(
    filteredOrders.reduce((acc, o) => { acc[o.status] = (acc[o.status] || 0) + 1; return acc; }, {})
  ).map(([status, cantidad]) => ({ status, cantidad, label: STATUS_LABELS[status] || status }));

  // ── Top proveedores ───────────────────────────────────
  const bySupplier = Object.entries(
    filteredOrders.reduce((acc, o) => {
      const key = `Proveedor #${o.supplier_id}`;
      acc[key] = (acc[key] || 0) + 1; return acc;
    }, {})
  ).map(([proveedor, ordenes]) => ({ proveedor, ordenes }))
    .sort((a, b) => b.ordenes - a.ordenes).slice(0, 5);

  const formatCurrency = (v) =>
    new Intl.NumberFormat('es-PY', { style: 'currency', currency: 'PYG', minimumFractionDigits: 0 }).format(v || 0);

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="an-tooltip">
        <p className="an-tooltip-label">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color, margin: '2px 0', fontSize: '13px', fontWeight: 600 }}>
            {p.name}: {typeof p.value === 'number' && p.value > 1000 ? formatCurrency(p.value) : p.value}
          </p>
        ))}
      </div>
    );
  };

  const applyCustomRange = () => {
    if (!tempFrom || !tempTo) return;
    const from = new Date(tempFrom);
    const to   = new Date(tempTo);
    to.setHours(23, 59, 59, 999);
    setCustomRange({ from, to });
    setShowCalendar(false);
  };

  return (
    <div className="an-page">
      <div className="an-container">

        {/* Header */}
        <div className="an-header">
          <div>
            <h1>Analytics</h1>
            <p>{isAdmin ? 'Vista global de la plataforma' : 'Resumen de tu actividad en EasyPy'}</p>
          </div>
          <div className="an-period-selector">
            {PERIODS.map((p, i) => (
              <button key={i} className={`an-period-btn ${!customRange && period === i ? 'active' : ''}`}
                onClick={() => { setPeriod(i); setCustomRange(null); }}>
                {p.label}
              </button>
            ))}
            <button className={`an-period-btn ${customRange ? 'active' : ''}`}
              onClick={() => setShowCalendar(!showCalendar)}>
              {customRange
                ? `${cutoffFrom.toLocaleDateString('es-PY', { day: '2-digit', month: 'short' })} – ${cutoffTo.toLocaleDateString('es-PY', { day: '2-digit', month: 'short' })}`
                : 'Rango'}
            </button>
          </div>
        </div>

        {/* Calendar */}
        {showCalendar && (
          <div ref={calendarRef} style={{ background: 'white', border: '1.5px solid #e5e7eb', borderRadius: '12px', padding: '16px', display: 'flex', gap: '12px', alignItems: 'flex-end', marginBottom: '16px', flexWrap: 'wrap', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>
            <div>
              <label style={{ fontSize: '11px', fontWeight: '700', color: '#374151', display: 'block', marginBottom: '4px' }}>Desde</label>
              <input type="date" value={tempFrom} onChange={e => setTempFrom(e.target.value)} style={{ padding: '7px 10px', border: '1.5px solid #e5e7eb', borderRadius: '8px', fontSize: '13px' }} />
            </div>
            <div>
              <label style={{ fontSize: '11px', fontWeight: '700', color: '#374151', display: 'block', marginBottom: '4px' }}>Hasta</label>
              <input type="date" value={tempTo} onChange={e => setTempTo(e.target.value)} style={{ padding: '7px 10px', border: '1.5px solid #e5e7eb', borderRadius: '8px', fontSize: '13px' }} />
            </div>
            <button onClick={applyCustomRange} style={{ padding: '8px 16px', background: '#056EB7', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>Aplicar</button>
            <button onClick={() => { setCustomRange(null); setShowCalendar(false); }} style={{ padding: '8px 12px', background: 'white', color: '#6b7280', border: '1.5px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' }}>Cancelar</button>
          </div>
        )}

        {loading ? (
          <div className="an-loading"><div className="an-spinner" /></div>
        ) : (
          <>
            {/* ── KPIs ── */}
            {isAdmin ? (
              <>
                <div className="an-kpis">
                  {[
                    { label: 'Total órdenes',       value: totalOrders,      format: 'number'   },
                    { label: 'En curso',             value: activeOrders,     format: 'number'   },
                    { label: 'Completadas',          value: completadas,      format: 'number'   },
                    { label: 'Canceladas',           value: canceladas,       format: 'number'   },
                  ].map((kpi, i) => (
                    <div key={i} className="an-kpi">
                      <span className="an-kpi-label">{kpi.label}</span>
                      <span className="an-kpi-value">{kpi.value}</span>
                    </div>
                  ))}
                </div>
                <div className="an-kpis" style={{ marginTop: '12px' }}>
                  {[
                    { label: 'Ingreso total',        value: totalRecaudo,      format: 'currency' },
                    { label: 'Costo logística',      value: totalSupplier,     format: 'currency' },
                    { label: 'Comisión EasyPy',      value: utilidadEasypy,    format: 'currency', highlight: true },
                    { label: 'Ganancia vendedores',  value: totalBuyerProfit,  format: 'currency' },
                  ].map((kpi, i) => (
                    <div key={i} className={`an-kpi ${kpi.highlight ? 'highlight' : ''}`}>
                      <span className="an-kpi-label">{kpi.label}</span>
                      <span className="an-kpi-value">{formatCurrency(kpi.value)}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="an-kpis">
                {[
                  { label: 'Órdenes',          value: totalOrders,      format: 'number'   },
                  { label: 'Total recaudado',   value: totalRecaudo,     format: 'currency' },
                  { label: 'Ganancia estimada', value: gananciaEstimada, format: 'currency', highlight: true },
                  { label: 'Completadas',       value: completadas,      format: 'number'   },
                ].map((kpi, i) => (
                  <div key={i} className={`an-kpi ${kpi.highlight ? 'highlight' : ''}`}>
                    <span className="an-kpi-label">{kpi.label}</span>
                    <span className="an-kpi-value">{kpi.format === 'currency' ? formatCurrency(kpi.value) : kpi.value}</span>
                  </div>
                ))}
              </div>
            )}

            {/* ── Gráfico líneas ── */}
            <div className="an-card">
              <h2 className="an-card-title">{isAdmin ? 'Ingresos y utilidad en el tiempo' : 'Unidades vendidas en el tiempo'}</h2>
              {salesByDay.length === 0 ? (
                <div className="an-empty">Sin datos para este período</div>
              ) : isAdmin ? (
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={salesByDay}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="fecha" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="ingreso"         name="Ingreso"          stroke="#056EB7" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
                    <Line type="monotone" dataKey="costo_logistica" name="Costo logística"  stroke="#0ea5e9" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
                    <Line type="monotone" dataKey="utilidad"        name="Comisión EasyPy"  stroke="#16a34a" strokeWidth={2}   dot={false} activeDot={{ r: 4 }} />
                    <Legend />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={salesByDay}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="fecha" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} allowDecimals={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="cantidad" stroke="#056EB7" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* ── Admin: desglose + pie ── */}
            {isAdmin && (
              <div className="an-row2">
                <div className="an-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h2 className="an-card-title" style={{ margin: 0 }}>Desglose</h2>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {BREAKDOWN_OPTIONS.map(opt => (
                        <button key={opt.id} onClick={() => setBreakdown(opt.id)}
                          style={{ padding: '4px 12px', fontSize: '11px', fontWeight: '700', borderRadius: '100px', border: '1.5px solid', cursor: 'pointer', transition: 'all 0.2s',
                            background: breakdown === opt.id ? '#056EB7' : 'white',
                            color:      breakdown === opt.id ? 'white'   : '#6b7280',
                            borderColor: breakdown === opt.id ? '#056EB7' : '#e5e7eb',
                          }}>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  {breakdownData.length === 0 ? (
                    <div className="an-empty">Sin datos</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart data={breakdownData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                        <XAxis type="number" tick={{ fontSize: 10, fill: '#9ca3af' }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#6b7280' }} width={90} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="ingreso"         name="Ingreso"         fill="#056EB7" radius={[0,3,3,0]} stackId="a" />
                        <Bar dataKey="costo_logistica" name="Costo logística" fill="#0ea5e9" radius={[0,3,3,0]} stackId="a" />
                        <Bar dataKey="utilidad"        name="Comisión"        fill="#16a34a" radius={[0,3,3,0]} stackId="a" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>

                <div className="an-card">
                  <h2 className="an-card-title">Distribución de ingresos</h2>
                  {costPieData.length === 0 ? (
                    <div className="an-empty">Sin datos</div>
                  ) : (
                    <>
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie data={costPieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={3}>
                            {costPieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                          </Pie>
                          <Tooltip formatter={(v) => formatCurrency(v)} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
                        {costPieData.map((d, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: d.color, flexShrink: 0 }} />
                              <span style={{ color: '#6b7280' }}>{d.name}</span>
                            </div>
                            <span style={{ fontWeight: '700', color: '#111827' }}>{formatCurrency(d.value)}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* ── No admin: estado + proveedores ── */}
            {!isAdmin && (
              <div className="an-row2">
                <div className="an-card">
                  <h2 className="an-card-title">Órdenes por estado</h2>
                  {byStatus.length === 0 ? <div className="an-empty">Sin datos</div> : (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={byStatus} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                        <XAxis type="number" tick={{ fontSize: 11, fill: '#9ca3af' }} allowDecimals={false} />
                        <YAxis type="category" dataKey="label" tick={{ fontSize: 11, fill: '#6b7280' }} width={110} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="cantidad" radius={[0,4,4,0]}>
                          {byStatus.map((entry, i) => <Cell key={i} fill={STATUS_COLORS[entry.status] || '#9ca3af'} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
                <div className="an-card">
                  <h2 className="an-card-title">{isProvider ? 'Top 3 productos más vendidos' : 'Top proveedores'}</h2>
                  {isProvider ? (
                    topProducts.length === 0 ? <div className="an-empty">Sin datos</div> : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '4px 0' }}>
                        {topProducts.map((p, i) => (
                          <div key={p.product_id} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ fontSize: '18px', fontWeight: '800', color: '#056EB7', width: '20px' }}>#{i+1}</span>
                            {p.imageUrl ? <img src={p.imageUrl} alt={p.name} style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover', border: '1.5px solid #e5e7eb', flexShrink: 0 }} loading="lazy" /> : <div style={{ width: '48px', height: '48px', borderRadius: '8px', background: '#f3f4f6', flexShrink: 0 }} />}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ fontSize: '13px', fontWeight: '700', color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</p>
                              <p style={{ fontSize: '12px', color: '#6b7280' }}>{p.qty} unidades vendidas</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  ) : (
                    bySupplier.length === 0 ? <div className="an-empty">Sin datos</div> : (
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={bySupplier}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="proveedor" tick={{ fontSize: 10, fill: '#9ca3af' }} />
                          <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} allowDecimals={false} />
                          <Tooltip content={<CustomTooltip />} />
                          <Bar dataKey="ordenes" fill="#056EB7" radius={[4,4,0,0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )
                  )}
                </div>
              </div>
            )}

            {/* Admin: estado de órdenes */}
            {isAdmin && (
              <div className="an-row2">
                <div className="an-card">
                  <h2 className="an-card-title">Órdenes por estado</h2>
                  {byStatus.length === 0 ? <div className="an-empty">Sin datos</div> : (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={byStatus} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                        <XAxis type="number" tick={{ fontSize: 11, fill: '#9ca3af' }} allowDecimals={false} />
                        <YAxis type="category" dataKey="label" tick={{ fontSize: 11, fill: '#6b7280' }} width={110} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="cantidad" radius={[0,4,4,0]}>
                          {byStatus.map((entry, i) => <Cell key={i} fill={STATUS_COLORS[entry.status] || '#9ca3af'} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
                <div className="an-card">
                  <h2 className="an-card-title">Top 3 productos</h2>
                  {topProducts.length === 0 ? <div className="an-empty">Sin datos</div> : (
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                      {topProducts.map((p, i) => (
                        <div key={p.product_id} style={{ flex: '1 1 140px', border: '1.5px solid #e5e7eb', borderRadius: '10px', overflow: 'hidden' }}>
                          {p.imageUrl ? <img src={p.imageUrl} alt={p.name} style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover' }} loading="lazy" /> : <div style={{ width: '100%', aspectRatio: '4/3', background: '#f3f4f6' }} />}
                          <div style={{ padding: '10px' }}>
                            <p style={{ fontSize: '11px', fontWeight: '800', color: '#056EB7' }}>#{i+1}</p>
                            <p style={{ fontSize: '12px', fontWeight: '700', color: '#111827', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{p.name}</p>
                            <p style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>{p.qty} unidades</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Wallet — solo no-admin */}
            {!isAdmin && (
              <div className="an-card">
                <h2 className="an-card-title">Estado de la wallet</h2>
                <div className="an-wallet-row">
                  <div className="an-wallet-item">
                    <span className="an-wallet-label">Disponible</span>
                    <span className="an-wallet-value green">{formatCurrency(wallet?.balance_available || 0)}</span>
                  </div>
                  <div className="an-wallet-item">
                    <span className="an-wallet-label">Pendiente</span>
                    <span className="an-wallet-value orange">{formatCurrency(wallet?.balance_pending || 0)}</span>
                  </div>
                  <div className="an-wallet-item">
                    <span className="an-wallet-label">Ganancia estimada</span>
                    <span className="an-wallet-value blue">{formatCurrency(gananciaEstimada)}</span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Analytics;