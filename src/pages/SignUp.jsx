import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { registerLocal, getMe } from '../services/api';
import { useUser } from '../App';
import '../styles/signup.css';

const Signup = () => {
  const [userType, setUserType] = useState('seller');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleSignup, setIsGoogleSignup] = useState(false);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setUser } = useUser();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    terms: false
  });

  useEffect(() => {
    const name = searchParams.get('name');
    const email = searchParams.get('email');
    const provider = searchParams.get('provider');

    if (provider === 'google' && email) {
      setIsGoogleSignup(true);
      setFormData(prev => ({
        ...prev,
        fullName: name || '',
        email: email || '',
      }));
    }
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (error) setError('');
  };

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePassword = (password) => password.length >= 8;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.fullName.trim()) return setError('Por favor ingresa tu nombre completo');
    if (!validateEmail(formData.email)) return setError('Por favor ingresa un correo electrónico válido');
    if (!formData.phone.trim()) return setError('Por favor ingresa tu número de teléfono');

    if (!isGoogleSignup) {
      if (!validatePassword(formData.password)) return setError('La contraseña debe tener al menos 8 caracteres');
      if (formData.password !== formData.confirmPassword) return setError('Las contraseñas no coinciden');
    }

    if (!formData.terms) return setError('Debes aceptar los términos y condiciones');

    setIsLoading(true);
    try {
      await registerLocal(formData.email, formData.fullName, formData.password, userType);
      const user = await getMe();
      setUser(user);
      navigate(user.user_role === 'provider' ? '/provider-orders' : '/catalogo');
    } catch (err) {
      setError(err.message || 'Error al crear la cuenta. Por favor intenta de nuevo.');
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
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              background: '#f0fdf4', border: '1px solid #bbf7d0',
              borderRadius: '8px', padding: '10px 14px', marginBottom: '16px',
              fontSize: '13px', color: '#15803d'
            }}>
              <svg width="16" height="16" viewBox="0 0 48 48">
                <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.8 13.5-4.7l-6.2-5.2C29.4 35.6 26.8 36 24 36c-5.2 0-9.6-2.9-11.3-7.1l-6.6 4.8C9.6 39.6 16.3 44 24 44z"/>
                <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.9 2.4-2.5 4.4-4.6 5.8l6.2 5.2C40.7 35.7 44 30.3 44 24c0-1.3-.1-2.7-.4-4z"/>
                <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.6 33.1 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.7-8 19.7-20 0-1.3-.1-2.7-.1-4z"/>
                <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 16 19 13 24 13c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
              </svg>
              Cuenta de Google vinculada — solo falta elegir tu tipo de cuenta
            </div>
          )}

          {error && <div className="error-box">{error}</div>}

          <form className="signup-form" onSubmit={handleSubmit}>

            <div className="form-group">
              <label>Tipo de cuenta</label>
              <div className="user-type-selector">
                <button type="button" className={`user-type-option ${userType === 'seller' ? 'active' : ''}`} onClick={() => setUserType('seller')}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                    <polyline points="9 22 9 12 15 12 15 22"></polyline>
                  </svg>
                  <div>
                    <div className="option-title">Vendedor</div>
                    <div className="option-desc">Vende productos</div>
                  </div>
                </button>
                <button type="button" className={`user-type-option ${userType === 'provider' ? 'active' : ''}`} onClick={() => setUserType('provider')}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="1" y="3" width="15" height="13"></rect>
                    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
                    <circle cx="5.5" cy="18.5" r="2.5"></circle>
                    <circle cx="18.5" cy="18.5" r="2.5"></circle>
                  </svg>
                  <div>
                    <div className="option-title">Proveedor</div>
                    <div className="option-desc">Suministra inventario</div>
                  </div>
                </button>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="fullName">Nombre completo</label>
              <div className="input-wrapper">
                <svg className="input-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                <input type="text" id="fullName" name="fullName" placeholder="Juan Pérez" value={formData.fullName} onChange={handleInputChange} required />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="email">Correo electrónico</label>
              <div className="input-wrapper">
                <svg className="input-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
                <input
                  type="email" id="email" name="email" placeholder="correo@ejemplo.com"
                  value={formData.email} onChange={handleInputChange} required
                  disabled={isGoogleSignup}
                  style={isGoogleSignup ? { background: '#f9fafb', color: '#6b7280', cursor: 'not-allowed' } : {}}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="phone">Teléfono</label>
              <div className="input-wrapper">
                <svg className="input-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                </svg>
                <input type="tel" id="phone" name="phone" placeholder="+595 123 456 789" value={formData.phone} onChange={handleInputChange} required />
              </div>
            </div>

            {!isGoogleSignup && (
              <>
                <div className="form-group">
                  <label htmlFor="password">Contraseña</label>
                  <div className="input-wrapper">
                    <svg className="input-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                    <input type={showPassword ? 'text' : 'password'} id="password" name="password" placeholder="••••••••" value={formData.password} onChange={handleInputChange} required />
                    <button type="button" className="icon-button" onClick={() => setShowPassword(!showPassword)}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        {showPassword ? (<><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></>) : (<><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></>)}
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirmar contraseña</label>
                  <div className="input-wrapper">
                    <svg className="input-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                    <input type={showConfirmPassword ? 'text' : 'password'} id="confirmPassword" name="confirmPassword" placeholder="••••••••" value={formData.confirmPassword} onChange={handleInputChange} required />
                    <button type="button" className="icon-button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        {showConfirmPassword ? (<><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></>) : (<><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></>)}
                      </svg>
                    </button>
                  </div>
                </div>
              </>
            )}

            <div className="form-group">
              <label className="checkbox-wrapper">
                <input type="checkbox" id="terms" name="terms" checked={formData.terms} onChange={handleInputChange} required />
                <span className="checkbox-label">
                  Acepto los <a href="#" className="link">términos y condiciones</a>
                </span>
              </label>
            </div>

            <button type="submit" className="primary-button" disabled={isLoading}>
              {isLoading ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>
          </form>

          <div className="signup-footer">
            <span>¿Ya tienes cuenta? <a href="/login" className="link">Inicia sesión</a></span>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Signup;