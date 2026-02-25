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
    // Usuario: admin
    // Contraseña: 123
    setTimeout(() => {
      if (email === 'admin' && password === '123') {
        // Login exitoso
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('userName', 'Administrador');
        localStorage.setItem('userEmail', 'admin@easystore.com');
        
        setLoading(false);
        
        // Redirigir al catálogo
        navigate('/catalogo');
      } else {
        // Login fallido
        setError('Usuario o contraseña incorrectos. Prueba con: admin / 123');
        setLoading(false);
      }
    }, 1000);
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
            <div className="login-icon">
              <Lock />
            </div>
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
                  placeholder="admin"
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
          </div>

          <div className="login-footer">
            ¿No tienes una cuenta? <a href="/signup">Regístrate</a>
          </div>

        </div>
      </div>
    </div>
  );
}