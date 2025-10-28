import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// Import translation files
import en from "../locales/en.json";
import de from "../locales/de.json";
import fr from "../locales/fr.json";

const languageResources = {
  en: { translation: en },
  de: { translation: de },
  fr: { translation: fr },
};

i18next
  .use(initReactI18next)
  .use(LanguageDetector)
  .init({
    compatibilityJSON: 'v3',
    lng: 'en',
    fallbackLng: 'en',
    resources: languageResources,
    interpolation: {
      escapeValue: false, // React already does escaping
    },
  });

export default i18next;
