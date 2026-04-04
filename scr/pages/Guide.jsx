import { useLang } from '../contexts/LanguageContext';
import { Check, Copy } from 'lucide-react';
import { useState } from 'react';

export default function GuidePage() {
  const { t } = useLang();
  const [copied, setCopied] = useState(false);
  const scriptUrl = "https://raw.githubusercontent.com/YOUR_USERNAME/roverify/main/roblox/VerificationSystem.lua";

  const copy = () => {
    navigator.clipboard.writeText(scriptUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="container mt-2">
      <h1>{t('guide.title')}</h1>
      <div className="grid grid-2 mt-2">
        {[1,2,3,4].map(i => (
          <div key={i} className="card">
            <h3>📍 Step {i}: {t(`guide.step${i}`)}</h3>
            <p className="text-muted mt-2">Follow the instructions in your Roblox Studio to integrate the verification system.</p>
          </div>
        ))}
      </div>
      <div className="card mt-2">
        <h3>📜 Script URL</h3>
        <div className="flex flex-between mt-2">
          <code style={{ background: 'var(--bg-secondary)', padding: '0.5rem 1rem', borderRadius: '8px', wordBreak: 'break-all' }}>{scriptUrl}</code>
          <button className="btn btn-outline btn-small" onClick={copy} style={{ marginLeft: '1rem' }}>
            {copied ? <Check size={16} color="var(--success)" /> : <Copy size={16} />} {t('guide.copy_code')}
          </button>
        </div>
      </div>
    </div>
  );
}
