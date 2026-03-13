// OrderForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUser } from '../App';
import { getLogistics, createOrder } from '../services/api';
import '../styles/orderform.css';

const COUNTRY_CODES = [
  { code: '+595', flag: '🇵🇾', name: 'Paraguay' },
  { code: '+57',  flag: '🇨🇴', name: 'Colombia' },
  { code: '+54',  flag: '🇦🇷', name: 'Argentina' },
  { code: '+52',  flag: '🇲🇽', name: 'México' },
  { code: '+51',  flag: '🇵🇪', name: 'Perú' },
  { code: '+56',  flag: '🇨🇱', name: 'Chile' },
  { code: '+58',  flag: '🇻🇪', name: 'Venezuela' },
  { code: '+593', flag: '🇪🇨', name: 'Ecuador' },
  { code: '+598', flag: '🇺🇾', name: 'Uruguay' },
  { code: '+591', flag: '🇧🇴', name: 'Bolivia' },
];

const PLATFORM_COMMISSION = 0.05;

const OrderForm = () => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { user }  = useUser();

  // ── Carrito heredado del CartSidebar ────────────────
  const { cart = [], providerName = '' } = location.state || {};

  const [logistics, setLogistics]         = useState([]);
  const [loadingLogistics, setLoadingLogistics] = useState(true);
  const [submitting, setSubmitting]       = useState(false);
  const [submitError, setSubmitError]     = useState('');

  const [form, setForm] = useState({
    firstName:           '',
    lastName:            '',
    countryCode:         '+595',
    phone:               '',
    city:                '',
    region:              '',
    address:             '',
    addressComplement:   '',
    email:               '',
    salePrice:           '',
    collectionType:      'con_recaudo',
    logisticsId:         null,
  });

  const [errors, setErrors] = useState({});

  // ── Cargar logísticas del backend ────────────────────
  useEffect(() => {
    getLogistics()
      .then(data => setLogistics(data || []))
      .catch(() => setLogistics([]))
      .finally(() => setLoadingLogistics(false));
  }, []);

  // ── Calculos ─────────────────────────────────────────
  const totalItems  = cart.reduce((sum, item) => sum + item.quantity, 0);
  const salePrice   = parseFloat(form.salePrice) || 0;
  const totalRecaudo = salePrice * totalItems;
  const commission  = totalRecaudo * PLATFORM_COMMISSION;

  // logistic_cost: por ahora 0 hasta que logistics tenga precio
  const logisticCost = 0;
  const earnings    = totalRecaudo - logisticCost - commission;

  const formatCurrency = (v) =>
    new Intl.NumberFormat('es-PY', { style: 'currency', currency: 'PYG', minimumFractionDigits: 0 }).format(v);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.firstName.trim())   e.firstName  = 'Requerido';
    if (!form.lastName.trim())    e.lastName   = 'Requerido';
    if (!form.phone.trim())       e.phone      = 'Requerido';
    if (!form.city.trim())        e.city       = 'Requerido';
    if (!form.region.trim())      e.region     = 'Requerido';
    if (!form.address.trim())     e.address    = 'Requerido';
    if (!form.email.trim())       e.email      = 'Requerido';
    if (!salePrice || salePrice <= 0) e.salePrice = 'Precio inválido';
    if (!form.logisticsId)        e.logisticsId = 'Seleccioná una transportadora';
    return e;
  };

  const handleSubmit = async () => {
    setSubmitError('');
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
    if (cart.length === 0) { setSubmitError('El carrito está vacío'); return; }

    // supplier_id: todos los items son del mismo proveedor (validado en carrito)
    const supplierId = cart[0].provider;

    const payload = {
      buyer_id:      user.user_id,
      supplier_id:   supplierId,
      logistic_id:   form.logisticsId,
      final_price:   totalRecaudo,
      logistic_cost: logisticCost,
      platform_fee:  commission,
      buyer_profit:  earnings,
      status:        'pending',
      collection_type:             form.collectionType,
      recipient_name:              `${form.firstName} ${form.lastName}`.trim(),
      recipient_phone:             `${form.countryCode}${form.phone}`,
      recipient_email:             form.email,
      recipient_city:              form.city,
      recipient_region:            form.region,
      recipient_address:           form.address,
      recipient_address_complement: form.addressComplement || null,
      items: cart.map(item => ({
        product_id:    item.id,
        quantity:      item.quantity,
        supplier_cost: item.price,
      })),
    };

    setSubmitting(true);
    try {
      await createOrder(payload);
      navigate('/catalogo', { replace: true });
    } catch (err) {
      if (err.message?.includes('Saldo insuficiente')) {
        setSubmitError('No tenés saldo suficiente para cubrir el costo de esta orden.');
      } else {
        setSubmitError(err.message || 'Ocurrió un error al crear la orden');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // ── Si llegó sin carrito, redirigir ─────────────────
  if (cart.length === 0) {
    return (
      <div className="of-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
          <p style={{ color: '#6b7280' }}>No hay productos en el carrito.</p>
          <button
            style={{ padding: '8px 20px', background: '#056EB7', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
            onClick={() => navigate('/catalogo')}
          >
            Volver al catálogo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="of-page">
      <div className="of-card">
        <div className="of-columns">

          {/* ══ COL 1 — Cliente ══ */}
          <div className="of-col">
            <div className="of-section-head">
              <span className="of-num">1</span>
              <div>
                <p className="of-col-title">Datos del Cliente</p>
                <p className="of-col-sub">Información de entrega</p>
              </div>
            </div>

            <div className="of-row2">
              <div className="of-field">
                <label className="of-label">Nombre <span className="of-req">*</span></label>
                <input className={`of-input ${errors.firstName ? 'err' : ''}`} placeholder="Carlos"
                  value={form.firstName} onChange={e => handleChange('firstName', e.target.value)} />
                {errors.firstName && <span className="of-err">{errors.firstName}</span>}
              </div>
              <div className="of-field">
                <label className="of-label">Apellido <span className="of-req">*</span></label>
                <input className={`of-input ${errors.lastName ? 'err' : ''}`} placeholder="Ramírez"
                  value={form.lastName} onChange={e => handleChange('lastName', e.target.value)} />
                {errors.lastName && <span className="of-err">{errors.lastName}</span>}
              </div>
            </div>

            <div className="of-field">
              <label className="of-label">Teléfono <span className="of-req">*</span></label>
              <div className={`of-phone ${errors.phone ? 'err' : ''}`}>
                <select className="of-phone-code" value={form.countryCode}
                  onChange={e => handleChange('countryCode', e.target.value)}>
                  {COUNTRY_CODES.map(c => (
                    <option key={c.code} value={c.code}>{c.code}</option>
                  ))}
                </select>
                <input className="of-phone-num" placeholder="0981 000 000"
                  value={form.phone}
                  onChange={e => handleChange('phone', e.target.value.replace(/\D/g, ''))}
                  maxLength={10} />
              </div>
              {errors.phone && <span className="of-err">{errors.phone}</span>}
            </div>

            <div className="of-row2">
              <div className="of-field">
                <label className="of-label">Ciudad <span className="of-req">*</span></label>
                <input className={`of-input ${errors.city ? 'err' : ''}`} placeholder="Asunción"
                  value={form.city} onChange={e => handleChange('city', e.target.value)} />
                {errors.city && <span className="of-err">{errors.city}</span>}
              </div>
              <div className="of-field">
                <label className="of-label">Dpto / Región <span className="of-req">*</span></label>
                <input className={`of-input ${errors.region ? 'err' : ''}`} placeholder="Central"
                  value={form.region} onChange={e => handleChange('region', e.target.value)} />
                {errors.region && <span className="of-err">{errors.region}</span>}
              </div>
            </div>

            <div className="of-row2">
              <div className="of-field">
                <label className="of-label">Dirección <span className="of-req">*</span></label>
                <input className={`of-input ${errors.address ? 'err' : ''}`} placeholder="Av. España 1234"
                  value={form.address} onChange={e => handleChange('address', e.target.value)} />
                {errors.address && <span className="of-err">{errors.address}</span>}
              </div>
              <div className="of-field">
                <label className="of-label">Complemento</label>
                <input className="of-input" placeholder="Apto, Torre..."
                  value={form.addressComplement}
                  onChange={e => handleChange('addressComplement', e.target.value)} />
              </div>
            </div>

            <div className="of-field">
              <label className="of-label">Correo Electrónico <span className="of-req">*</span></label>
              <input className={`of-input ${errors.email ? 'err' : ''}`} type="email"
                placeholder="cliente@email.com"
                value={form.email} onChange={e => handleChange('email', e.target.value)} />
              {errors.email && <span className="of-err">{errors.email}</span>}
            </div>

            {/* Productos del carrito */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {cart.map(item => (
                <div key={item.id} className="of-product-box">
                  {item.image && (
                    <img src={item.image} alt={item.name} className="of-product-img" />
                  )}
                  <div className="of-product-info">
                    <span className="of-product-name">{item.name}</span>
                    <span className="of-product-cost">x{item.quantity} — {formatCurrency(item.price)}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Precio de venta */}
            <div className="of-field">
              <label className="of-label">Precio de Venta por unidad <span className="of-req">*</span></label>
              <div className={`of-price-wrap ${errors.salePrice ? 'err' : ''}`}>
                <span className="of-price-sign">Gs.</span>
                <input className="of-price-input" type="number" placeholder="0" min="0"
                  value={form.salePrice} onChange={e => handleChange('salePrice', e.target.value)} />
              </div>
              {errors.salePrice && <span className="of-err">{errors.salePrice}</span>}
            </div>
          </div>

          <div className="of-divider" />

          {/* ══ COL 2 — Logística ══ */}
          <div className="of-col">
            <div className="of-section-head">
              <span className="of-num">2</span>
              <div>
                <p className="of-col-title">Servicio Logístico</p>
                <p className="of-col-sub">Tipo de envío y transportadora</p>
              </div>
            </div>

            <div className="of-field">
              <label className="of-label">Tipo de Servicio</label>
              <div className="of-toggle">
                <button
                  className={`of-toggle-btn ${form.collectionType === 'con_recaudo' ? 'active' : ''}`}
                  onClick={() => handleChange('collectionType', 'con_recaudo')}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" />
                  </svg>
                  Con Recaudo
                </button>
                <button
                  className={`of-toggle-btn ${form.collectionType === 'sin_recaudo' ? 'active' : ''}`}
                  onClick={() => handleChange('collectionType', 'sin_recaudo')}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                  Sin Recaudo
                </button>
              </div>
              <p className="of-hint">
                {form.collectionType === 'con_recaudo'
                  ? '✓ El cliente paga contra entrega.'
                  : '✓ Pago recibido, solo se despacha.'}
              </p>
            </div>

            <div className="of-field">
              <label className="of-label">Transportadora <span className="of-req">*</span></label>
              {errors.logisticsId && <span className="of-err">{errors.logisticsId}</span>}
              {loadingLogistics ? (
                <p style={{ fontSize: '13px', color: '#9ca3af' }}>Cargando transportadoras...</p>
              ) : (
                <div className="of-logistics">
                  {logistics.map(l => (
                    <button key={l.logistic_id}
                      className={`of-logistics-opt ${form.logisticsId === l.logistic_id ? 'active' : ''}`}
                      onClick={() => handleChange('logisticsId', l.logistic_id)}>
                      <div className="of-logistics-info">
                        <span className="of-logistics-name">{l.name}</span>
                      </div>
                      <div className={`of-check ${form.logisticsId === l.logistic_id ? 'active' : ''}`}>
                        {form.logisticsId === l.logistic_id && (
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5">
                            <path d="M20 6L9 17l-5-5" />
                          </svg>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="of-divider" />

          {/* ══ COL 3 — Resumen ══ */}
          <div className="of-col of-col-summary">
            <div className="of-section-head">
              <span className="of-num">3</span>
              <div>
                <p className="of-col-title">Resumen de Orden</p>
                <p className="of-col-sub">Detalle financiero</p>
              </div>
            </div>

            {/* Items del carrito */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {cart.map(item => (
                <div key={item.id} className="of-summary-product">
                  {item.image && <img src={item.image} alt={item.name} className="of-sum-img" />}
                  <div className="of-sum-product-info">
                    <span className="of-sum-name">{item.name}</span>
                    <span className="of-sum-qty">x{item.quantity} unidad{item.quantity > 1 ? 'es' : ''}</span>
                  </div>
                  <span className="of-sum-price">
                    {salePrice > 0 ? formatCurrency(item.price * item.quantity) : '—'}
                  </span>
                </div>
              ))}
            </div>

            <div className="of-breakdown">
              <div className="of-brow">
                <span className="of-blabel">Total a recaudar</span>
                <span className="of-bval green">{totalRecaudo > 0 ? formatCurrency(totalRecaudo) : '—'}</span>
              </div>
              <div className="of-brow">
                <span className="of-blabel">Comisión plataforma (5%)</span>
                <span className="of-bval red">{commission > 0 ? `- ${formatCurrency(commission)}` : '—'}</span>
              </div>
              <div className="of-bdivider" />
              <div className="of-brow of-brow-earnings">
                <span className="of-blabel-earn">Tus Ganancias</span>
                <span className={`of-earn-val ${totalRecaudo > 0 ? (earnings >= 0 ? 'green' : 'red') : ''}`}>
                  {totalRecaudo > 0 ? formatCurrency(earnings) : '—'}
                </span>
              </div>
            </div>

            {submitError && (
              <div style={{ background: '#fef2f2', border: '1.5px solid #fecaca', borderRadius: '8px', padding: '10px 12px', fontSize: '13px', color: '#dc2626' }}>
                {submitError}
              </div>
            )}

            <div className="of-actions">
              <button className="of-btn-cancel" onClick={() => navigate(-1)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
                Cancelar
              </button>
              <button className="of-btn-submit" onClick={handleSubmit} disabled={submitting}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" />
                </svg>
                {submitting ? 'Enviando...' : 'Enviar Orden'}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default OrderForm;