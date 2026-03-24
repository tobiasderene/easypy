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
          const params = new URLSearchParams({
            name:      data.name,
            email:     data.email,
            provider:  'google',
            google_id: data.google_id,
          });
          navigate(`/signup?${params}`, { replace: true });
          return;
        }

        if (data.token) {
          localStorage.setItem('auth_token', data.token);
        }

        const user = await getMe();
        if (user) {
          setUser(user);
          if (user.user_status === 'pending')  { navigate('/', { replace: true }); return; }
          if (user.user_role === 'provider')    navigate('/provider-orders', { replace: true });
          else if (user.user_role === 'admin')  navigate('/admin', { replace: true });
          else                                  navigate('/catalogo', { replace: true });
        } else {
          navigate('/login', { replace: true });
        }
      })
      .catch(() => navigate('/login', { replace: true }));
  }, []);

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', background: '#f9fafb',
    }}>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
      <div style={{
        width: '40px', height: '40px', borderRadius: '50%',
        border: '3px solid #e5e7eb',
        borderTopColor: '#056EB7',
        animation: 'spin 0.75s linear infinite',
      }} />
    </div>
  );
};

export default AuthCallback;