import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import * as Localization from "expo-localization";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Import translation files
import en from "../locales/en.json";
import de from "../locales/de.json";
import fr from "../locales/fr.json";

const languageResources = {
  en: { translation: en },
  de: { translation: de },
  fr: { translation: fr },
};

// Custom language detector for React Native
const languageDetector = {
  type: 'languageDetector',
  async: true,
  detect: async (callback) => {
    try {
      // Check if user has manually selected a language
      const savedLanguage = await AsyncStorage.getItem('user-language');
      if (savedLanguage && ['en', 'de', 'fr'].includes(savedLanguage)) {
        return callback(savedLanguage);
      }
      
      // Fall back to device language
      const deviceLanguage = Localization.locale.split('-')[0];
      const supportedLanguage = ['en', 'de', 'fr'].includes(deviceLanguage) ? deviceLanguage : 'en';
      callback(supportedLanguage);
    } catch (error) {
      callback('en');
    }
  },
  init: () => {},
  cacheUserLanguage: async (language) => {
    try {
      await AsyncStorage.setItem('user-language', language);
    } catch (error) {
      console.warn('Failed to save language preference:', error);
    }
  }
};

i18next
  .use(initReactI18next)
  .use(languageDetector)
  .init({
    compatibilityJSON: 'v3',
    fallbackLng: 'en',
    resources: languageResources,
    interpolation: {
      escapeValue: false,
      skipOnVariables: false,
    },
    debug: true,
    react: {
      useSuspense: false,
    },
  });

export default i18next;
