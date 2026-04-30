import { View, Text } from "react-native";

export const LegendItem = ({ color, emoji, label }: { color: string; emoji: string; label: string }) => {
    return (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Text style={{ fontSize: 14 }}>{emoji}</Text>
            <Text style={{ fontSize: 12, color }}>{label}</Text>
        </View>
    );
}