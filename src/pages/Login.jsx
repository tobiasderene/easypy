// pages/Login.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, Eye, EyeOff } from 'lucide-react';
import '../styles/login.css';
import '../styles/assets.css';

export default function LoginMinimal() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = () => {
    setError('');
    setLoading(true);

    if (!email || !password) {
      setError('Por favor completa todos los campos');
      setLoading(false);
      return;
    }

    // Mockup de autenticación
    setTimeout(() => {
      if (email === 'admin' && password === '123') {
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('userType', 'seller');
        localStorage.setItem('userName', 'Administrador');
        localStorage.setItem('userEmail', 'admin@easystore.com');
        setLoading(false);
        navigate('/catalogo');
      } 
      else if (email === 'provider' && password === '123') {
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('userType', 'provider');
        localStorage.setItem('userName', 'Proveedor Global');
        localStorage.setItem('userEmail', 'provider@easystore.com');
        setLoading(false);
        navigate('/provider-orders');
      }
      else {
        setError('Usuario o contraseña incorrectos. Prueba con: admin/123 o provider/123');
        setLoading(false);
      }
    }, 1000);
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError('');
    try {
      const res = await fetch('https://easypy-backend-430520813248.us-central1.run.app/auth/google');
      const data = await res.json();
      window.location.href = data.url;
    } catch (e) {
      setError('No se pudo conectar con Google. Intentá de nuevo.');
      setGoogleLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleSubmit();
  };

  return (
    <div className="login-page">
      <div className="login-wrapper">
        <div className="login-card">

          {/* Header */}
          <div className="login-header">
            <h1>Bienvenido</h1>
            <p>Ingresa tus credenciales para continuar</p>
          </div>

          {/* Form */}
          <div className="login-form">
            <div className="form-group">
              <label>Usuario</label>
              <div className="input-wrapper">
                <Mail className="input-icon" />
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Usuario"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Contraseña</label>
              <div className="input-wrapper">
                <Lock className="input-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="••••••••"
                  disabled={loading}
                />
                <button
                  type="button"
                  className="icon-button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>
            </div>

            {error && <div className="error-box">{error}</div>}

            <div className="login-options">
              <label>
                <input type="checkbox" /> Recordarme
              </label>
              <a href="#" onClick={(e) => e.preventDefault()}>¿Olvidaste tu contraseña?</a>
            </div>

            <button
              className="primary-button"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? 'Ingresando...' : 'Iniciar Sesión'}
            </button>

            {/* Divisor */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '16px 0' }}>
              <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
              <span style={{ fontSize: '13px', color: '#9ca3af', whiteSpace: 'nowrap' }}>o continúa con</span>
              <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
            </div>

            {/* Botón Google */}
            <button
              onClick={handleGoogleLogin}
              disabled={googleLoading}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                padding: '10px 16px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                background: '#fff',
                cursor: googleLoading ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                transition: 'background 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
              onMouseLeave={e => e.currentTarget.style.background = '#fff'}
            >
              {/* Google SVG icon */}
              <svg width="18" height="18" viewBox="0 0 48 48">
                <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.6 33.1 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.7-8 19.7-20 0-1.3-.1-2.7-.1-4z"/>
                <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 16 19 13 24 13c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
                <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.8 13.5-4.7l-6.2-5.2C29.4 35.6 26.8 36 24 36c-5.2 0-9.6-2.9-11.3-7.1l-6.6 4.8C9.6 39.6 16.3 44 24 44z"/>
                <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.9 2.4-2.5 4.4-4.6 5.8l6.2 5.2C40.7 35.7 44 30.3 44 24c0-1.3-.1-2.7-.4-4z"/>
              </svg>
              {googleLoading ? 'Redirigiendo...' : 'Continuar con Google'}
            </button>

          </div>

          <div className="login-footer">
            ¿No tienes una cuenta? <a href="/signup">Regístrate</a>
          </div>

        </div>
      </div>
    </div>
  );
}