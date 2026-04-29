import type { ExpoConfig } from "expo/config";
import 'dotenv/config';

const config: ExpoConfig = {
  name: "Dri GoRun?!",
  slug: "drirun",
  version: "1.0.0",
  orientation: "portrait",

  // ─────────────────────────────────────────────────────────────
  // ÍCONE EXTERNO (visível na tela inicial do celular, gaveta de apps, etc.)
  // É a imagem principal do aplicativo (launcher icon).
  // Deve ser um PNG de pelo menos 512x512 (o Expo redimensiona automaticamente).
  // ─────────────────────────────────────────────────────────────
  icon: "./assets/images/logo.png",

  userInterfaceStyle: "automatic",

  ios: {
    bundleIdentifier: "com.drirun.app",
    infoPlist: {
      NSLocationWhenInUseUsageDescription:
        "DriRun precisa da sua localização para rastrear sua corrida.",
    },
  },

  android: {
    adaptiveIcon: {
      // Ícone adaptativo do Android (usado em versões mais recentes)
      // O foregroundImage geralmente é a mesma imagem do ícone principal.
      foregroundImage: "./assets/images/logo.png",
      backgroundColor: "#E6F4FE",
    },
    package: "com.drirun.app",
    permissions: [
      "POST_NOTIFICATIONS",
      "ACCESS_FINE_LOCATION",
      "ACCESS_COARSE_LOCATION",
    ],
  },

  plugins: [
    "expo-router",

    // ─────────────────────────────────────────────────────────────
    // SPLASH SCREEN (tela interna que aparece enquanto o app carrega)
    // A imagem definida aqui é exibida centralizada com fundo colorido.
    // Não é o ícone do app! É uma tela temporária de abertura.
    // ─────────────────────────────────────────────────────────────
    [
      "expo-splash-screen",
      {
        image: "./assets/images/icon.png",   // imagem central da splash screen (pode ser a mesma ou diferente)
        imageWidth: 200,                    // largura em pixels (redimensionada)
        resizeMode: "contain",              // "contain" mantém proporção sem cortar
        backgroundColor: "#E6F4FE",         // cor de fundo da splash
        dark: {
          backgroundColor: "#04112d",       // fundo escuro (modo noturno)
        },
      },
    ],

    "expo-location",
    "expo-notifications",
  ],

  experiments: {
    typedRoutes: true,
  },

  // ─────────────────────────────────────────────────────────────
  // Variáveis de ambiente (acessíveis via Constants.expoConfig.extra)
  // ─────────────────────────────────────────────────────────────
  extra: {
    ORIGIN_VIDEO_URL: process.env.ORIGIN_VIDEO_URL,
    ORIGIN_LINKEDIN_URL: process.env.ORIGIN_LINKEDIN_URL,
    ORIGIN_YOUTUBE_CHANEL_URL: process.env.ORIGIN_YOUTUBE_CHANEL_URL,
    ORIGIN_GITHUB_URL: process.env.ORIGIN_GITHUB_URL,
    ORIGIN_HELP_APP: process.env.ORIGIN_HELP_APP,
  },

  intentFilters: [
    {
      action: "VIEW",
      data: [
        { scheme: "https", host: "www.youtube.com" },
        { scheme: "https", host: "www.linkedin.com" },
        { scheme: "https", host: "github.com" },
        { scheme: "https", host: "link.mercadopago.com.br" },
      ],
    },
  ],
};

export default config;