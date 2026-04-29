import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { useApp } from "@/context/AppContext";

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