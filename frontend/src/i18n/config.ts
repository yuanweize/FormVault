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

// Get saved language from localStorage or detect browser language
const savedLanguage = typeof window !== 'undefined' ? localStorage.getItem('formvault-language') : null;
const browserLanguage = typeof navigator !== 'undefined' ? navigator.language.split('-')[0] : 'en';
const defaultLanguage = savedLanguage || (resources[browserLanguage as keyof typeof resources] ? browserLanguage : 'en');

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: defaultLanguage,
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development',

    interpolation: {
      escapeValue: false, // React already escapes values
    },

    react: {
      useSuspense: false,
    },
  });

export default i18n;