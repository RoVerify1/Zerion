import { useState, useEffect } from 'react';
import { useAuth, useLang } from '../contexts/AuthContext';
import { Shield, Copy, Check } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const { t } = useLang();
  const [status, setStatus] = useState({});
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch('/api/verify/status', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
      .then(r => r.json()).then(d => d.success && setStatus(d.data)).catch(console.error);
  }, []);

  const handleStart = async () => {
    const robloxUser = prompt('Roblox Username:');
    if (!robloxUser) return;
    setLoading(true);
    const res = await fetch('/api/verify/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
      body: JSON.stringify({ robloxUsername: robloxUser })
    });
    const data = await res.json();
    if (data.success) setCode(data.data.code);
    setLoading(false);
  };

  const handleCheck = async () => {
    setLoading(true);
    const res = await fetch('/api/verify/game', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
      body: JSON.stringify({ robloxUserId: status.robloxUserId, verificationCode: code.replace('-','') })
    });
    const data = await res.json();
    alert(data.message);
    if (data.success) window.location.reload();
    setLoading(false);
  };

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!user) return null;

  return (
    <div className="container mt-2">
      <div className="card flex flex-between">
        <div>
          <h2>{t('dashboard.welcome', { name: user.username })}</h2>
          <p className="text-muted">{user.email}</p>
        </div>
        <span className={`badge ${status.isVerified ? 'badge-success' : 'badge-error'}`}>
          {status.isVerified ? t('dashboard.verified') : t('dashboard.not_verified')}
        </span>
      </div>

      {!status.isVerified && (
        <div className="card mt-2">
          <h3 style={{ marginBottom: '1rem' }}>🔐 {t('dashboard.start_verify')}</h3>
          {!code ? (
            <button className="btn btn-primary" onClick={handleStart} disabled={loading}>{loading ? '⏳' : 'Start'}</button>
          ) : (
            <div className="grid" style={{ gap: '1rem' }}>
              <div className="card flex flex-center" style={{ background: 'var(--bg-secondary)', padding: '1rem', fontSize: '1.5rem', letterSpacing: '0.25rem', fontFamily: 'monospace' }}>
                {code}
                <button className="btn btn-outline btn-small" style={{ marginLeft: '1rem' }} onClick={copyCode}>
                  {copied ? <Check size={16} color="var(--success)" /> : <Copy size={16} />}
                </button>
              </div>
              <button className="btn btn-primary" onClick={handleCheck} disabled={loading}>{loading ? '⏳' : t('dashboard.check_code')}</button>
            </div>
          )}
        </div>
      )}
      {status.isVerified && (
        <div className="card mt-2 text-center">
          <h3>🎉 {t('dashboard.verified_success')}</h3>
          <p className="text-muted">{t('dashboard.verified_desc')}</p>
        </div>
      )}
    </div>
  );
}
