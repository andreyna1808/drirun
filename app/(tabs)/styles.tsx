
import React, { useEffect } from "react";
import {
    StyleSheet,
} from "react-native";

export const LoggedStyles = (colors: any) => {
    return StyleSheet.create({
        scroll: { flex: 1 },
        scrollContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20 },
        header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
        greeting: { fontSize: 22, fontWeight: "800", color: colors.foreground },
        date: { fontSize: 13, color: colors.muted, marginTop: 2, textTransform: "capitalize" },
        streakBadge: { flexDirection: "row", alignItems: "center", backgroundColor: colors.primary + "20", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, gap: 4 },
        streakEmoji: { fontSize: 18 },
        streakCount: { fontSize: 18, fontWeight: "800", color: colors.primary },
        progressCard: { backgroundColor: colors.surface, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: colors.border },
        progressHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
        progressLabel: { fontSize: 14, color: colors.muted, fontWeight: "600" },
        progressPercent: { fontSize: 14, color: colors.primary, fontWeight: "700" },
        progressBarBg: { height: 8, backgroundColor: colors.border, borderRadius: 4, marginBottom: 6 },
        progressBarFill: { height: 8, backgroundColor: colors.primary, borderRadius: 4 },
        progressSub: { fontSize: 12, color: colors.muted },
        doneCard: { backgroundColor: colors.success + "15", borderRadius: 20, padding: 24, alignItems: "center", marginBottom: 20, borderWidth: 1, borderColor: colors.success + "40" },
        doneEmoji: { fontSize: 48, marginBottom: 12 },
        doneTitle: { fontSize: 20, fontWeight: "800", color: colors.foreground, textAlign: "center", marginBottom: 8 },
        doneSub: { fontSize: 14, color: colors.muted, textAlign: "center", lineHeight: 20 },
        startCard: { backgroundColor: colors.surface, borderRadius: 20, padding: 24, alignItems: "center", marginBottom: 20, borderWidth: 1, borderColor: colors.border },
        phraseText: { fontSize: 15, color: colors.foreground, fontStyle: "italic", textAlign: "center", marginBottom: 20, lineHeight: 22 },
        startButton: { backgroundColor: colors.primary, borderRadius: 20, paddingVertical: 18, paddingHorizontal: 48, marginBottom: 12, shadowColor: colors.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 },
        startButtonText: { color: "#FFFFFF", fontSize: 18, fontWeight: "800", letterSpacing: 0.5 },
        startHint: { fontSize: 12, color: colors.muted },
        section: { marginBottom: 20 },
        sectionTitle: { fontSize: 17, fontWeight: "700", color: colors.foreground, marginBottom: 12 },
        todayRunCard: { backgroundColor: colors.surface, borderRadius: 16, paddingHorizontal: 16, borderWidth: 1, borderColor: colors.border },
        recentRunCard: { backgroundColor: colors.surface, borderRadius: 12, padding: 14, flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8, borderWidth: 1, borderColor: colors.border },
        recentRunDate: { fontSize: 13, color: colors.muted, textTransform: "capitalize", marginBottom: 2 },
        recentRunDistance: { fontSize: 18, fontWeight: "700", color: colors.foreground },
        recentRunPace: { fontSize: 14, fontWeight: "600", color: colors.primary },
        recentRunTime: { fontSize: 13, color: colors.muted },
        adBanner: { height: 50, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border, alignItems: "center", justifyContent: "center" },
        adText: { fontSize: 12, color: colors.muted },
    });
}