// CreateLogisticsUser.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminRegisterUser, getLogistics, createLogistics, assignUserToLogistics } from '../services/api';
import '../styles/adminpage.css';

const CreateLogisticsUser = () => {
  const navigate = useNavigate();

  const [logistics, setLogistics]     = useState([]);
  const [step, setStep]               = useState(1);
  const [submitting, setSubmitting]   = useState(false);
  const [error, setError]             = useState('');
  const [createdUser, setCreatedUser] = useState(null);

  const [form, setForm] = useState({
    nickname:        '',
    email:           '',
    password:        '',
    confirmPassword: '',
    logisticOption:  'existing',
    logisticId:      '',
    newLogisticName: '',
    apiType:         'manual',
    apiUrl:          '',
    apiKey:          '',
    apiUser:         '',
    apiPassword:     '',
    tenantId:        '',
  });

  useEffect(() => {
    getLogistics()
      .then(d => setLogistics(d || []))
      .catch(() => setLogistics([]));
  }, []);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const validate = () => {
    if (!form.nickname.trim())        return 'El nombre de usuario es requerido';
    if (!form.email.trim())           return 'El email es requerido';
    if (!form.password)               return 'La contraseña es requerida';
    if (form.password.length < 8)     return 'La contraseña debe tener al menos 8 caracteres';
    if (form.password !== form.confirmPassword) return 'Las contraseñas no coinciden';
    if (form.logisticOption === 'existing' && !form.logisticId)
      return 'Seleccioná una empresa logística';
    if (form.logisticOption === 'new' && !form.newLogisticName.trim())
      return 'Ingresá el nombre de la nueva empresa';
    if (form.logisticOption === 'new' && form.apiType === 'external_api') {
      if (!form.apiUrl.trim()) return 'La URL de la API es requerida';
      if (!form.apiKey.trim()) return 'El token de la API es requerido';
    }
    return null;
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) { setError(err); return; }

    setSubmitting(true);
    setError('');

    try {
      // 1. Crear usuario sin tocar el token del admin
      const user = await adminRegisterUser({
        email:     form.email,
        name:      form.nickname,
        password:  form.password,
        user_role: 'logistics',
      });

      // 2. Crear empresa nueva o usar existente
      let logisticId = form.logisticId;
      if (form.logisticOption === 'new') {
        const newLogistic = await createLogistics({
          name:         form.newLogisticName,
          status:       'active',
          api_type:     form.apiType,
          api_url:      form.apiType === 'external_api' ? form.apiUrl      : null,
          api_key:      form.apiType === 'external_api' ? form.apiKey      : null,
          api_user:     form.apiType === 'external_api' ? form.apiUser     : null,
          api_password: form.apiType === 'external_api' ? form.apiPassword : null,
          tenant_id:    form.apiType === 'external_api' ? form.tenantId    : null,
        });
        logisticId = newLogistic.logistic_id;
      }

      // 3. Vincular usuario a la empresa
      await assignUserToLogistics(parseInt(logisticId), user.user_id);

      setCreatedUser({ ...user, logisticId });
      setStep(2);
    } catch (e) {
      setError(e.message || 'Error al crear el usuario. Verificá los datos.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setForm({
      nickname: '', email: '', password: '', confirmPassword: '',
      logisticOption: 'existing', logisticId: '', newLogisticName: '',
      apiType: 'manual', apiUrl: '', apiKey: '',
    });
  };

  // ── Step 2: Success ───────────────────────────────
  if (step === 2) return (
    <div className="admin-page">
      <div style={{ maxWidth: '520px', margin: '0 auto' }}>
        <div style={{
          background: 'white', border: '1.5px solid #e5e7eb', borderRadius: '16px',
          padding: '32px', textAlign: 'center', display: 'flex', flexDirection: 'column',
          alignItems: 'center', gap: '16px',
        }}>
          <div style={{ fontSize: '48px' }}>🎉</div>
          <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#111827', margin: 0 }}>
            Usuario logístico creado
          </h2>
          <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
            El usuario <strong>{createdUser?.user_nickname || form.nickname}</strong> fue creado y vinculado a la empresa logística.
          </p>
          <div style={{ background: '#f9fafb', borderRadius: '10px', padding: '16px', width: '100%', textAlign: 'left' }}>
            <p style={{ fontSize: '13px', color: '#374151', margin: '0 0 6px 0' }}>
              <strong>Email:</strong> {form.email}
            </p>
            <p style={{ fontSize: '13px', color: '#374151', margin: '0 0 6px 0' }}>
              <strong>Empresa:</strong> {form.logisticOption === 'new'
                ? form.newLogisticName
                : logistics.find(l => l.logistic_id === parseInt(form.logisticId))?.name || '—'}
            </p>
            <p style={{ fontSize: '13px', color: '#374151', margin: 0 }}>
              <strong>Integración:</strong> {form.logisticOption === 'new' && form.apiType === 'external_api' ? 'API externa automática' : 'Panel manual'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
            <button className="admin-btn admin-btn-ghost" style={{ flex: 1 }} onClick={resetForm}>
              Crear otro
            </button>
            <button className="admin-btn admin-btn-primary" style={{ flex: 1 }} onClick={() => navigate('/admin')}>
              Volver al panel
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // ── Step 1: Form ──────────────────────────────────
  return (
    <div className="admin-page">
      <div className="admin-header">
        <div className="admin-header-left">
          <h1>Crear Usuario Logístico</h1>
          <p>Registrá un nuevo proveedor logístico y vinculalo a su empresa</p>
        </div>
        <div className="admin-header-actions">
          <button className="admin-btn admin-btn-ghost" onClick={() => navigate('/admin')}>
            ← Volver
          </button>
        </div>
      </div>

      <div style={{ maxWidth: '520px' }}>
        <div style={{
          background: 'white', border: '1.5px solid #e5e7eb', borderRadius: '16px',
          padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px',
        }}>

          {/* ── Datos del usuario ── */}
          <div>
            <p style={sectionLabel}>Datos del usuario</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Field label="Nombre de usuario *">
                <input className="of-input" placeholder="Ej: Transportes Ramírez"
                  value={form.nickname} onChange={e => handleChange('nickname', e.target.value)} />
              </Field>
              <Field label="Email *">
                <input className="of-input" type="email" placeholder="logistica@empresa.com"
                  value={form.email} onChange={e => handleChange('email', e.target.value)} />
              </Field>
              <Field label="Contraseña *">
                <input className="of-input" type="password" placeholder="Mínimo 8 caracteres"
                  value={form.password} onChange={e => handleChange('password', e.target.value)} />
              </Field>
              <Field label="Confirmar contraseña *">
                <input className="of-input" type="password" placeholder="Repetí la contraseña"
                  value={form.confirmPassword} onChange={e => handleChange('confirmPassword', e.target.value)} />
              </Field>
            </div>
          </div>

          {/* ── Empresa logística ── */}
          <div style={{ borderTop: '1.5px solid #f3f4f6', paddingTop: '20px' }}>
            <p style={sectionLabel}>Empresa logística</p>

            {/* Toggle existing / new */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
              {[
                { value: 'existing', label: 'Empresa existente' },
                { value: 'new',      label: 'Crear nueva empresa' },
              ].map(opt => (
                <button key={opt.value} onClick={() => handleChange('logisticOption', opt.value)}
                  style={{
                    flex: 1, padding: '8px', borderRadius: '8px', fontSize: '12px',
                    fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s',
                    background: form.logisticOption === opt.value ? '#056EB7' : 'white',
                    color:      form.logisticOption === opt.value ? 'white'   : '#6b7280',
                    border:     form.logisticOption === opt.value ? 'none'    : '1.5px solid #e5e7eb',
                  }}>
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Existing company */}
            {form.logisticOption === 'existing' && (
              <Field label="Seleccioná la empresa *">
                <select className="of-input" value={form.logisticId}
                  onChange={e => handleChange('logisticId', e.target.value)}
                  style={{ background: 'white' }}>
                  <option value="">— Seleccioná —</option>
                  {logistics.map(l => (
                    <option key={l.logistic_id} value={l.logistic_id}>
                      {l.name} {l.user_id ? '(ya tiene usuario)' : ''}
                    </option>
                  ))}
                </select>
              </Field>
            )}

            {/* New company */}
            {form.logisticOption === 'new' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <Field label="Nombre de la empresa *">
                  <input className="of-input" placeholder="Ej: Transportes del Sur"
                    value={form.newLogisticName}
                    onChange={e => handleChange('newLogisticName', e.target.value)} />
                </Field>

                <Field label="Tipo de integración">
                  <select className="of-input" value={form.apiType}
                    onChange={e => handleChange('apiType', e.target.value)}
                    style={{ background: 'white' }}>
                    <option value="manual">Manual — panel logístico</option>
                    <option value="external_api">API externa — automático</option>
                  </select>
                </Field>

                {form.apiType === 'external_api' && (
                  <>
                    <Field label="URL base de la API *">
                      <input className="of-input" placeholder="https://api.logistica.com"
                        value={form.apiUrl}
                        onChange={e => handleChange('apiUrl', e.target.value)} />
                    </Field>
                    <Field label="API Key / Token estático (opcional)">
                      <input className="of-input" type="password"
                        placeholder="Solo si no usa usuario/password"
                        value={form.apiKey}
                        onChange={e => handleChange('apiKey', e.target.value)} />
                    </Field>
                    <Field label="Usuario API (Futura/PaP)">
                      <input className="of-input"
                        placeholder="usuario@empresa.com.py"
                        value={form.apiUser}
                        onChange={e => handleChange('apiUser', e.target.value)} />
                    </Field>
                    <Field label="Password API">
                      <input className="of-input" type="password"
                        placeholder="Contraseña de la API"
                        value={form.apiPassword}
                        onChange={e => handleChange('apiPassword', e.target.value)} />
                    </Field>
                    <Field label="Tenant ID (Abp.TenantId)">
                      <input className="of-input"
                        placeholder="Ej: 2"
                        value={form.tenantId}
                        onChange={e => handleChange('tenantId', e.target.value)} />
                    </Field>
                    <div style={{
                      background: '#fffbeb', border: '1.5px solid #fde68a',
                      borderRadius: '8px', padding: '10px 12px',
                      fontSize: '12px', color: '#92400e',
                    }}>
                      ⚡ Modo automático — los paquetes se crearán en la API externa cuando el proveedor marque "Listo para retirar"
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {error && (
            <div style={{
              background: '#fef2f2', border: '1.5px solid #fecaca',
              borderRadius: '8px', padding: '10px 14px',
              fontSize: '13px', color: '#dc2626',
            }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="admin-btn admin-btn-ghost" style={{ flex: 0.5 }}
              onClick={() => navigate('/admin')} disabled={submitting}>
              Cancelar
            </button>
            <button className="admin-btn admin-btn-primary" style={{ flex: 1, padding: '12px' }}
              onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Creando...' : 'Crear usuario logístico'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

const sectionLabel = {
  fontSize: '13px', fontWeight: '700', color: '#374151',
  textTransform: 'uppercase', letterSpacing: '0.4px', margin: '0 0 14px 0',
};

const Field = ({ label, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
    <label style={{ fontSize: '11px', fontWeight: '700', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
      {label}
    </label>
    {children}
  </div>
);

export default CreateLogisticsUser;