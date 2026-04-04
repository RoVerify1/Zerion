import { createContext, useContext, useState, useEffect } from 'react';
import i18n from '../i18n';

const LangContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(localStorage.getItem('lang') || 'de');

  useEffect(() => {
    i18n.changeLanguage(lang);
    localStorage.setItem('lang', lang);
  }, [lang]);

  return (
    <LangContext.Provider value={{ lang, setLang, toggleLang: () => setLang(p => p === 'de' ? 'en' : 'de') }}>
      {children}
    </LangContext.Provider>
  );
}

export const useLang = () => useContext(LangContext);
