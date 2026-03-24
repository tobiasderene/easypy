import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { useUser } from '../App';
import { getOrdersByBuyer, getWalletByUser, getTransactionsByWallet } from '../services/api';
import '../styles/analytics.css';

const PERIODS = [
  { label: '1 semana', days: 7 },
  { label: '1 mes',    days: 30 },
  { label: '3 meses',  days: 90 },
];

const STATUS_COLORS = {
  completed:  '#16a34a',
  confirmed:  '#056EB7',
  processing: '#d97706',
  pending:    '#9ca3af',
  cancelled:  '#dc2626',
};

const STATUS_LABELS = {
  completed:  'Completado',
  confirmed:  'Confirmado',
  processing: 'En proceso',
  pending:    'Pendiente',
  cancelled:  'Cancelado',
};

const Analytics = () => {
  const { user }          = useUser();
  const [period, setPeriod] = useState(1); // index of PERIODS
  const [orders, setOrders] = useState([]);
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.user_id) return;
    setLoading(true);
    Promise.all([
      getOrdersByBuyer(user.user_id),
      getWalletByUser(user.user_id),
    ])
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

  const days     = PERIODS[period].days;
  const cutoff   = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  const filteredOrders = orders.filter(o => {
    if (!o.created_at) return false;
    const d = new Date(o.created_at);
    return !isNaN(d) && d >= cutoff;
  });

  const filteredTxs = transactions.filter(t => {
    if (!t.created_at) return false;
    const d = new Date(t.created_at);
    return !isNaN(d) && d >= cutoff;
  });

  // ── KPIs ─────────────────────────────────────────────
  const totalOrders    = filteredOrders.length;
  const totalRecaudo   = filteredOrders.reduce((s, o) => s + parseFloat(o.final_price  || 0), 0);
  const totalGanancias = filteredOrders.reduce((s, o) => s + parseFloat(o.buyer_profit || 0), 0);
  const completadas    = filteredOrders.filter(o => o.status === 'completed').length;

  // ── Ingresos por día ─────────────────────────────────
  const revenueByDay = (() => {
    const map = {};
    filteredOrders.forEach(o => {
      if (!o.created_at) return;
      const d = new Date(o.created_at);
      if (isNaN(d)) return;
      const key = d.toLocaleDateString('es-PY', { day: '2-digit', month: 'short' });
      map[key] = (map[key] || 0) + parseFloat(o.buyer_profit || 0);
    });
    return Object.entries(map)
      .map(([fecha, ganancia]) => ({ fecha, ganancia }))
      .slice(-days);
  })();

  // ── Órdenes por estado ───────────────────────────────
  const byStatus = Object.entries(
    filteredOrders.reduce((acc, o) => {
      acc[o.status] = (acc[o.status] || 0) + 1;
      return acc;
    }, {})
  ).map(([status, cantidad]) => ({ status, cantidad, label: STATUS_LABELS[status] || status }));

  // ── Top proveedores ──────────────────────────────────
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

  // ── Movimientos de wallet ─────────────────────────────
  const walletMovements = filteredTxs.map(t => ({
    fecha:  new Date(t.created_at).toLocaleDateString('es-PY', { day: '2-digit', month: 'short' }),
    monto:  parseFloat(t.amount || 0),
    tipo:   t.transaction_type,
  }));

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
              <button
                key={i}
                className={`an-period-btn ${period === i ? 'active' : ''}`}
                onClick={() => setPeriod(i)}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="an-loading">
            <div className="an-spinner" />
          </div>
        ) : (
          <>
            {/* KPIs */}
            <div className="an-kpis">
              {[
                { label: 'Órdenes',        value: totalOrders,    format: 'number' },
                { label: 'Total recaudado', value: totalRecaudo,   format: 'currency' },
                { label: 'Ganancias',       value: totalGanancias, format: 'currency', highlight: true },
                { label: 'Completadas',     value: completadas,    format: 'number' },
              ].map((kpi, i) => (
                <div key={i} className={`an-kpi ${kpi.highlight ? 'highlight' : ''}`}>
                  <span className="an-kpi-label">{kpi.label}</span>
                  <span className="an-kpi-value">
                    {kpi.format === 'currency' ? formatCurrency(kpi.value) : kpi.value}
                  </span>
                </div>
              ))}
            </div>

            {/* Ganancias en el tiempo */}
            <div className="an-card">
              <h2 className="an-card-title">Ganancias en el tiempo</h2>
              {revenueByDay.length === 0 ? (
                <div className="an-empty">Sin datos para este período</div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={revenueByDay}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="fecha" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="ganancia" stroke="#056EB7" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />
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
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={byStatus} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 11, fill: '#9ca3af' }} allowDecimals={false} />
                      <YAxis type="category" dataKey="label" tick={{ fontSize: 11, fill: '#6b7280' }} width={90} />
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

              {/* Top proveedores */}
              <div className="an-card">
                <h2 className="an-card-title">Top proveedores</h2>
                {bySupplier.length === 0 ? (
                  <div className="an-empty">Sin datos</div>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={bySupplier}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="proveedor" tick={{ fontSize: 10, fill: '#9ca3af' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} allowDecimals={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="ordenes" fill="#056EB7" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

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
                  <span className="an-wallet-label">Total histórico</span>
                  <span className="an-wallet-value blue">{formatCurrency((parseFloat(wallet?.balance_available) || 0) + (parseFloat(wallet?.balance_pending) || 0))}</span>
                </div>
              </div>

              {walletMovements.length > 0 && (
                <ResponsiveContainer width="100%" height={160} style={{ marginTop: '16px' }}>
                  <BarChart data={walletMovements}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="fecha" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="monto" radius={[4, 4, 0, 0]}>
                      {walletMovements.map((entry, i) => (
                        <Cell key={i} fill={entry.monto >= 0 ? '#16a34a' : '#dc2626'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </>
        )}

      </div>
    </div>
  );
};

export default Analytics;