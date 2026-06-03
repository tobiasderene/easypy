import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { registerLocal, registerGoogle, getMe, updateUser, uploadProfileImage } from '../services/api';
import { useUser } from '../App';
import { getCities } from '../services/api';
import '../styles/signup.css';

const Signup = () => {
  const [userType, setUserType]                       = useState('provider');
  const [showPassword, setShowPassword]               = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError]                             = useState('');
  const [isLoading, setIsLoading]                     = useState(false);
  const [isGoogleSignup, setIsGoogleSignup]           = useState(false);
  const [googleId, setGoogleId]                       = useState('');
  const [avatarFile, setAvatarFile]                   = useState(null);
  const [avatarPreview, setAvatarPreview]             = useState(null);
  const fileInputRef                                  = useRef(null);
  const SELLER_REGISTRATION_ENABLED = false;
  const navigate       = useNavigate();
  const [searchParams] = useSearchParams();
  const { setUser }    = useUser();

  const [cities, setCities] = useState([]);

  const [formData, setFormData] = useState({
    fullName: '', email: '', phone: '',
    password: '', confirmPassword: '', terms: false,
    razon_social: '', address: '', address_height: '',
    city: '', region: '', cp: '',
    contact_name: '', doc_type: '', doc_number: '',
    piso: '', dpto: '',
  });

  useEffect(() => {
    getCities().then(data => setCities(data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    const name     = searchParams.get('name');
    const email    = searchParams.get('email');
    const provider = searchParams.get('provider');
    const gid      = searchParams.get('google_id');
    if (provider === 'google' && email) {
      setIsGoogleSignup(true);
      setGoogleId(gid || '');
      setFormData(prev => ({ ...prev, fullName: name || '', email: email || '' }));
    }
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (error) setError('');
  };

  const handleCitySelect = (e) => {
    const val = e.target.value;
    const loc = cities.find(l => l.name === val);
    if (loc) setFormData(prev => ({ ...prev, city: loc.name, region: loc.department, cp: String(loc.cp || '') }));
    else     setFormData(prev => ({ ...prev, city: '', region: '', cp: '' }));
    if (error) setError('');
  };

  const handleDocNumber = (value) => {
    let formatted = value;
    if (formData.doc_type === 'ruc') {
      const digits = value.replace(/\D/g, '');
      formatted = digits.length <= 1 ? digits : digits.slice(0, -1) + '-' + digits.slice(-1);
    } else if (formData.doc_type === 'cedula') {
      formatted = value.replace(/\D/g, '').slice(0, 8);
    }
    setFormData(prev => ({ ...prev, doc_number: formatted }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const getInitials = (name) =>
    (name || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  const validateEmail    = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePassword = (password) => password.length >= 8;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.fullName.trim())      return setError('Por favor ingresá tu nombre completo');
    if (!validateEmail(formData.email)) return setError('Por favor ingresá un correo válido');
    if (!formData.phone.trim())         return setError('Por favor ingresá tu número de teléfono');
    if (!isGoogleSignup) {
      if (!validatePassword(formData.password))           return setError('La contraseña debe tener al menos 8 caracteres');
      if (formData.password !== formData.confirmPassword) return setError('Las contraseñas no coinciden');
    }
    if (userType === 'provider') {
      if (!formData.razon_social.trim())   return setError('Ingresá la razón social');
      if (!formData.city.trim())           return setError('Seleccioná la ciudad');
      if (!formData.address.trim())        return setError('Ingresá la calle');
      if (!formData.address_height.trim()) return setError('Ingresá la altura de la calle');
      if (!formData.contact_name.trim())   return setError('Ingresá el nombre del contacto');
    }
    if (!formData.terms) return setError('Debés aceptar los términos y condiciones');

    setIsLoading(true);
    try {
      if (isGoogleSignup) {
        await registerGoogle(formData.email, formData.fullName, userType, googleId);
      } else {
        await registerLocal(formData.email, formData.fullName, formData.password, userType, {
          razon_social:   formData.razon_social   || undefined,
          address:        formData.address        || undefined,
          address_height: formData.address_height || undefined,
          city:           formData.city           || undefined,
          region:         formData.region         || undefined,
          cp:             formData.cp ? parseInt(formData.cp) : undefined,
          phone:          formData.phone          || undefined,
          contact_name:   formData.contact_name   || undefined,
          doc_type:       formData.doc_type       || undefined,
          doc_number:     formData.doc_number     || undefined,
          piso:           formData.piso           || undefined,
          dpto:           formData.dpto           || undefined,
        });
      }
      const user = await getMe();
      if (avatarFile) await uploadProfileImage(avatarFile);
      setUser(user);
      if (user.user_status === 'pending') return;
      navigate(user.user_role === 'provider' ? '/provider-orders' : '/catalogo');
    } catch (err) {
      setError(err.message || 'Error al crear la cuenta. Por favor intentá de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="signup-page">
      <div className="signup-wrapper">
        <div className="signup-card">

          <div className="signup-header">
            <div className="signup-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <line x1="19" y1="8" x2="19" y2="14"></line>
                <line x1="22" y1="11" x2="16" y2="11"></line>
              </svg>
            </div>
            <h1>Crear cuenta</h1>
            <p>{isGoogleSignup ? 'Completá tu perfil para continuar' : 'Regístrate para comenzar'}</p>
          </div>

          {isGoogleSignup && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', fontSize: '13px', color: '#15803d' }}>
              Cuenta de Google vinculada — solo falta elegir tu tipo de cuenta
            </div>
          )}

          {error && <div className="error-box">{error}</div>}

          <form className="signup-form" onSubmit={handleSubmit}>

            {/* Tipo de cuenta */}
            <div className="form-group">
              <label>Tipo de cuenta</label>
              <div className="user-type-selector">
                <button
                  type="button"
                  disabled={!SELLER_REGISTRATION_ENABLED}
                  className={`user-type-option ${
                    userType === 'seller' ? 'active' : ''
                  } ${!SELLER_REGISTRATION_ENABLED ? 'disabled' : ''}`}
                  onClick={() => SELLER_REGISTRATION_ENABLED && setUserType('seller')}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                    <polyline points="9 22 9 12 15 12 15 22"></polyline>
                  </svg>
                
                  <div>
                    <div className="option-title">Vendedor</div>
                    <div className="option-desc">
                      {SELLER_REGISTRATION_ENABLED
                        ? 'Vende productos'
                        : 'Registros temporalmente cerrados'}
                    </div>
                  </div>
                </button>
                <button type="button" className={`user-type-option ${userType === 'provider' ? 'active' : ''}`} onClick={() => setUserType('provider')}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
                  <div><div className="option-title">Proveedor</div><div className="option-desc">Suministra inventario</div></div>
                </button>
              </div>
            </div>

            {/* Foto */}
            <div className="form-group">
              <label>Foto de perfil <span style={{ color: '#9ca3af', fontWeight: 400 }}>(opcional)</span></label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div onClick={() => fileInputRef.current?.click()} style={{ width: '64px', height: '64px', borderRadius: '50%', overflow: 'hidden', background: 'linear-gradient(135deg, #aacdfe, #056EB7)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, border: '2px solid #e5e7eb' }}>
                  {avatarPreview ? <img src={avatarPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '20px', fontWeight: '800', color: 'white' }}>{getInitials(formData.fullName) || '?'}</span>}
                </div>
                <div>
                  <button type="button" onClick={() => fileInputRef.current?.click()} style={{ padding: '7px 16px', background: '#056EB7', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                    {avatarPreview ? 'Cambiar foto' : 'Subir foto'}
                  </button>
                  <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>JPG, PNG o WEBP</p>
                </div>
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleAvatarChange} style={{ display: 'none' }} />
              </div>
            </div>

            {/* Datos básicos */}
            <div className="form-group">
              <label htmlFor="fullName">Nombre completo</label>
              <div className="input-wrapper"><input type="text" id="fullName" name="fullName" placeholder="Juan Pérez" value={formData.fullName} onChange={handleInputChange} required /></div>
            </div>
            <div className="form-group">
              <label htmlFor="email">Correo electrónico</label>
              <div className="input-wrapper"><input type="email" id="email" name="email" placeholder="correo@ejemplo.com" value={formData.email} onChange={handleInputChange} required disabled={isGoogleSignup} style={isGoogleSignup ? { background: '#f9fafb', color: '#6b7280', cursor: 'not-allowed' } : {}} /></div>
            </div>
            <div className="form-group">
              <label htmlFor="phone">Teléfono</label>
              <div className="input-wrapper"><input type="tel" id="phone" name="phone" placeholder="+595 981 000 000" value={formData.phone} onChange={handleInputChange} required /></div>
            </div>

            {!isGoogleSignup && (
              <>
                <div className="form-group">
                  <label htmlFor="password">Contraseña</label>
                  <div className="input-wrapper">
                    <input type={showPassword ? 'text' : 'password'} id="password" name="password" placeholder="••••••••" value={formData.password} onChange={handleInputChange} required />
                    <button type="button" className="icon-button" onClick={() => setShowPassword(!showPassword)}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{showPassword ? (<><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></>) : (<><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></>)}</svg>
                    </button>
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirmar contraseña</label>
                  <div className="input-wrapper">
                    <input type={showConfirmPassword ? 'text' : 'password'} id="confirmPassword" name="confirmPassword" placeholder="••••••••" value={formData.confirmPassword} onChange={handleInputChange} required />
                    <button type="button" className="icon-button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{showConfirmPassword ? (<><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></>) : (<><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></>)}</svg>
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* ── Datos del proveedor ── */}
            {userType === 'provider' && (
              <div style={{ border: '1.5px solid #e5e7eb', borderRadius: '12px', padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px', background: '#f9fafb' }}>

                <p style={{ fontSize: '13px', fontWeight: '800', color: '#1f2937', margin: 0 }}>Datos de la empresa</p>

                <div className="form-group" style={{ margin: 0 }}>
                  <label>Razón social <span style={{ color: '#ef4444' }}>*</span></label>
                  <div className="input-wrapper"><input type="text" name="razon_social" placeholder="Ej: Mi Empresa S.A." value={formData.razon_social} onChange={handleInputChange} /></div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>Tipo de documento</label>
                    <select name="doc_type" value={formData.doc_type} onChange={e => { handleInputChange(e); setFormData(prev => ({ ...prev, doc_number: '' })); }} >
                      <option value="">Sin documento</option>
                      <option value="cedula">Cédula</option>
                      <option value="ruc">RUC</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>{formData.doc_type === 'ruc' ? 'RUC' : formData.doc_type === 'cedula' ? 'Nro. cédula' : 'Número'}</label>
                    <div className="input-wrapper"><input type="text" placeholder={formData.doc_type === 'ruc' ? 'XXXXXXXX-X' : formData.doc_type === 'cedula' ? '12345678' : '—'} value={formData.doc_number} onChange={e => handleDocNumber(e.target.value)} disabled={!formData.doc_type} /></div>
                  </div>
                </div>

                <p style={{ fontSize: '13px', fontWeight: '800', color: '#1f2937', margin: '4px 0 0 0' }}>Ubicación</p>

                <div className="form-group" style={{ margin: 0 }}>
                  <label>Ciudad <span style={{ color: '#ef4444' }}>*</span></label>
                  <select value={formData.city} onChange={handleCitySelect} >
                    <option value="">Seleccioná una ciudad...</option>
                    {cities.map(loc => (
                      <option key={loc.city_id} value={loc.name}>{loc.name}</option>
                    ))}
                  </select>

                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>Calle <span style={{ color: '#ef4444' }}>*</span></label>
                    <div className="input-wrapper"><input type="text" name="address" placeholder="Av. España" value={formData.address} onChange={handleInputChange} /></div>
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>Altura <span style={{ color: '#ef4444' }}>*</span></label>
                    <div className="input-wrapper"><input type="number" name="address_height" placeholder="1234" value={formData.address_height} onChange={handleInputChange} /></div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>Piso <span style={{ color: '#9ca3af', fontWeight: 400 }}>(opcional)</span></label>
                    <div className="input-wrapper"><input type="text" name="piso" placeholder="Ej: 4" value={formData.piso} onChange={handleInputChange} /></div>
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>Dpto <span style={{ color: '#9ca3af', fontWeight: 400 }}>(opcional)</span></label>
                    <div className="input-wrapper"><input type="text" name="dpto" placeholder="Ej: B" value={formData.dpto} onChange={handleInputChange} /></div>
                  </div>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label>Persona de contacto <span style={{ color: '#ef4444' }}>*</span></label>
                  <div className="input-wrapper"><input type="text" name="contact_name" placeholder="Ej: María González" value={formData.contact_name} onChange={handleInputChange} /></div>
                </div>

              </div>
            )}

            <div className="form-group">
              <label className="checkbox-wrapper">
                <input type="checkbox" id="terms" name="terms" checked={formData.terms} onChange={handleInputChange} required />
                <span className="checkbox-label">Acepto los <a href="#" className="link">términos y condiciones</a></span>
              </label>
            </div>

            <button type="submit" className="primary-button" disabled={isLoading}>
              {isLoading ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>
          </form>

          <div className="signup-footer">
            <span>¿Ya tenés cuenta? <a href="/login" className="link">Iniciá sesión</a></span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
