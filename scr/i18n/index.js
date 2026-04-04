import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import de from './de.js';
import en from './en.js';

i18n.use(initReactI18next).init({
  resources: { de: { translation: de }, en: { translation: en } },
  lng: localStorage.getItem('lang') || 'de',
  fallbackLng: 'en',
  interpolation: { escapeValue: false }
});

export default i18n;
