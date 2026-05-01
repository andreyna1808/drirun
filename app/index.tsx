import { useEffect } from "react";
import { View, ActivityIndicator, Platform } from "react-native";
import { router } from "expo-router";
import { useApp } from "@/context/AppContext";
import * as Notifications from "expo-notifications";

export default function HomeScreen() {
    const { state, isLoading } = useApp();

    // Setup das notificações dentro do componente — evita side-effects no top-level do
    // módulo, que podem derrubar o boot se o nativo do expo-notifications não estiver
    // disponível (ex: rodando em Expo Go em SDK 53+).
    useEffect(() => {
        if (Platform.OS === "web") return;

        try {
            Notifications.setNotificationHandler({
                handleNotification: async () => ({
                    shouldShowAlert: true,
                    shouldShowBanner: true,
                    shouldShowList: true,
                    shouldPlaySound: true,
                    shouldSetBadge: false,
                }),
            });
        } catch (e) {
            console.warn("[Notif] setNotificationHandler falhou:", e);
        }

        if (Platform.OS === "android") {
            Notifications.setNotificationChannelAsync("default", {
                name: "default",
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: "#FF231F7C",
            }).catch((e) => console.warn("[Notif] setNotificationChannelAsync falhou:", e));
        }

        // Pede permissão de notificação no Android 13+ — sem isso, scheduleNotificationAsync
        // silenciosamente falha em devices novos.
        Notifications.getPermissionsAsync()
            .then(({ granted, canAskAgain }) => {
                if (!granted && canAskAgain) {
                    return Notifications.requestPermissionsAsync();
                }
            })
            .catch((e) => console.warn("[Notif] permissão falhou:", e));
    }, []);

    useEffect(() => {
        if (!isLoading) {
            if (state.isOnboarded) {
                router.replace("/(tabs)");
            } else {
                router.replace("/onboarding");
            }
        }
    }, [isLoading, state.isOnboarded]);

    return (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <ActivityIndicator size="large" />
        </View>
    );
}
