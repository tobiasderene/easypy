import React, { useState } from 'react';
import { CheckCircle, X, AlertCircle, CreditCard } from 'lucide-react';
import './WithdrawModal.css';

const WithdrawModal = ({ isOpen, onClose, availableBalance = 1250000 }) => {
  const [step, setStep] = useState(1); // 1: form, 2: confirmation
  const [amount, setAmount] = useState('');
  const [bankEntity, setBankEntity] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [error, setError] = useState('');

  const handleAmountChange = (e) => {
    const value = e.target.value;
    // Solo permitir números
    if (value === '' || /^\d+$/.test(value)) {
      setAmount(value);
      setError('');
    }
  };

  const handleBankEntityChange = (e) => {
    setBankEntity(e.target.value);
    setError('');
  };

  const handleBankAccountChange = (e) => {
    const value = e.target.value;
    // Permitir números y guiones
    if (value === '' || /^[\d-]+$/.test(value)) {
      setBankAccount(value);
      setError('');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validación de monto
    if (!amount || amount === '0') {
      setError('Por favor ingresa un monto válido');
      return;
    }

    if (parseInt(amount) < 50000) {
      setError('El monto mínimo de retiro es Gs. 50,000');
      return;
    }

    if (parseInt(amount) > availableBalance) {
      setError('El monto excede tu saldo disponible');
      return;
    }

    // Validación de entidad bancaria
    if (!bankEntity || bankEntity.trim().length < 3) {
      setError('Por favor ingresa el nombre de la entidad bancaria');
      return;
    }

    // Validación de cuenta bancaria
    if (!bankAccount || bankAccount.length < 10) {
      setError('Por favor ingresa un número de cuenta válido');
      return;
    }

    // Ir al paso de confirmación
    setStep(2);
  };

  const handleClose = () => {
    // Reset al cerrar
    setStep(1);
    setAmount('');
    setBankEntity('');
    setBankAccount('');
    setError('');
    onClose();
  };

  const formatCurrency = (value) => {
    if (!value) return 'Gs. 0';
    return new Intl.NumberFormat('es-PY', {
      style: 'currency',
      currency: 'PYG',
      minimumFractionDigits: 0
    }).format(value);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        
        {/* Step 1: Form */}
        {step === 1 && (
          <>
            {/* Header */}
            <div className="modal-header">
              <div className="modal-icon withdraw">
                <CreditCard size={24} />
              </div>
              <h2>Solicitud de Retiro</h2>
              <button className="modal-close" onClick={handleClose}>
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="modal-body">
              <p className="modal-description">
                Ingresa el monto que deseas retirar de tu billetera
              </p>

              {/* Balance disponible */}
              <div className="balance-display">
                <span className="balance-label">Saldo disponible</span>
                <span className="balance-amount">{formatCurrency(availableBalance)}</span>
              </div>

              <form onSubmit={handleSubmit}>
                {/* Monto a retirar */}
                <div className="form-group">
                  <label htmlFor="amount">Monto a retirar</label>
                  <div className="amount-input-wrapper">
                    <span className="currency-symbol">Gs.</span>
                    <input
                      type="text"
                      id="amount"
                      className={`amount-input ${error && !bankAccount ? 'error' : ''}`}
                      placeholder="0"
                      value={amount}
                      onChange={handleAmountChange}
                      autoFocus
                    />
                  </div>
                  {amount && !error && (
                    <div className="amount-preview">
                      {formatCurrency(amount)}
                    </div>
                  )}
                </div>

                {/* Entidad bancaria */}
                <div className="form-group">
                  <label htmlFor="bankEntity">Entidad bancaria</label>
                  <div className="bank-input-wrapper">
                    <svg className="input-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="1" x2="12" y2="23"></line>
                      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                    </svg>
                    <input
                      type="text"
                      id="bankEntity"
                      className={`bank-input ${error && !bankEntity ? 'error' : ''}`}
                      placeholder="Ej: Banco Nacional, Itaú, BBVA..."
                      value={bankEntity}
                      onChange={handleBankEntityChange}
                    />
                  </div>
                </div>

                {/* Cuenta bancaria */}
                <div className="form-group">
                  <label htmlFor="bankAccount">Número de cuenta bancaria</label>
                  <div className="bank-input-wrapper">
                    <CreditCard className="input-icon" size={20} />
                    <input
                      type="text"
                      id="bankAccount"
                      className={`bank-input ${error && bankAccount.length < 10 ? 'error' : ''}`}
                      placeholder="1234-5678-9012-3456"
                      value={bankAccount}
                      onChange={handleBankAccountChange}
                      maxLength={19}
                    />
                  </div>
                  {error && <span className="error-message">{error}</span>}
                </div>

                {/* Botones de monto rápido */}
                <div className="quick-amounts">
                  <span className="quick-label">Montos rápidos:</span>
                  <div className="quick-buttons">
                    <button
                      type="button"
                      className="quick-btn"
                      onClick={() => setAmount('100000')}
                    >
                      100K
                    </button>
                    <button
                      type="button"
                      className="quick-btn"
                      onClick={() => setAmount('500000')}
                    >
                      500K
                    </button>
                    <button
                      type="button"
                      className="quick-btn"
                      onClick={() => setAmount('1000000')}
                    >
                      1M
                    </button>
                    <button
                      type="button"
                      className="quick-btn"
                      onClick={() => setAmount(availableBalance.toString())}
                    >
                      Todo
                    </button>
                  </div>
                </div>

                {/* Nota importante */}
                <div className="info-box warning">
                  <AlertCircle size={20} />
                  <div>
                    <p className="info-title">Importante:</p>
                    <ul className="info-list">
                      <li>El retiro mínimo es de Gs. 50,000</li>
                      <li>La transferencia se procesará en 1-3 días hábiles</li>
                      <li>Se aplicará una comisión del 2% sobre el monto</li>
                    </ul>
                  </div>
                </div>

                {/* Resumen de costos */}
                {amount && parseInt(amount) >= 50000 && (
                  <div className="cost-summary">
                    <div className="cost-row">
                      <span>Monto a retirar:</span>
                      <span>{formatCurrency(amount)}</span>
                    </div>
                    <div className="cost-row">
                      <span>Comisión (2%):</span>
                      <span className="cost-fee">-{formatCurrency(parseInt(amount) * 0.02)}</span>
                    </div>
                    <div className="cost-row total">
                      <span>Recibirás:</span>
                      <span>{formatCurrency(parseInt(amount) * 0.98)}</span>
                    </div>
                  </div>
                )}

                {/* Buttons */}
                <div className="modal-actions">
                  <button 
                    type="button" 
                    className="btn-secondary"
                    onClick={handleClose}
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    className="btn-primary withdraw"
                  >
                    Solicitar Retiro
                  </button>
                </div>
              </form>
            </div>
          </>
        )}

        {/* Step 2: Confirmation */}
        {step === 2 && (
          <>
            {/* Header */}
            <div className="modal-header">
              <div className="modal-icon success">
                <CheckCircle size={24} />
              </div>
              <h2>¡Retiro Solicitado!</h2>
              <button className="modal-close" onClick={handleClose}>
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="modal-body">
              <div className="success-content">
                <div className="success-icon-large">
                  <CheckCircle size={64} />
                </div>
                
                <h3>Tu solicitud ha sido procesada</h3>
                
                <div className="confirmation-details">
                  <div className="confirmation-row">
                    <span className="confirmation-label">Monto solicitado:</span>
                    <span className="confirmation-value">{formatCurrency(amount)}</span>
                  </div>
                  <div className="confirmation-row">
                    <span className="confirmation-label">Comisión:</span>
                    <span className="confirmation-value cost-fee">-{formatCurrency(parseInt(amount) * 0.02)}</span>
                  </div>
                  <div className="confirmation-row highlight">
                    <span className="confirmation-label">Monto a recibir:</span>
                    <span className="confirmation-value">{formatCurrency(parseInt(amount) * 0.98)}</span>
                  </div>
                  <div className="confirmation-row">
                    <span className="confirmation-label">Entidad bancaria:</span>
                    <span className="confirmation-value">{bankEntity}</span>
                  </div>
                  <div className="confirmation-row">
                    <span className="confirmation-label">Cuenta destino:</span>
                    <span className="confirmation-value">{bankAccount}</span>
                  </div>
                  <div className="confirmation-row">
                    <span className="confirmation-label">Estado:</span>
                    <span className="status-badge processing">En proceso</span>
                  </div>
                  <div className="confirmation-row">
                    <span className="confirmation-label">Fecha:</span>
                    <span className="confirmation-value">
                      {new Date().toLocaleDateString('es-PY', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <div className="confirmation-row">
                    <span className="confirmation-label">Tiempo estimado:</span>
                    <span className="confirmation-value">1-3 días hábiles</span>
                  </div>
                </div>

                <div className="info-box success">
                  <CheckCircle size={20} />
                  <p>
                    El dinero será transferido a tu cuenta bancaria. 
                    Recibirás una notificación cuando el retiro sea completado.
                  </p>
                </div>

                {/* Button */}
                <button 
                  className="btn-primary full-width"
                  onClick={handleClose}
                >
                  Entendido
                </button>
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
};

export default WithdrawModal;