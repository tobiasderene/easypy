import React, { useState } from 'react';
import { CheckCircle, X, DollarSign } from 'lucide-react';
import { createBankMovement } from '../services/api';
import '../styles/depositmodal.css';

const DepositModal = ({ isOpen, onClose }) => {
  const [step, setStep]         = useState(1);
  const [amount, setAmount]     = useState('');
  const [reference, setReference] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleAmountChange = (e) => {
    const v = e.target.value;
    if (v === '' || /^\d+$/.test(v)) { setAmount(v); setError(''); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || amount === '0') return setError('Por favor ingresa un monto válido');
    if (parseInt(amount) < 10000) return setError('El monto mínimo es Gs. 10,000');
    if (!reference.trim()) return setError('Por favor ingresa el número de referencia de tu transferencia');

    setLoading(true);
    try {
      await createBankMovement({
        bank_movement_type: 'ingreso',
        amount: parseInt(amount),
        reference_number: reference.trim(),
        status: 'pending',
      });
      setStep(2);
    } catch (err) {
      setError(err.message || 'Ocurrió un error. Intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep(1); setAmount(''); setReference(''); setError('');
    onClose();
  };

  const formatCurrency = (value) => {
    if (!value) return 'Gs. 0';
    return new Intl.NumberFormat('es-PY', { style: 'currency', currency: 'PYG', minimumFractionDigits: 0 }).format(value);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>

        {/* Step 1 */}
        {step === 1 && (
          <>
            <div className="modal-header">
              <div className="modal-icon deposit"><DollarSign size={24} /></div>
              <h2>Solicitud de Ingreso</h2>
              <button className="modal-close" onClick={handleClose}><X size={20} /></button>
            </div>

            <div className="modal-body">
              <p className="modal-description">
                Realizá la transferencia a nuestra cuenta y completá el formulario
              </p>

              <form onSubmit={handleSubmit}>
                {/* Monto */}
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
                  {amount && !error && (
                    <div className="amount-preview">{formatCurrency(amount)}</div>
                  )}
                </div>

                {/* Referencia */}
                <div className="form-group">
                  <label htmlFor="reference">Número de referencia</label>
                  <div className="amount-input-wrapper">
                    <input
                      type="text"
                      id="reference"
                      className={`amount-input ${error ? 'error' : ''}`}
                      placeholder="Ej: TRF-20250310-001"
                      value={reference}
                      onChange={(e) => { setReference(e.target.value); setError(''); }}
                      style={{ paddingLeft: '16px' }}
                    />
                  </div>
                  {error && <span className="error-message">{error}</span>}
                </div>

                {/* Datos bancarios */}
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
                      <span className="bank-value">EasyPy S.A.</span>
                    </div>
                    <div className="bank-row">
                      <span className="bank-label">RUC:</span>
                      <span className="bank-value">80012345-6</span>
                    </div>
                  </div>
                </div>

                <div className="info-box">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p>Una vez enviada la solicitud, verificaremos tu transferencia. El proceso puede tomar hasta 24 horas hábiles.</p>
                </div>

                <div className="modal-actions">
                  <button type="button" className="btn-secondary" onClick={handleClose}>Cancelar</button>
                  <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? 'Enviando...' : 'Enviar Solicitud'}
                  </button>
                </div>
              </form>
            </div>
          </>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <>
            <div className="modal-header">
              <div className="modal-icon success"><CheckCircle size={24} /></div>
              <h2>¡Solicitud Enviada!</h2>
              <button className="modal-close" onClick={handleClose}><X size={20} /></button>
            </div>

            <div className="modal-body">
              <div className="success-content">
                <div className="success-icon-large"><CheckCircle size={64} /></div>
                <h3>Solicitud recibida correctamente</h3>

                <div className="confirmation-details">
                  <div className="confirmation-row">
                    <span className="confirmation-label">Monto:</span>
                    <span className="confirmation-value">{formatCurrency(amount)}</span>
                  </div>
                  <div className="confirmation-row">
                    <span className="confirmation-label">Referencia:</span>
                    <span className="confirmation-value">{reference}</span>
                  </div>
                  <div className="confirmation-row">
                    <span className="confirmation-label">Estado:</span>
                    <span className="status-badge pending">Pendiente de verificación</span>
                  </div>
                  <div className="confirmation-row">
                    <span className="confirmation-label">Fecha:</span>
                    <span className="confirmation-value">
                      {new Date().toLocaleDateString('es-PY', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                <div className="info-box success">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p>Recibirás una notificación cuando tu solicitud sea verificada y el monto esté disponible.</p>
                </div>

                <button className="btn-primary full-width" onClick={handleClose}>Entendido</button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DepositModal;