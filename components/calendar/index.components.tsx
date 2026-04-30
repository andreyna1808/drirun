import { View, Text } from "react-native";

export const StatBox = ({ value, label, color, colors }: { value: any; label: string; color: string; colors: any }) => {
    return (
        <View style={[{ flex: 1, alignItems: "center", padding: 8, borderRadius: 12, backgroundColor: color + "15", marginHorizontal: 3 }]}>
            <Text style={{ fontSize: 20, fontWeight: "800", color }}>{value}</Text>
            <Text style={{ fontSize: 11, color: colors.muted, marginTop: 2 }}>{label}</Text>
        </View>
    );
}

export const LegendItem = ({ color, emoji, label }: { color: string; emoji: string; label: string }) => {
    return (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Text style={{ fontSize: 14 }}>{emoji}</Text>
            <Text style={{ fontSize: 12, color }}>{label}</Text>
        </View>
    );
}