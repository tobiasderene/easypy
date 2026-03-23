import React, { useState, useRef } from 'react';
import { useUser } from '../App';
import { updateUser, uploadProfileImage } from '../services/api';
import '../styles/settings.css';

const Settings = () => {
  const { user, setUser } = useUser();

  const [form, setForm] = useState({
    user_nickname:   user?.user_nickname   || '',
    email:           user?.email           || '',
    user_description: user?.user_description || '',
  });

  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile]       = useState(null);
  const [saving, setSaving]               = useState(false);
  const [success, setSuccess]             = useState(false);
  const [error, setError]                 = useState('');
  const fileInputRef                      = useRef(null);

  const getInitials = (name) =>
    (name || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setSuccess(false);
    setError('');
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess(false);

    try {
      // 1. Subir foto si cambió
      if (avatarFile) {
        await uploadProfileImage(avatarFile);
      }

      // 2. Actualizar datos del usuario
      const updated = await updateUser(user.user_id, {
        user_nickname:    form.user_nickname    || undefined,
        email:            form.email            || undefined,
        user_description: form.user_description || undefined,
      });

      setUser(updated);
      setSuccess(true);
      setAvatarFile(null);
    } catch (err) {
      setError(err.message || 'Ocurrió un error al guardar los cambios');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="settings-page">
      <div className="settings-container">

        {/* Header */}
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
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Preview" />
                ) : user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt="Perfil" />
                ) : (
                  <span className="avatar-initials">{getInitials(user?.user_nickname)}</span>
                )}
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
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleAvatarChange}
                style={{ display: 'none' }}
              />
            </div>
          </div>

          {/* Datos personales */}
          <div className="settings-card">
            <h2 className="settings-section-title">Datos personales</h2>
            <div className="settings-form-grid">

              <div className="settings-field">
                <label htmlFor="user_nickname">Nombre de usuario</label>
                <input
                  type="text"
                  id="user_nickname"
                  name="user_nickname"
                  value={form.user_nickname}
                  onChange={handleChange}
                  placeholder="Tu nombre"
                />
              </div>

              <div className="settings-field">
                <label htmlFor="email">Correo electrónico</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="tu@email.com"
                />
              </div>

              <div className="settings-field settings-field--full">
                <label htmlFor="user_description">Descripción</label>
                <textarea
                  id="user_description"
                  name="user_description"
                  value={form.user_description}
                  onChange={handleChange}
                  placeholder="Contá algo sobre vos..."
                  rows={3}
                />
              </div>

            </div>
          </div>

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

          {/* Feedback */}
          {error && (
            <div className="settings-error">{error}</div>
          )}
          {success && (
            <div className="settings-success">✓ Cambios guardados correctamente</div>
          )}

          {/* Actions */}
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