import { useEffect } from "react";
import { View, ActivityIndicator, Platform } from "react-native";
import { router } from "expo-router";
import { useApp } from "@/context/AppContext";
import * as Notifications from "expo-notifications";

export default function HomeScreen() {
    const { state, isLoading } = useApp();

    // Setup das notificações dentro do componente — evita side-effects no top-level do
    // módulo, que podem derrubar o boot se o nativo do expo-notifications não estiver
    // disponível.
    //
    // ⚠ NÃO pedir permissão aqui. A permissão de notificação SÓ deve ser solicitada
    // quando o usuário explicitamente clicar em "Ativar notificações" no onboarding
    // (ou em alguma outra tela que justifique o pedido). Pedir no boot do app é
    // anti-padrão — derruba a taxa de aceitação e assusta o usuário.
    //
    // Aqui só fazemos config silenciosa: handler de exibição e canal Android.
    useEffect(() => {
        if (Platform.OS === "web") return;

        try {
            Notifications.setNotificationHandler({
                // shouldShowAlert foi descontinuado em favor de banner/list — usar
                // ambos cobre todas as plataformas e remove o warn do console.
                handleNotification: async () => ({
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
