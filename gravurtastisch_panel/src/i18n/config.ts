import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import de from './locales/de.json';

const getInitialLanguage = (): string => {
  if (typeof window !== 'undefined') {
    const hasDefault = localStorage.getItem('panel_default_de_v2');
    if (!hasDefault) {
      localStorage.setItem('panel_default_de_v2', 'true');
      localStorage.setItem('panel_lng', 'de');
      return 'de';
    }
    const saved = localStorage.getItem('panel_lng');
    if (saved === 'en' || saved === 'de') {
      return saved;
    }
    localStorage.setItem('panel_lng', 'de');
    return 'de';
  }
  return 'de';
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      de: { translation: de },
      en: { translation: en },
    },
    lng: getInitialLanguage(),
    fallbackLng: 'de',
    supportedLngs: ['de', 'en'],
    nonExplicitSupportedLngs: true,
    load: 'languageOnly',
    detection: {
      order: ['localStorage'],
      caches: ['localStorage'],
      lookupLocalStorage: 'panel_lng',
    },
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

export const SUPPORTED_LANGUAGES = [
  { code: 'de', label: 'Deutsch', flag: '🇩🇪', tag: 'DE' },
  { code: 'en', label: 'English', flag: '🇬🇧', tag: 'EN' },
] as const;

export default i18n;
