import React, { useState } from 'react';
import { TrendingUp, TrendingDown, DollarSign, ArrowUpRight, ArrowDownLeft, Wallet as WalletIcon, Calendar } from 'lucide-react';
import DepositModal from '../components/DepositModal';
import '../styles/wallet.css';

const Wallet = () => {
  const [activeTab, setActiveTab] = useState('all'); // all, income, expense
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  // Balance y datos
  const balance = 1250000; // Gs. 1,250,000
  const monthlyChange = 15.5; // +15.5%
  const isPositive = monthlyChange > 0;

  // Datos para el gráfico (últimos 7 días)
  const chartData = [
    { day: 'Lun', amount: 1100000 },
    { day: 'Mar', amount: 1150000 },
    { day: 'Mié', amount: 1120000 },
    { day: 'Jue', amount: 1180000 },
    { day: 'Vie', amount: 1220000 },
    { day: 'Sáb', amount: 1200000 },
    { day: 'Dom', amount: 1250000 }
  ];

  const maxAmount = Math.max(...chartData.map(d => d.amount));
  const minAmount = Math.min(...chartData.map(d => d.amount));

  // Transacciones
  const transactions = [
    {
      id: 1,
      type: 'income',
      description: 'Venta - Pedido #TRX-001',
      amount: 150000,
      date: '2024-02-23',
      time: '14:30',
      status: 'completed'
    },
    {
      id: 2,
      type: 'expense',
      description: 'Compra a TechGlobal Suppliers',
      amount: 80000,
      date: '2024-02-23',
      time: '10:15',
      status: 'completed'
    },
    {
      id: 3,
      type: 'income',
      description: 'Venta - Pedido #TRX-002',
      amount: 95000,
      date: '2024-02-22',
      time: '16:45',
      status: 'completed'
    },
    {
      id: 4,
      type: 'expense',
      description: 'Retiro a cuenta bancaria',
      amount: 200000,
      date: '2024-02-22',
      time: '09:00',
      status: 'pending'
    },
    {
      id: 5,
      type: 'income',
      description: 'Venta - Pedido #TRX-003',
      amount: 120000,
      date: '2024-02-21',
      time: '18:20',
      status: 'completed'
    },
    {
      id: 6,
      type: 'expense',
      description: 'Compra a BeautyHub Wholesale',
      amount: 65000,
      date: '2024-02-21',
      time: '11:30',
      status: 'completed'
    },
    {
      id: 7,
      type: 'income',
      description: 'Depósito manual',
      amount: 300000,
      date: '2024-02-20',
      time: '08:00',
      status: 'completed'
    },
    {
      id: 8,
      type: 'expense',
      description: 'Compra a AudioPro Wholesale',
      amount: 45000,
      date: '2024-02-20',
      time: '15:45',
      status: 'completed'
    }
  ];

  // Filtrar transacciones
  const filteredTransactions = transactions.filter(transaction => {
    if (activeTab === 'all') return true;
    return transaction.type === activeTab;
  });

  // Formatear moneda
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-PY', {
      style: 'currency',
      currency: 'PYG',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Formatear fecha
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(date);
  };

  // Calcular totales
  const totalIncome = transactions
    .filter(t => t.type === 'income' && t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter(t => t.type === 'expense' && t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);

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

        {/* Balance & Chart Section */}
        <div className="balance-chart-section">
          
          {/* Balance Card */}
          <div className="balance-card">
            <div className="balance-header">
              <span className="balance-label">Balance Disponible</span>
              <div className={`balance-change ${isPositive ? 'positive' : 'negative'}`}>
                {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                <span>{isPositive ? '+' : ''}{monthlyChange}%</span>
              </div>
            </div>
            
            <div className="balance-amount">
              {formatCurrency(balance)}
            </div>

            <div className="balance-stats">
              <div className="stat-item">
                <ArrowUpRight size={16} className="icon-income" />
                <div>
                  <div className="stat-label">Ingresos</div>
                  <div className="stat-value income">{formatCurrency(totalIncome)}</div>
                </div>
              </div>
              
              <div className="stat-divider"></div>

              <div className="stat-item">
                <ArrowDownLeft size={16} className="icon-expense" />
                <div>
                  <div className="stat-label">Egresos</div>
                  <div className="stat-value expense">{formatCurrency(totalExpense)}</div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="balance-actions">
              <button 
                className="action-btn deposit"
                onClick={() => setShowDepositModal(true)}
              >
                <ArrowDownLeft size={18} />
                <span>Ingresar Dinero</span>
              </button>
              <button 
                className="action-btn withdraw"
                onClick={() => setShowWithdrawModal(true)}
              >
                <ArrowUpRight size={18} />
                <span>Retirar Dinero</span>
              </button>
            </div>
          </div>

          {/* Chart Card */}
          <div className="chart-card">
            <div className="chart-header">
              <h3>Evolución (7 días)</h3>
              <Calendar size={20} />
            </div>
            
            <div className="chart-container">
              <div className="chart">
                {chartData.map((data, index) => {
                  const heightPercent = ((data.amount - minAmount) / (maxAmount - minAmount)) * 100;
                  return (
                    <div key={index} className="chart-bar-wrapper">
                      <div className="chart-bar-container">
                        <div 
                          className="chart-bar"
                          style={{ height: `${heightPercent}%` }}
                        >
                          <span className="chart-tooltip">
                            {formatCurrency(data.amount)}
                          </span>
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

        {/* Transactions Section */}
        <div className="transactions-section">
          <div className="transactions-header">
            <h2>Historial de Movimientos</h2>
            <div className="transaction-tabs">
              <button
                className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
                onClick={() => setActiveTab('all')}
              >
                Todos
              </button>
              <button
                className={`tab-btn ${activeTab === 'income' ? 'active' : ''}`}
                onClick={() => setActiveTab('income')}
              >
                Ingresos
              </button>
              <button
                className={`tab-btn ${activeTab === 'expense' ? 'active' : ''}`}
                onClick={() => setActiveTab('expense')}
              >
                Egresos
              </button>
            </div>
          </div>

          <div className="transactions-list">
            {filteredTransactions.map(transaction => (
              <div key={transaction.id} className="transaction-item">
                <div className="transaction-icon-wrapper">
                  <div className={`transaction-icon ${transaction.type}`}>
                    {transaction.type === 'income' ? (
                      <ArrowDownLeft size={20} />
                    ) : (
                      <ArrowUpRight size={20} />
                    )}
                  </div>
                </div>

                <div className="transaction-info">
                  <h4 className="transaction-description">{transaction.description}</h4>
                  <div className="transaction-meta">
                    <span className="transaction-date">{formatDate(transaction.date)}</span>
                    <span className="transaction-time">{transaction.time}</span>
                    <span className={`transaction-status ${transaction.status}`}>
                      {transaction.status === 'completed' ? 'Completado' : 'Pendiente'}
                    </span>
                  </div>
                </div>

                <div className={`transaction-amount ${transaction.type}`}>
                  {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Deposit Modal */}
      <DepositModal 
        isOpen={showDepositModal}
        onClose={() => setShowDepositModal(false)}
      />

      {/* Withdraw Modal (placeholder) */}
      {showWithdrawModal && (
        <div className="modal-overlay" onClick={() => setShowWithdrawModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Retirar Dinero</h3>
            <p>Funcionalidad de retiro en desarrollo</p>
            <button onClick={() => setShowWithdrawModal(false)}>Cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Wallet;