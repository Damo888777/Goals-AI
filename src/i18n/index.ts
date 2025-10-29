import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Dynamic imports for translation files
const loadResources = async () => {
  const resources: any = {};
  
  // Helper function to safely load translation files
  const loadTranslation = async (locale: string) => {
    try {
      const module = await import(`../locales/${locale}/translation.json`);
      return module.default;
    } catch (error) {
      console.warn(`Translation file not found for ${locale}:`, error);
      return {}; // Return empty object as fallback
    }
  };
  
  // Load all supported languages
  const [en, de, fr] = await Promise.all([
    loadTranslation('en'),
    loadTranslation('de'), 
    loadTranslation('fr')
  ]);
  
  resources.en = { translation: en };
  resources.de = { translation: de };
  resources.fr = { translation: fr };
  
  return resources;
};

const initI18n = async () => {
  const resources = await loadResources();
  
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
};

// Initialize immediately - DISABLED to avoid conflict with src/services/i18next.js
// initI18n();

export default i18n;
