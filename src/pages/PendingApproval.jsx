import React from 'react';
import { useUser } from '../App';
import { logout } from '../services/api';
import { useNavigate } from 'react-router-dom';
import '../styles/pendingapproval.css';

const PendingApproval = () => {
  const { setUser } = useUser();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    setUser(null);
    navigate('/login', { replace: true });
  };

  return (
    <div className="pending-page">
      <div className="pending-card">
        <div className="pending-icon">
            <svg width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        </div>

        <h1 className="pending-title">Cuenta en revisión</h1>
        <p className="pending-subtitle">
          Tu cuenta como proveedor está siendo revisada por nuestro equipo.
          Te notificaremos cuando sea aprobada.
        </p>

        <div className="pending-steps">
          <div className="pending-step done">
            <div className="step-dot">
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span>Registro completado</span>
          </div>
          <div className="pending-step-line"></div>
          <div className="pending-step active">
            <div className="step-dot">
              <span className="step-pulse"></span>
            </div>
            <span>Revisión de cuenta</span>
          </div>
          <div className="pending-step-line inactive"></div>
          <div className="pending-step inactive">
            <div className="step-dot empty"></div>
            <span>Cuenta habilitada</span>
          </div>
        </div>

        <div className="pending-info">
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p>El proceso de revisión puede tomar hasta 24 horas hábiles.</p>
        </div>

        <button className="pending-logout" onClick={handleLogout}>
          Cerrar sesión
        </button>
      </div>
    </div>
  );
};

export default PendingApproval;