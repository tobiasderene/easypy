import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUsers, updateUser } from '../services/api';
import { getWithdrawalsByStatus, updateWithdrawal } from '../services/api';
import { getBankMovementsByStatus, updateBankMovement } from '../services/api';
import '../styles/adminpage.css';

const TABS = [
  { id: 'providers', label: 'Proveedores', icon: '🏭' },
  { id: 'withdrawals', label: 'Egresos', icon: '💸' },
  { id: 'deposits', label: 'Ingresos', icon: '💰' },
];

const StatusBadge = ({ status }) => {
  const map = {
    pending:  { label: 'Pendiente', cls: 'badge-pending' },
    active:   { label: 'Activo',    cls: 'badge-active'  },
    inactive: { label: 'Inactivo',  cls: 'badge-inactive'},
    approved: { label: 'Aprobado',  cls: 'badge-active'  },
    rejected: { label: 'Rechazado', cls: 'badge-inactive'},
    confirmed:{ label: 'Confirmado',cls: 'badge-active'  },
  };
  const s = map[status] || { label: status, cls: 'badge-pending' };
  return <span className={`badge ${s.cls}`}>{s.label}</span>;
};

const ConfirmModal = ({ message, onConfirm, onCancel }) => (
  <div className="modal-overlay">
    <div className="modal">
      <p className="modal-message">{message}</p>
      <div className="modal-actions">
        <button className="btn btn-ghost" onClick={onCancel}>Cancelar</button>
        <button className="btn btn-primary" onClick={onConfirm}>Confirmar</button>
      </div>
    </div>
  </div>
);

// ─── Tab: Proveedores ────────────────────────────────
const ProvidersTab = () => {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [modal, setModal]         = useState(null);

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    try {
      const data = await getUsers({ role: 'provider', status: 'pending' });
      setProviders(data || []);
    } catch {
      setProviders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (provider, action) => {
    const label = action === 'active' ? 'habilitar' : 'rechazar';
    setModal({
      message: `¿Estás seguro de que querés ${label} a ${provider.user_nickname}?`,
      onConfirm: () => applyAction(provider.user_id, action),
    });
  };

  const applyAction = async (userId, status) => {
    setModal(null);
    try {
      await updateUser(userId, { user_status: status });
      setProviders(prev => prev.filter(p => p.user_id !== userId));
    } catch {
      alert('Ocurrió un error. Intentá de nuevo.');
    }
  };

  if (loading) return <div className="tab-loading">Cargando proveedores...</div>;

  return (
    <div className="tab-content">
      <div className="tab-header">
        <h2 className="tab-title">Proveedores pendientes</h2>
        <span className="tab-count">{providers.length} pendientes</span>
      </div>

      {providers.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">✅</span>
          <p>No hay proveedores pendientes de aprobación</p>
        </div>
      ) : (
        <div className="card-list">
          {providers.map(p => (
            <div key={p.user_id} className="admin-card">
              <div className="card-avatar">{p.user_nickname?.[0]?.toUpperCase() || '?'}</div>
              <div className="card-info">
                <p className="card-name">{p.user_nickname}</p>
                <p className="card-sub">{p.email}</p>
                {p.user_description && (
                  <p className="card-desc">{p.user_description}</p>
                )}
              </div>
              <div className="card-meta">
                <StatusBadge status={p.user_status} />
                <p className="card-date">{new Date(p.created_at).toLocaleDateString('es-PY')}</p>
              </div>
              <div className="card-actions">
                <button
                  className="btn btn-success"
                  onClick={() => handleAction(p, 'active')}
                >
                  Habilitar
                </button>
                <button
                  className="btn btn-danger"
                  onClick={() => handleAction(p, 'inactive')}
                >
                  Rechazar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <ConfirmModal
          message={modal.message}
          onConfirm={modal.onConfirm}
          onCancel={() => setModal(null)}
        />
      )}
    </div>
  );
};

// ─── Tab: Egresos ────────────────────────────────────
const WithdrawalsTab = () => {
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [modal, setModal]             = useState(null);

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  const fetchWithdrawals = async () => {
    try {
      const data = await getWithdrawalsByStatus('pending');
      setWithdrawals(data || []);
    } catch {
      setWithdrawals([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (w, status) => {
    const label = status === 'approved' ? 'aprobar' : 'rechazar';
    setModal({
      message: `¿Estás seguro de que querés ${label} el retiro de ${formatAmount(w.amount)}?`,
      onConfirm: () => applyAction(w.withdrawls_id, status),
    });
  };

  const applyAction = async (id, status) => {
    setModal(null);
    try {
      await updateWithdrawal(id, { status });
      setWithdrawals(prev => prev.filter(w => w.withdrawls_id !== id));
    } catch {
      alert('Ocurrió un error. Intentá de nuevo.');
    }
  };

  const formatAmount = (amount) =>
    new Intl.NumberFormat('es-PY', { style: 'currency', currency: 'PYG', minimumFractionDigits: 0 }).format(amount);

  if (loading) return <div className="tab-loading">Cargando egresos...</div>;

  return (
    <div className="tab-content">
      <div className="tab-header">
        <h2 className="tab-title">Solicitudes de egreso</h2>
        <span className="tab-count">{withdrawals.length} pendientes</span>
      </div>

      {withdrawals.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">✅</span>
          <p>No hay solicitudes de egreso pendientes</p>
        </div>
      ) : (
        <div className="card-list">
          {withdrawals.map(w => (
            <div key={w.withdrawls_id} className="admin-card">
              <div className="card-avatar card-avatar--money">💸</div>
              <div className="card-info">
                <p className="card-name">{formatAmount(w.amount)}</p>
                <p className="card-sub">Banco: {w.bank_name}</p>
                <p className="card-sub">Cuenta: {w.bank_account_address}</p>
              </div>
              <div className="card-meta">
                <StatusBadge status={w.status} />
                <p className="card-date">{new Date(w.created_at).toLocaleDateString('es-PY')}</p>
              </div>
              <div className="card-actions">
                <button
                  className="btn btn-success"
                  onClick={() => handleAction(w, 'approved')}
                >
                  Aprobar
                </button>
                <button
                  className="btn btn-danger"
                  onClick={() => handleAction(w, 'rejected')}
                >
                  Rechazar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <ConfirmModal
          message={modal.message}
          onConfirm={modal.onConfirm}
          onCancel={() => setModal(null)}
        />
      )}
    </div>
  );
};

// ─── Tab: Ingresos ───────────────────────────────────
const DepositsTab = () => {
  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState(null);

  useEffect(() => {
    fetchDeposits();
  }, []);

  const fetchDeposits = async () => {
    try {
      const data = await getBankMovementsByStatus('pending');
      // Solo los de tipo ingreso
      const ingresos = (data || []).filter(d => d.bank_movement_type === 'ingreso');
      setDeposits(ingresos);
    } catch {
      setDeposits([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (d, status) => {
    const label = status === 'confirmed' ? 'confirmar' : 'rechazar';
    setModal({
      message: `¿Estás seguro de que querés ${label} el ingreso de ${formatAmount(d.amount)}?`,
      onConfirm: () => applyAction(d.bank_movement_id, status),
    });
  };

  const applyAction = async (id, status) => {
    setModal(null);
    try {
      await updateBankMovement(id, { status });
      setDeposits(prev => prev.filter(d => d.bank_movement_id !== id));
    } catch {
      alert('Ocurrió un error. Intentá de nuevo.');
    }
  };

  const formatAmount = (amount) =>
    new Intl.NumberFormat('es-PY', { style: 'currency', currency: 'PYG', minimumFractionDigits: 0 }).format(amount);

  if (loading) return <div className="tab-loading">Cargando ingresos...</div>;

  return (
    <div className="tab-content">
      <div className="tab-header">
        <h2 className="tab-title">Confirmaciones de ingreso</h2>
        <span className="tab-count">{deposits.length} pendientes</span>
      </div>

      {deposits.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">✅</span>
          <p>No hay ingresos pendientes de confirmación</p>
        </div>
      ) : (
        <div className="card-list">
          {deposits.map(d => (
            <div key={d.bank_movement_id} className="admin-card">
              <div className="card-avatar card-avatar--money">💰</div>
              <div className="card-info">
                <p className="card-name">{formatAmount(d.amount)}</p>
                <p className="card-sub">Ref: {d.reference_number}</p>
              </div>
              <div className="card-meta">
                <StatusBadge status={d.status} />
                <p className="card-date">{new Date(d.created_at).toLocaleDateString('es-PY')}</p>
              </div>
              <div className="card-actions">
                <button
                  className="btn btn-success"
                  onClick={() => handleAction(d, 'confirmed')}
                >
                  Confirmar
                </button>
                <button
                  className="btn btn-danger"
                  onClick={() => handleAction(d, 'rejected')}
                >
                  Rechazar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <ConfirmModal
          message={modal.message}
          onConfirm={modal.onConfirm}
          onCancel={() => setModal(null)}
        />
      )}
    </div>
  );
};

// ─── Página principal ────────────────────────────────
const AdminPage = () => {
  const [activeTab, setActiveTab] = useState('providers');

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1 className="admin-title">Panel de Administración</h1>
        <p className="admin-subtitle">Gestioná proveedores, egresos e ingresos pendientes</p>
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

      <div className="admin-body">
        {activeTab === 'providers'   && <ProvidersTab />}
        {activeTab === 'withdrawals' && <WithdrawalsTab />}
        {activeTab === 'deposits'    && <DepositsTab />}
      </div>
    </div>
  );
};

export default AdminPage;