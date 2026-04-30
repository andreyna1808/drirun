import { View, Text } from "react-native";

export const RunMetricRow = ({ label, value, colors, isLast = false }: { label: string; value: string; colors: any; isLast?: boolean }) => {
    return (
        <View style={{
            flexDirection: "row",
            justifyContent: "space-between",
            paddingVertical: 12,
            borderBottomWidth: isLast ? 0 : 1,
            borderBottomColor: colors.border,
        }}>
            <Text style={{ color: colors.muted, fontSize: 14 }}>{label}</Text>
            <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: "600" }}>{value}</Text>
        </View>
    );
}

