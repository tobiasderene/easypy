import React, { useState, useEffect, useRef } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend
} from 'recharts';
import { useUser } from '../App';
import {
  getOrdersByBuyer, getOrdersBySupplier, getAllOrdersAdmin,
  getWalletByUser, getTransactionsByWallet, getProductImages
} from '../services/api';
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
  picked_up:        '#2563eb',
  out_for_delivery: '#d97706',
  pending:          '#9ca3af',
  cancelled:        '#dc2626',
  redelivery:       '#f97316',
};

const STATUS_LABELS = {
  completed:        'Completado',
  confirmed:        'Confirmado',
  processing:       'En preparación',
  ready_for_pickup: 'Listo para retiro',
  picked_up:        'Retirado',
  out_for_delivery: 'En camino',
  pending:          'Pendiente admin',
  cancelled:        'Cancelado',
  redelivery:       'Reagendado',
};

const EARNINGS_VIEWS = [
  { id: 'daily',   label: 'Diario'   },
  { id: 'weekly',  label: 'Semanal'  },
  { id: 'monthly', label: 'Mensual'  },
];

const BREAKDOWN_OPTIONS = [
  { id: 'status',   label: 'Por estado'    },
  { id: 'supplier', label: 'Por proveedor' },
  { id: 'buyer',    label: 'Por vendedor'  },
  { id: 'logistics',label: 'Por logística' },
];

const Analytics = () => {
  const { user }   = useUser();
  const isProvider = user?.user_role === 'provider';
  const isAdmin    = user?.user_role === 'admin';

  const [period, setPeriod]             = useState(2);
  const [customRange, setCustomRange]   = useState(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [tempFrom, setTempFrom]         = useState('');
  const [tempTo, setTempTo]             = useState('');
  const [breakdown, setBreakdown]       = useState('status');
  const [earningsView, setEarningsView] = useState('daily');
  const [orders, setOrders]             = useState([]);
  const [wallet, setWallet]             = useState(null);
  const [topProducts, setTopProducts]   = useState([]);
  const [loading, setLoading]           = useState(true);
  const [kpiView, setKpiView]           = useState('completed'); // 'completed' | 'pending'
  const calendarRef = useRef(null);

  // Para admin: refetch cuando cambia el período o rango
  useEffect(() => {
    if (!user?.user_id) return;
    setLoading(true);
    setOrders([]);

    let dateFrom = null;
    let dateTo   = null;

    if (isAdmin) {
      const range = customRange || (() => {
        const to   = new Date();
        const from = new Date();
        from.setDate(from.getDate() - PERIODS[period].days + 1);
        from.setHours(0, 0, 0, 0);
        return { from, to };
      })();
      dateFrom = range.from.toISOString();
      dateTo   = range.to.toISOString();
    }

    const fetchOrders = isAdmin
      ? getAllOrdersAdmin(dateFrom, dateTo)
      : isProvider
        ? getOrdersBySupplier(user.user_id)
        : getOrdersByBuyer(user.user_id);

    const fetchWallet = isAdmin
      ? Promise.resolve(null)
      : getWalletByUser(user.user_id);

    Promise.all([fetchOrders, fetchWallet])
      .then(([ords, wal]) => {
        setOrders(ords || []);
        setWallet(wal);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, period, customRange]);

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
    const sorted = Object.entries(productCount).sort((a, b) => b[1] - a[1]).slice(0, 5);
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

  const getRange = () => {
    if (customRange) return customRange;
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - PERIODS[period].days + 1);
    from.setHours(0, 0, 0, 0);
    return { from, to };
  };

  const { from: cutoffFrom, to: cutoffTo } = getRange();

  // Admin: el backend ya filtra por fecha — no filtrar de nuevo
  // No-admin: filtrar en frontend sobre sus propias órdenes
  const filteredOrders = isAdmin
    ? orders.filter(o => !!o.created_at)
    : orders.filter(o => {
        if (!o.created_at) return false;
        const d = new Date(o.created_at);
        return !isNaN(d) && d >= cutoffFrom && d <= cutoffTo;
      });

  const formatCurrency = (v) =>
    new Intl.NumberFormat('es-PY', { style: 'currency', currency: 'PYG', minimumFractionDigits: 0 }).format(v || 0);

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const inProgress = ['confirmed','processing','ready_for_pickup','picked_up','out_for_delivery','redelivery'];

  // Filtrar según kpiView para los KPIs financieros
  // Las órdenes canceladas con logística movilizada también generan ingreso (logistic_cost + platform_fee)
  const cancelledMovilized = filteredOrders.filter(o =>
    o.status === 'cancelled' &&
    ['picked_up','out_for_delivery','redelivery'].includes(o.pre_cancel_status || '')
  );

  const kpiOrders = filteredOrders.filter(o => {
    if (kpiView === 'completed') return o.status === 'completed';
    if (kpiView === 'pending')   return inProgress.includes(o.status);
    return true; // 'all'
  });

  const totalOrders      = filteredOrders.length;
  const completadas      = filteredOrders.filter(o => o.status === 'completed').length;
  const canceladas       = filteredOrders.filter(o => o.status === 'cancelled').length;
  const activeOrders     = filteredOrders.filter(o => inProgress.includes(o.status)).length;
  const totalRecaudo     = kpiOrders.reduce((s, o) => s + parseFloat(o.final_price   || 0), 0);
  // Logística y comisión incluyen cancelaciones donde la logística ya fue movilizada
  const cancelledLogistics  = cancelledMovilized.reduce((s, o) => s + parseFloat(o.logistic_cost || 0), 0);
  const cancelledCommission = cancelledMovilized.reduce((s, o) => s + parseFloat(o.platform_fee  || 0), 0);
  const totalLogistics   = kpiOrders.reduce((s, o) => s + parseFloat(o.logistic_cost || 0), 0) + (kpiView === 'all' ? cancelledLogistics : 0);
  const totalCommission  = kpiOrders.reduce((s, o) => s + parseFloat(o.platform_fee  || 0), 0) + (kpiView === 'all' ? cancelledCommission : 0);
  const totalBuyerProfit = kpiOrders.reduce((s, o) => s + parseFloat(o.buyer_profit  || 0), 0);
  const gananciaEstimada = kpiOrders.reduce((s, o) => s + parseFloat(o.buyer_profit  || 0), 0);
  const ticketPromedio   = kpiOrders.length > 0 ? totalRecaudo / kpiOrders.length : 0;
  const tasaConversion   = totalOrders > 0 ? ((completadas / totalOrders) * 100).toFixed(1) : 0;

  // ── Ganancias EasyPy agrupadas por período ────────────────────────────────
  const earningsData = (() => {
    const map = {};
    filteredOrders.forEach(o => {
      if (!o.created_at) return;
      const d = new Date(o.created_at);
      let key;
      if (earningsView === 'daily') {
        key = d.toLocaleDateString('es-PY', { day: '2-digit', month: 'short' });
      } else if (earningsView === 'weekly') {
        const startOfWeek = new Date(d);
        startOfWeek.setDate(d.getDate() - d.getDay());
        key = `Sem ${startOfWeek.toLocaleDateString('es-PY', { day: '2-digit', month: 'short' })}`;
      } else {
        key = d.toLocaleDateString('es-PY', { month: 'short', year: 'numeric' });
      }
      if (!map[key]) map[key] = { periodo: key, ingreso: 0, comision: 0, logistica: 0, ganancia_vendedor: 0 };
      map[key].ingreso           += parseFloat(o.final_price   || 0);
      map[key].comision          += parseFloat(o.platform_fee  || 0);
      map[key].logistica         += parseFloat(o.logistic_cost || 0);
      map[key].ganancia_vendedor += parseFloat(o.buyer_profit  || 0);
    });
    return Object.values(map);
  })();

  // ── Rankings ──────────────────────────────────────────────────────────────
  const rankingProviders = Object.entries(
    filteredOrders.reduce((acc, o) => {
      const key = o.supplier_id;
      if (!acc[key]) acc[key] = { id: key, name: `Proveedor #${key}`, ordenes: 0, ingreso: 0 };
      acc[key].ordenes++;
      acc[key].ingreso += parseFloat(o.logistic_cost || 0);
      return acc;
    }, {})
  ).map(([, v]) => v).sort((a, b) => b.ordenes - a.ordenes).slice(0, 8);

  const rankingSellers = Object.entries(
    filteredOrders.reduce((acc, o) => {
      const key = o.buyer_id;
      if (!acc[key]) acc[key] = { id: key, name: `Vendedor #${key}`, ordenes: 0, recaudo: 0 };
      acc[key].ordenes++;
      acc[key].recaudo += parseFloat(o.final_price || 0);
      return acc;
    }, {})
  ).map(([, v]) => v).sort((a, b) => b.ordenes - a.ordenes).slice(0, 8);

  // ── Breakdown ──────────────────────────────────────────────────────────────
  const breakdownData = (() => {
    if (!isAdmin) return [];
    const map = {};
    filteredOrders.forEach(o => {
      let key = '';
      if (breakdown === 'status')    key = STATUS_LABELS[o.status] || o.status;
      if (breakdown === 'supplier')  key = `Proveedor #${o.supplier_id}`;
      if (breakdown === 'buyer')     key = `Vendedor #${o.buyer_id}`;
      if (breakdown === 'logistics') key = o.logistic_id ? `Logística #${o.logistic_id}` : 'Sin logística';
      if (!map[key]) map[key] = { name: key, ingreso: 0, comision: 0, logistica: 0, ordenes: 0 };
      map[key].ingreso   += parseFloat(o.final_price   || 0);
      map[key].comision  += parseFloat(o.platform_fee  || 0);
      map[key].logistica += parseFloat(o.logistic_cost || 0);
      map[key].ordenes++;
    });
    return Object.values(map).sort((a, b) => b.ingreso - a.ingreso).slice(0, 8);
  })();

  const byStatus = Object.entries(
    filteredOrders.reduce((acc, o) => { acc[o.status] = (acc[o.status] || 0) + 1; return acc; }, {})
  ).map(([status, cantidad]) => ({ status, cantidad, label: STATUS_LABELS[status] || status }));

  const costPieData = isAdmin ? [
    { name: 'Comisión EasyPy',  value: Math.round(totalCommission),  color: '#056EB7' },
    { name: 'Costo logística',  value: Math.round(totalLogistics),   color: '#0ea5e9' },
    { name: 'Ganancia vendors', value: Math.round(totalBuyerProfit), color: '#16a34a' },
  ].filter(d => d.value > 0) : [];

  const salesByDay = (() => {
    const map = {};
    filteredOrders.forEach(o => {
      if (!o.created_at) return;
      const d = new Date(o.created_at);
      if (isNaN(d)) return;
      const key = d.toLocaleDateString('es-PY', { day: '2-digit', month: 'short' });
      if (!isAdmin) {
        const qty = (o.items || []).reduce((s, i) => s + (i.quantity || 1), 0);
        map[key] = (map[key] || 0) + qty;
      }
    });
    if (!isAdmin) return Object.entries(map).map(([fecha, cantidad]) => ({ fecha, cantidad }));
    return [];
  })();

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
            <p>{isAdmin ? 'Vista global de la plataforma' : 'Resumen de tu actividad'}</p>
          </div>
          <div className="an-period-selector">
            {PERIODS.map((p, i) => (
              <button key={i} className={`an-period-btn ${!customRange && period === i ? 'active' : ''}`}
                onClick={() => { setPeriod(i); setCustomRange(null); }}>
                {p.label}
              </button>
            ))}
            <button className={`an-period-btn ${customRange ? 'active' : ''}`} onClick={() => setShowCalendar(!showCalendar)}>
              {customRange
                ? `${cutoffFrom.toLocaleDateString('es-PY', { day: '2-digit', month: 'short' })} – ${cutoffTo.toLocaleDateString('es-PY', { day: '2-digit', month: 'short' })}`
                : 'Rango'}
            </button>
          </div>
        </div>

        {/* Toggle completadas / pendientes */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
          {[
            { id: 'completed', label: '✓ Completadas' },
            { id: 'pending',   label: '⏳ En curso'   },
            { id: 'all',       label: 'Todas'          },
          ].map(v => (
            <button key={v.id} onClick={() => setKpiView(v.id)}
              style={{ padding: '6px 14px', fontSize: '12px', fontWeight: '700', borderRadius: '100px', border: '1.5px solid', cursor: 'pointer',
                background: kpiView === v.id ? '#056EB7' : 'white',
                color:      kpiView === v.id ? 'white'   : '#6b7280',
                borderColor: kpiView === v.id ? '#056EB7' : '#e5e7eb' }}>
              {v.label}
            </button>
          ))}
        </div>

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
            {/* ── KPIs Admin ── */}
            {isAdmin ? (
              <>
                <div className="an-kpis">
                  {[
                    { label: 'Total órdenes',    value: totalOrders,                format: 'number'   },
                    { label: 'En curso',          value: activeOrders,              format: 'number'   },
                    { label: 'Completadas',       value: completadas,               format: 'number'   },
                    { label: 'Canceladas',        value: canceladas,                format: 'number'   },
                    { label: 'Tasa conversión',   value: `${tasaConversion}%`,      format: 'text'     },
                    { label: 'Ticket promedio',   value: ticketPromedio,            format: 'currency' },
                  ].map((kpi, i) => (
                    <div key={i} className="an-kpi">
                      <span className="an-kpi-label">{kpi.label}</span>
                      <span className="an-kpi-value">
                        {kpi.format === 'currency' ? formatCurrency(kpi.value) : kpi.value}
                      </span>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px', marginBottom: '4px' }}>
                  <p style={{ fontSize: '11px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {kpiView === 'completed' ? '✓ Solo órdenes completadas' : kpiView === 'pending' ? '⏳ Solo órdenes en curso' : 'Todas las órdenes'}
                  </p>
                </div>
                <div className="an-kpis" style={{ marginTop: '4px' }}>
                  {[
                    { label: 'Ingreso total',       value: totalRecaudo,      highlight: false },
                    { label: 'Costo logística',     value: totalLogistics,    highlight: false },
                    { label: 'Comisión EasyPy',     value: totalCommission,   highlight: true  },
                    { label: 'Ganancia vendedores', value: totalBuyerProfit,  highlight: false },
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
                  { label: 'Órdenes',           value: totalOrders,      format: 'number'   },
                  { label: 'Total recaudado',    value: totalRecaudo,     format: 'currency' },
                  { label: 'Ganancia estimada',  value: gananciaEstimada, format: 'currency', highlight: true },
                  { label: 'Completadas',        value: completadas,      format: 'number'   },
                ].map((kpi, i) => (
                  <div key={i} className={`an-kpi ${kpi.highlight ? 'highlight' : ''}`}>
                    <span className="an-kpi-label">{kpi.label}</span>
                    <span className="an-kpi-value">{kpi.format === 'currency' ? formatCurrency(kpi.value) : kpi.value}</span>
                  </div>
                ))}
              </div>
            )}

            {/* ── Ganancias EasyPy (admin) ── */}
            {isAdmin && (
              <div className="an-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h2 className="an-card-title" style={{ margin: 0 }}>Ganancias EasyPy</h2>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {EARNINGS_VIEWS.map(v => (
                      <button key={v.id} onClick={() => setEarningsView(v.id)}
                        style={{ padding: '4px 12px', fontSize: '11px', fontWeight: '700', borderRadius: '100px', border: '1.5px solid', cursor: 'pointer',
                          background: earningsView === v.id ? '#056EB7' : 'white',
                          color:      earningsView === v.id ? 'white'   : '#6b7280',
                          borderColor: earningsView === v.id ? '#056EB7' : '#e5e7eb' }}>
                        {v.label}
                      </button>
                    ))}
                  </div>
                </div>
                {earningsData.length === 0 ? <div className="an-empty">Sin datos</div> : (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={earningsData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="periodo" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Bar dataKey="ingreso"          name="Ingreso"         fill="#e0f2fe" radius={[3,3,0,0]} />
                      <Bar dataKey="comision"         name="Comisión EasyPy" fill="#056EB7" radius={[3,3,0,0]} />
                      <Bar dataKey="ganancia_vendedor" name="Ganancia vendors" fill="#16a34a" radius={[3,3,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            )}

            {/* ── Gráfico no-admin ── */}
            {!isAdmin && (
              <div className="an-card">
                <h2 className="an-card-title">Unidades vendidas en el tiempo</h2>
                {salesByDay.length === 0 ? <div className="an-empty">Sin datos</div> : (
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
            )}

            {/* ── Rankings (admin) ── */}
            {isAdmin && (
              <>
                <div className="an-row2">
                  {/* Top proveedores */}
                  <div className="an-card">
                    <h2 className="an-card-title">Ranking de proveedores</h2>
                    {rankingProviders.length === 0 ? <div className="an-empty">Sin datos</div> : (
                      <ResponsiveContainer width="100%" height={240}>
                        <BarChart data={rankingProviders} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                          <XAxis type="number" tick={{ fontSize: 10, fill: '#9ca3af' }} allowDecimals={false} />
                          <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#6b7280' }} width={90} />
                          <Tooltip content={<CustomTooltip />} />
                          <Bar dataKey="ordenes" name="Órdenes" fill="#8b5cf6" radius={[0,3,3,0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>

                  {/* Top vendedores */}
                  <div className="an-card">
                    <h2 className="an-card-title">Ranking de vendedores</h2>
                    {rankingSellers.length === 0 ? <div className="an-empty">Sin datos</div> : (
                      <ResponsiveContainer width="100%" height={240}>
                        <BarChart data={rankingSellers} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                          <XAxis type="number" tick={{ fontSize: 10, fill: '#9ca3af' }} allowDecimals={false} />
                          <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#6b7280' }} width={90} />
                          <Tooltip content={<CustomTooltip />} />
                          <Bar dataKey="ordenes" name="Órdenes" fill="#056EB7" radius={[0,3,3,0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                {/* Top productos */}
                <div className="an-card">
                  <h2 className="an-card-title">Ranking de productos más vendidos</h2>
                  {topProducts.length === 0 ? <div className="an-empty">Sin datos</div> : (
                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                      {topProducts.map((p, i) => (
                        <div key={p.product_id} style={{ flex: '1 1 140px', border: '1.5px solid #e5e7eb', borderRadius: '10px', overflow: 'hidden', minWidth: '120px' }}>
                          {p.imageUrl ? <img src={p.imageUrl} alt={p.name} style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover' }} loading="lazy" />
                            : <div style={{ width: '100%', aspectRatio: '4/3', background: '#f3f4f6' }} />}
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
              </>
            )}

            {/* ── Desglose (admin) ── */}
            {isAdmin && (
              <div className="an-row2">
                <div className="an-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h2 className="an-card-title" style={{ margin: 0 }}>Desglose</h2>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {BREAKDOWN_OPTIONS.map(opt => (
                        <button key={opt.id} onClick={() => setBreakdown(opt.id)}
                          style={{ padding: '4px 12px', fontSize: '11px', fontWeight: '700', borderRadius: '100px', border: '1.5px solid', cursor: 'pointer',
                            background: breakdown === opt.id ? '#056EB7' : 'white',
                            color:      breakdown === opt.id ? 'white'   : '#6b7280',
                            borderColor: breakdown === opt.id ? '#056EB7' : '#e5e7eb' }}>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  {breakdownData.length === 0 ? <div className="an-empty">Sin datos</div> : (
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart data={breakdownData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                        <XAxis type="number" tick={{ fontSize: 10, fill: '#9ca3af' }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#6b7280' }} width={90} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="ingreso"  name="Ingreso"  fill="#056EB7" radius={[0,3,3,0]} stackId="a" />
                        <Bar dataKey="comision" name="Comisión" fill="#16a34a" radius={[0,3,3,0]} stackId="a" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>

                <div className="an-card">
                  <h2 className="an-card-title">Distribución de ingresos</h2>
                  {costPieData.length === 0 ? <div className="an-empty">Sin datos</div> : (
                    <>
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie data={costPieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={3}>
                            {costPieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                          </Pie>
                          <Tooltip formatter={v => formatCurrency(v)} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
                        {costPieData.map((d, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: d.color }} />
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

            {/* ── No admin ── */}
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
                  <h2 className="an-card-title">{isProvider ? 'Top 3 productos' : 'Top proveedores'}</h2>
                  {isProvider ? (
                    topProducts.slice(0,3).length === 0 ? <div className="an-empty">Sin datos</div> : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {topProducts.slice(0,3).map((p, i) => (
                          <div key={p.product_id} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ fontSize: '18px', fontWeight: '800', color: '#056EB7', width: '20px' }}>#{i+1}</span>
                            {p.imageUrl ? <img src={p.imageUrl} alt={p.name} style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover', border: '1.5px solid #e5e7eb' }} loading="lazy" /> : <div style={{ width: '48px', height: '48px', borderRadius: '8px', background: '#f3f4f6' }} />}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ fontSize: '13px', fontWeight: '700', color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</p>
                              <p style={{ fontSize: '12px', color: '#6b7280' }}>{p.qty} unidades</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  ) : (
                    rankingProviders.length === 0 ? <div className="an-empty">Sin datos</div> : (
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={rankingProviders.slice(0,5)}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9ca3af' }} />
                          <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} allowDecimals={false} />
                          <Tooltip content={<CustomTooltip />} />
                          <Bar dataKey="ordenes" name="Órdenes" fill="#056EB7" radius={[4,4,0,0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )
                  )}
                </div>
              </div>
            )}

            {/* Wallet — no admin */}
            {!isAdmin && wallet && (
              <div className="an-card">
                <h2 className="an-card-title">Estado de la wallet</h2>
                <div className="an-wallet-row">
                  <div className="an-wallet-item">
                    <span className="an-wallet-label">Disponible</span>
                    <span className="an-wallet-value green">{formatCurrency(wallet.balance_available)}</span>
                  </div>
                  <div className="an-wallet-item">
                    <span className="an-wallet-label">Pendiente</span>
                    <span className="an-wallet-value orange">{formatCurrency(wallet.balance_pending)}</span>
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
