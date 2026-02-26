import React, { useState } from 'react';
import { CheckCircle, X, DollarSign } from 'lucide-react';
import '../styles/depositmodal.css';

const DepositModal = ({ isOpen, onClose }) => {
  const [step, setStep] = useState(1); // 1: form, 2: confirmation
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');

  const handleAmountChange = (e) => {
    const value = e.target.value;
    // Solo permitir números
    if (value === '' || /^\d+$/.test(value)) {
      setAmount(value);
      setError('');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validación
    if (!amount || amount === '0') {
      setError('Por favor ingresa un monto válido');
      return;
    }

    if (parseInt(amount) < 10000) {
      setError('El monto mínimo es Gs. 10,000');
      return;
    }

    // Ir al paso de confirmación
    setStep(2);
  };

  const handleClose = () => {
    // Reset al cerrar
    setStep(1);
    setAmount('');
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
              <div className="modal-icon deposit">
                <DollarSign size={24} />
              </div>
              <h2>Solicitud de Ingreso</h2>
              <button className="modal-close" onClick={handleClose}>
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="modal-body">
              <p className="modal-description">
                Ingresa el monto que transferiste para agregar fondos a tu billetera
              </p>

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="amount">Monto transferido</label>
                  <div className="amount-input-wrapper">
                    <span className="currency-symbol">Gs.</span>
                    <input
                      type="text"
                      id="amount"
                      className={`amount-input ${error ? 'error' : ''}`}
                      placeholder="0"
                      value={amount}
                      onChange={handleAmountChange}
                      autoFocus
                    />
                  </div>
                  {error && <span className="error-message">{error}</span>}
                  {amount && !error && (
                    <div className="amount-preview">
                      {formatCurrency(amount)}
                    </div>
                  )}
                </div>

                {/* Información bancaria */}
                <div className="bank-info">
                  <h4>Datos para transferencia</h4>
                  <div className="bank-details">
                    <div className="bank-row">
                      <span className="bank-label">Banco:</span>
                      <span className="bank-value">Banco Nacional</span>
                    </div>
                    <div className="bank-row">
                      <span className="bank-label">Cuenta:</span>
                      <span className="bank-value">1234-5678-90</span>
                    </div>
                    <div className="bank-row">
                      <span className="bank-label">Titular:</span>
                      <span className="bank-value">EasyStore S.A.</span>
                    </div>
                    <div className="bank-row">
                      <span className="bank-label">RUC:</span>
                      <span className="bank-value">80012345-6</span>
                    </div>
                  </div>
                </div>

                {/* Nota importante */}
                <div className="info-box">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                    />
                  </svg>
                  <p>
                    Una vez enviada la solicitud, verificaremos tu transferencia. 
                    El proceso puede tomar hasta 24 horas hábiles.
                  </p>
                </div>

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
                    className="btn-primary"
                  >
                    Enviar Solicitud
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
              <h2>¡Solicitud Enviada!</h2>
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
                
                <h3>Solicitud recibida correctamente</h3>
                
                <div className="confirmation-details">
                  <div className="confirmation-row">
                    <span className="confirmation-label">Monto solicitado:</span>
                    <span className="confirmation-value">{formatCurrency(amount)}</span>
                  </div>
                  <div className="confirmation-row">
                    <span className="confirmation-label">Estado:</span>
                    <span className="status-badge pending">Pendiente de verificación</span>
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
                </div>

                <div className="info-box success">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" 
                    />
                  </svg>
                  <p>
                    Recibirás una notificación cuando tu solicitud sea verificada 
                    y el monto esté disponible en tu billetera.
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

export default DepositModal;