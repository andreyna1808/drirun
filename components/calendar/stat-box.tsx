import { View, Text } from "react-native";

export const StatBox = ({ value, label, color, colors }: { value: any; label: string; color: string; colors: any }) => {
    return (
        <View style={[{ flex: 1, alignItems: "center", padding: 8, borderRadius: 12, backgroundColor: color + "15", marginHorizontal: 3 }]}>
            <Text style={{ fontSize: 20, fontWeight: "800", color }}>{value}</Text>
            <Text style={{ fontSize: 11, color: colors.muted, marginTop: 2 }}>{label}</Text>
        </View>
    );
}
