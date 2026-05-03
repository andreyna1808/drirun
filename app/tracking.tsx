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
  showRunActiveNotification,
  dismissRunActiveNotification,
} from "@/hooks/run-notification";

MapboxGL.setAccessToken(Constants.expoConfig?.extra?.MAPBOX_PUBLIC_TOKEN ?? "");

export default function TrackingScreen() {
  useKeepAwake();

  const { t } = useTranslation();
  const { state, dispatch } = useApp();
  const colors = useColors();
  const cameraRef = useRef<MapboxGL.Camera>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [duration, setDuration] = useState(0);
  const [distance, setDistance] = useState(0);
  const [route, setRoute] = useState<Array<{ latitude: number; longitude: number }>>([]);
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState(false);

  // Refs para evitar closures stale
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isFinishingRef = useRef(false);
  const lastLocationRef = useRef<{ latitude: number; longitude: number } | null>(null);
  const distanceRef = useRef(0);
  const durationRef = useRef(0);
  const routeRef = useRef<Array<{ latitude: number; longitude: number }>>([]);
  const isPausedRef = useRef(false);
  const isRunningRef = useRef(false);
  const lastUiUpdateRef = useRef(0);

  // ── Timer local ───────────────────────────────────────────────────────────
  // Fica aqui no componente — o background-tracking não precisa mais saber de tempo.
  const runStartTimeRef  = useRef(0);
  const totalPausedMsRef = useRef(0);
  const pauseStartRef    = useRef(0);

  const getElapsedSeconds = useCallback((): number => {
    if (runStartTimeRef.current === 0) return 0;
    const pausedSoFar = isPausedRef.current
      ? totalPausedMsRef.current + (Date.now() - pauseStartRef.current)
      : totalPausedMsRef.current;
    return Math.max(0, Math.floor((Date.now() - runStartTimeRef.current - pausedSoFar) / 1000));
  }, []);

  // ── Permissão de FOREGROUND no mount ───────────────────────────────────────
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
  }, []);

  // ── Ressincronização ao voltar do background ──────────────────────────────
  useEffect(() => {
    const sub = AppState.addEventListener("change", async (nextState) => {
      if (nextState !== "active") return;
      if (!isRunningRef.current) return;

      if (!isPausedRef.current) {
        const elapsed = getElapsedSeconds();
        durationRef.current = elapsed;
        setDuration(elapsed);
      }
      setDistance(distanceRef.current);

      if (isPausedRef.current) return;

      // Re-checa bg permission e reinicia o tracking se necessário
      await new Promise((r) => setTimeout(r, 400));
      const { status } = await Location.getBackgroundPermissionsAsync();
      if (status === "granted") {
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
  const ensureBackgroundPermission = useCallback(async (): Promise<boolean> => {
    // Já temos bg granted? beleza
    const current = await Location.getBackgroundPermissionsAsync();
    if (current.status === "granted") return true;

    // Tenta pedir — no Android 11+ redireciona pra Configurações.
    const requested = await Location.requestBackgroundPermissionsAsync();
    if (requested.status === "granted") return true;

    // Não rolou — pergunta se quer abrir as Configurações ou seguir só foreground.
    return new Promise<boolean>((resolve) => {
      Alert.alert(
        "Permissão de localização em segundo plano",
        "Para o app continuar contando sua corrida com a tela apagada, vá em " +
        "Configurações → DriRun → Localização e escolha \"Permitir o tempo todo\". " +
        "Depois volte aqui e clique em Iniciar de novo.\n\n" +
        "Você pode iniciar agora mesmo sem isso, mas a contagem só funciona com o app aberto.",
        [
          {
            text: "Iniciar mesmo assim",
            onPress: () => resolve(true),
          },
          {
            text: "Abrir Configurações",
            onPress: () => {
              resolve(false);
              Linking.openSettings().catch((e) =>
                console.warn("[Tracking] openSettings falhou:", e)
              );
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
    timerRef.current = null;
    isRunningRef.current = false;
    isPausedRef.current = false;
    setLocationUpdateCallback(null);
    await stopBackgroundLocation();
    dismissRunActiveNotification();
  }, []);

  // ── Pausar/Retomar ─────────────────────────────────────────────────────────
  const togglePause = useCallback(() => {
    if (!isRunningRef.current) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

    if (isPausedRef.current) {
      totalPausedMsRef.current += Date.now() - pauseStartRef.current;
      pauseStartRef.current = 0;
      isPausedRef.current = false;
      setIsPaused(false);
      showRunActiveNotification(false);
      // Timer de UI — 100ms para não pular segundos
      timerRef.current = setInterval(() => {
        if (isPausedRef.current) return;
        const elapsed = getElapsedSeconds();
        if (elapsed !== durationRef.current) {
          durationRef.current = elapsed;
          setDuration(elapsed);
        }
      }, 100);
    } else {
      // Pausar — marca o instante de início da pausa
      pauseStartRef.current = Date.now();
      isPausedRef.current = true;
      setIsPaused(true);
      showRunActiveNotification(true);
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    }
  }, [getElapsedSeconds]);

  // ── Finalizar corrida ──────────────────────────────────────────────────────
  const confirmFinish = useCallback(() => {
    if (isFinishingRef.current) return;
    isFinishingRef.current = true;

    // 1. Captura dados ANTES de parar qualquer coisa
    const finalDuration = getElapsedSeconds();
    const finalDistance = distanceRef.current;
    const finalRoute = routeRef.current;

    // 2. Para os timers locais imediatamente (síncrono, sem await)
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    isRunningRef.current = false;
    setLocationUpdateCallback(null);

    // 3. Mostra overlay + haptic — usuário vê feedback visual imediato
    setIsFinishing(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

    // 4. Salva o registro
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

    // 5. Breve delay pra overlay aparecer, depois navega
    setTimeout(() => {
      router.replace(`/run-summary?runId=${runRecord.id}` as any);
    }, 600);

    // 6. Cleanup do GPS e notificação em background
    stopBackgroundLocation().catch(console.warn);
    dismissRunActiveNotification().catch(console.warn);
  }, [state.profile, dispatch]);

  const cancelRun = useCallback(async () => {
    await stopAll();
    router.back();
  }, [stopAll]);

  const finishRun = useCallback(() => {
    if (distanceRef.current < 10) {
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

    // Pede permissão de notificação — necessária para a sobreposição da corrida aparecer.
    // Fazemos aqui (não no boot) para o usuário entender o contexto do pedido.
    const { status: notifStatus } = await Notifications.requestPermissionsAsync();
    if (notifStatus !== "granted") {
      Alert.alert(
        "Notificações desativadas",
        "Ative as notificações para ver o cronômetro e a distância na barra de status durante a corrida.",
        [
          { text: "Abrir configurações", onPress: () => Linking.openSettings() },
          { text: "Continuar sem notificação" },
        ]
      );
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
    isFinishingRef.current = false;
    distanceRef.current = 0;
    durationRef.current = 0;
    routeRef.current = [];
    lastLocationRef.current = null;

    // Inicia o timer local baseado em timestamp.
    runStartTimeRef.current  = Date.now();
    totalPausedMsRef.current = 0;
    pauseStartRef.current    = 0;

    // Notificação estática — aparece imediatamente e fica até o fim da corrida.
    showRunActiveNotification(false);

    // Timer de UI — roda a cada 100ms mas só atualiza o display quando o segundo
    // efetivamente muda. Isso resolve o problema de o setInterval de 1000ms pular
    // segundos quando o JS thread está ocupado renderizando o mapa.
    timerRef.current = setInterval(() => {
      if (isPausedRef.current) return;
      const elapsed = getElapsedSeconds();
      if (elapsed !== durationRef.current) {
        durationRef.current = elapsed;
        setDuration(elapsed);
      }
    }, 100);

    // Callback que recebe localização do background task
    setLocationUpdateCallback((coords: any) => {
      if (isPausedRef.current) return; // ignora updates enquanto pausado

      // ── Distância: sempre calculada por ponto (precisão máxima) ────────────
      if (lastLocationRef.current) {
        const delta = haversineDistance(
          lastLocationRef.current.latitude,
          lastLocationRef.current.longitude,
          coords.latitude,
          coords.longitude
        );
        if (delta < 50) {
          distanceRef.current += delta;
        }
      }
      lastLocationRef.current = coords;
      routeRef.current.push(coords); // O(1) — sem copiar o array inteiro a cada ponto

      // ── UI (mapa, rota, câmera): throttled a 2s ────────────────────────────
      // Renderizar a linha do Mapbox a cada GPS update (~1s) bloqueia o JS thread
      // e impede o setInterval de 100ms de disparar na hora certa, causando o
      // "pulo" de segundos no cronômetro. Com 2s o mapa ainda parece fluido mas
      // o timer pode respirar entre os renders.
      const now = Date.now();
      if (now - lastUiUpdateRef.current > 2000) {
        lastUiUpdateRef.current = now;
        setCurrentLocation(coords);
        setDistance(distanceRef.current);
        setRoute([...routeRef.current]);
        cameraRef.current?.setCamera({
          centerCoordinate: [coords.longitude, coords.latitude],
          zoomLevel: 16,
          animationDuration: 500,
        });
      }
    });

    // Inicia task de background. Se falhar (ex: app entrou em background, permissão
    // revogada no meio do caminho, etc), a gente NÃO derruba a corrida — só loga.
    // O timer + a UI continuam funcionando enquanto o app estiver em foreground.
    try {
      await startBackgroundLocation();
    } catch (e) {
      console.warn("[Tracking] startBackgroundLocation falhou — seguindo só em foreground:", e);
      Alert.alert(
        "Rastreamento limitado",
        "Não consegui ativar o rastreamento em segundo plano agora. " +
        "Sua corrida vai contar enquanto o app estiver aberto. " +
        "Se você concedeu a permissão, tente parar e iniciar novamente."
      );
    }
  }, [hasPermission, t, ensureBackgroundPermission]);

  // ── Métricas calculadas ────────────────────────────────────────────────────
  const currentPace = distance > 0 ? duration / (distance / 1000) : 0;
  const formattedPace = formatPace(currentPace);
  const formattedDuration = formatDuration(duration);
  // Mostra metros quando < 1 km (ex: "350 m"), km quando >= 1 km (ex: "1.23 km")
  const formattedDistance = distance < 1000
    ? `${Math.round(distance)} m`
    : `${(distance / 1000).toFixed(2)} km`;

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

      {/* Overlay de finalização */}
      {isFinishing && (
        <View style={{
          position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: colors.background + "EE",
          justifyContent: "center", alignItems: "center", gap: 16,
        }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ color: colors.foreground, fontSize: 18, fontWeight: "600" }}>
            Finalizando corrida...
          </Text>
        </View>
      )}
    </View>
  );
}
