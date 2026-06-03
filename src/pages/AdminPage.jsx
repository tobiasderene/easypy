import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getUsers, updateUser, adminUpdateStatus, adminDeleteUser,
  getWithdrawalsByStatus, updateWithdrawal,
  getDeposits, getDepositsByStatus, approveDeposit, rejectDeposit,
  getOrdersByStatus, confirmOrderAdmin, cancelOrderAdmin,
  getWallet, getUser, getWalletByUser, getTransactionsByWallet,
  getOrdersByBuyer, getOrdersBySupplier,
} from '../services/api';
import '../styles/adminpage.css';

const TABS = [
  { id: 'providers',   label: 'Proveedores', icon: '🏭' },
  { id: 'orders',      label: 'Órdenes',     icon: '📦' },
  { id: 'deposits',    label: 'Ingresos',    icon: '💰' },
  { id: 'withdrawals', label: 'Egresos',     icon: '💸' },
  { id: 'users',       label: 'Usuarios',    icon: '👥' },
];

// ─── Helpers ──────────────────────────────────────────
const formatCurrency = (v) =>
  new Intl.NumberFormat('es-PY', { style: 'currency', currency: 'PYG', minimumFractionDigits: 0 }).format(v || 0);

const formatDate = (d) => {
  try { return new Date(d).toLocaleDateString('es-PY', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return '—'; }
};

const StatusBadge = ({ status }) => {
  const map = {
    pending:          { label: 'Pendiente',             cls: 'badge-pending'    },
    active:           { label: 'Activo',                cls: 'badge-active'     },
    inactive:         { label: 'Inactivo',              cls: 'badge-inactive'   },
    approved:         { label: 'Aprobado',              cls: 'badge-approved'   },
    rejected:         { label: 'Rechazado',             cls: 'badge-rejected'   },
    confirmed:        { label: 'Confirmado',            cls: 'badge-confirmed'  },
    processing:       { label: 'En preparación',        cls: 'badge-processing' },
    ready_for_pickup: { label: 'Listo para retiro',     cls: 'badge-confirmed'  },
    picked_up:        { label: 'Retirado',              cls: 'badge-processing' },
    out_for_delivery: { label: 'En camino',             cls: 'badge-processing' },
    redelivery:       { label: 'Reagendado',            cls: 'badge-pending'    },
    cancelled:        { label: 'Cancelado',             cls: 'badge-cancelled'  },
    completed:        { label: 'Completado',            cls: 'badge-completed'  },
  };
  const s = map[status] || { label: status, cls: 'badge-pending' };
  return <span className={`admin-badge ${s.cls}`}>{s.label}</span>;
};

const ConfirmModal = ({ title, message, onConfirm, onCancel, confirmLabel = 'Confirmar', danger = false }) => {
  const [processing, setProcessing] = React.useState(false);
  const handleConfirm = async () => {
    setProcessing(true);
    try { await onConfirm(); } finally { setProcessing(false); }
  };
  return (
    <div className="admin-modal-overlay" onClick={(e) => e.target === e.currentTarget && !processing && onCancel()}>
      <div className="admin-modal">
        <p className="admin-modal-title">{title}</p>
        <p className="admin-modal-msg">{message}</p>
        <div className="admin-modal-actions">
          <button className="admin-btn admin-btn-ghost" onClick={onCancel} disabled={processing}>Cancelar</button>
          <button
            className={`admin-btn ${danger ? 'admin-btn-danger' : 'admin-btn-primary'}`}
            onClick={handleConfirm}
            disabled={processing}
          >
            {processing ? 'Procesando...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Tab: Proveedores ─────────────────────────────────
const ProvidersTab = () => {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [modal, setModal]         = useState(null);

  useEffect(() => {
    getUsers({ role: 'provider', status: 'pending' })
      .then(d => setProviders(d || []))
      .catch(() => setProviders([]))
      .finally(() => setLoading(false));
  }, []);

  const handleAction = (p, action) => {
    setModal({
      title:        action === 'active' ? 'Habilitar proveedor' : 'Rechazar proveedor',
      message:      `¿Querés ${action === 'active' ? 'habilitar' : 'rechazar'} a ${p.user_nickname}?`,
      confirmLabel: action === 'active' ? 'Habilitar' : 'Rechazar',
      danger:       action !== 'active',
      onConfirm:    async () => {
        setModal(null);
        if (action === 'active') {
          await adminUpdateStatus(p.user_id, 'active');
        } else {
          // Rechazar = eliminar el usuario para que pueda registrarse de nuevo con el mismo email
          await adminDeleteUser(p.user_id);
        }
        setProviders(prev => prev.filter(x => x.user_id !== p.user_id));
      },
    });
  };

  if (loading) return <div className="tab-loading">Cargando...</div>;

  return (
    <div className="tab-content">
      <div className="tab-header">
        <h2 className="tab-title">Proveedores pendientes</h2>
        <span className="tab-count">{providers.length}</span>
      </div>
      {providers.length === 0 ? (
        <div className="admin-empty"><span className="admin-empty-icon">✅</span><p>Sin proveedores pendientes</p></div>
      ) : (
        <div className="admin-card-list">
          {providers.map(p => (
            <div key={p.user_id} className="admin-card">
              <div className="admin-card-avatar">{p.user_nickname?.[0]?.toUpperCase() || '?'}</div>
              <div className="admin-card-info">
                <p className="admin-card-name">{p.user_nickname}</p>
                <p className="admin-card-sub">{p.email}</p>
                {p.user_description && <p className="admin-card-desc">{p.user_description}</p>}
              </div>
              <div className="admin-card-meta">
                <StatusBadge status={p.user_status} />
                <p className="admin-card-date">{formatDate(p.created_at)}</p>
              </div>
              <div className="admin-card-actions">
                <button className="admin-btn admin-btn-success" onClick={() => handleAction(p, 'active')}>Habilitar</button>
                <button className="admin-btn admin-btn-danger"  onClick={() => handleAction(p, 'inactive')}>Rechazar</button>
              </div>
            </div>
          ))}
        </div>
      )}
      {modal && <ConfirmModal {...modal} onCancel={() => setModal(null)} />}
    </div>
  );
};

// ─── Tab: Órdenes ─────────────────────────────────────
const OrdersTab = () => {
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]     = useState(null);

  useEffect(() => {
    getOrdersByStatus('pending')
      .then(d => setOrders(d || []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  const handleConfirm = (o) => setModal({
    title: 'Confirmar orden',
    message: `¿Confirmás la orden #${o.order_id} por ${formatCurrency(o.final_price)}?`,
    confirmLabel: 'Confirmar',
    onConfirm: async () => {
      setModal(null);
      await confirmOrderAdmin(o.order_id);
      setOrders(prev => prev.filter(x => x.order_id !== o.order_id));
    },
  });

  const handleCancel = (o) => setModal({
    title: 'Cancelar orden',
    message: `¿Cancelás la orden #${o.order_id}? Esta acción no se puede deshacer.`,
    confirmLabel: 'Cancelar orden',
    danger: true,
    onConfirm: async () => {
      setModal(null);
      await cancelOrderAdmin(o.order_id);
      setOrders(prev => prev.filter(x => x.order_id !== o.order_id));
    },
  });

  if (loading) return <div className="tab-loading">Cargando...</div>;

  return (
    <div className="tab-content">
      <div className="tab-header">
        <h2 className="tab-title">Órdenes pendientes</h2>
        <span className="tab-count">{orders.length}</span>
      </div>
      {orders.length === 0 ? (
        <div className="admin-empty"><span className="admin-empty-icon">✅</span><p>Sin órdenes pendientes</p></div>
      ) : (
        <div className="admin-card-list">
          {orders.map(o => (
            <div key={o.order_id} className="admin-card">
              <div className="admin-card-avatar emoji">📦</div>
              <div className="admin-card-info">
                <p className="admin-card-name">Orden #{o.order_id}</p>
                <p className="admin-card-sub">Destinatario: {o.recipient_name || '—'}</p>
                <p className="admin-card-sub">{o.recipient_city}{o.recipient_region ? `, ${o.recipient_region}` : ''}</p>
              </div>
              <div className="admin-card-meta">
                <StatusBadge status={o.status} />
                <p className="admin-card-amount">{formatCurrency(o.final_price)}</p>
                <p className="admin-card-date">{formatDate(o.created_at)}</p>
              </div>
              <div className="admin-card-actions">
                <button className="admin-btn admin-btn-success" onClick={() => handleConfirm(o)}>Confirmar</button>
                <button className="admin-btn admin-btn-danger"  onClick={() => handleCancel(o)}>Cancelar</button>
              </div>
            </div>
          ))}
        </div>
      )}
      {modal && <ConfirmModal {...modal} onCancel={() => setModal(null)} />}
    </div>
  );
};

// ─── Tab: Ingresos (Depósitos) ────────────────────────
const DepositsTab = () => {
  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState(null);
  const [preview, setPreview]   = useState(null);

  useEffect(() => {
    getDepositsByStatus('pending')
      .then(d => setDeposits(d || []))
      .catch(() => setDeposits([]))
      .finally(() => setLoading(false));
  }, []);

  const handleApprove = (d) => setModal({
    title: 'Aprobar depósito',
    message: `¿Aprobás el depósito de ${formatCurrency(d.amount)}? El saldo será acreditado inmediatamente.`,
    confirmLabel: 'Aprobar',
    onConfirm: async () => {
      setModal(null);
      await approveDeposit(d.deposit_id);
      setDeposits(prev => prev.filter(x => x.deposit_id !== d.deposit_id));
    },
  });

  const handleReject = (d) => setModal({
    title: 'Rechazar depósito',
    message: `¿Rechazás el depósito de ${formatCurrency(d.amount)}?`,
    confirmLabel: 'Rechazar',
    danger: true,
    onConfirm: async () => {
      setModal(null);
      await rejectDeposit(d.deposit_id);
      setDeposits(prev => prev.filter(x => x.deposit_id !== d.deposit_id));
    },
  });

  if (loading) return <div className="tab-loading">Cargando...</div>;

  return (
    <div className="tab-content">
      <div className="tab-header">
        <h2 className="tab-title">Depósitos pendientes</h2>
        <span className="tab-count">{deposits.length}</span>
      </div>
      {deposits.length === 0 ? (
        <div className="admin-empty"><span className="admin-empty-icon">✅</span><p>Sin depósitos pendientes</p></div>
      ) : (
        <div className="admin-card-list">
          {deposits.map(d => (
            <div key={d.deposit_id} className="admin-card" style={{ flexWrap: 'wrap' }}>
              <div className="admin-card-avatar emoji">💰</div>
              <div className="admin-card-info">
                <p className="admin-card-name">{formatCurrency(d.amount)}</p>
                <p className="admin-card-sub">Usuario ID: {d.user_id}</p>
                <p className="admin-card-sub">Wallet ID: {d.wallet_id}</p>
                {/* Comprobante */}
                {d.signed_url && (
                  <img
                    src={d.signed_url}
                    alt="Comprobante"
                    className="deposit-receipt"
                    onClick={() => setPreview(d.signed_url)}
                  />
                )}
              </div>
              <div className="admin-card-meta">
                <StatusBadge status={d.status} />
                <p className="admin-card-date">{formatDate(d.created_at)}</p>
              </div>
              <div className="admin-card-actions">
                <button className="admin-btn admin-btn-success" onClick={() => handleApprove(d)}>Aprobar</button>
                <button className="admin-btn admin-btn-danger"  onClick={() => handleReject(d)}>Rechazar</button>
              </div>
            </div>
          ))}
        </div>
      )}
      {modal && <ConfirmModal {...modal} onCancel={() => setModal(null)} />}

      {/* Preview comprobante */}
      {preview && (
        <div className="admin-modal-overlay" onClick={() => setPreview(null)}>
          <img src={preview} alt="Comprobante" style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: '12px' }} />
        </div>
      )}
    </div>
  );
};

// ─── Tab: Egresos ─────────────────────────────────────
const WithdrawalsTab = () => {
  const [withdrawals, setWithdrawals] = useState([]);
  const [enriched, setEnriched]       = useState({});  // { withdrawls_id: { user, wallet } }
  const [loading, setLoading]         = useState(true);
  const [modal, setModal]             = useState(null);

  useEffect(() => {
    getWithdrawalsByStatus('pending')
      .then(async (data) => {
        const list = data || [];
        setWithdrawals(list);
        // Enriquecer con datos de wallet y usuario
        const enrichMap = {};
        await Promise.all(list.map(async (w) => {
          try {
            const wallet = await getWallet(w.wallet_id);
            const user   = wallet?.user_id ? await getUser(wallet.user_id) : null;
            enrichMap[w.withdrawls_id] = { wallet, user };
          } catch {}
        }));
        setEnriched(enrichMap);
      })
      .catch(() => setWithdrawals([]))
      .finally(() => setLoading(false));
  }, []);

  const handleAction = (w, status) => {
    const info   = enriched[w.withdrawls_id];
    const wallet = info?.wallet;
    const user   = info?.user;

    // Control cruzado: verificar que el saldo disponible cubra el retiro
    if (status === 'approved' && wallet) {
      const available = parseFloat(wallet.balance_available || 0);
      const requested = parseFloat(w.amount || 0);
      if (requested > available) {
        alert(`Saldo insuficiente. Solicita: ${formatCurrency(requested)} — Disponible: ${formatCurrency(available)}`);
        return;
      }
    }

    setModal({
      title:        status === 'approved' ? 'Aprobar retiro' : 'Rechazar retiro',
      message:      `¿${status === 'approved' ? 'Aprobás' : 'Rechazás'} el retiro de ${formatCurrency(w.amount)} de ${user?.user_nickname || `Wallet #${w.wallet_id}`} al banco ${w.bank_name}?`,
      confirmLabel: status === 'approved' ? 'Aprobar' : 'Rechazar',
      danger:       status !== 'approved',
      onConfirm:    async () => {
        setModal(null);
        await updateWithdrawal(w.withdrawls_id, { status });
        setWithdrawals(prev => prev.filter(x => x.withdrawls_id !== w.withdrawls_id));
      },
    });
  };

  if (loading) return <div className="tab-loading">Cargando...</div>;

  return (
    <div className="tab-content">
      <div className="tab-header">
        <h2 className="tab-title">Retiros pendientes</h2>
        <span className="tab-count">{withdrawals.length}</span>
      </div>
      {withdrawals.length === 0 ? (
        <div className="admin-empty"><span className="admin-empty-icon">✅</span><p>Sin retiros pendientes</p></div>
      ) : (
        <div className="admin-card-list">
          {withdrawals.map(w => {
            const info   = enriched[w.withdrawls_id];
            const wallet = info?.wallet;
            const user   = info?.user;
            const available = parseFloat(wallet?.balance_available || 0);
            const pending   = parseFloat(wallet?.balance_pending   || 0);
            const requested = parseFloat(w.amount || 0);
            const insufficient = requested > available;

            return (
              <div key={w.withdrawls_id} className="admin-card" style={{ flexWrap: 'wrap' }}>
                <div className="admin-card-avatar emoji">💸</div>

                <div className="admin-card-info" style={{ flex: 2 }}>
                  {/* Solicitante */}
                  <p className="admin-card-name" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {user?.user_nickname || `Wallet #${w.wallet_id}`}
                    {user?.user_role && (
                      <span style={{ fontSize: '11px', fontWeight: '600', padding: '2px 8px', borderRadius: '100px',
                        background: user.user_role === 'provider' ? '#eff6ff' : '#f0fdf4',
                        color:      user.user_role === 'provider' ? '#2563eb' : '#16a34a' }}>
                        {user.user_role === 'provider' ? 'Proveedor' : 'Vendedor'}
                      </span>
                    )}
                  </p>

                  {/* Monto solicitado */}
                  <p className="admin-card-sub" style={{ fontSize: '18px', fontWeight: '800', color: insufficient ? '#dc2626' : '#111827' }}>
                    {formatCurrency(requested)}
                    {insufficient && <span style={{ fontSize: '12px', marginLeft: '8px', color: '#dc2626' }}>Saldo insuficiente</span>}
                  </p>

                  {/* Banco */}
                  <p className="admin-card-sub">Banco: {w.bank_name}</p>
                  <p className="admin-card-sub">Cuenta: {w.bank_account_address}</p>
                </div>

                {/* Control cruzado de wallet */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '10px 14px', background: '#f9fafb', borderRadius: '10px', minWidth: '180px' }}>
                  <p style={{ fontSize: '11px', fontWeight: '700', color: '#6b7280', marginBottom: '4px' }}>Control de wallet</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', fontSize: '12px' }}>
                    <span style={{ color: '#6b7280' }}>Disponible</span>
                    <span style={{ fontWeight: '700', color: insufficient ? '#dc2626' : '#16a34a' }}>
                      {wallet ? formatCurrency(available) : '—'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', fontSize: '12px' }}>
                    <span style={{ color: '#6b7280' }}>Pendiente</span>
                    <span style={{ fontWeight: '600', color: '#d97706' }}>
                      {wallet ? formatCurrency(pending) : '—'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', fontSize: '12px', borderTop: '1px solid #e5e7eb', paddingTop: '4px', marginTop: '2px' }}>
                    <span style={{ color: '#6b7280' }}>Solicita</span>
                    <span style={{ fontWeight: '800', color: '#111827' }}>{formatCurrency(requested)}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <StatusBadge status={w.status} />
                      <p className="admin-card-date">{formatDate(w.created_at)}</p>
                    </div>
                    <div className="admin-card-actions">
                      <button className="admin-btn admin-btn-success" onClick={() => handleAction(w, 'approved')} disabled={insufficient}>Aprobar</button>
                      <button className="admin-btn admin-btn-danger"  onClick={() => handleAction(w, 'rejected')}>Rechazar</button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {modal && <ConfirmModal {...modal} onCancel={() => setModal(null)} />}
    </div>
  );
};

// ─── Tab: Usuarios ────────────────────────────────────
const UsersTab = () => {
  const [users, setUsers]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [expanded, setExpanded]   = useState(null);
  const [userDetail, setUserDetail] = useState({});
  const [loadingDetail, setLoadingDetail] = useState(null);

  useEffect(() => {
    getUsers()
      .then(d => setUsers(d || []))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, []);

  const loadUserDetail = async (u) => {
    if (userDetail[u.user_id]) { setExpanded(u.user_id); return; }
    setLoadingDetail(u.user_id);
    try {
      const [wallet, orders] = await Promise.all([
        getWalletByUser(u.user_id).catch(() => null),
        u.user_role === 'provider'
          ? getOrdersBySupplier(u.user_id).catch(() => [])
          : getOrdersByBuyer(u.user_id).catch(() => []),
      ]);
      let txs = [];
      if (wallet?.wallet_id) {
        txs = await getTransactionsByWallet(wallet.wallet_id).catch(() => []);
      }
      setUserDetail(prev => ({ ...prev, [u.user_id]: { wallet, orders: orders || [], txs } }));
      setExpanded(u.user_id);
    } catch {}
    finally { setLoadingDetail(null); }
  };

  const filteredUsers = users.filter(u => {
    const matchRole = roleFilter === 'all' || u.user_role === roleFilter;
    const matchSearch = !search ||
      (u.user_nickname || '').toLowerCase().includes(search.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(search.toLowerCase());
    return matchRole && matchSearch;
  });

  const ROLE_LABEL = { seller: 'Vendedor', provider: 'Proveedor', admin: 'Admin', logistics: 'Logística', buyer: 'Buyer' };
  const ROLE_COLOR = { seller: '#056EB7', provider: '#8b5cf6', admin: '#dc2626', logistics: '#d97706', buyer: '#16a34a' };
  const STATUS_COLOR = { active: '#16a34a', pending: '#d97706', inactive: '#dc2626' };

  if (loading) return <div className="tab-loading">Cargando...</div>;

  return (
    <div className="tab-content">
      <div className="tab-header">
        <h2 className="tab-title">Panel de usuarios</h2>
        <span className="tab-count">{filteredUsers.length}</span>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Buscar por nombre o email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: '200px', padding: '8px 12px', border: '1.5px solid #e5e7eb', borderRadius: '8px', fontSize: '13px' }}
        />
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
          style={{ padding: '8px 12px', border: '1.5px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', background: 'white' }}>
          <option value="all">Todos los roles</option>
          <option value="seller">Vendedores</option>
          <option value="provider">Proveedores</option>
          <option value="logistics">Logística</option>
          <option value="admin">Admins</option>
        </select>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {filteredUsers.map(u => {
          const isExpanded  = expanded === u.user_id;
          const detail      = userDetail[u.user_id];
          const isLoading   = loadingDetail === u.user_id;

          return (
            <div key={u.user_id} style={{ border: '1.5px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden', background: 'white' }}>
              {/* Fila principal */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', cursor: 'pointer' }}
                onClick={() => isExpanded ? setExpanded(null) : loadUserDetail(u)}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: ROLE_COLOR[u.user_role] + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', color: ROLE_COLOR[u.user_role], fontSize: '16px', flexShrink: 0 }}>
                  {(u.user_nickname || '?')[0].toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: '700', fontSize: '14px', color: '#111827' }}>{u.user_nickname}</span>
                    <span style={{ fontSize: '11px', fontWeight: '600', padding: '2px 8px', borderRadius: '100px', background: (ROLE_COLOR[u.user_role] || '#6b7280') + '15', color: ROLE_COLOR[u.user_role] || '#6b7280' }}>
                      {ROLE_LABEL[u.user_role] || u.user_role}
                    </span>
                    <span style={{ fontSize: '11px', fontWeight: '600', padding: '2px 8px', borderRadius: '100px', background: (STATUS_COLOR[u.user_status] || '#9ca3af') + '15', color: STATUS_COLOR[u.user_status] || '#9ca3af' }}>
                      {u.user_status}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                    {u.email}
                    {u.phone && <span style={{ marginLeft: '8px' }}>· {u.phone}</span>}
                    {u.city  && <span style={{ marginLeft: '8px' }}>· {u.city}</span>}
                  </div>
                </div>
                <div style={{ fontSize: '12px', color: '#9ca3af', flexShrink: 0 }}>
                  {isLoading ? 'Cargando...' : isExpanded ? '▲' : '▼'}
                </div>
              </div>

              {/* Detalle expandido */}
              {isExpanded && detail && (
                <div style={{ borderTop: '1.5px solid #f3f4f6', padding: '16px', background: '#fafafa', display: 'flex', flexDirection: 'column', gap: '16px' }}>

                  {/* Wallet */}
                  {detail.wallet && (
                    <div>
                      <p style={{ fontSize: '11px', fontWeight: '800', color: '#6b7280', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Wallet</p>
                      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                        {[
                          { label: 'Disponible', value: formatCurrency(detail.wallet.balance_available), color: '#16a34a' },
                          { label: 'Pendiente',  value: formatCurrency(detail.wallet.balance_pending),   color: '#d97706' },
                        ].map((item, i) => (
                          <div key={i} style={{ background: 'white', border: '1.5px solid #e5e7eb', borderRadius: '8px', padding: '10px 16px', minWidth: '140px' }}>
                            <p style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>{item.label}</p>
                            <p style={{ fontSize: '16px', fontWeight: '800', color: item.color }}>{item.value}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Órdenes recientes */}
                  {detail.orders?.length > 0 && (
                    <div>
                      <p style={{ fontSize: '11px', fontWeight: '800', color: '#6b7280', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Últimas órdenes ({detail.orders.length})
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '200px', overflowY: 'auto' }}>
                        {detail.orders.slice(0, 10).map(o => {
                          const created = o.created_at ? new Date(o.created_at) : null;
                          return (
                            <div key={o.order_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'white', borderRadius: '8px', border: '1px solid #f3f4f6', fontSize: '12px' }}>
                              <span style={{ fontWeight: '600', color: '#111827' }}>#{o.order_id}</span>
                              <span style={{ color: '#6b7280' }}>{o.recipient_city || '—'}</span>
                              <span style={{ padding: '2px 8px', borderRadius: '100px', fontSize: '11px', fontWeight: '600', background: (STATUS_COLORS[o.status] || '#9ca3af') + '15', color: STATUS_COLORS[o.status] || '#9ca3af' }}>
                                {o.status}
                              </span>
                              <span style={{ fontWeight: '700', color: '#056EB7' }}>{formatCurrency(o.final_price)}</span>
                              <span style={{ color: '#9ca3af' }}>{created ? created.toLocaleDateString('es-PY', { day: '2-digit', month: 'short' }) : '—'}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Transacciones recientes */}
                  {detail.txs?.length > 0 && (
                    <div>
                      <p style={{ fontSize: '11px', fontWeight: '800', color: '#6b7280', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Transacciones ({detail.txs.length})
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '160px', overflowY: 'auto' }}>
                        {detail.txs.slice(0, 8).map(t => (
                          <div key={t.id_transaction} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'white', borderRadius: '8px', border: '1px solid #f3f4f6', fontSize: '12px' }}>
                            <span style={{ color: '#6b7280' }}>{t.transaction_category}</span>
                            {t.order_id && <span style={{ color: '#9ca3af' }}>Orden #{t.order_id}</span>}
                            <span style={{ padding: '2px 8px', borderRadius: '100px', fontSize: '11px', background: t.transaction_status === 'completed' ? '#dcfce7' : '#fef3c7', color: t.transaction_status === 'completed' ? '#16a34a' : '#d97706', fontWeight: '600' }}>
                              {t.transaction_status}
                            </span>
                            <span style={{ fontWeight: '700', color: t.transaction_direction === 'inbound' ? '#16a34a' : '#dc2626' }}>
                              {t.transaction_direction === 'inbound' ? '+' : '-'}{formatCurrency(t.transaction_amount)}
                            </span>
                            <span style={{ color: '#9ca3af' }}>{new Date(t.created_at).toLocaleDateString('es-PY', { day: '2-digit', month: 'short' })}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {!detail.wallet && detail.orders?.length === 0 && detail.txs?.length === 0 && (
                    <p style={{ fontSize: '13px', color: '#9ca3af', textAlign: 'center' }}>Sin actividad registrada</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const STATUS_COLORS = {
  completed: '#16a34a', confirmed: '#056EB7', processing: '#d97706',
  ready_for_pickup: '#8b5cf6', picked_up: '#2563eb', out_for_delivery: '#d97706',
  pending: '#9ca3af', cancelled: '#dc2626', redelivery: '#f97316',
};


// ─── Página principal ─────────────────────────────────
const AdminPage = () => {
  const navigate             = useNavigate();
  const [activeTab, setActiveTab] = useState('providers');

  const tabCounts = {}; // se podría cargar conteos dinámicos acá

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div className="admin-header-left">
          <h1>Panel de Administración</h1>
          <p>Gestioná proveedores, órdenes, ingresos y egresos</p>
        </div>
        <div className="admin-header-actions">
          <button
            className="admin-btn admin-btn-blue"
            onClick={() => navigate('/admin/create-logistics')}
          >
            + Crear usuario logístico
          </button>
        </div>
      </div>

      <div className="admin-tabs">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`admin-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'providers'   && <ProvidersTab />}
      {activeTab === 'orders'      && <OrdersTab />}
      {activeTab === 'deposits'    && <DepositsTab />}
      {activeTab === 'withdrawals' && <WithdrawalsTab />}
      {activeTab === 'users'       && <UsersTab />}
    </div>
  );
};

export default AdminPage;
