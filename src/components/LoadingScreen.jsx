// components/LoadingScreen.jsx
import React from 'react';

const LoadingScreen = () => (
  <div style={{
    position: 'fixed',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'white',
    zIndex: 9999,
  }}>
    <div style={{
      width: '44px',
      height: '44px',
      border: '4px solid #e5e7eb',
      borderTop: '4px solid #056EB7',
      borderRadius: '50%',
      animation: 'spin 0.75s linear infinite',
    }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

export default LoadingScreen;