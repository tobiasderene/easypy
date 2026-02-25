// OrderForm.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/orderform.css';

const COUNTRY_CODES = [
  { code: '+57', flag: '🇨🇴', name: 'Colombia' },
  { code: '+54', flag: '🇦🇷', name: 'Argentina' },
  { code: '+52', flag: '🇲🇽', name: 'México' },
  { code: '+51', flag: '🇵🇪', name: 'Perú' },
  { code: '+56', flag: '🇨🇱', name: 'Chile' },
  { code: '+58', flag: '🇻🇪', name: 'Venezuela' },
  { code: '+593', flag: '🇪🇨', name: 'Ecuador' },
  { code: '+595', flag: '🇵🇾', name: 'Paraguay' },
  { code: '+598', flag: '🇺🇾', name: 'Uruguay' },
  { code: '+591', flag: '🇧🇴', name: 'Bolivia' },
];

const LOGISTICS_PROVIDERS = [
  { id: 'servientrega', name: 'Servientrega', time: '2-3 días' },
  { id: 'coordinadora', name: 'Coordinadora', time: '1-2 días' },
  { id: 'interrapidisimo', name: 'Interrapidísimo', time: '2-4 días' },
  { id: 'envia', name: 'Envía', time: '3-5 días' },
  { id: 'tcc', name: 'TCC', time: '2-3 días' },
];

const SHIPPING_COST = 8500;
const PLATFORM_COMMISSION = 0.05;

const OrderForm = () => {
  const navigate = useNavigate();

  const product = {
    id: 'PRD-00142',
    name: 'Smart Watch Serie 8 - Pantalla AMOLED 1.96"',
    unitCost: 45.99,
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&q=80',
  };

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    countryCode: '+57',
    phone: '',
    city: '',
    region: '',
    address: '',
    addressComplement: '',
    email: '',
    salePrice: '',
    quantity: 1,
    collectionType: 'con_recaudo',
    logisticsProvider: '',
  });

  const [errors, setErrors] = useState({});

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const salePrice   = parseFloat(form.salePrice) || 0;
  const quantity    = parseInt(form.quantity) || 1;
  const totalRecaudo = salePrice * quantity;
  const commission  = totalRecaudo * PLATFORM_COMMISSION;
  const earnings    = totalRecaudo - SHIPPING_COST - commission;

  const validate = () => {
    const e = {};
    if (!form.firstName.trim())            e.firstName = 'Requerido';
    if (!form.lastName.trim())             e.lastName  = 'Requerido';
    if (!form.phone.trim())                e.phone     = 'Requerido';
    if (!form.city.trim())                 e.city      = 'Requerido';
    if (!form.region.trim())               e.region    = 'Requerido';
    if (!form.address.trim())              e.address   = 'Requerido';
    if (!form.email.trim())                e.email     = 'Requerido';
    if (!form.salePrice || salePrice <= 0) e.salePrice = 'Precio inválido';
    if (!form.logisticsProvider)           e.logisticsProvider = 'Selecciona una transportadora';
    return e;
  };

  const handleSubmit = () => {
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
    alert('¡Orden enviada exitosamente!');
  };

  const fmt = (v) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v);

  return (
    <div className="of-page">

      {/* ── Single Container ── */}
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

            {/* Nombre + Apellido */}
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

            {/* Teléfono */}
            <div className="of-field">
              <label className="of-label">Teléfono <span className="of-req">*</span></label>
              <div className={`of-phone ${errors.phone ? 'err' : ''}`}>
                <select className="of-phone-code" value={form.countryCode}
                  onChange={e => handleChange('countryCode', e.target.value)}>
                  {COUNTRY_CODES.map(c => (
                    <option key={c.code} value={c.code}>{c.code}</option>
                  ))}
                </select>
                <input className="of-phone-num" placeholder="300 000 0000"
                  value={form.phone}
                  onChange={e => handleChange('phone', e.target.value.replace(/\D/g, ''))}
                  maxLength={10} />
              </div>
              {errors.phone && <span className="of-err">{errors.phone}</span>}
            </div>

            {/* Ciudad + Region */}
            <div className="of-row2">
              <div className="of-field">
                <label className="of-label">Ciudad <span className="of-req">*</span></label>
                <input className={`of-input ${errors.city ? 'err' : ''}`} placeholder="Bogotá"
                  value={form.city} onChange={e => handleChange('city', e.target.value)} />
                {errors.city && <span className="of-err">{errors.city}</span>}
              </div>
              <div className="of-field">
                <label className="of-label">Dpto / Región <span className="of-req">*</span></label>
                <input className={`of-input ${errors.region ? 'err' : ''}`} placeholder="Cundinamarca"
                  value={form.region} onChange={e => handleChange('region', e.target.value)} />
                {errors.region && <span className="of-err">{errors.region}</span>}
              </div>
            </div>

            {/* Dirección + Complemento */}
            <div className="of-row2">
              <div className="of-field">
                <label className="of-label">Dirección <span className="of-req">*</span></label>
                <input className={`of-input ${errors.address ? 'err' : ''}`} placeholder="Cra 15 # 85-32"
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

            {/* Email */}
            <div className="of-field">
              <label className="of-label">Correo Electrónico <span className="of-req">*</span></label>
              <input className={`of-input ${errors.email ? 'err' : ''}`} type="email"
                placeholder="cliente@email.com"
                value={form.email} onChange={e => handleChange('email', e.target.value)} />
              {errors.email && <span className="of-err">{errors.email}</span>}
            </div>

            {/* Producto info */}
            <div className="of-product-box">
              <img src={product.image} alt={product.name} className="of-product-img" />
              <div className="of-product-info">
                <span className="of-product-id">{product.id}</span>
                <span className="of-product-name">{product.name}</span>
                <span className="of-product-cost">Costo: {fmt(product.unitCost * 3800)}</span>
              </div>
            </div>

            {/* Precio + Cantidad */}
            <div className="of-row2">
              <div className="of-field">
                <label className="of-label">Precio de Venta <span className="of-req">*</span></label>
                <div className={`of-price-wrap ${errors.salePrice ? 'err' : ''}`}>
                  <span className="of-price-sign">$</span>
                  <input className="of-price-input" type="number" placeholder="0" min="0"
                    value={form.salePrice} onChange={e => handleChange('salePrice', e.target.value)} />
                </div>
                {errors.salePrice && <span className="of-err">{errors.salePrice}</span>}
              </div>
              <div className="of-field">
                <label className="of-label">Cantidad</label>
                <div className="of-qty">
                  <button className="of-qty-btn"
                    onClick={() => handleChange('quantity', Math.max(1, form.quantity - 1))}
                    disabled={form.quantity <= 1}>−</button>
                  <span className="of-qty-val">{form.quantity}</span>
                  <button className="of-qty-btn"
                    onClick={() => handleChange('quantity', form.quantity + 1)}>+</button>
                </div>
              </div>
            </div>
          </div>

          {/* ── Divider ── */}
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

            {/* Toggle recaudo */}
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

            {/* Transportadoras */}
            <div className="of-field">
              <label className="of-label">Transportadora <span className="of-req">*</span></label>
              {errors.logisticsProvider && <span className="of-err">{errors.logisticsProvider}</span>}
              <div className="of-logistics">
                {LOGISTICS_PROVIDERS.map(p => (
                  <button key={p.id}
                    className={`of-logistics-opt ${form.logisticsProvider === p.id ? 'active' : ''}`}
                    onClick={() => handleChange('logisticsProvider', p.id)}>
                    <div className="of-logistics-info">
                      <span className="of-logistics-name">{p.name}</span>
                      <span className="of-logistics-time">⏱ {p.time}</span>
                    </div>
                    <div className={`of-check ${form.logisticsProvider === p.id ? 'active' : ''}`}>
                      {form.logisticsProvider === p.id && (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5">
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── Divider ── */}
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

            {/* Producto */}
            <div className="of-summary-product">
              <img src={product.image} alt={product.name} className="of-sum-img" />
              <div className="of-sum-product-info">
                <span className="of-sum-name">{product.name}</span>
                <span className="of-sum-qty">x{form.quantity} unidad{form.quantity > 1 ? 'es' : ''}</span>
              </div>
              <span className="of-sum-price">
                {salePrice > 0 ? fmt(salePrice * form.quantity) : '—'}
              </span>
            </div>

            {/* Breakdown */}
            <div className="of-breakdown">
              <div className="of-brow">
                <span className="of-blabel">Total a recaudar</span>
                <span className="of-bval green">{totalRecaudo > 0 ? fmt(totalRecaudo) : '—'}</span>
              </div>
              <div className="of-brow">
                <span className="of-blabel">Precio de envío</span>
                <span className="of-bval red">
                  {form.logisticsProvider ? `- ${fmt(SHIPPING_COST)}` : '—'}
                </span>
              </div>
              <div className="of-brow">
                <span className="of-blabel">Comisión plataforma (5%)</span>
                <span className="of-bval red">{commission > 0 ? `- ${fmt(commission)}` : '—'}</span>
              </div>
              <div className="of-bdivider" />
              <div className="of-brow of-brow-earnings">
                <span className="of-blabel-earn">Tus Ganancias</span>
                <span className={`of-earn-val ${totalRecaudo > 0 && form.logisticsProvider ? (earnings >= 0 ? 'green' : 'red') : ''}`}>
                  {totalRecaudo > 0 && form.logisticsProvider ? fmt(earnings) : '—'}
                </span>
              </div>
            </div>


            {/* Buttons */}
            <div className="of-actions">
              <button className="of-btn-cancel" onClick={() => navigate(-1)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
                Cancelar
              </button>
              <button className="of-btn-submit" onClick={handleSubmit}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" />
                </svg>
                Enviar Orden
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default OrderForm;