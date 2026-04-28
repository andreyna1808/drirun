/**
 * i18n/index.ts
 * Configuração do sistema de internacionalização do DriRun.
 * Detecta automaticamente o idioma do dispositivo e permite troca manual.
 * Suporta: Português (pt), Inglês (en), Espanhol (es).
 */
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { getLocales } from "expo-localization";
import AsyncStorage from "@react-native-async-storage/async-storage";

import pt from "./pt";
import en from "./en";
import es from "./es";

export type SupportedLanguage = "pt" | "en" | "es";

export const SUPPORTED_LANGUAGES: { code: SupportedLanguage; label: string; flag: string }[] = [
  { code: "pt", label: "Português", flag: "🇧🇷" },
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "es", label: "Español", flag: "🇪🇸" },
];

const LANGUAGE_STORAGE_KEY = "@drirun:language";

/**
 * Detecta o idioma do dispositivo e retorna o código suportado mais próximo.
 * Se o idioma do dispositivo não for suportado, retorna "pt" como padrão.
 */
function detectDeviceLanguage(): SupportedLanguage {
  try {
    const locales = getLocales();
    if (locales.length > 0) {
      const deviceLang = locales[0].languageCode ?? "pt";
      if (deviceLang.startsWith("pt")) return "pt";
      if (deviceLang.startsWith("en")) return "en";
      if (deviceLang.startsWith("es")) return "es";
    }
  } catch {
    // Fallback silencioso
  }
  return "pt";
}

/**
 * Inicializa o i18n com o idioma salvo ou detectado automaticamente.
 * Deve ser chamado antes de renderizar o app.
 */
export async function initI18n(): Promise<void> {
  // Verifica se há idioma salvo pelo usuário
  let savedLanguage: SupportedLanguage | null = null;
  try {
    const stored = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (stored && ["pt", "en", "es"].includes(stored)) {
      savedLanguage = stored as SupportedLanguage;
    }
  } catch {
    // Ignora erros de storage
  }

  const language = savedLanguage ?? detectDeviceLanguage();

  await i18n.use(initReactI18next).init({
    resources: {
      pt: { translation: pt },
      en: { translation: en },
      es: { translation: es },
    },
    lng: language,
    fallbackLng: "pt",
    interpolation: {
      escapeValue: false, // React já escapa os valores
    },
  });
}

/**
 * Altera o idioma do app e persiste a escolha no AsyncStorage.
 */
export async function changeLanguage(lang: SupportedLanguage): Promise<void> {
  await i18n.changeLanguage(lang);
  await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
}

/**
 * Retorna o idioma atual do app.
 */
export function getCurrentLanguage(): SupportedLanguage {
  return (i18n.language as SupportedLanguage) ?? "pt";
}

export default i18n;
