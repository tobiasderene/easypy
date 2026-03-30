// WithdrawModal.jsx
import React, { useState } from 'react';
import { CheckCircle, AlertCircle, CreditCard } from 'lucide-react';
import { createWithdrawal } from '../services/api';
import '../styles/withdrawmodal.css';

const WithdrawModal = ({ isOpen, onClose, walletId, availableBalance = 0 }) => {
  const [step, setStep]               = useState(1);
  const [amount, setAmount]           = useState('');
  const [bankEntity, setBankEntity]   = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [error, setError]             = useState('');
  const [loading, setLoading]         = useState(false);

  const formatCurrency = (v) =>
    new Intl.NumberFormat('es-PY', { style: 'currency', currency: 'PYG', minimumFractionDigits: 0 }).format(v || 0);

  const handleAmountChange = (e) => {
    const v = e.target.value;
    if (v === '' || /^\d+$/.test(v)) { setAmount(v); setError(''); }
  };

  const handleBankAccountChange = (e) => {
    const v = e.target.value;
    if (v === '' || /^[\d-]+$/.test(v)) { setBankAccount(v); setError(''); }
  };

  const handleSubmit = async () => {
    if (!amount || amount === '0')                    return setError('Ingresá un monto válido');
    if (parseInt(amount) < 50000)                     return setError('El monto mínimo de retiro es Gs. 50,000');
    if (parseInt(amount) > availableBalance)          return setError('El monto excede tu saldo disponible');
    if (!bankEntity || bankEntity.trim().length < 3)  return setError('Ingresá el nombre de la entidad bancaria');
    if (!bankAccount || bankAccount.length < 10)      return setError('Ingresá un número de cuenta válido');

    setLoading(true);
    try {
      await createWithdrawal({
        wallet_id:            walletId,
        amount:               parseInt(amount),
        status:               'pending',
        bank_name:            bankEntity.trim(),
        bank_account_address: bankAccount.trim(),
      });
      setStep(2);
    } catch (err) {
      setError(err.message || 'Ocurrió un error. Intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep(1); setAmount(''); setBankEntity(''); setBankAccount(''); setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="wm-overlay" onClick={(e) => e.target === e.currentTarget && handleClose()}>
      <div className="wm-modal">

        {/* Header */}
        <div className="wm-header">
          <div>
            <h2 className="wm-title">{step === 1 ? 'Retirar Dinero' : 'Solicitud enviada'}</h2>
            <p className="wm-subtitle">{step === 1 ? 'Completá los datos para solicitar el retiro' : 'Tu solicitud fue procesada correctamente'}</p>
          </div>
        </div>

        {/* ── STEP 1 ── */}
        {step === 1 && (<>

          {/* Balance */}
          <div className="wm-balance">
            <div>
              <p className="wm-balance-label">Saldo disponible</p>
              <p className="wm-balance-amount">{formatCurrency(availableBalance)}</p>
            </div>
          </div>

          {/* Monto */}
          <div className="wm-field">
            <label className="wm-label">Monto a retirar <span className="wm-req">*</span></label>
            <div className="wm-amount-wrap">
              <span className="wm-currency">Gs.</span>
              <input
                className="wm-amount-input"
                type="text"
                placeholder="0"
                value={amount}
                onChange={handleAmountChange}
                autoFocus
              />
            </div>
            {amount && !error && parseFloat(amount) > 0 && (
              <span className="wm-amount-preview">{formatCurrency(parseInt(amount))}</span>
            )}
          </div>

          {/* Montos rápidos */}
          <div className="wm-quick">
            <span className="wm-quick-label">Montos rápidos</span>
            <div className="wm-quick-btns">
              {['100000', '500000', '1000000'].map((v) => (
                <button key={v} className="wm-quick-btn" onClick={() => { setAmount(v); setError(''); }}>
                  {v === '100000' ? '100K' : v === '500000' ? '500K' : '1M'}
                </button>
              ))}
              <button className="wm-quick-btn" onClick={() => { setAmount(Math.floor(availableBalance).toString()); setError(''); }}>
                Todo
              </button>
            </div>
          </div>

          {/* Entidad bancaria */}
          <div className="wm-field">
            <label className="wm-label">Entidad bancaria <span className="wm-req">*</span></label>
            <div className="wm-input-wrap">
              <svg className="wm-input-icon" width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
              <input
                className="wm-input"
                type="text"
                placeholder="Ej: Itaú, Banco Nacional, BBVA..."
                value={bankEntity}
                onChange={(e) => { setBankEntity(e.target.value); setError(''); }}
              />
            </div>
          </div>

          {/* Número de cuenta */}
          <div className="wm-field">
            <label className="wm-label">Número de cuenta <span className="wm-req">*</span></label>
            <div className="wm-input-wrap">
              <CreditCard className="wm-input-icon" size={18} />
              <input
                className="wm-input"
                type="text"
                placeholder="1234-5678-9012-3456"
                value={bankAccount}
                onChange={handleBankAccountChange}
                maxLength={19}
              />
            </div>
          </div>

          {/* Info */}
          <div className="wm-info">
            <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1, color: '#d97706' }} />
            <div>
              <p className="wm-info-title">Importante</p>
              <ul className="wm-info-list">
                <li>El retiro mínimo es de Gs. 50,000</li>
                <li>La transferencia se procesa en 1-3 días hábiles</li>
              </ul>
            </div>
          </div>

          {/* Resumen */}
          {amount && parseInt(amount) >= 50000 && (
            <div className="wm-summary">
              <div className="wm-summary-row">
                <span>Monto a retirar</span>
                <span>{formatCurrency(parseInt(amount))}</span>
              </div>
            </div>
          )}

          {error && <div className="wm-error">{error}</div>}

          <div className="wm-actions">
            <button className="wm-btn-cancel" onClick={handleClose} disabled={loading}>Cancelar</button>
            <button className="wm-btn-submit" onClick={handleSubmit} disabled={loading}>
              {loading ? 'Enviando...' : 'Solicitar retiro'}
            </button>
          </div>

        </>)}

        {/* ── STEP 2 — Éxito ── */}
        {step === 2 && (
          <div className="wm-success">
            <div className="wm-success-icon">
              <CheckCircle size={36} />
            </div>
            <p className="wm-success-title">Solicitud enviada</p>

            <div className="wm-success-details">
              {[
                ['Monto solicitado', formatCurrency(parseInt(amount))],
                ['Entidad bancaria', bankEntity],
                ['Cuenta destino',   bankAccount],
                ['Tiempo estimado',  '1-3 días hábiles'],
              ].map(([label, value]) => (
                <div key={label} className="wm-detail-row">
                  <span className="wm-detail-label">{label}</span>
                  <span className="wm-detail-value">{value}</span>
                </div>
              ))}
              <div className="wm-detail-row">
                <span className="wm-detail-label">Estado</span>
                <span className="wm-status-badge">En proceso</span>
              </div>
            </div>

            <div className="wm-success-info">
              <CheckCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>El dinero será transferido a tu cuenta bancaria cuando el retiro sea aprobado.</span>
            </div>

            <button className="wm-btn-full" onClick={handleClose}>Entendido</button>
          </div>
        )}

      </div>
    </div>
  );
};

export default WithdrawModal;