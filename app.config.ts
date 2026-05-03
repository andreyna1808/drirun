import 'dotenv/config';
import type { ExpoConfig } from "expo/config";

const config: ExpoConfig = {
  name: "Dri GoRun",
  slug: "drirun",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/logo.png",
  userInterfaceStyle: "automatic",
  platforms: ["ios", "android"],

  ios: {
    bundleIdentifier: "com.drirun.app",
    infoPlist: {
      NSLocationWhenInUseUsageDescription: "...",
      NSLocationAlwaysAndWhenInUseUsageDescription: "DriRun precisa rastrear sua corrida em segundo plano.",
      UIBackgroundModes: ["location", "fetch"],
    },
  },

  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/images/logo.png",
      backgroundColor: "#E6F4FE",
    },
    package: "com.drirun.app",
    permissions: [
      "POST_NOTIFICATIONS",
      "ACCESS_FINE_LOCATION",
      "ACCESS_COARSE_LOCATION",
      "BILLING",
      "ACCESS_BACKGROUND_LOCATION",
      "FOREGROUND_SERVICE",
      "FOREGROUND_SERVICE_LOCATION",
      "RECEIVE_BOOT_COMPLETED",
    ],

    // config: {
    //   googleMaps: {
    //     apiKey: process.env.GOOGLE_MAPS_API_KEY,
    //   },
    // },
  },

  plugins: [
    "expo-router",
    [
      "expo-splash-screen",
      {
        image: "./assets/images/icon.png",
        imageWidth: 200,
        resizeMode: "contain",
        backgroundColor: "#E6F4FE",
        dark: {
          backgroundColor: "#04112d",
        },
      },
    ],
    [
      "react-native-google-mobile-ads",
      {
        androidAppId: process.env.ANDROID_ADMOB_APP_ID,
        iosAppId: process.env.IOS_ADMOB_APP_ID,
      }
    ],

    "@rnmapbox/maps",
    [
      "expo-location",
      {
        // Necessário pra rastreamento em segundo plano + foreground service no Android.
        // Sem isso o startLocationUpdatesAsync com foregroundService crasha.
        locationAlwaysAndWhenInUsePermission:
          "DriRun precisa rastrear sua corrida em segundo plano.",
        isAndroidBackgroundLocationEnabled: true,
        isAndroidForegroundServiceEnabled: true,
      },
    ],
    [
      "expo-notifications",
      {
        // Configuração do canal Android — sem isso, scheduleNotificationAsync pode falhar
        // ou a notificação não aparece. Substitua os caminhos pelos seus assets se quiser.
        icon: "./assets/images/logo.png",
        color: "#04112d",
      },
    ],
  ],

  experiments: {
    typedRoutes: true,
  },

  extra: {
    MAPBOX_PUBLIC_TOKEN: process.env.MAPBOX_PUBLIC_TOKEN,
    ORIGIN_VIDEO_URL: process.env.ORIGIN_VIDEO_URL,
    ORIGIN_LINKEDIN_URL: process.env.ORIGIN_LINKEDIN_URL,
    ORIGIN_YOUTUBE_CHANEL_URL: process.env.ORIGIN_YOUTUBE_CHANEL_URL,
    ORIGIN_GITHUB_URL: process.env.ORIGIN_GITHUB_URL,
    ORIGIN_HELP_APP: process.env.ORIGIN_HELP_APP,
    eas: {
      projectId: process.env.EAS_PROJECT_ID,
    },

    ANDROID_ADMOB_BANNER_ID: process.env.ANDROID_ADMOB_BANNER_ID,
    ANDROID_ADMOB_REWARDED_ID: process.env.ANDROID_ADMOB_REWARDED_ID,
    IOS_ADMOB_BANNER_ID: process.env.IOS_ADMOB_BANNER_ID,
    IOS_ADMOB_REWARDED_ID: process.env.IOS_ADMOB_REWARDED_ID,
  },
};

export default config;