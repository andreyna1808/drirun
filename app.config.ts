import 'dotenv/config';
import type { ExpoConfig } from "expo/config";

const config: ExpoConfig = {
  name: "Dri GoRun?!",
  slug: "drirun",
  version: "1.0.0",
  orientation: "portrait",
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
      foregroundImage: "./assets/images/logo.png",
      backgroundColor: "#E6F4FE",
    },
    package: "com.drirun.app",
    permissions: [
      "POST_NOTIFICATIONS",
      "ACCESS_FINE_LOCATION",
      "ACCESS_COARSE_LOCATION",
      "BILLING",
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

    "expo-router",
    [
      "react-native-google-mobile-ads",
      {
        androidAppId: process.env.ANDROID_ADMOB_APP_ID,
        iosAppId: process.env.IOS_ADMOB_APP_ID,
      }
    ],

    "@rnmapbox/maps",
    "expo-location",
    "expo-notifications",
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
  },
};

export default config;