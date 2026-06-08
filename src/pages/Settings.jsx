import React, { useState, useRef, useEffect } from 'react';
import { useUser } from '../App';
import { updateUser, uploadProfileImage, getCities } from '../services/api';
import '../styles/settings.css';

const Settings = () => {
  const { user, setUser } = useUser();
  const isProvider = user?.user_role === 'provider';

  const [form, setForm] = useState({
    user_nickname:    user?.user_nickname    || '',
    email:            user?.email            || '',
    user_description: user?.user_description || '',
    phone:            user?.phone            || '',
    city:             user?.city             || '',
    region:           user?.region           || '',
    address:          user?.address          || '',
    address_height:   user?.address_height   || '',
    doc_type:         user?.doc_type         || '',
    doc_number:       user?.doc_number       || '',
    contact_name:     user?.contact_name     || '',
    razon_social:     user?.razon_social     || '',
  });

  const [cities, setCities]           = useState([]);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile]   = useState(null);
  const [saving, setSaving]           = useState(false);
  const [fieldErrors, setFieldErrors]  = useState({});
  const [success, setSuccess]         = useState(false);
  const [error, setError]             = useState('');
  const fileInputRef                  = useRef(null);

  // Sincronizar form cuando user cambia (llega después del mount)
  useEffect(() => {
    if (!user) return;
    setForm({
      user_nickname:    user.user_nickname    || '',
      email:            user.email            || '',
      user_description: user.user_description || '',
      phone:            user.phone            || '',
      city:             user.city             || '',
      region:           user.region           || '',
      address:          user.address          || '',
      address_height:   user.address_height   || '',
      doc_type:         user.doc_type         || '',
      doc_number:       user.doc_number       || '',
      contact_name:     user.contact_name     || '',
      razon_social:     user.razon_social     || '',
    });
  }, [user?.user_id]);

  useEffect(() => {
    getCities().then(d => setCities(d || [])).catch(() => {});
  }, []);

  const getInitials = (name) =>
    (name || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) setFieldErrors(prev => ({ ...prev, [name]: '' }));
    setSuccess(false);
    setError('');
  };

  const handleCityChange = (e) => {
    const val = e.target.value;
    const loc = cities.find(c => c.name === val);
    setForm(prev => ({
      ...prev,
      city:   val,
      region: loc?.department || prev.region,
    }));
    setSuccess(false);
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const validateForm = () => {
    const errs = {};
    if (!form.user_nickname?.trim()) errs.user_nickname = 'Requerido';
    if (isProvider) {
      if (!form.phone?.trim())          errs.phone          = 'Requerido';
      if (!form.city?.trim())           errs.city           = 'Requerido';
      if (!form.region?.trim())         errs.region         = 'Requerido';
      if (!form.address?.trim())        errs.address        = 'Requerido';
      if (!form.address_height?.trim()) errs.address_height = 'Requerido';
      if (!form.doc_type?.trim())       errs.doc_type       = 'Requerido';
      if (!form.doc_number?.trim())     errs.doc_number     = 'Requerido';
      if (!form.contact_name?.trim())   errs.contact_name   = 'Requerido';
      if (!form.razon_social?.trim())   errs.razon_social   = 'Requerido';
    }
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validateForm();
    if (Object.keys(errs).length > 0) { setFieldErrors(errs); return; }
    setFieldErrors({});
    setSaving(true);
    setError('');
    setSuccess(false);
    try {
      if (avatarFile) await uploadProfileImage(avatarFile);

      const payload = {
        user_nickname:    form.user_nickname    || undefined,
        email:            form.email            || undefined,
        user_description: form.user_description || undefined,
        phone:            form.phone            || undefined,
        city:             form.city             || undefined,
        region:           form.region           || undefined,
        address:          form.address          || undefined,
        address_height:   form.address_height   || undefined,
        doc_type:         form.doc_type         || undefined,
        doc_number:       form.doc_number       || undefined,
        ...(isProvider && {
          contact_name:  form.contact_name  || undefined,
          razon_social:  form.razon_social  || undefined,
        }),
      };

      const updated = await updateUser(user.user_id, payload);
      setUser(updated);
      setSuccess(true);
      setAvatarFile(null);
    } catch (err) {
      setError(err.message || 'Ocurrió un error al guardar los cambios');
    } finally {
      setSaving(false);
    }
  };

  const req = isProvider ? ' *' : '';



  return (
    <div className="settings-page">
      <div className="settings-container">

        <div className="settings-header">
          <h1>Configuración</h1>
          <p>Gestioná tu perfil y preferencias</p>
        </div>

        <form onSubmit={handleSubmit} className="settings-body">

          {/* Avatar */}
          <div className="settings-card">
            <h2 className="settings-section-title">Foto de perfil</h2>
            <div className="avatar-section">
              <div className="avatar-preview" onClick={() => fileInputRef.current?.click()}>
                {avatarPreview ? <img src={avatarPreview} alt="Preview" />
                  : user?.avatarUrl ? <img src={user.avatarUrl} alt="Perfil" />
                  : <span className="avatar-initials">{getInitials(user?.user_nickname)}</span>}
                <div className="avatar-overlay">
                  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
              </div>
              <div className="avatar-info">
                <button type="button" className="btn-upload-avatar" onClick={() => fileInputRef.current?.click()}>
                  Cambiar foto
                </button>
                <p>JPG, PNG o WEBP. Máximo 5MB.</p>
              </div>
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp"
                onChange={handleAvatarChange} style={{ display: 'none' }} />
            </div>
          </div>

          {/* Datos personales */}
          <div className="settings-card">
            <h2 className="settings-section-title">Datos personales</h2>
            <div className="settings-form-grid">
              <div className="settings-field">
                <label htmlFor="user_nickname">Nombre de usuario</label>
                <input type="text" id="user_nickname" name="user_nickname"
                  value={form['user_nickname']} onChange={handleChange}
                  placeholder="Tu nombre" />
              </div>
              <div className="settings-field">
                <label htmlFor="email">Correo electrónico</label>
                <input type="email" id="email" name="email"
                  value={form['email']} onChange={handleChange}
                  placeholder="tu@email.com" />
              </div>
              <div className="settings-field">
                <label htmlFor="phone"></label>
                <input type="text" id="phone" name="phone"
                  value={form['phone']} onChange={handleChange}
                  placeholder="+595981000000" />
              </div>

              <div className="settings-field settings-field--full">
                <label htmlFor="user_description">Descripción</label>
                <textarea id="user_description" name="user_description"
                  value={form.user_description} onChange={handleChange}
                  placeholder="Contá algo sobre vos..." rows={3} />
              </div>
            </div>
          </div>

          {/* Documento */}
          <div className="settings-card">
            <h2 className="settings-section-title">Documento</h2>
            <div className="settings-form-grid">
              <div className="settings-field">
                <label>Tipo de documento{req}</label>
                <select name="doc_type" value={form.doc_type} onChange={handleChange}
                  style={{ width: '100%', padding: '9px 12px', border: `1.5px solid ${fieldErrors.doc_type ? '#dc2626' : '#e5e7eb'}`, borderRadius: '8px', fontSize: '13px', background: 'white' }}>
                  <option value="">Sin documento</option>
                  <option value="cedula">Cédula</option>
                  <option value="ruc">RUC</option>
                  <option value="pasaporte">Pasaporte</option>
                </select>
                {fieldErrors.doc_type && <span style={{fontSize:'11px',color:'#dc2626'}}>{fieldErrors.doc_type}</span>}
              </div>
              <div className="settings-field">
                <label htmlFor="doc_number">Número de documento{req}</label>
                <input type="text" id="doc_number" name="doc_number"
                  value={form['doc_number']} onChange={handleChange}
                  placeholder="12345678" />
              </div>
            </div>
          </div>

          {/* Ubicación */}
          <div className="settings-card">
            <h2 className="settings-section-title">Ubicación</h2>
            <div className="settings-form-grid">
              <div className="settings-field">
                <label>Ciudad</label>
                <select name="city" value={form.city} onChange={handleCityChange}
                  style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', background: 'white' }}>
                  <option value="">Seleccioná una ciudad...</option>
                  {cities.map(c => <option key={c.city_id} value={c.name}>{c.name}</option>)}
                </select>
              </div>
              <div className="settings-field">
                <label htmlFor="region">Departamento / Región{req}</label>
                <input type="text" id="region" name="region"
                  value={form['region']} onChange={handleChange}
                  placeholder="Central" />
              </div>
              <div className="settings-field settings-field--full">
                <label htmlFor="address">Dirección{req}</label>
                <input type="text" id="address" name="address"
                  value={form['address']} onChange={handleChange}
                  placeholder="Av. España 1234" style={fieldErrors.address ? {borderColor:'#dc2626'} : {}} />
                {fieldErrors.address && <span style={{fontSize:'11px',color:'#dc2626'}}>{fieldErrors.address}</span>}
              </div>
              <div className="settings-field">
                <label htmlFor="address_height">Altura / N° de casa{req}</label>
                <input type="text" id="address_height" name="address_height"
                  value={form['address_height']} onChange={handleChange}
                  placeholder="Nro 1234" style={fieldErrors.address_height ? {borderColor:'#dc2626'} : {}} />
                {fieldErrors.address_height && <span style={{fontSize:'11px',color:'#dc2626'}}>{fieldErrors.address_height}</span>}
              </div>
            </div>
          </div>

          {/* Datos comerciales — solo proveedores */}
          {isProvider && (
            <div className="settings-card">
              <h2 className="settings-section-title">Datos comerciales</h2>
              <div className="settings-form-grid">
                <div className="settings-field">
                <label htmlFor="contact_name">Nombre de contacto *</label>
                <input type="text" id="contact_name" name="contact_name"
                  value={form['contact_name']} onChange={handleChange}
                  placeholder="Juan Pérez" />
              </div>
                <div className="settings-field">
                <label htmlFor="razon_social">Razón social *</label>
                <input type="text" id="razon_social" name="razon_social"
                  value={form['razon_social']} onChange={handleChange}
                  placeholder="Empresa S.A." />
              </div>
              </div>
            </div>
          )}

          {/* Info de solo lectura */}
          <div className="settings-card settings-card--readonly">
            <h2 className="settings-section-title">Información de cuenta</h2>
            <div className="settings-form-grid">
              <div className="settings-field">
                <label>Rol</label>
                <div className="settings-readonly">{user?.user_role}</div>
              </div>
              <div className="settings-field">
                <label>Estado</label>
                <div className="settings-readonly">{user?.user_status}</div>
              </div>
            </div>
          </div>

          {error   && <div className="settings-error">{error}</div>}
          {success && <div className="settings-success">Cambios guardados correctamente</div>}

          <div className="settings-actions">
            <button type="submit" className="btn-save" disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default Settings;
