import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, CreditCard, Plus, Trash2, Star } from 'lucide-react';
import { createWithdrawal, getBankAccounts, createBankAccount, setDefaultAccount, deleteBankAccount } from '../services/api';
import '../styles/withdrawmodal.css';

const WithdrawModal = ({ isOpen, onClose, walletId, availableBalance = 0 }) => {
  const [step, setStep]               = useState(1);
  const [amount, setAmount]           = useState('');
  const [accounts, setAccounts]       = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newAccount, setNewAccount]   = useState({ bank_name: '', holder_name: '', cedula: '', account_number: '', is_default: false });
  const [savingAccount, setSavingAccount] = useState(false);
  const [error, setError]             = useState('');
  const [loading, setLoading]         = useState(false);

  const formatCurrency = (v) =>
    new Intl.NumberFormat('es-PY', { style: 'currency', currency: 'PYG', minimumFractionDigits: 0 }).format(v || 0);

  useEffect(() => {
    if (isOpen) {
      loadAccounts();
    }
  }, [isOpen]);

  const loadAccounts = async () => {
    try {
      const data = await getBankAccounts();
      setAccounts(data || []);
      const def = (data || []).find(a => a.is_default);
      if (def) setSelectedAccount(def.account_id);
      else if (data?.length > 0) setSelectedAccount(data[0].account_id);
      else setShowNewForm(true);
    } catch {}
  };

  const handleAmountChange = (e) => {
    const v = e.target.value;
    if (v === '' || /^\d+$/.test(v)) { setAmount(v); setError(''); }
  };

  const handleSaveAccount = async () => {
    if (!newAccount.bank_name.trim())      return setError('Ingresá la entidad bancaria');
    if (!newAccount.holder_name.trim())    return setError('Ingresá el nombre del titular');
    if (!newAccount.cedula.trim())         return setError('Ingresá el número de cédula');
    if (!newAccount.account_number.trim()) return setError('Ingresá el número de cuenta');

    setSavingAccount(true);
    try {
      const created = await createBankAccount(newAccount);
      setAccounts(prev => [...prev, created]);
      setSelectedAccount(created.account_id);
      setShowNewForm(false);
      setNewAccount({ bank_name: '', holder_name: '', cedula: '', account_number: '', is_default: false });
      setError('');
    } catch (err) {
      setError(err.message || 'Error al guardar la cuenta');
    } finally {
      setSavingAccount(false);
    }
  };

  const handleSetDefault = async (accountId, e) => {
    e.stopPropagation();
    try {
      await setDefaultAccount(accountId);
      setAccounts(prev => prev.map(a => ({ ...a, is_default: a.account_id === accountId })));
    } catch {}
  };

  const handleDeleteAccount = async (accountId, e) => {
    e.stopPropagation();
    if (!window.confirm('¿Eliminar esta cuenta?')) return;
    try {
      await deleteBankAccount(accountId);
      const updated = accounts.filter(a => a.account_id !== accountId);
      setAccounts(updated);
      if (selectedAccount === accountId) {
        setSelectedAccount(updated[0]?.account_id || null);
        if (updated.length === 0) setShowNewForm(true);
      }
    } catch {}
  };

  const handleSubmit = async () => {
    if (!amount || amount === '0')          return setError('Ingresá un monto válido');
    if (parseInt(amount) < 50000)           return setError('El monto mínimo de retiro es Gs. 50,000');
    if (parseInt(amount) > availableBalance) return setError('El monto excede tu saldo disponible');
    if (!selectedAccount)                   return setError('Seleccioná una cuenta bancaria');

    const account = accounts.find(a => a.account_id === selectedAccount);
    if (!account) return setError('Cuenta no encontrada');

    const bankInfo = `Titular: ${account.holder_name} | CI: ${account.cedula} | Cuenta: ${account.account_number}`;

    setLoading(true);
    try {
      await createWithdrawal({
        wallet_id:            walletId,
        amount:               parseInt(amount),
        status:               'pending',
        bank_name:            account.bank_name,
        bank_account_address: bankInfo,
      });
      setStep(2);
    } catch (err) {
      setError(err.message || 'Ocurrió un error. Intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep(1); setAmount(''); setError(''); setShowNewForm(false);
    onClose();
  };

  if (!isOpen) return null;

  const selectedAccountData = accounts.find(a => a.account_id === selectedAccount);

  return (
    <div className="wm-overlay" onClick={(e) => e.target === e.currentTarget && handleClose()}>
      <div className="wm-modal">

        <div className="wm-header">
          <div>
            <h2 className="wm-title">{step === 1 ? 'Retirar Dinero' : 'Solicitud enviada'}</h2>
            <p className="wm-subtitle">{step === 1 ? 'Completá los datos para solicitar el retiro' : 'Tu solicitud fue procesada correctamente'}</p>
          </div>
        </div>

        {step === 1 && (<>
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
              <input className="wm-amount-input" type="text" placeholder="0" value={amount} onChange={handleAmountChange} autoFocus />
            </div>
            {amount && !error && parseFloat(amount) > 0 && (
              <span className="wm-amount-preview">{formatCurrency(parseInt(amount))}</span>
            )}
          </div>

          <div className="wm-quick">
            <span className="wm-quick-label">Montos rápidos</span>
            <div className="wm-quick-btns">
              {['100000', '500000', '1000000'].map((v) => (
                <button key={v} className="wm-quick-btn" onClick={() => { setAmount(v); setError(''); }}>
                  {v === '100000' ? '100K' : v === '500000' ? '500K' : '1M'}
                </button>
              ))}
              <button className="wm-quick-btn" onClick={() => { setAmount(Math.floor(availableBalance).toString()); setError(''); }}>Todo</button>
            </div>
          </div>

          {/* Cuentas guardadas */}
          <div className="wm-field">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label className="wm-label" style={{ margin: 0 }}>Cuenta bancaria <span className="wm-req">*</span></label>
              {accounts.length > 0 && (
                <button onClick={() => setShowNewForm(!showNewForm)}
                  style={{ fontSize: '12px', color: '#056EB7', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Plus size={13} /> Nueva cuenta
                </button>
              )}
            </div>

            {/* Lista de cuentas */}
            {accounts.map(account => (
              <div key={account.account_id}
                onClick={() => setSelectedAccount(account.account_id)}
                style={{
                  border: `1.5px solid ${selectedAccount === account.account_id ? '#056EB7' : '#e5e7eb'}`,
                  borderRadius: '8px', padding: '10px 12px', marginBottom: '6px', cursor: 'pointer',
                  background: selectedAccount === account.account_id ? '#eff6ff' : 'white',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#111827' }}>
                    {account.bank_name}
                    {account.is_default && <span style={{ marginLeft: '6px', fontSize: '10px', color: '#056EB7', fontWeight: '600' }}>★ Principal</span>}
                  </div>
                  <div style={{ fontSize: '11px', color: '#6b7280' }}>{account.holder_name} · CI {account.cedula}</div>
                  <div style={{ fontSize: '11px', color: '#6b7280' }}>{account.account_number}</div>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {!account.is_default && (
                    <button onClick={(e) => handleSetDefault(account.account_id, e)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: '2px' }}
                      title="Marcar como principal">
                      <Star size={14} />
                    </button>
                  )}
                  <button onClick={(e) => handleDeleteAccount(account.account_id, e)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '2px' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}

            {/* Formulario nueva cuenta */}
            {showNewForm && (
              <div style={{ border: '1.5px solid #e5e7eb', borderRadius: '8px', padding: '12px', background: '#f9fafb', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <p style={{ fontSize: '12px', fontWeight: '700', color: '#374151', margin: 0 }}>Nueva cuenta bancaria</p>
                {[
                  { key: 'bank_name',      label: 'Entidad bancaria',       placeholder: 'Ej: Itaú, Bancop...' },
                  { key: 'holder_name',    label: 'Nombre y apellido',       placeholder: 'Titular de la cuenta' },
                  { key: 'cedula',         label: 'Cédula',                  placeholder: '4567890', type: 'number' },
                  { key: 'account_number', label: 'Número de cuenta',        placeholder: 'Sin formato' },
                ].map(field => (
                  <div key={field.key}>
                    <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '3px' }}>{field.label}</label>
                    <input
                      className="wm-input"
                      type={field.type || 'text'}
                      placeholder={field.placeholder}
                      value={newAccount[field.key]}
                      onChange={e => setNewAccount(prev => ({ ...prev, [field.key]: e.target.value }))}
                      style={{ width: '100%' }}
                    />
                  </div>
                ))}
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#6b7280', cursor: 'pointer' }}>
                  <input type="checkbox" checked={newAccount.is_default}
                    onChange={e => setNewAccount(prev => ({ ...prev, is_default: e.target.checked }))}
                    style={{ accentColor: '#056EB7' }} />
                  Marcar como cuenta principal
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => { setShowNewForm(false); setError(''); }}
                    style={{ flex: 1, padding: '8px', border: '1.5px solid #e5e7eb', borderRadius: '7px', background: 'white', fontSize: '12px', cursor: 'pointer' }}>
                    Cancelar
                  </button>
                  <button onClick={handleSaveAccount} disabled={savingAccount}
                    style={{ flex: 2, padding: '8px', border: 'none', borderRadius: '7px', background: '#056EB7', color: 'white', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
                    {savingAccount ? 'Guardando...' : 'Guardar cuenta'}
                  </button>
                </div>
              </div>
            )}
          </div>

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

        {step === 2 && (
          <div className="wm-success">
            <div className="wm-success-icon"><CheckCircle size={36} /></div>
            <p className="wm-success-title">Solicitud enviada</p>
            <div className="wm-success-details">
              {[
                ['Monto solicitado', formatCurrency(parseInt(amount))],
                ['Entidad bancaria', selectedAccountData?.bank_name],
                ['Titular',         selectedAccountData?.holder_name],
                ['Cédula',          selectedAccountData?.cedula],
                ['Cuenta destino',  selectedAccountData?.account_number],
                ['Tiempo estimado', '1-3 días hábiles'],
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
              <span>El dinero será transferido a tu cuenta cuando el retiro sea aprobado.</span>
            </div>
            <button className="wm-btn-full" onClick={handleClose}>Entendido</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default WithdrawModal;
