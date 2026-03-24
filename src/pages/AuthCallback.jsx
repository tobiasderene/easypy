// pages/AuthCallback.jsx
import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useUser } from '../App';
import { getMe } from '../services/api';

const BASE_URL = "https://easypy-backend-430520813248.us-central1.run.app";

const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate       = useNavigate();
  const { setUser }    = useUser();
  const handled        = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const code  = searchParams.get('code');
    const error = searchParams.get('error');

    if (error || !code) {
      navigate('/login', { replace: true });
      return;
    }

    const token = localStorage.getItem('auth_token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    fetch(`${BASE_URL}/auth/exchange-code`, {
      method:      'POST',
      credentials: 'include',
      headers,
      body: JSON.stringify({ code }),
    })
      .then(res => res.json())
      .then(async (data) => {
        if (data.action === 'signup') {
          // Usuario nuevo — mandarlo a signup con los datos de Google
          const params = new URLSearchParams({
            name:      data.name,
            email:     data.email,
            provider:  'google',
            google_id: data.google_id,
          });
          navigate(`/signup?${params}`, { replace: true });
          return;
        }

        // Login exitoso — guardar token y redirigir
        if (data.token) {
          localStorage.setItem('auth_token', data.token);
        }

        const user = await getMe();
        if (user) {
          setUser(user);
          if (user.user_status === 'pending') { navigate('/', { replace: true }); return; }
          if (user.user_role === 'provider')  navigate('/provider-orders', { replace: true });
          else if (user.user_role === 'admin') navigate('/admin', { replace: true });
          else navigate('/catalogo', { replace: true });
        } else {
          navigate('/login', { replace: true });
        }
      })
      .catch(() => navigate('/login', { replace: true }));
  }, []);

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', background: '#f9fafb', flexDirection: 'column', gap: '16px'
    }}>
      <div style={{ fontSize: '24px', fontWeight: '800', color: '#056EB7', letterSpacing: '-0.5px' }}>
        EASYPY
      </div>
      <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>Iniciando sesión...</p>
    </div>
  );
};

export default AuthCallback;