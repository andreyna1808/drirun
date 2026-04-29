import { StyleSheet, } from "react-native";

export function createStyles(colors: any) {
    return StyleSheet.create({
        header: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
        },
        backButton: {
            width: 40,
            height: 40,
            alignItems: "center",
            justifyContent: "center",
        },
        backIcon: {
            fontSize: 24,
            fontWeight: "700",
        },
        headerTitle: {
            fontSize: 18,
            fontWeight: "700",
        },
        content: {
            padding: 20,
            paddingBottom: 40,
        },
        heroSection: {
            alignItems: "center",
            marginBottom: 24,
            paddingVertical: 20,
        },
        heroEmoji: {
            fontSize: 64,
            marginBottom: 8,
        },
        appName: {
            fontSize: 36,
            fontWeight: "900",
            letterSpacing: 3,
        },
        tagline: {
            fontSize: 15,
            marginTop: 4,
            letterSpacing: 1,
        },
        card: {
            borderRadius: 16,
            padding: 20,
            marginBottom: 16,
            borderWidth: 1,
        },
        cardTitle: {
            fontSize: 17,
            fontWeight: "700",
            marginBottom: 10,
        },
        cardText: {
            fontSize: 14,
            lineHeight: 22,
        },
        divider: {
            height: 1,
            marginVertical: 12,
        },
        videoButton: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            marginTop: 14,
            paddingVertical: 12,
            borderRadius: 12,
        },
        videoButtonIcon: {
            color: "#FFFFFF",
            fontSize: 16,
        },
        videoButtonText: {
            color: "#FFFFFF",
            fontSize: 15,
            fontWeight: "700",
        },
        socialButton: {
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            marginTop: 10,
            padding: 14,
            borderRadius: 12,
            borderWidth: 1,
        },
        socialIcon: {
            fontSize: 24,
        },
        socialInfo: {
            flex: 1,
        },
        socialName: {
            fontSize: 15,
            fontWeight: "600",
        },
        socialHandle: {
            fontSize: 12,
            marginTop: 2,
        },
        socialArrow: {
            fontSize: 18,
            fontWeight: "700",
        },
        techStack: {
            fontSize: 12,
            marginTop: 10,
            fontStyle: "italic",
        },
        version: {
            textAlign: "center",
            fontSize: 12,
            marginTop: 8,
            marginBottom: 16,
        },
        closeButton: {
            paddingVertical: 14,
            borderRadius: 12,
            alignItems: "center",
            borderWidth: 1,
        },
        closeButtonText: {
            fontSize: 15,
            fontWeight: "600",
        },
    });
}
