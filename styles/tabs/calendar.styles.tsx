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
