import {
    StyleSheet,
} from "react-native";

export const MetricsStyles = (colors: any) => {
    return StyleSheet.create({
        scroll: { flex: 1 },
        content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20 },
        title: {
            fontSize: 24,
            fontWeight: "800",
            color: colors.foreground,
            marginBottom: 16,
        },
        filterRow: {
            flexDirection: "row",
            backgroundColor: colors.surface,
            borderRadius: 12,
            padding: 4,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: colors.border,
        },
        filterButton: {
            flex: 1,
            paddingVertical: 8,
            borderRadius: 8,
            alignItems: "center",
        },
        filterButtonActive: {
            backgroundColor: colors.primary,
        },
        filterText: {
            fontSize: 13,
            fontWeight: "600",
            color: colors.muted,
        },
        filterTextActive: {
            color: "#FFFFFF",
        },
        summaryRow: {
            flexDirection: "row",
            marginBottom: 16,
        },
        emptyContainer: {
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            padding: 40,
        },
        emptyEmoji: {
            fontSize: 64,
            marginBottom: 16,
        },
        emptyTitle: {
            fontSize: 22,
            fontWeight: "700",
            color: colors.foreground,
            marginBottom: 8,
        },
        emptyText: {
            fontSize: 15,
            color: colors.muted,
            textAlign: "center",
            lineHeight: 22,
        },
        adBanner: { maxHeight: 180, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border, alignItems: "center", justifyContent: "center" },
    });
}
