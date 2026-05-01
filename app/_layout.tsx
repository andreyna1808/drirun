import "@/global.css";
import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ThemeProvider } from "@/lib/theme-provider";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AppProvider, useApp } from "@/context/AppContext";
import { ActivityIndicator, View, Text } from "react-native";
import i18n, { initI18n } from "@/lib/i18n";
import { I18nextProvider } from "react-i18next";
import "@/hooks/background-tracking";

const queryClient = new QueryClient();

function RootNavigator() {
  const { isLoading } = useApp();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 10 }}>Carregando dados...</Text>
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="tracking" options={{ presentation: "fullScreenModal" }} />
      <Stack.Screen name="run-summary" options={{ presentation: "modal" }} />
      <Stack.Screen name="calendar-track" options={{ presentation: "fullScreenModal" }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [i18nReady, setI18nReady] = useState(false);
  const [i18nError, setI18nError] = useState<string | null>(null);

  useEffect(() => {
    initI18n()
      .then(() => setI18nReady(true))
      .catch((e) => {
        console.error("Erro ao inicializar i18n:", e);
        setI18nError("Erro ao carregar configurações de idioma.");
      });
  }, []);

  if (!i18nReady) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        {i18nError ? (
          <Text style={{ color: "red" }}>{i18nError}</Text>
        ) : (
          <ActivityIndicator size="large" />
        )}
        <Text style={{ marginTop: 10 }}>Carregando idioma...</Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <I18nextProvider i18n={i18n}>
          <ThemeProvider>
            <SafeAreaProvider>
              <AppProvider>
                <RootNavigator />
                <StatusBar style="auto" />
              </AppProvider>
            </SafeAreaProvider>
          </ThemeProvider>
        </I18nextProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}