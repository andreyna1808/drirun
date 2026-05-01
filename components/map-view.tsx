import React from "react";
import {
    View,
    Text,
} from "react-native";
import MapboxGL from "@rnmapbox/maps";
import Constants from "expo-constants";
import { useTranslation } from "react-i18next";
import { useColors } from "@/hooks/use-colors";
import { RunSummaryStyles } from "@/styles/run-summary.styles";
import { LoggedStyles } from "@/styles/tabs/styles";
import { IMapViewProps } from "@/interfaces/tabs";

MapboxGL.setAccessToken(Constants.expoConfig?.extra?.MAPBOX_PUBLIC_TOKEN ?? "");

export function MapView({ todayRun, type }: IMapViewProps) {
    const { t } = useTranslation()
    const colors = useColors();
    const loggedStyles = LoggedStyles(colors);
    const runSummaryStyles = RunSummaryStyles(colors);

    const todayRoute = todayRun?.route ?? [];
    const hasRoute = todayRoute.length > 1;

    const routeGeoJSON: GeoJSON.Feature<GeoJSON.LineString> = {
        type: "Feature",
        geometry: {
            type: "LineString",
            coordinates: todayRoute.map((p: any) => [p.longitude, p.latitude]),
        },
        properties: {},
    };

    const bounds = hasRoute ? {
        ne: [
            Math.max(...todayRoute.map((p: any) => p.longitude)),
            Math.max(...todayRoute.map((p: any) => p.latitude)),
        ],
        sw: [
            Math.min(...todayRoute.map((p: any) => p.longitude)),
            Math.min(...todayRoute.map((p: any) => p.latitude)),
        ],
        paddingTop: 40,
        paddingBottom: 40,
        paddingLeft: 40,
        paddingRight: 40,
    } : null;


    return hasRoute && type == "summary" ? (
        <View style={[runSummaryStyles.mapCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[runSummaryStyles.metricsTitle, { color: colors.foreground }]}>🗺️ {t("route_title")}</Text>
            <MapboxGL.MapView
                style={runSummaryStyles.map}
                styleURL={MapboxGL.StyleURL.Street}
                scrollEnabled={false}
                zoomEnabled={false}
                logoEnabled={false}
                attributionEnabled={false}
            >
                {bounds && (
                    <MapboxGL.Camera
                        bounds={bounds}
                        animationDuration={0}
                    />
                )}

                {/* Linha da rota */}
                <MapboxGL.ShapeSource id="summaryRoute" shape={routeGeoJSON}>
                    <MapboxGL.LineLayer
                        id="summaryLine"
                        style={{
                            lineColor: colors.primary,
                            lineWidth: 4,
                            lineCap: "round",
                            lineJoin: "round",
                        }}
                    />
                </MapboxGL.ShapeSource>

                {/* Marcador de início */}
                <MapboxGL.PointAnnotation
                    id="start"
                    coordinate={[todayRoute[0].longitude, todayRoute[0].latitude]}
                >
                    <View style={{
                        width: 14, height: 14, borderRadius: 7,
                        backgroundColor: "green", borderWidth: 2, borderColor: "#fff"
                    }} />
                </MapboxGL.PointAnnotation>

                {/* Marcador de fim */}
                <MapboxGL.PointAnnotation
                    id="end"
                    coordinate={[todayRoute[todayRoute.length - 1].longitude, todayRoute[todayRoute.length - 1].latitude]}
                >
                    <View style={{
                        width: 14, height: 14, borderRadius: 7,
                        backgroundColor: "red", borderWidth: 2, borderColor: "#fff"
                    }} />
                </MapboxGL.PointAnnotation>
            </MapboxGL.MapView>
        </View>
    ) : todayRun && hasRoute && type == "home" ? (
        <View style={[loggedStyles.section, { marginTop: 8 }]}>
            <Text style={loggedStyles.sectionTitle}>🗺️ {t("route_title")}</Text>
            <View style={{
                height: 200,
                borderRadius: 16,
                overflow: "hidden",
                borderWidth: 1,
                borderColor: colors.border,
            }}>
                <MapboxGL.MapView
                    style={{ flex: 1 }}
                    styleURL={MapboxGL.StyleURL.Street}
                    scrollEnabled={false}
                    zoomEnabled={false}
                    logoEnabled={false}
                    attributionEnabled={false}
                >
                    {bounds && (
                        <MapboxGL.Camera
                            bounds={bounds}
                            animationDuration={0}
                        />
                    )}

                    <MapboxGL.ShapeSource id="homeRoute" shape={routeGeoJSON}>
                        <MapboxGL.LineLayer
                            id="homeLine"
                            style={{
                                lineColor: colors.primary,
                                lineWidth: 4,
                                lineCap: "round",
                                lineJoin: "round",
                            }}
                        />
                    </MapboxGL.ShapeSource>

                    {/* Início */}
                    <MapboxGL.PointAnnotation
                        id="homeStart"
                        coordinate={[todayRoute[0].longitude, todayRoute[0].latitude]}
                    >
                        <View style={{
                            width: 14, height: 14, borderRadius: 7,
                            backgroundColor: "green", borderWidth: 2, borderColor: "#fff"
                        }} />
                    </MapboxGL.PointAnnotation>

                    {/* Fim */}
                    <MapboxGL.PointAnnotation
                        id="homeEnd"
                        coordinate={[todayRoute[todayRoute.length - 1].longitude, todayRoute[todayRoute.length - 1].latitude]}
                    >
                        <View style={{
                            width: 14, height: 14, borderRadius: 7,
                            backgroundColor: "red", borderWidth: 2, borderColor: "#fff"
                        }} />
                    </MapboxGL.PointAnnotation>
                </MapboxGL.MapView>
            </View>
        </View>
    ) : null;

}