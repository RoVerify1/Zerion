import { useState, useEffect } from 'react';
import { useAuth, useLang } from '../contexts/AuthContext';
import { ArrowLeft } from 'lucide-react';

export default function OTPVerify({ email, onBack }) {
  const { t, verifyOTP } = useAuth();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(60);

  useEffect(() => {
    const i = setInterval(() => setTimer(t => t > 0 ? t - 1 : 0), 1000);
    return () => clearInterval(i);
  }, []);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (code.length < 6) return;
    setLoading(true);
    const res = await verifyOTP(email, code);
    if (!res.success) alert(res.message);
    setLoading(false);
  };

  return (
    <div style={{ marginTop: '1rem', textAlign: 'center' }}>
      <p>{t('auth.otp_sent')}: <strong>{email}</strong></p>
      <form onSubmit={handleVerify} className="grid" style={{ gap: '1rem', marginTop: '1rem' }}>
        <input 
          placeholder={t('auth.otp_enter')} 
          value={code} 
          onChange={e => setCode(e.target.value.replace(/\D/g,'').slice(0,6))} 
          maxLength={6}
          style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.5rem' }}
          autoFocus
        />
        <div className="flex flex-center gap-1">
          <button type="button" className="btn btn-outline btn-small" onClick={onBack}><ArrowLeft size={16} /></button>
          <button type="submit" className="btn btn-primary" disabled={loading || code.length < 6}>{loading ? '⏳' : t('auth.otp_enter')}</button>
        </div>
        {timer > 0 && <p className="text-muted text-small">Resend in {timer}s</p>}
      </form>
    </div>
  );
}
