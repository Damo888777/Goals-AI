import React, { createContext, useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, NativeModules } from 'react-native';

const { WidgetLanguageSync } = NativeModules;

interface Language {
  code: string;
  name: string;
  flag: string;
}

interface LanguageContextType {
  currentLanguage: string;
  changeLanguage: (language: string) => Promise<void>;
  availableLanguages: Language[];
  isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { i18n, t } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language || 'en');
  const [isLoading, setIsLoading] = useState(true);

  const availableLanguages: Language[] = [
    { code: 'en', name: t('onboarding.language.languages.en'), flag: '🇺🇸' },
    { code: 'de', name: t('onboarding.language.languages.de'), flag: '🇩🇪' },
    { code: 'fr', name: t('onboarding.language.languages.fr'), flag: '🇫🇷' }
  ];

  const changeLanguage = async (language: string) => {
    try {
      await i18n.changeLanguage(language);
      await AsyncStorage.setItem('user-language', language);
      
      // Sync language to iOS widget via App Group UserDefaults
      if (Platform.OS === 'ios' && WidgetLanguageSync) {
        try {
          await WidgetLanguageSync.setLanguage(language);
          console.log('✅ Language synced to widget:', language);
        } catch (error) {
          console.warn('Failed to sync language to widget:', error);
        }
      }
      
      setCurrentLanguage(language);
    } catch (error) {
      console.warn('Failed to change language:', error);
    }
  };

  useEffect(() => {
    const initializeLanguage = async () => {
      try {
        // Wait for i18n to be ready
        if (i18n.isInitialized) {
          setCurrentLanguage(i18n.language);
          setIsLoading(false);
        } else {
          // Wait for i18n to initialize
          i18n.on('initialized', () => {
            setCurrentLanguage(i18n.language);
            setIsLoading(false);
          });
        }
      } catch (error) {
        console.warn('Failed to initialize language:', error);
        setIsLoading(false);
      }
    };

    initializeLanguage();

    // Listen for language changes
    const handleLanguageChange = (lng: string) => {
      setCurrentLanguage(lng);
    };

    i18n.on('languageChanged', handleLanguageChange);

    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, [i18n]);

  const value: LanguageContextType = {
    currentLanguage,
    changeLanguage,
    availableLanguages,
    isLoading,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};
