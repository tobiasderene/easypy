import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownLeft, Wallet as WalletIcon, Calendar } from 'lucide-react';
import { useUser } from '../App';
import { getWalletByUser, getTransactionsByWallet } from '../services/api';
import DepositModal from '../components/DepositModal';
import WithdrawModal from '../components/WithdrawModal';
import '../styles/wallet.css';

const Wallet = () => {
  const { user } = useUser();

  const [wallet, setWallet]         = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [activeTab, setActiveTab]   = useState('all');
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
    } catch {
      // silencioso
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [user]);

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('es-PY', { style: 'currency', currency: 'PYG', minimumFractionDigits: 0 }).format(amount || 0);

  const formatDate = (dateString) =>
    new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(dateString));

  const filteredTransactions = transactions.filter(t => {
    if (activeTab === 'all') return true;
    if (activeTab === 'income') return t.transaction_direction === 'in';
    if (activeTab === 'expense') return t.transaction_direction === 'out';
    return true;
  });

  const totalIncome = transactions
    .filter(t => t.transaction_direction === 'in' && t.transaction_status === 'completed')
    .reduce((sum, t) => sum + parseFloat(t.transaction_amount || 0), 0);

  const totalExpense = transactions
    .filter(t => t.transaction_direction === 'out' && t.transaction_status === 'completed')
    .reduce((sum, t) => sum + parseFloat(t.transaction_amount || 0), 0);

  // Gráfico: últimas 7 transacciones agrupadas por día
  const chartData = (() => {
    const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    const today = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - (6 - i));
      const dayName = days[d.getDay() === 0 ? 6 : d.getDay() - 1];
      const dayTxs = transactions.filter(t => {
        const td = new Date(t.created_at);
        return td.toDateString() === d.toDateString();
      });
      const amount = dayTxs.reduce((sum, t) => {
        const val = parseFloat(t.transaction_amount || 0);
        return t.transaction_direction === 'in' ? sum + val : sum - val;
      }, parseFloat(wallet?.balance_available || 0));
      return { day: dayName, amount: Math.max(0, amount) };
    });
  })();

  const maxAmount = Math.max(...chartData.map(d => d.amount), 1);
  const minAmount = Math.min(...chartData.map(d => d.amount), 0);

  if (loading) {
    return (
      <div className="wallet-page">
        <div className="wallet-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <p style={{ color: '#9ca3af' }}>Cargando billetera...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="wallet-page">
      <div className="wallet-container">

        {/* Header */}
        <div className="wallet-header">
          <div className="header-content">
            <WalletIcon size={32} />
            <div>
              <h1>Mi Billetera</h1>
              <p>Gestiona tus ingresos y egresos</p>
            </div>
          </div>
        </div>

        {/* Balance & Chart */}
        <div className="balance-chart-section">

          {/* Balance Card */}
          <div className="balance-card">
            <div className="balance-header">
              <span className="balance-label">Balance Disponible</span>
            </div>

            <div className="balance-amount">
              {formatCurrency(wallet?.balance_available)}
            </div>

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
              <div className="stat-divider"></div>
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
                <ArrowDownLeft size={18} />
                <span>Ingresar Dinero</span>
              </button>
              <button className="action-btn withdraw" onClick={() => setShowWithdrawModal(true)}>
                <ArrowUpRight size={18} />
                <span>Retirar Dinero</span>
              </button>
            </div>
          </div>

          {/* Chart */}
          <div className="chart-card">
            <div className="chart-header">
              <h3>Evolución (7 días)</h3>
              <Calendar size={20} />
            </div>
            <div className="chart-container">
              <div className="chart">
                {chartData.map((data, index) => {
                  const range = maxAmount - minAmount || 1;
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

        {/* Transactions */}
        <div className="transactions-section">
          <div className="transactions-header">
            <h2>Historial de Movimientos</h2>
            <div className="transaction-tabs">
              {[['all', 'Todos'], ['income', 'Ingresos'], ['expense', 'Egresos']].map(([val, label]) => (
                <button
                  key={val}
                  className={`tab-btn ${activeTab === val ? 'active' : ''}`}
                  onClick={() => setActiveTab(val)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="transactions-list">
            {filteredTransactions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                No hay movimientos para mostrar
              </div>
            ) : (
              filteredTransactions.map(t => {
                const isIncome = t.transaction_direction === 'in';
                return (
                  <div key={t.id_transaction} className="transaction-item">
                    <div className="transaction-icon-wrapper">
                      <div className={`transaction-icon ${isIncome ? 'income' : 'expense'}`}>
                        {isIncome ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                      </div>
                    </div>
                    <div className="transaction-info">
                      <h4 className="transaction-description">{t.transaction_category}</h4>
                      <div className="transaction-meta">
                        <span className="transaction-date">{formatDate(t.created_at)}</span>
                        <span className={`transaction-status ${t.transaction_status}`}>
                          {t.transaction_status === 'completed' ? 'Completado' : 'Pendiente'}
                        </span>
                      </div>
                    </div>
                    <div className={`transaction-amount ${isIncome ? 'income' : 'expense'}`}>
                      {isIncome ? '+' : '-'}{formatCurrency(t.transaction_amount)}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <DepositModal
        isOpen={showDepositModal}
        onClose={() => { setShowDepositModal(false); fetchData(); }}
      />
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