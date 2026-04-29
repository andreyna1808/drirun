import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Importe as traduções
import pt from './locales/pt'; // se tiver
import en from './locales/en'; // se tiver
import es from './locales/es';

const STORAGE_KEY = '@drirun:language';

export const initI18n = async () => {
  let savedLanguage = await AsyncStorage.getItem(STORAGE_KEY);
  const deviceLanguage = Localization.getLocales()[0]?.languageCode ?? 'pt';
  const defaultLanguage = savedLanguage || deviceLanguage || 'en';

  await i18n.use(initReactI18next).init({
    resources: {
      pt: { translation: pt },
      en: { translation: en },
      es: { translation: es },
    },
    lng: defaultLanguage,
    fallbackLng: 'pt',
    interpolation: { escapeValue: false },
  });

  return i18n;
};

export const changeLanguage = async (lang: string) => {
  await i18n.changeLanguage(lang);
  await AsyncStorage.setItem(STORAGE_KEY, lang);
};

export default i18n;