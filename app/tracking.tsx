import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
  AppState,
} from "react-native";
import MapboxGL from "@rnmapbox/maps";
import Constants from "expo-constants";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import { useKeepAwake } from "expo-keep-awake";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/use-colors";
import { TrackingStyles } from "@/styles/tracking.styles";
import { BannerAd, BannerAdSize } from "react-native-google-mobile-ads";
import { BANNER_AD_UNIT_ID } from "@/hooks/use-ads";
import { formatDuration, formatPace } from "@/utils/tabs";
import { haversineDistance, estimateCalories } from "@/utils/tracking";
import { RunRecord } from "@/interfaces/context";
import {
  startBackgroundLocation,
  stopBackgroundLocation,
  setLocationUpdateCallback,
} from "@/hooks/background-tracking";
import {
  showRunNotification,
  dismissRunNotification,
  ACTION_PAUSE,
  ACTION_RESUME,
  ACTION_FINISH,
} from "@/hooks/run-notification";

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
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const notifIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastLocationRef = useRef<{ latitude: number; longitude: number } | null>(null);
  const distanceRef = useRef(0);
  const durationRef = useRef(0);
  const routeRef = useRef<Array<{ latitude: number; longitude: number }>>([]);
  const isPausedRef = useRef(false);
  const isRunningRef = useRef(false);

  // ── Helper único pra mandar a notif com o estado atual ─────────────────────
  const pushNotif = useCallback(() => {
    showRunNotification({
      durationSeconds: durationRef.current,
      distanceMeters: distanceRef.current,
      isPaused: isPausedRef.current,
    });
  }, []);

  // ── Permissão de FOREGROUND no mount ───────────────────────────────────────
  // Importante: não pedimos background aqui. Background no Android 11+ exige que o
  // usuário vá em Configurações; pedir aqui causaria um warn imediato mesmo após
  // ele autorizar. Pedimos sob demanda quando ele clica em Iniciar.
  useEffect(() => {
    (async () => {
      const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
      if (fgStatus !== "granted") {
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

    // Limpeza ao sair da tela sem finalizar
    return () => {
      stopAll();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Re-checagem de permissão ao voltar do background ──────────────────────
  // Se a corrida está rodando e ficou sem bg permission, e o usuário foi às
  // Configurações e voltou, tentamos religar o background tracking.
  useEffect(() => {
    const sub = AppState.addEventListener("change", async (nextState) => {
      if (nextState !== "active") return;
      if (!isRunningRef.current || isPausedRef.current) return;

      const { status } = await Location.getBackgroundPermissionsAsync();
      if (status === "granted") {
        // Já estava rodando? Reinicia o background com a permissão nova.
        try {
          await stopBackgroundLocation();
          await startBackgroundLocation();
        } catch (e) {
          console.warn("[Tracking] Falha ao re-iniciar bg location:", e);
        }
      }
    });
    return () => sub.remove();
  }, []);

  // ── Garantir permissão de background antes do start ───────────────────────
  // Retorna true se pode iniciar (com ou sem bg). Só BLOQUEIA se foreground falhar.
  const ensureBackgroundPermission = useCallback(async (): Promise<boolean> => {
    // Já temos bg granted? beleza
    const current = await Location.getBackgroundPermissionsAsync();
    if (current.status === "granted") return true;

    // Tenta pedir — no Android 11+ isso só redireciona pra Configurações.
    const requested = await Location.requestBackgroundPermissionsAsync();
    if (requested.status === "granted") return true;

    // Não rolou — pergunta se quer abrir as Configurações ou seguir só foreground.
    return new Promise<boolean>((resolve) => {
      Alert.alert(
        "Permissão de localização em segundo plano",
        "Para o app continuar contando sua corrida com a tela apagada, vá em " +
        "Configurações → DriRun → Localização e escolha \"Permitir o tempo todo\". " +
        "Você pode iniciar agora mesmo sem isso, mas a contagem só funciona com o app aberto.",
        [
          {
            text: "Iniciar mesmo assim",
            onPress: () => resolve(true),
          },
          {
            text: "Abrir Configurações",
            onPress: async () => {
              await Linking.openSettings();
              resolve(true); // Volta no AppState listener pra rechecar
            },
          },
          {
            text: "Cancelar",
            style: "cancel",
            onPress: () => resolve(false),
          },
        ]
      );
    });
  }, []);

  // ── Para tudo ──────────────────────────────────────────────────────────────
  const stopAll = useCallback(async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (notifIntervalRef.current) clearInterval(notifIntervalRef.current);
    timerRef.current = null;
    notifIntervalRef.current = null;
    isRunningRef.current = false;
    isPausedRef.current = false;
    setLocationUpdateCallback(null);
    await stopBackgroundLocation();
    await dismissRunNotification();
  }, []);

  // ── Pausar/Retomar ─────────────────────────────────────────────────────────
  const togglePause = useCallback(() => {
    if (!isRunningRef.current) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

    if (isPausedRef.current) {
      // Retomar
      isPausedRef.current = false;
      setIsPaused(false);
      timerRef.current = setInterval(() => {
        durationRef.current += 1;
        setDuration((d) => d + 1);
        // Atualiza a notif a cada tick — assim o tempo aparece vivo na barra.
        pushNotif();
      }, 1000);
    } else {
      // Pausar
      isPausedRef.current = true;
      setIsPaused(true);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    // Atualiza imediatamente pra trocar título e botões
    pushNotif();
  }, [pushNotif]);

  // ── Finalizar corrida ──────────────────────────────────────────────────────
  const confirmFinish = useCallback(async () => {
    await stopAll();

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

    const finalDuration = durationRef.current;
    const finalDistance = distanceRef.current;
    const finalRoute = routeRef.current;

    const paceSecondsPerKm =
      finalDistance > 0 ? finalDuration / (finalDistance / 1000) : 0;

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
  }, [stopAll, state.profile, dispatch]);

  const cancelRun = useCallback(async () => {
    await stopAll();
    router.back();
  }, [stopAll]);

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
      t("tracking_finish_confirm_message", {
        distance: (distanceRef.current / 1000).toFixed(2),
      }),
      [
        { text: t("tracking_continue"), style: "cancel" },
        { text: t("tracking_finish"), onPress: confirmFinish },
      ]
    );
  }, [cancelRun, confirmFinish, t]);

  // ── Iniciar corrida ────────────────────────────────────────────────────────
  const startRun = useCallback(async () => {
    if (!hasPermission) {
      Alert.alert(t("tracking_permission_title"), t("tracking_permission_msg"));
      return;
    }

    // Pergunta sobre bg aqui (e não no mount) — assim quem volta das Configurações
    // já entra com permissão fresh.
    const canStart = await ensureBackgroundPermission();
    if (!canStart) return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setIsRunning(true);
    setIsPaused(false);
    setDuration(0);
    setDistance(0);
    setRoute([]);
    isRunningRef.current = true;
    isPausedRef.current = false;
    distanceRef.current = 0;
    durationRef.current = 0;
    routeRef.current = [];
    lastLocationRef.current = null;

    // Mostra a notif imediatamente (0 km · 00:00) — o usuário já vê na barra.
    await showRunNotification({
      durationSeconds: 0,
      distanceMeters: 0,
      isPaused: false,
    });

    // Timer do cronômetro — atualiza a notif a cada segundo.
    timerRef.current = setInterval(() => {
      if (isPausedRef.current) return;
      durationRef.current += 1;
      setDuration((d) => d + 1);
      pushNotif();
    }, 1000);

    // Callback que recebe localização do background task
    setLocationUpdateCallback((coords: any) => {
      if (isPausedRef.current) return; // ignora updates enquanto pausado

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

      cameraRef.current?.setCamera({
        centerCoordinate: [coords.longitude, coords.latitude],
        zoomLevel: 16,
        animationDuration: 500,
      });

      // Atualiza a notif assim que entra um novo ponto — pra distância subir vivo.
      pushNotif();
    });

    // Inicia task de background (substitui watchPositionAsync)
    await startBackgroundLocation();
  }, [hasPermission, t, pushNotif, ensureBackgroundPermission]);

  // ── Listener dos botões da notificação ─────────────────────────────────────
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const action = response.actionIdentifier;
      switch (action) {
        case ACTION_PAUSE:
        case ACTION_RESUME:
          togglePause();
          break;
        case ACTION_FINISH:
          finishRun();
          break;
        default:
          break;
      }
    });
    return () => sub.remove();
  }, [togglePause, finishRun]);

  // ── Métricas calculadas ────────────────────────────────────────────────────
  const currentPace = distance > 0 ? duration / (distance / 1000) : 0;
  const formattedPace = formatPace(currentPace);
  const formattedDuration = formatDuration(duration);
  const formattedDistance = (distance / 1000).toFixed(2);

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

          <MapboxGL.UserLocation visible />

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

          {route.length > 0 && (
            <MapboxGL.PointAnnotation
              id="startMarker"
              coordinate={[route[0].longitude, route[0].latitude]}
            >
              <View style={{
                width: 16, height: 16, borderRadius: 8,
                backgroundColor: "green", borderWidth: 2, borderColor: "#fff",
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
