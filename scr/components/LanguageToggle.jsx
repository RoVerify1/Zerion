import { useLang } from '../contexts/LanguageContext';
import { Globe } from 'lucide-react';

export default function LanguageToggle() {
  const { lang, toggleLang } = useLang();
  return (
    <button className="btn btn-outline btn-small" onClick={toggleLang} aria-label="Toggle Language">
      <Globe size={16} /> {lang.toUpperCase()}
    </button>
  );
}
