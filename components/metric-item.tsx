import React from "react";
import {
    View,
    Text,
} from "react-native";

export const MetricItem = ({ label, value, emoji, colors }: { label: string; value: string; emoji: string; colors: any }) => {
    return (
        <View style={{ alignItems: "center", flex: 1, minWidth: "45%", marginBottom: 16 }}>
            <Text style={{ fontSize: 24, marginBottom: 4 }}>{emoji}</Text>
            <Text style={{ fontSize: 20, fontWeight: "800", color: colors.foreground }}>{value}</Text>
            <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>{label}</Text>
        </View>
    );
}