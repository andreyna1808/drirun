import {
    Dimensions,
    StyleSheet,
} from "react-native";

const { width } = Dimensions.get("window");

export const COLUMNS = 7;
export const GRID_PADDING = 20;
export const CELL_GAP = 4;
export const CELL_SIZE = Math.floor(
    (width - GRID_PADDING * 2 - CELL_GAP * (COLUMNS - 1)) / COLUMNS
);


export const CalendarStyles = (colors: any) => {
    return StyleSheet.create({
        content: { padding: GRID_PADDING },
        sectionTitle: { fontSize: 20, fontWeight: "800", marginBottom: 12 },
        bmiCard: {
            borderRadius: 20,
            padding: 20,
            borderWidth: 1,
            marginBottom: 8,
        },
        bmiValueRow: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 16,
        },
        bmiValueContainer: { alignItems: "flex-start" },
        bmiValue: { fontSize: 48, fontWeight: "900", lineHeight: 52 },
        bmiUnit: { fontSize: 13, marginTop: 2 },
        bmiCategoryBadge: {
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            paddingHorizontal: 14,
            paddingVertical: 8,
            borderRadius: 12,
        },
        bmiCategoryEmoji: { fontSize: 20 },
        bmiCategoryLabel: { fontSize: 14, fontWeight: "700" },
        bmiBarContainer: {
            flexDirection: "row",
            height: 12,
            borderRadius: 6,
            overflow: "visible",
            marginBottom: 4,
            position: "relative",
        },
        bmiBarSegment: { flex: 1, height: 12 },
        bmiIndicator: {
            position: "absolute",
            top: -4,
            width: 20,
            height: 20,
            borderRadius: 10,
            borderWidth: 2,
            borderColor: "#FFFFFF",
            marginLeft: -10,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
            elevation: 4,
        },
        bmiLegend: {
            flexDirection: "row",
            justifyContent: "space-between",
            marginTop: 8,
            marginBottom: 12,
        },
        bmiLegendItem: { fontSize: 10 },
        bmiProfileRow: {
            flexDirection: "row",
            justifyContent: "space-around",
            paddingTop: 12,
            borderTopWidth: 1,
        },
        bmiProfileItem: { fontSize: 13 },
        noBmiText: { fontSize: 14, textAlign: "center", paddingVertical: 16 },
        statsRow: { flexDirection: "row", marginBottom: 12 },
        legendRow: {
            flexDirection: "row",
            gap: 16,
            marginBottom: 16,
            justifyContent: "center",
        },
        grid: {
            flexDirection: "row",
            flexWrap: "wrap",
            gap: CELL_GAP,
        },
        dayCell: {
            borderRadius: 8,
            alignItems: "center",
            justifyContent: "center",
        },
        dayCellEmoji: { fontSize: CELL_SIZE * 0.45 },
        dayCellNumber: { fontSize: CELL_SIZE * 0.3, fontWeight: "600" },
        emptyCard: {
            borderRadius: 16,
            padding: 32,
            borderWidth: 1,
            alignItems: "center",
            gap: 12,
        },
        emptyEmoji: { fontSize: 48 },
        emptyText: { fontSize: 14, textAlign: "center", lineHeight: 20 },
    });
}


export const BmiStyles = (colors: any) => {
    return StyleSheet.create({
        scroll: { flex: 1 },
        content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20 },
        title: { fontSize: 24, fontWeight: "800", color: colors.foreground, marginBottom: 4 },
        subtitle: { fontSize: 14, color: colors.muted, marginBottom: 20 },
        inputRow: { flexDirection: "row", gap: 12, marginBottom: 12 },
        inputGroup: { flex: 1 },
        inputLabel: { fontSize: 11, fontWeight: "700", color: colors.muted, marginBottom: 6, letterSpacing: 0.5 },
        input: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 12, fontSize: 18, fontWeight: "700", textAlign: "center" },
        updateButton: { backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 12, alignItems: "center", marginBottom: 20 },
        updateButtonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
        gaugeContainer: { alignItems: "center", marginBottom: 20, position: "relative" },
        bmiValueContainer: { position: "absolute", bottom: 0, alignItems: "center" },
        bmiValue: { fontSize: 40, fontWeight: "900" },
        bmiLabel: { fontSize: 13, color: colors.muted, fontWeight: "600" },
        categoryCard: { borderRadius: 16, padding: 20, alignItems: "center", marginBottom: 16, borderWidth: 1.5 },
        categoryEmoji: { fontSize: 36, marginBottom: 8 },
        categoryLabel: { fontSize: 20, fontWeight: "800", marginBottom: 4 },
        categoryRange: { fontSize: 13, color: colors.muted, marginBottom: 8 },
        categoryDescription: { fontSize: 14, color: colors.foreground, textAlign: "center", lineHeight: 20 },
        idealWeightCard: { backgroundColor: colors.surface, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: colors.border, alignItems: "center" },
        idealWeightTitle: { fontSize: 15, fontWeight: "700", color: colors.foreground, marginBottom: 4 },
        idealWeightValue: { fontSize: 24, fontWeight: "800", color: colors.success, marginBottom: 4 },
        idealWeightSub: { fontSize: 12, color: colors.muted },
        idealWeightDiff: { fontSize: 13, fontWeight: "600", marginTop: 4 },
        adviceCard: { backgroundColor: colors.primary + "10", borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: colors.primary + "30" },
        adviceTitle: { fontSize: 15, fontWeight: "700", color: colors.foreground, marginBottom: 8 },
        adviceText: { fontSize: 14, color: colors.foreground, lineHeight: 20 },
        referenceCard: { backgroundColor: colors.surface, borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: colors.border },
        referenceTitle: { fontSize: 14, fontWeight: "700", color: colors.muted, padding: 12, paddingBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 },
        referenceRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
        referenceDot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
        referenceLabel: { flex: 1, fontSize: 13, color: colors.muted },
        referenceRange: { fontSize: 12, color: colors.muted },
        emptyContainer: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40, paddingTop: 60 },
        emptyEmoji: { fontSize: 64, marginBottom: 16 },
        emptyTitle: { fontSize: 22, fontWeight: "700", color: colors.foreground, marginBottom: 8 },
        emptyText: { fontSize: 15, color: colors.muted, textAlign: "center", lineHeight: 22 },
    });
}