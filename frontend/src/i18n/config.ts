import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslations from './locales/en.json';
import zhTranslations from './locales/zh.json';
import esTranslations from './locales/es.json';
import deTranslations from './locales/de.json';
import frTranslations from './locales/fr.json';
import csTranslations from './locales/cs.json';
import itTranslations from './locales/it.json';
import ptTranslations from './locales/pt.json';
import ruTranslations from './locales/ru.json';
import jaTranslations from './locales/ja.json';
import koTranslations from './locales/ko.json';
import arTranslations from './locales/ar.json';

const resources = {
  en: {
    translation: enTranslations,
  },
  zh: {
    translation: zhTranslations,
  },
  es: {
    translation: esTranslations,
  },
  de: {
    translation: deTranslations,
  },
  fr: {
    translation: frTranslations,
  },
  cs: {
    translation: csTranslations,
  },
  it: {
    translation: itTranslations,
  },
  pt: {
    translation: ptTranslations,
  },
  ru: {
    translation: ruTranslations,
  },
  ja: {
    translation: jaTranslations,
  },
  ko: {
    translation: koTranslations,
  },
  ar: {
    translation: arTranslations,
  },
};

// Get saved language from localStorage or detect domain/browser language
const getInitialLanguage = (): string => {
  if (typeof window === 'undefined') return 'en';

  // 1. Check user explicitly saved preference
  const saved = localStorage.getItem('formvault-language') || localStorage.getItem('i18nextLng');
  if (saved && resources[saved.split('-')[0] as keyof typeof resources]) {
    return saved.split('-')[0];
  }

  // 2. Intelligent Domain-based localization (e.g. pojisteni.hktse.eu.org -> Czech)
  const hostname = window.location.hostname.toLowerCase();
  if (hostname.startsWith('pojisteni') || hostname.includes('czech')) {
    return 'cs';
  }

  // 3. Browser language detection
  const browserLang = typeof navigator !== 'undefined' ? navigator.language.split('-')[0] : 'en';
  if (resources[browserLang as keyof typeof resources]) {
    return browserLang;
  }

  return 'en';
};

const defaultLanguage = getInitialLanguage();

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: defaultLanguage,
    fallbackLng: 'en',
    debug: false,

    interpolation: {
      escapeValue: false, // React already escapes values
    },

    react: {
      useSuspense: false,
    },
  });

export default i18n;