import React from "react";
import {
    View,
    Text,
} from "react-native";

export const SummaryCard = ({ label, value, colors }: { label: string; value: string; colors: any }) => {
    return (
        <View style={{
            flex: 1,
            backgroundColor: colors.surface,
            borderRadius: 12,
            padding: 12,
            alignItems: "center",
            marginHorizontal: 3,
            borderWidth: 1,
            borderColor: colors.border,
        }}>
            <Text style={{ fontSize: 20, fontWeight: "800", color: colors.primary }}>{value}</Text>
            <Text style={{ fontSize: 11, color: colors.muted, marginTop: 2 }}>{label}</Text>
        </View>
    );
}
