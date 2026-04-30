import React from "react";
import {
    View,
    Text,
} from "react-native";

export const ChartCard = ({
    title, unit, children, totalValue, colors,
}: {
    title: string; unit?: string; children: React.ReactNode; totalValue?: string; colors: any;
}) => {
    return (
        <View style={{
            backgroundColor: colors.surface,
            borderRadius: 16,
            padding: 16,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: colors.border,
        }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
                <Text style={{ fontSize: 15, fontWeight: "700", color: colors.foreground }}>{title}</Text>
                {totalValue && (
                    <Text style={{ fontSize: 14, color: colors.primary, fontWeight: "600" }}>
                        {totalValue}{unit ? ` ${unit}` : ""}
                    </Text>
                )}
            </View>
            {children}
        </View>
    );
}
