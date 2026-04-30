import {
    StyleSheet,
} from "react-native";

export const SettingsProfileStyles = (colors: any) => {
    return StyleSheet.create({
        content: { padding: 20 },
        title: { fontSize: 24, fontWeight: "800", color: colors.foreground, marginBottom: 24 },
        label: { color: colors.muted, marginBottom: 6, fontSize: 13, fontWeight: "600", marginTop: 12 },
        input: {
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 10,
            padding: 14,
            fontSize: 16,
            color: colors.foreground,
        },
        sexRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
        sexBtn: {
            flex: 1,
            paddingVertical: 10,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.surface,
            alignItems: "center",
        },
        sexText: { fontSize: 14, fontWeight: "600", color: colors.foreground },
        saveBtn: {
            backgroundColor: colors.primary,
            borderRadius: 12,
            paddingVertical: 16,
            alignItems: "center",
            marginTop: 32,
        },
        saveText: { color: "#FFF", fontWeight: "700", fontSize: 16 },
    });
}
