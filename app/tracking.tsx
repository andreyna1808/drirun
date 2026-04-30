import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import MapboxGL from "@rnmapbox/maps";
import Constants from "expo-constants";
import * as Location from "expo-location";
import { useKeepAwake } from "expo-keep-awake";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { useApp, RunRecord } from "@/context/AppContext";
import { useColors } from "@/hooks/use-colors";
import { TrackingStyles } from "@/styles/tracking.styles";
import { BannerAd, BannerAdSize } from "react-native-google-mobile-ads";
import { BANNER_AD_UNIT_ID } from "@/hooks/use-ads";
import { formatDuration, formatPace } from "@/utils/tabs";
import { haversineDistance, estimateCalories } from "@/utils/tracking";

// Inicializa o Mapbox com o token público
MapboxGL.setAccessToken(Constants.expoConfig?.extra?.MAPBOX_PUBLIC_TOKEN ?? "");

export default function TrackingScreen() {
  useKeepAwake();

  const { t } = useTranslation();
  const { state, dispatch } = useApp();
  const colors = useColors();
  const cameraRef = useRef<MapboxGL.Camera>(null);

  // ── Estado da corrida ──────────────────────────────────────────────────────
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [distance, setDistance] = useState(0);
  const [route, setRoute] = useState<Array<{ latitude: number; longitude: number }>>([]);
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState(false);

  // Refs para evitar closures stale
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastLocationRef = useRef<{ latitude: number; longitude: number } | null>(null);
  const distanceRef = useRef(0);
  const durationRef = useRef(0);
  const routeRef = useRef<Array<{ latitude: number; longitude: number }>>([]);

  // ── Permissão de localização ───────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setLocationError(t("tracking_permission_denied"));
        return;
      }
      setHasPermission(true);

      try {
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        const coords = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        };
        setCurrentLocation(coords);
        cameraRef.current?.setCamera({
          centerCoordinate: [coords.longitude, coords.latitude],
          zoomLevel: 15,
          animationDuration: 500,
        });
      } catch (e) {
        console.error("Erro ao obter localização inicial:", e);
      }
    })();

    return () => {
      locationSubscription.current?.remove();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // ── Iniciar corrida ────────────────────────────────────────────────────────
  const startRun = useCallback(async () => {
    if (!hasPermission) {
      Alert.alert(t("tracking_permission_title"), t("tracking_permission_msg"));
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsRunning(true);
    setIsPaused(false);
    setDuration(0);
    setDistance(0);
    setRoute([]);
    distanceRef.current = 0;
    durationRef.current = 0;
    routeRef.current = [];
    lastLocationRef.current = null;

    timerRef.current = setInterval(() => {
      durationRef.current += 1;
      setDuration((d) => d + 1);
    }, 1000);

    locationSubscription.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 2000,
        distanceInterval: 5,
      },
      (location) => {
        const coords = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };

        setCurrentLocation(coords);

        if (lastLocationRef.current) {
          const delta = haversineDistance(
            lastLocationRef.current.latitude,
            lastLocationRef.current.longitude,
            coords.latitude,
            coords.longitude
          );
          if (delta < 50) {
            distanceRef.current += delta;
            setDistance(distanceRef.current);
          }
        }

        lastLocationRef.current = coords;
        routeRef.current = [...routeRef.current, coords];
        setRoute([...routeRef.current]);

        // Centraliza câmera na posição atual
        cameraRef.current?.setCamera({
          centerCoordinate: [coords.longitude, coords.latitude],
          zoomLevel: 16,
          animationDuration: 500,
        });
      }
    );
  }, [hasPermission, t]);

  // ── Pausar/Retomar ─────────────────────────────────────────────────────────
  const togglePause = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isPaused) {
      setIsPaused(false);
      timerRef.current = setInterval(() => {
        durationRef.current += 1;
        setDuration((d) => d + 1);
      }, 1000);
    } else {
      setIsPaused(true);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [isPaused]);

  // ── Finalizar corrida ──────────────────────────────────────────────────────
  const confirmFinish = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    locationSubscription.current?.remove();

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const finalDuration = durationRef.current;
    const finalDistance = distanceRef.current;
    const finalRoute = routeRef.current;

    const paceSecondsPerKm =
      finalDistance > 0 ? (finalDuration / (finalDistance / 1000)) : 0;

    const weightKg = state.profile?.weight ?? 70;
    const calories = estimateCalories(weightKg, finalDuration);

    const runRecord: RunRecord = {
      id: Date.now().toString(),
      date: new Date().toISOString().split("T")[0],
      duration: finalDuration,
      distance: finalDistance,
      pace: paceSecondsPerKm,
      calories,
      route: finalRoute,
    };

    dispatch({ type: "ADD_RUN", payload: runRecord });
    router.replace(`/run-summary?runId=${runRecord.id}` as any);
  }, [state.profile, dispatch]);

  const cancelRun = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    locationSubscription.current?.remove();
    router.back();
  }, []);

  const finishRun = useCallback(() => {
    if (distanceRef.current < 100) {
      Alert.alert(
        t("tracking_short_run_title"),
        t("tracking_short_run_message"),
        [
          { text: t("tracking_continue"), style: "cancel" },
          { text: t("tracking_cancel"), onPress: cancelRun, style: "destructive" },
        ]
      );
      return;
    }

    Alert.alert(
      t("tracking_finish_confirm_title"),
      t("tracking_finish_confirm_message", { distance: (distanceRef.current / 1000).toFixed(2) }),
      [
        { text: t("tracking_continue"), style: "cancel" },
        { text: t("tracking_finish"), onPress: confirmFinish },
      ]
    );
  }, [cancelRun, confirmFinish, t]);

  // ── Métricas calculadas ────────────────────────────────────────────────────
  const currentPace = distance > 0 ? duration / (distance / 1000) : 0;
  const formattedPace = formatPace(currentPace);
  const formattedDuration = formatDuration(duration);
  const formattedDistance = (distance / 1000).toFixed(2);

  // Converte rota para formato GeoJSON do Mapbox
  const routeGeoJSON: GeoJSON.Feature<GeoJSON.LineString> = {
    type: "Feature",
    geometry: {
      type: "LineString",
      coordinates: route.map((p) => [p.longitude, p.latitude]),
    },
    properties: {},
  };

  const styles = TrackingStyles(colors);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {locationError && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{locationError}</Text>
        </View>
      )}

      {hasPermission && currentLocation ? (
        <MapboxGL.MapView
          style={styles.map}
          styleURL={MapboxGL.StyleURL.Street}
          logoEnabled={false}
          attributionEnabled={false}
        >
          <MapboxGL.Camera
            ref={cameraRef}
            centerCoordinate={[currentLocation.longitude, currentLocation.latitude]}
            zoomLevel={15}
          />

          {/* Localização do usuário */}
          <MapboxGL.UserLocation visible />

          {/* Linha da rota */}
          {route.length > 1 && (
            <MapboxGL.ShapeSource id="routeSource" shape={routeGeoJSON}>
              <MapboxGL.LineLayer
                id="routeLine"
                style={{
                  lineColor: colors.primary,
                  lineWidth: 5,
                  lineCap: "round",
                  lineJoin: "round",
                }}
              />
            </MapboxGL.ShapeSource>
          )}

          {/* Marcador de início */}
          {route.length > 0 && (
            <MapboxGL.PointAnnotation
              id="startMarker"
              coordinate={[route[0].longitude, route[0].latitude]}
            >
              <View style={{
                width: 16, height: 16, borderRadius: 8,
                backgroundColor: "green", borderWidth: 2, borderColor: "#fff"
              }} />
            </MapboxGL.PointAnnotation>
          )}
        </MapboxGL.MapView>
      ) : (
        <View style={styles.mapPlaceholder}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.mapPlaceholderText, { color: colors.muted }]}>
            {t("tracking_waiting_gps")}
          </Text>
        </View>
      )}

      <View style={[styles.metricsContainer, { backgroundColor: colors.card }]}>
        <View style={styles.metricItem}>
          <Text style={[styles.metricValue, { color: colors.foreground }]}>{formattedDistance}</Text>
          <Text style={[styles.metricLabel, { color: colors.muted }]}>{t("tracking_distance")}</Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={[styles.metricValue, { color: colors.foreground }]}>{formattedDuration}</Text>
          <Text style={[styles.metricLabel, { color: colors.muted }]}>{t("tracking_time")}</Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={[styles.metricValue, { color: colors.foreground }]}>{formattedPace}</Text>
          <Text style={[styles.metricLabel, { color: colors.muted }]}>{t("tracking_pace")}</Text>
        </View>
      </View>

      <View style={styles.controlsContainer}>
        {!isRunning ? (
          <TouchableOpacity
            style={[styles.controlButton, styles.startButton, { backgroundColor: colors.primary }]}
            onPress={startRun}
          >
            <Text style={styles.controlButtonText}>{t("tracking_start")}</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.runningControls}>
            <TouchableOpacity
              style={[styles.controlButton, styles.pauseButton, { backgroundColor: colors.accent }]}
              onPress={togglePause}
            >
              <Text style={styles.controlButtonText}>
                {isPaused ? t("tracking_resume") : t("tracking_pause")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.controlButton, styles.finishButton, { backgroundColor: colors.error }]}
              onPress={finishRun}
            >
              <Text style={styles.controlButtonText}>{t("tracking_finish")}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {!state.hasRemovedAds && (
        <View style={styles.adBanner}>
          <BannerAd
            unitId={BANNER_AD_UNIT_ID}
            size={BannerAdSize.LARGE_ANCHORED_ADAPTIVE_BANNER}
            requestOptions={{ requestNonPersonalizedAdsOnly: true }}
          />
        </View>
      )}
    </View>
  );
}