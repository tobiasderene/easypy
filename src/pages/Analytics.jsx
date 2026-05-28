import React, { useState, useEffect, useRef } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { useUser } from '../App';
import { getOrdersByBuyer, getOrdersBySupplier, getWalletByUser, getTransactionsByWallet, getProductImages } from '../services/api';
import '../styles/analytics.css';

const PERIODS = [
  { label: 'Hoy',     days: 1  },
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

const Analytics = () => {
  const { user }            = useUser();
  const isProvider          = user?.user_role === 'provider';
  const [period, setPeriod] = useState(1);
  const [customRange, setCustomRange]   = useState(null); // { from, to }
  const [showCalendar, setShowCalendar] = useState(false);
  const [tempFrom, setTempFrom]         = useState('');
  const [tempTo, setTempTo]             = useState('');
  const [orders, setOrders]       = useState([]);
  const [wallet, setWallet]       = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [topProducts, setTopProducts]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const calendarRef = useRef(null);

  useEffect(() => {
    if (!user?.user_id) return;
    setLoading(true);
    const fetchOrders = isProvider
      ? getOrdersBySupplier(user.user_id)
      : getOrdersByBuyer(user.user_id);

    Promise.all([fetchOrders, getWalletByUser(user.user_id)])
      .then(async ([ords, wal]) => {
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

  // ── Top productos con imágenes ───────────────────────
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
    const sorted = Object.entries(productCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

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

  // ── Rango activo ─────────────────────────────────────
  const getRange = () => {
    if (customRange) return customRange;
    const to   = new Date();
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

  const filteredTxs = transactions.filter(t => {
    if (!t.created_at) return false;
    const d = new Date(t.created_at);
    return !isNaN(d) && d >= cutoffFrom && d <= cutoffTo;
  });

  // ── KPIs ─────────────────────────────────────────────
  const totalOrders    = filteredOrders.length;
  const totalRecaudo   = filteredOrders.reduce((s, o) => s + parseFloat(o.final_price  || 0), 0);
  const completadas    = filteredOrders.filter(o => o.status === 'completed').length;

  // Ganancia estimada = ganancias de completadas + ganancias de órdenes en curso
  const inProgress = ['confirmed', 'processing', 'ready_for_pickup', 'in_transit', 'redelivery'];
  const gananciaEstimada = filteredOrders
    .filter(o => o.status === 'completed' || inProgress.includes(o.status))
    .reduce((s, o) => s + parseFloat(o.buyer_profit || 0), 0);

  // ── Cantidades vendidas por día (línea) ──────────────
  const salesByDay = (() => {
    const map = {};
    filteredOrders.forEach(o => {
      if (!o.created_at) return;
      const d = new Date(o.created_at);
      if (isNaN(d)) return;
      const key = d.toLocaleDateString('es-PY', { day: '2-digit', month: 'short' });
      const qty = (o.items || []).reduce((s, i) => s + (i.quantity || 1), 0);
      map[key] = (map[key] || 0) + qty;
    });
    return Object.entries(map).map(([fecha, cantidad]) => ({ fecha, cantidad }));
  })();

  // ── Órdenes por estado — pendiente = confirmado por admin ────
  const byStatus = Object.entries(
    filteredOrders.reduce((acc, o) => {
      // Agrupar pending como "Pendiente admin" solo si ya fue confirmado
      const key = o.status;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {})
  ).map(([status, cantidad]) => ({
    status,
    cantidad,
    label: STATUS_LABELS[status] || status,
  }));

  // ── Top proveedores (solo sellers) ───────────────────
  const bySupplier = Object.entries(
    filteredOrders.reduce((acc, o) => {
      const key = `Proveedor #${o.supplier_id}`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {})
  )
    .map(([proveedor, ordenes]) => ({ proveedor, ordenes }))
    .sort((a, b) => b.ordenes - a.ordenes)
    .slice(0, 5);

  const formatCurrency = (v) =>
    new Intl.NumberFormat('es-PY', { style: 'currency', currency: 'PYG', minimumFractionDigits: 0 }).format(v);

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="an-tooltip">
        <p className="an-tooltip-label">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color, margin: '2px 0', fontSize: '13px', fontWeight: 600 }}>
            {typeof p.value === 'number' && p.value > 1000 ? formatCurrency(p.value) : p.value}
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
            <p>Resumen de tu actividad en EasyPy</p>
          </div>
          <div className="an-period-selector">
            {PERIODS.map((p, i) => (
              <button key={i}
                className={`an-period-btn ${!customRange && period === i ? 'active' : ''}`}
                onClick={() => { setPeriod(i); setCustomRange(null); }}>
                {p.label}
              </button>
            ))}
            <button
              className={`an-period-btn ${customRange ? 'active' : ''}`}
              onClick={() => setShowCalendar(!showCalendar)}>
              📅 {customRange
                ? `${cutoffFrom.toLocaleDateString('es-PY', { day: '2-digit', month: 'short' })} – ${cutoffTo.toLocaleDateString('es-PY', { day: '2-digit', month: 'short' })}`
                : 'Rango'}
            </button>
          </div>
        </div>

        {/* Calendar dropdown */}
        {showCalendar && (
          <div ref={calendarRef} style={{
            background: 'white', border: '1.5px solid #e5e7eb', borderRadius: '12px',
            padding: '16px', display: 'flex', gap: '12px', alignItems: 'flex-end',
            marginBottom: '16px', flexWrap: 'wrap', boxShadow: '0 4px 16px rgba(0,0,0,0.08)'
          }}>
            <div>
              <label style={{ fontSize: '11px', fontWeight: '700', color: '#374151', display: 'block', marginBottom: '4px' }}>Desde</label>
              <input type="date" value={tempFrom} onChange={e => setTempFrom(e.target.value)}
                style={{ padding: '7px 10px', border: '1.5px solid #e5e7eb', borderRadius: '8px', fontSize: '13px' }} />
            </div>
            <div>
              <label style={{ fontSize: '11px', fontWeight: '700', color: '#374151', display: 'block', marginBottom: '4px' }}>Hasta</label>
              <input type="date" value={tempTo} onChange={e => setTempTo(e.target.value)}
                style={{ padding: '7px 10px', border: '1.5px solid #e5e7eb', borderRadius: '8px', fontSize: '13px' }} />
            </div>
            <button onClick={applyCustomRange}
              style={{ padding: '8px 16px', background: '#056EB7', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
              Aplicar
            </button>
            <button onClick={() => { setCustomRange(null); setShowCalendar(false); }}
              style={{ padding: '8px 12px', background: 'white', color: '#6b7280', border: '1.5px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' }}>
              Cancelar
            </button>
          </div>
        )}

        {loading ? (
          <div className="an-loading"><div className="an-spinner" /></div>
        ) : (
          <>
            {/* KPIs */}
            <div className="an-kpis">
              {[
                { label: 'Órdenes',           value: totalOrders,       format: 'number'   },
                { label: 'Total recaudado',    value: totalRecaudo,      format: 'currency' },
                { label: 'Ganancia estimada',  value: gananciaEstimada,  format: 'currency', highlight: true },
                { label: 'Completadas',        value: completadas,       format: 'number'   },
              ].map((kpi, i) => (
                <div key={i} className={`an-kpi ${kpi.highlight ? 'highlight' : ''}`}>
                  <span className="an-kpi-label">{kpi.label}</span>
                  <span className="an-kpi-value">
                    {kpi.format === 'currency' ? formatCurrency(kpi.value) : kpi.value}
                  </span>
                </div>
              ))}
            </div>

            {/* Cantidades vendidas en el tiempo */}
            <div className="an-card">
              <h2 className="an-card-title">Unidades vendidas en el tiempo</h2>
              {salesByDay.length === 0 ? (
                <div className="an-empty">Sin datos para este período</div>
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

            <div className="an-row2">
              {/* Órdenes por estado */}
              <div className="an-card">
                <h2 className="an-card-title">Órdenes por estado</h2>
                {byStatus.length === 0 ? (
                  <div className="an-empty">Sin datos</div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={byStatus} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 11, fill: '#9ca3af' }} allowDecimals={false} />
                      <YAxis type="category" dataKey="label" tick={{ fontSize: 11, fill: '#6b7280' }} width={110} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="cantidad" radius={[0, 4, 4, 0]}>
                        {byStatus.map((entry, i) => (
                          <Cell key={i} fill={STATUS_COLORS[entry.status] || '#9ca3af'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Top proveedores (solo sellers) / Top productos (providers) */}
              <div className="an-card">
                <h2 className="an-card-title">
                  {isProvider ? 'Top 3 productos más vendidos' : 'Top proveedores'}
                </h2>
                {isProvider ? (
                  topProducts.length === 0 ? (
                    <div className="an-empty">Sin datos</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '4px 0' }}>
                      {topProducts.map((p, i) => (
                        <div key={p.product_id} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ fontSize: '18px', fontWeight: '800', color: '#056EB7', width: '20px' }}>#{i+1}</span>
                          {p.imageUrl
                            ? <img src={p.imageUrl} alt={p.name} style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover', border: '1.5px solid #e5e7eb', flexShrink: 0 }} loading="lazy" />
                            : <div style={{ width: '48px', height: '48px', borderRadius: '8px', background: '#f3f4f6', flexShrink: 0 }} />
                          }
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: '13px', fontWeight: '700', color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</p>
                            <p style={{ fontSize: '12px', color: '#6b7280' }}>{p.qty} unidades vendidas</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                ) : (
                  bySupplier.length === 0 ? (
                    <div className="an-empty">Sin datos</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={bySupplier}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="proveedor" tick={{ fontSize: 10, fill: '#9ca3af' }} />
                        <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} allowDecimals={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="ordenes" fill="#056EB7" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )
                )}
              </div>
            </div>

            {/* Top 3 productos para sellers también */}
            {!isProvider && topProducts.length > 0 && (
              <div className="an-card">
                <h2 className="an-card-title">Top 3 productos más vendidos</h2>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                  {topProducts.map((p, i) => (
                    <div key={p.product_id} style={{ flex: '1 1 160px', border: '1.5px solid #e5e7eb', borderRadius: '10px', overflow: 'hidden', minWidth: '140px' }}>
                      {p.imageUrl
                        ? <img src={p.imageUrl} alt={p.name} style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover' }} loading="lazy" />
                        : <div style={{ width: '100%', aspectRatio: '4/3', background: '#f3f4f6' }} />
                      }
                      <div style={{ padding: '10px' }}>
                        <p style={{ fontSize: '11px', fontWeight: '800', color: '#056EB7' }}>#{i+1}</p>
                        <p style={{ fontSize: '12px', fontWeight: '700', color: '#111827', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{p.name}</p>
                        <p style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>{p.qty} unidades</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Wallet */}
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
          </>
        )}
      </div>
    </div>
  );
};

export default Analytics;