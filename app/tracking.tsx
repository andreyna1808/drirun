/**
 * tracking.tsx
 * Tela de rastreamento de corrida/caminhada em tempo real.
 * Usa GPS para mapear a rota, calcular distância, pace e kcal.
 * Funciona como o Strava — o usuário não pode burlar o check do dia
 * sem realmente iniciar e finalizar uma atividade.
 */

import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  Dimensions,
} from "react-native";
import { MapFallback } from "@/components/MapViewWrapper";

// Importação condicional para evitar erro no web
const MapView = Platform.OS !== "web" ? require("react-native-maps").default : null;
const Polyline = Platform.OS !== "web" ? require("react-native-maps").Polyline : null;
const Marker = Platform.OS !== "web" ? require("react-native-maps").Marker : null;
const PROVIDER_DEFAULT = Platform.OS !== "web" ? require("react-native-maps").PROVIDER_DEFAULT : null;
import * as Location from "expo-location";
import { useKeepAwake } from "expo-keep-awake";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useApp, RunRecord } from "@/context/AppContext";
import { useColors } from "@/hooks/use-colors";

const { width, height } = Dimensions.get("window");

// ─── Constantes de cálculo ────────────────────────────────────────────────────

/** MET (Metabolic Equivalent of Task) para corrida moderada */
const MET_RUNNING = 8.0;
/** MET para caminhada */
const MET_WALKING = 3.5;

/**
 * Calcula a distância em metros entre dois pontos GPS usando a fórmula de Haversine.
 */
function haversineDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371000; // raio da Terra em metros
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Estima as calorias gastas com base no peso, MET e tempo em horas.
 * Fórmula: kcal = MET × peso(kg) × tempo(h)
 */
function estimateCalories(weightKg: number, durationSeconds: number, met = MET_RUNNING): number {
  const hours = durationSeconds / 3600;
  return Math.round(met * weightKg * hours);
}

/**
 * Formata segundos em string MM:SS ou HH:MM:SS.
 */
function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/**
 * Formata o pace em min/km (ex: "5:30 /km").
 */
function formatPace(paceSecondsPerKm: number): string {
  if (!isFinite(paceSecondsPerKm) || paceSecondsPerKm <= 0) return "--:-- /km";
  const m = Math.floor(paceSecondsPerKm / 60);
  const s = Math.round(paceSecondsPerKm % 60);
  return `${m}:${String(s).padStart(2, "0")} /km`;
}

// ─── Componente ───────────────────────────────────────────────────────────────

export default function TrackingScreen() {
  // Mantém a tela sempre ligada durante a corrida
  useKeepAwake();

  const { state, dispatch } = useApp();
  const colors = useColors();
  const mapRef = useRef<any>(null);

  // ── Estado da corrida ──────────────────────────────────────────────────────
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0); // segundos
  const [distance, setDistance] = useState(0); // metros
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
        setLocationError("Permissão de localização negada. Ative nas configurações.");
        return;
      }
      setHasPermission(true);

      // Obtém a localização inicial para centralizar o mapa
      try {
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        const coords = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        };
        setCurrentLocation(coords);
        mapRef.current?.animateToRegion({
          ...coords,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        });
      } catch (e) {
        console.error("Erro ao obter localização inicial:", e);
      }
    })();

    return () => {
      // Limpa subscriptions ao desmontar
      locationSubscription.current?.remove();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // ── Iniciar corrida ────────────────────────────────────────────────────────

  const startRun = useCallback(async () => {
    if (!hasPermission) {
      Alert.alert("Permissão necessária", "Ative a localização para iniciar a corrida.");
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

    // Timer de duração (incrementa a cada segundo)
    timerRef.current = setInterval(() => {
      durationRef.current += 1;
      setDuration((d) => d + 1);
    }, 1000);

    // Subscreve às atualizações de localização GPS
    locationSubscription.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 2000,    // atualiza a cada 2 segundos
        distanceInterval: 5,   // ou a cada 5 metros
      },
      (location) => {
        const coords = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };

        setCurrentLocation(coords);

        // Calcula distância incremental
        if (lastLocationRef.current) {
          const delta = haversineDistance(
            lastLocationRef.current.latitude,
            lastLocationRef.current.longitude,
            coords.latitude,
            coords.longitude
          );
          // Filtra ruído GPS (ignora saltos maiores que 50m em 2 segundos)
          if (delta < 50) {
            distanceRef.current += delta;
            setDistance(distanceRef.current);
          }
        }

        lastLocationRef.current = coords;
        routeRef.current = [...routeRef.current, coords];
        setRoute([...routeRef.current]);

        // Centraliza o mapa na posição atual
        mapRef.current?.animateToRegion({
          ...coords,
          latitudeDelta: 0.003,
          longitudeDelta: 0.003,
        }, 500);
      }
    );
  }, [hasPermission]);

  // ── Pausar/Retomar ─────────────────────────────────────────────────────────

  const togglePause = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isPaused) {
      // Retomar
      setIsPaused(false);
      timerRef.current = setInterval(() => {
        durationRef.current += 1;
        setDuration((d) => d + 1);
      }, 1000);
    } else {
      // Pausar
      setIsPaused(true);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [isPaused]);

  // ── Finalizar corrida ──────────────────────────────────────────────────────

  const finishRun = useCallback(() => {
    // Distância mínima de 100m para validar a corrida
    if (distanceRef.current < 100) {
      Alert.alert(
        "Corrida muito curta",
        "Você precisa percorrer pelo menos 100 metros para registrar a atividade.",
        [{ text: "Continuar correndo" }, { text: "Cancelar", onPress: cancelRun, style: "destructive" }]
      );
      return;
    }

    Alert.alert(
      "Finalizar corrida?",
      `Distância: ${(distanceRef.current / 1000).toFixed(2)} km`,
      [
        { text: "Continuar", style: "cancel" },
        { text: "Finalizar", onPress: confirmFinish },
      ]
    );
  }, []);

  const confirmFinish = useCallback(() => {
    // Para o timer e a subscrição de localização
    if (timerRef.current) clearInterval(timerRef.current);
    locationSubscription.current?.remove();

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const finalDuration = durationRef.current;
    const finalDistance = distanceRef.current;
    const finalRoute = routeRef.current;

    // Calcula o pace médio em segundos por km
    const paceSecondsPerKm =
      finalDistance > 0 ? (finalDuration / (finalDistance / 1000)) : 0;

    // Estima as calorias com base no peso do usuário
    const weightKg = state.profile?.weight ?? 70;
    const calories = estimateCalories(weightKg, finalDuration);

    // Cria o registro da corrida
    const runRecord: RunRecord = {
      id: Date.now().toString(),
      date: new Date().toISOString().split("T")[0],
      duration: finalDuration,
      distance: finalDistance,
      pace: paceSecondsPerKm,
      calories,
      route: finalRoute,
    };

    // Salva a corrida no contexto global
    dispatch({ type: "ADD_RUN", payload: runRecord });

    // Navega para a tela de resumo passando os dados da corrida
    router.replace(`/run-summary?runId=${runRecord.id}` as any);
  }, [state.profile, dispatch]);

  const cancelRun = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    locationSubscription.current?.remove();
    router.back();
  }, []);

  // ── Métricas calculadas ────────────────────────────────────────────────────

  const distanceKm = distance / 1000;
  const paceSecondsPerKm = distance > 0 ? (duration / distanceKm) : 0;
  const weightKg = state.profile?.weight ?? 70;
  const calories = estimateCalories(weightKg, duration);

  const styles = createStyles(colors);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      {/* ── Mapa ── */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        showsUserLocation
        showsMyLocationButton={false}
        followsUserLocation={isRunning && !isPaused}
        initialRegion={
          currentLocation
            ? {
                ...currentLocation,
                latitudeDelta: 0.005,
                longitudeDelta: 0.005,
              }
            : {
                latitude: -5.795,
                longitude: -35.209,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
              }
        }
      >
        {/* Rota percorrida como polyline laranja */}
        {route.length > 1 && (
          <Polyline
            coordinates={route}
            strokeColor={colors.primary}
            strokeWidth={4}
          />
        )}

        {/* Marcador de início (verde) */}
        {route.length > 0 && (
          <Marker
            coordinate={route[0]}
            title="Início"
            pinColor="green"
          />
        )}
      </MapView>

      {/* ── Header com botão de fechar ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={cancelRun}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
        {isPaused && (
          <View style={styles.pausedBadge}>
            <Text style={styles.pausedBadgeText}>PAUSADO</Text>
          </View>
        )}
      </View>

      {/* ── HUD de métricas (sobreposto ao mapa) ── */}
      <View style={styles.hud}>
        {/* Tempo */}
        <View style={styles.hudMain}>
          <Text style={styles.hudMainValue}>{formatDuration(duration)}</Text>
          <Text style={styles.hudMainLabel}>Tempo</Text>
        </View>

        {/* Distância e Pace */}
        <View style={styles.hudRow}>
          <View style={styles.hudItem}>
            <Text style={styles.hudValue}>{distanceKm.toFixed(2)}</Text>
            <Text style={styles.hudLabel}>km</Text>
          </View>
          <View style={styles.hudDivider} />
          <View style={styles.hudItem}>
            <Text style={styles.hudValue}>{formatPace(paceSecondsPerKm)}</Text>
            <Text style={styles.hudLabel}>Pace</Text>
          </View>
          <View style={styles.hudDivider} />
          <View style={styles.hudItem}>
            <Text style={styles.hudValue}>{calories}</Text>
            <Text style={styles.hudLabel}>kcal</Text>
          </View>
        </View>

        {/* Botões de controle */}
        <View style={styles.controls}>
          {!isRunning ? (
            /* Botão de iniciar */
            <TouchableOpacity
              style={[styles.startButton, !hasPermission && styles.buttonDisabled]}
              onPress={startRun}
              disabled={!hasPermission}
            >
              <Text style={styles.startButtonText}>
                {locationError ? "Sem GPS" : "INICIAR"}
              </Text>
            </TouchableOpacity>
          ) : (
            /* Botões de pausar e finalizar */
            <View style={styles.runningControls}>
              <TouchableOpacity style={styles.pauseButton} onPress={togglePause}>
                <Text style={styles.pauseButtonText}>
                  {isPaused ? "▶" : "⏸"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.stopButton} onPress={finishRun}>
                <Text style={styles.stopButtonText}>FINALIZAR</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Mensagem de erro de localização */}
        {locationError && (
          <Text style={styles.errorText}>{locationError}</Text>
        )}
      </View>
    </View>
  );
}

// ─── Estilos ─────────────────────────────────────────────────────────────────

function createStyles(colors: any) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    map: {
      width,
      height: height * 0.55,
    },
    header: {
      position: "absolute",
      top: 56,
      left: 16,
      right: 16,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    closeButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: "rgba(0,0,0,0.5)",
      alignItems: "center",
      justifyContent: "center",
    },
    closeButtonText: {
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "700",
    },
    pausedBadge: {
      backgroundColor: colors.warning,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
    },
    pausedBadgeText: {
      color: "#FFFFFF",
      fontSize: 12,
      fontWeight: "700",
      letterSpacing: 1,
    },
    hud: {
      flex: 1,
      backgroundColor: colors.surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      marginTop: -24,
      paddingTop: 24,
      paddingHorizontal: 24,
      paddingBottom: 40,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 8,
    },
    hudMain: {
      alignItems: "center",
      marginBottom: 20,
    },
    hudMainValue: {
      fontSize: 56,
      fontWeight: "800",
      color: colors.foreground,
      letterSpacing: -2,
    },
    hudMainLabel: {
      fontSize: 14,
      color: colors.muted,
      fontWeight: "600",
      letterSpacing: 1,
      textTransform: "uppercase",
    },
    hudRow: {
      flexDirection: "row",
      justifyContent: "space-around",
      alignItems: "center",
      backgroundColor: colors.background,
      borderRadius: 16,
      padding: 16,
      marginBottom: 24,
    },
    hudItem: {
      alignItems: "center",
      flex: 1,
    },
    hudValue: {
      fontSize: 20,
      fontWeight: "700",
      color: colors.foreground,
    },
    hudLabel: {
      fontSize: 12,
      color: colors.muted,
      marginTop: 2,
    },
    hudDivider: {
      width: 1,
      height: 32,
      backgroundColor: colors.border,
    },
    controls: {
      alignItems: "center",
    },
    startButton: {
      backgroundColor: colors.primary,
      borderRadius: 40,
      paddingVertical: 20,
      paddingHorizontal: 60,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.4,
      shadowRadius: 12,
      elevation: 8,
    },
    buttonDisabled: {
      opacity: 0.5,
    },
    startButtonText: {
      color: "#FFFFFF",
      fontSize: 20,
      fontWeight: "800",
      letterSpacing: 2,
    },
    runningControls: {
      flexDirection: "row",
      gap: 16,
      alignItems: "center",
    },
    pauseButton: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: colors.warning,
      alignItems: "center",
      justifyContent: "center",
    },
    pauseButtonText: {
      fontSize: 24,
    },
    stopButton: {
      backgroundColor: colors.error,
      borderRadius: 40,
      paddingVertical: 18,
      paddingHorizontal: 48,
      shadowColor: colors.error,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
    },
    stopButtonText: {
      color: "#FFFFFF",
      fontSize: 18,
      fontWeight: "800",
      letterSpacing: 1,
    },
    errorText: {
      color: colors.error,
      fontSize: 13,
      textAlign: "center",
      marginTop: 12,
    },
  });
}
