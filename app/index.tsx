import { useEffect } from "react";
import { View, ActivityIndicator, Platform } from "react-native";
import { router } from "expo-router";
import { useApp } from "@/context/AppContext";
import * as Notifications from "expo-notifications";

// ESSENCIAL — define como exibir notificações
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
});

// ESSENCIAL para Android — cria o canal
if (Platform.OS === "android") {
    Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
        sound: "default",
    });
}

export default function HomeScreen() {
    const { state, isLoading } = useApp();

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