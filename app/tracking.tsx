import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import MapView, { Polyline, Marker } from "react-native-maps";
import * as Location from "expo-location";
import { useKeepAwake } from "expo-keep-awake";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useApp, RunRecord } from "@/context/AppContext";
import { useColors } from "@/hooks/use-colors";
import { TrackingStyles } from "@/styles/tracking.styles";
import { BannerAd, BannerAdSize } from "react-native-google-mobile-ads";
import { BANNER_AD_UNIT_ID } from "@/hooks/use-ads";


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
  const mapRef = useRef<MapView>(null);

  console.log("OIEEEEEEEEEEEEEEEEEEEEEEEEE:", state);

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
  }, [cancelRun, confirmFinish]);

  // ── Métricas calculadas ────────────────────────────────────────────────────

  const currentPace = distance > 0 ? duration / (distance / 1000) : 0;
  const formattedPace = formatPace(currentPace);
  const formattedDuration = formatDuration(duration);
  const formattedDistance = (distance / 1000).toFixed(2);

  const styles = TrackingStyles(colors);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {locationError && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{locationError}</Text>
        </View>
      )}

      {hasPermission && currentLocation ? (
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={{
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          }}
          showsUserLocation
          followsUserLocation
          loadingEnabled
        >
          {route.length > 1 && (
            <Polyline
              coordinates={route}
              strokeWidth={5}
              strokeColor={colors.primary}
            />
          )}
          {currentLocation && (
            <Marker coordinate={currentLocation} />
          )}
        </MapView>
      ) : (
        <View style={styles.mapPlaceholder}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.mapPlaceholderText, { color: colors.muted }]}>Aguardando localização...</Text>
        </View>
      )}

      <View style={[styles.metricsContainer, { backgroundColor: colors.card }]}>
        <View style={styles.metricItem}>
          <Text style={[styles.metricValue, { color: colors.foreground }]}>{formattedDistance}</Text>
          <Text style={[styles.metricLabel, { color: colors.muted }]}>KM</Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={[styles.metricValue, { color: colors.foreground }]}>{formattedDuration}</Text>
          <Text style={[styles.metricLabel, { color: colors.muted }]}>Tempo</Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={[styles.metricValue, { color: colors.foreground }]}>{formattedPace}</Text>
          <Text style={[styles.metricLabel, { color: colors.muted }]}>Pace</Text>
        </View>
      </View>

      <View style={styles.controlsContainer}>
        {!isRunning ? (
          <TouchableOpacity style={[styles.controlButton, styles.startButton, { backgroundColor: colors.primary }]} onPress={startRun}>
            <Text style={styles.controlButtonText}>INICIAR</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.runningControls}>
            <TouchableOpacity style={[styles.controlButton, styles.pauseButton, { backgroundColor: colors.accent }]} onPress={togglePause}>
              <Text style={styles.controlButtonText}>{isPaused ? "RETOMAR" : "PAUSAR"}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.controlButton, styles.finishButton, { backgroundColor: colors.error }]} onPress={finishRun}>
              <Text style={styles.controlButtonText}>FINALIZAR</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {!state.hasRemovedAds && (
        <View style={styles.adBanner}>
          <BannerAd
            unitId={BANNER_AD_UNIT_ID}
            size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
            requestOptions={{ requestNonPersonalizedAdsOnly: true }}
          />
        </View>
      )}
    </View>
  );
}