import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownLeft, WalletIcon, Calendar } from 'lucide-react';
import { useUser } from '../App';
import { getWalletByUser, getTransactionsByWallet } from '../services/api';
import DepositModal from '../components/DepositModal';
import WithdrawModal from '../components/WithdrawModal';
import '../styles/wallet.css';

// transaction_direction en DB: 'inbound' = ingreso, 'outbound'/'out' = egreso
const isIncome  = (t) => t.transaction_direction === 'inbound'  || t.transaction_direction === 'in';
const isExpense = (t) => t.transaction_direction === 'outbound' || t.transaction_direction === 'out';

const TX_LABELS = {
  order_payment:   'Pago de orden',
  order_profit:    'Ganancia por entrega',
  withdrawal:      'Retiro de fondos',
  deposit:         'Depósito',
  commission:      'Comisión EasyPy',
  refund:          'Reembolso',
};

const Wallet = () => {
  const { user } = useUser();

  const [wallet, setWallet]             = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [activeTab, setActiveTab]       = useState('all');
  const [showDepositModal, setShowDepositModal]   = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  const fetchData = async () => {
    if (!user?.user_id) return;
    try {
      const w = await getWalletByUser(user.user_id);
      setWallet(w);
      if (w?.wallet_id) {
        const txs = await getTransactionsByWallet(w.wallet_id);
        setTransactions(txs || []);
      }
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [user]);

  const formatCurrency = (v) =>
    new Intl.NumberFormat('es-PY', { style: 'currency', currency: 'PYG', minimumFractionDigits: 0 }).format(v || 0);

  const formatDate = (d) => {
    try { return new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(d)); }
    catch { return '—'; }
  };

  const filteredTransactions = transactions.filter(t => {
    if (activeTab === 'all')     return true;
    if (activeTab === 'income')  return isIncome(t);
    if (activeTab === 'expense') return isExpense(t);
    return true;
  });

  const totalIncome  = transactions.filter(t => isIncome(t)  && t.transaction_status === 'completed').reduce((s, t) => s + parseFloat(t.transaction_amount || 0), 0);
  const totalExpense = transactions.filter(t => isExpense(t) && t.transaction_status === 'completed').reduce((s, t) => s + parseFloat(t.transaction_amount || 0), 0);

  // Gráfico: últimos 7 días
  const chartData = (() => {
    const days  = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    const today = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - (6 - i));
      const dayName = days[d.getDay() === 0 ? 6 : d.getDay() - 1];
      const dayTxs  = transactions.filter(t => new Date(t.created_at).toDateString() === d.toDateString());
      const amount  = dayTxs.reduce((sum, t) => {
        const val = parseFloat(t.transaction_amount || 0);
        return isIncome(t) ? sum + val : sum - val;
      }, 0);
      return { day: dayName, amount };
    });
  })();

  const maxAmount = Math.max(...chartData.map(d => d.amount), 1);
  const minAmount = Math.min(...chartData.map(d => d.amount), 0);

  if (loading) return (
    <div className="wallet-page">
      <div className="wallet-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <p style={{ color: '#9ca3af' }}>Cargando billetera...</p>
      </div>
    </div>
  );

  return (
    <div className="wallet-page">
      <div className="wallet-container">

        {/* Balance & Chart */}
        <div className="balance-chart-section">
          <div className="balance-card">
            <div className="balance-header">
              <span className="balance-label">Balance Disponible</span>
            </div>
            <div className="balance-amount">{formatCurrency(wallet?.balance_available)}</div>
            {wallet?.balance_pending > 0 && (
              <div style={{ fontSize: '13px', opacity: 0.8 }}>
                Pendiente: {formatCurrency(wallet.balance_pending)}
              </div>
            )}
            <div className="balance-stats">
              <div className="stat-item">
                <ArrowUpRight size={16} className="icon-income" />
                <div>
                  <div className="stat-label">Ingresos</div>
                  <div className="stat-value">{formatCurrency(totalIncome)}</div>
                </div>
              </div>
              <div className="stat-divider" />
              <div className="stat-item">
                <ArrowDownLeft size={16} className="icon-expense" />
                <div>
                  <div className="stat-label">Egresos</div>
                  <div className="stat-value">{formatCurrency(totalExpense)}</div>
                </div>
              </div>
            </div>
            <div className="balance-actions">
              <button className="action-btn deposit" onClick={() => setShowDepositModal(true)}>
                <ArrowDownLeft size={18} /><span>Ingresar Dinero</span>
              </button>
              <button className="action-btn withdraw" onClick={() => setShowWithdrawModal(true)}>
                <ArrowUpRight size={18} /><span>Retirar Dinero</span>
              </button>
            </div>
          </div>

          <div className="chart-card">
            <div className="chart-header">
              <h3>Evolución (7 días)</h3>
              <Calendar size={20} />
            </div>
            <div className="chart-container">
              <div className="chart">
                {chartData.map((data, index) => {
                  const range         = maxAmount - minAmount || 1;
                  const heightPercent = ((data.amount - minAmount) / range) * 100;
                  return (
                    <div key={index} className="chart-bar-wrapper">
                      <div className="chart-bar-container">
                        <div className="chart-bar" style={{ height: `${Math.max(heightPercent, 5)}%` }}>
                          <span className="chart-tooltip">{formatCurrency(data.amount)}</span>
                        </div>
                      </div>
                      <span className="chart-label">{data.day}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Transacciones */}
        <div className="transactions-section">
          <div className="transactions-header">
            <h2>Historial de Movimientos</h2>
            <div className="transaction-tabs">
              {[['all', 'Todos'], ['income', 'Ingresos'], ['expense', 'Egresos']].map(([val, label]) => (
                <button key={val} className={`tab-btn ${activeTab === val ? 'active' : ''}`} onClick={() => setActiveTab(val)}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="transactions-list">
            {filteredTransactions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                No hay movimientos {activeTab !== 'all' ? 'en esta categoría' : 'para mostrar'}
              </div>
            ) : (
              filteredTransactions.map(t => {
                const income = isIncome(t);
                const statusLabel = {
                  completed: 'Completado',
                  active:    'Activo',
                  pending:   'Pendiente',
                  cancelled: 'Cancelado',
                }[t.transaction_status] || t.transaction_status;

                return (
                  <div key={t.id_transaction} className="transaction-item">
                    <div className="transaction-icon-wrapper">
                      <div className={`transaction-icon ${income ? 'income' : 'expense'}`}>
                        {income ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                      </div>
                    </div>
                    <div className="transaction-info">
                      <h4 className="transaction-description">
                        {TX_LABELS[t.transaction_category] || t.transaction_category}
                        {t.order_id && <span style={{ fontSize: '11px', color: '#9ca3af', marginLeft: '6px' }}>Orden #{t.order_id}</span>}
                      </h4>
                      <div className="transaction-meta">
                        <span className="transaction-date">{formatDate(t.created_at)}</span>
                        <span className={`transaction-status ${t.transaction_status}`}>{statusLabel}</span>
                      </div>
                    </div>
                    <div className={`transaction-amount ${income ? 'income' : 'expense'}`}>
                      {income ? '+' : '-'}{formatCurrency(t.transaction_amount)}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {showDepositModal && (
        <DepositModal walletId={wallet?.wallet_id} onClose={() => setShowDepositModal(false)} onSuccess={() => fetchData()} />
      )}
      <WithdrawModal
        isOpen={showWithdrawModal}
        onClose={() => { setShowWithdrawModal(false); fetchData(); }}
        walletId={wallet?.wallet_id}
        availableBalance={parseFloat(wallet?.balance_available || 0)}
      />
    </div>
  );
};

export default Wallet;