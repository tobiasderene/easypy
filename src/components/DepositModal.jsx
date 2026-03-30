// DepositModal.jsx
import React, { useState, useRef } from 'react';
import { createDeposit } from '../services/api';
import '../styles/deposit.css';

const DepositModal = ({ walletId, onClose, onSuccess }) => {
  const [amount, setAmount]         = useState('');
  const [file, setFile]             = useState(null);
  const [preview, setPreview]       = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState('');
  const fileInputRef                = useRef(null);

  const formatCurrency = (v) =>
    new Intl.NumberFormat('es-PY', { style: 'currency', currency: 'PYG', minimumFractionDigits: 0 }).format(v);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;
    if (!['image/jpeg', 'image/png'].includes(selected.type)) {
      setError('Solo se aceptan imágenes JPG o PNG'); return;
    }
    if (selected.size > 10 * 1024 * 1024) {
      setError('El archivo no puede superar 10 MB'); return;
    }
    setError('');
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove('dragging');
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFileChange({ target: { files: [dropped] } });
  };

  const handleSubmit = async () => {
    setError('');
    if (!amount || parseFloat(amount) <= 0) { setError('Ingresá un monto válido'); return; }
    if (!file) { setError('Adjuntá el comprobante de pago'); return; }
    setSubmitting(true);
    try {
      await createDeposit(walletId, parseFloat(amount), file);
      onSuccess?.();
      onClose();
    } catch (e) {
      setError(e.message || 'Error al enviar el depósito');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="dm-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="dm-modal">

        <div className="dm-header">
          <div>
            <h2 className="dm-title">Solicitar Depósito</h2>
            <p className="dm-subtitle">Adjuntá el comprobante de transferencia</p>
          </div>
          <button className="dm-close" onClick={onClose}>
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Monto */}
        <div className="dm-field">
          <label className="dm-label">Monto a depositar <span className="dm-req">*</span></label>
          <div className="dm-amount-wrap">
            <span className="dm-currency">Gs.</span>
            <input
              className="dm-amount-input"
              type="number"
              placeholder="0"
              min="0"
              value={amount}
              onChange={e => setAmount(e.target.value)}
            />
          </div>
          {amount && parseFloat(amount) > 0 && (
            <span className="dm-amount-preview">{formatCurrency(parseFloat(amount))}</span>
          )}
        </div>

        {/* Upload */}
        <div className="dm-field">
          <label className="dm-label">Comprobante de pago <span className="dm-req">*</span></label>
          {!preview ? (
            <div
              className="dm-dropzone"
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={e => e.preventDefault()}
              onDragEnter={e => e.currentTarget.classList.add('dragging')}
              onDragLeave={e => e.currentTarget.classList.remove('dragging')}
            >
              <svg width="32" height="32" fill="none" stroke="#9ca3af" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="dm-dropzone-text">Arrastrá la imagen o hacé click para seleccionar</p>
              <p className="dm-dropzone-hint">JPG, PNG — máx. 10 MB</p>
            </div>
          ) : (
            <div className="dm-preview">
              <img src={preview} alt="Comprobante" className="dm-preview-img" />
              <button className="dm-preview-remove" onClick={() => { setFile(null); setPreview(null); }}>
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Cambiar imagen
              </button>
            </div>
          )}
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png" style={{ display: 'none' }} onChange={handleFileChange} />
        </div>

        {/* Info */}
        <div className="dm-info">
          <svg width="14" height="14" fill="none" stroke="#2563eb" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>El equipo de EasyPy revisará el comprobante y acreditará el saldo en tu wallet.</span>
        </div>

        {error && <div className="dm-error">{error}</div>}

        <div className="dm-actions">
          <button className="dm-btn-cancel" onClick={onClose} disabled={submitting}>Cancelar</button>
          <button className="dm-btn-submit" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Enviando...' : 'Enviar solicitud'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default DepositModal;