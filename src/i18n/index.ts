import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Static imports for translation files (required for native builds)
import en from '../locales/en.json';
import de from '../locales/de.json';
import fr from '../locales/fr.json';

// Resources object with static imports
const resources = {
  en: { translation: en },
  de: { translation: de },
  fr: { translation: fr }
};

// Initialize i18n with static resources
i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en', // default language
    fallbackLng: 'en',
    
    // Efficient key structure
    keySeparator: '.',
    nsSeparator: ':',
    
    interpolation: {
      escapeValue: false, // React already does escaping
    },
    
    // Debug mode for development
    debug: __DEV__,
    
    // Namespace settings
    defaultNS: 'translation',
    ns: ['translation'],
    
    // Performance optimizations
    load: 'languageOnly', // Don't load country-specific variants
    preload: ['en'], // Preload English
    
    // Efficient missing key handling
    saveMissing: __DEV__,
    missingKeyHandler: __DEV__ ? (lng, ns, key) => {
      console.warn(`Missing translation: ${lng}.${ns}.${key}`);
    } : undefined,
  });

export default i18n;
