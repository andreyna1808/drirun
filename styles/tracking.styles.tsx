import {
    Dimensions,
    StyleSheet,
} from "react-native";

const { height } = Dimensions.get("window");

export const TrackingStyles = (colors: any) => {
    return StyleSheet.create({
        container: {
            flex: 1,
        },
        errorContainer: {
            padding: 10,
            backgroundColor: "red",
            alignItems: "center",
        },
        errorText: {
            color: "white",
            fontWeight: "bold",
        },
        map: {
            width: "100%",
            height: height * 0.52,
        },
        mapPlaceholder: {
            width: "100%",
            height: height * 0.52,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "#e0e0e0",
        },
        mapPlaceholderText: {
            marginTop: 10,
        },
        metricsContainer: {
            flexDirection: "row",
            justifyContent: "space-around",
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: "#ccc",
        },
        metricItem: {
            alignItems: "center",
        },
        metricValue: {
            fontSize: 20,
            fontWeight: "bold",
        },
        metricLabel: {
            fontSize: 12,
            marginTop: 2,
        },
        controlsContainer: {
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 20,
        },
        controlButton: {
            paddingVertical: 12,
            paddingHorizontal: 24,
            borderRadius: 30,
            width: "100%",
            alignItems: "center",
            marginBottom: 8,
        },
        controlButtonText: {
            color: "white",
            fontSize: 16,
            fontWeight: "bold",
        },
        startButton: {
            // backgroundColor: colors.primary, // Cor definida no componente
        },
        runningControls: {
            flexDirection: "row",
            justifyContent: "space-around",
            width: "100%",
        },
        pauseButton: {
            flex: 1,
            marginRight: 10,
            // backgroundColor: colors.accent,
        },
        finishButton: {
            flex: 1,
            marginLeft: 10,
            // backgroundColor: colors.danger,
        },
        adBanner: { maxHeight: 80, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border, alignItems: "center", justifyContent: "center" },
    });
};