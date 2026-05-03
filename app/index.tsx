import { useEffect } from "react";
import { View, ActivityIndicator, Platform } from "react-native";
import { router } from "expo-router";
import { useApp } from "@/context/AppContext";
import * as Notifications from "expo-notifications";

export default function HomeScreen() {
    const { state, isLoading } = useApp();

    useEffect(() => {
        if (Platform.OS === "web") return;

        try {
            Notifications.setNotificationHandler({
                handleNotification: async (notification) => {
                    const isRunNotif = notification.request.identifier === "run-active";
                    return {
                        shouldShowBanner: !isRunNotif,
                        shouldShowList: true,
                        shouldPlaySound: !isRunNotif,
                        shouldSetBadge: false,
                    };
                },
            });
        } catch (e) {
            console.warn("[Notif] setNotificationHandler falhou:", e);
        }

        if (Platform.OS === "android") {
            // Canal padrão para alertas e mensagens normais
            Notifications.setNotificationChannelAsync("default", {
                name: "Geral",
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: "#FF231F7C",
            }).catch((e) => console.warn("[Notif] canal default falhou:", e));

            // Canal dedicado para a corrida ativa — LOW importance = sem som,
            // sem banner pop-up, mas aparece e atualiza normalmente na gaveta.
            Notifications.setNotificationChannelAsync("run-tracking", {
                name: "Corrida ativa",
                importance: Notifications.AndroidImportance.LOW,
                sound: null,
                vibrationPattern: undefined,
                enableVibrate: false,
            }).catch((e) => console.warn("[Notif] canal run-tracking falhou:", e));
        }
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
