import { useState } from 'react';
import { useAuth, useLang } from '../contexts/AuthContext';
import { X, Mail, Lock } from 'lucide-react';

export default function AuthModal({ onClose }) {
  const { t, authMode, setAuthMode, login, register, sendOTP } = useAuth();
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [step, setStep] = useState('form');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      let res;
      if (authMode === 'register') res = await register(form.username, form.email, form.password);
      else res = await login(form.email, form.password);
      
      if (res.success) onClose();
      else setError(res.message);
    } catch (err) { setError(t('common.error')); }
    setLoading(false);
  };

  const handleOAuth = (provider) => {
    window.location.href = `https://app.base44.com/oauth/${provider}?redirect=${encodeURIComponent(window.location.href)}`;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}><X size={20} /></button>
        <h2 style={{ marginBottom: '1.5rem' }}>{t(`auth.${authMode}`)}</h2>
        
        <div className="grid" style={{ gap: '0.75rem' }}>
          <button className="btn btn-google" onClick={() => handleOAuth('google')}>🔍 {t('auth.google')}</button>
          <button className="btn btn-discord" onClick={() => handleOAuth('discord')}>💬 {t('auth.discord')}</button>
        </div>

        <div className="divider">or</div>

        <form onSubmit={handleSubmit} className="grid" style={{ gap: '1rem' }}>
          {authMode === 'register' && (
            <input placeholder="Username" value={form.username} onChange={e => setForm({...form, username: e.target.value})} required />
          )}
          <div style={{ position: 'relative' }}>
            <Mail size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input placeholder={t('auth.email')} style={{ paddingLeft: '2.2rem' }} value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
          </div>
          <div style={{ position: 'relative' }}>
            <Lock size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input type="password" placeholder={t('auth.password')} style={{ paddingLeft: '2.2rem' }} value={form.password} onChange={e => setForm({...form, password: e.target.value})} required />
          </div>
          {error && <p style={{ color: 'var(--error)', fontSize: '0.875rem' }}>{error}</p>}
          <button className="btn btn-primary" disabled={loading} style={{ width: '100%' }}>{loading ? '⏳' : t(`auth.${authMode}`)}</button>
        </form>

        <p className="text-center text-muted" style={{ marginTop: '1rem', fontSize: '0.875rem' }}>
          {authMode === 'login' ? t('auth.no_account') : t('auth.has_account')}
          <button className="btn btn-link" onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}>
             {authMode === 'login' ? t('auth.switch_to_register') : t('auth.login')}
          </button>
        </p>
      </div>
    </div>
  );
}
