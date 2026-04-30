/**
 * run-summary.tsx
 * Tela de celebracao pos-corrida do DriRun.
 * Exibe: animacao da Fenix feliz, metricas da corrida, progresso da meta,
 * gemas ganhas e opcao de assistir anuncio para ganhar mais gemas.
 */
import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  Animated,
  Alert,
  Platform,
} from "react-native";
import { MapFallback } from "@/components/MapViewWrapper";
// Importacao condicional para evitar erro no web
const MapView = Platform.OS !== "web" ? require("react-native-maps").default : null;
const Polyline = Platform.OS !== "web" ? require("react-native-maps").Polyline : null;
const Marker = Platform.OS !== "web" ? require("react-native-maps").Marker : null;
import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/use-colors";
import { RunSummaryStyles } from "@/styles/run-summary.styles";

const { width } = Dimensions.get("window");

/** Formata segundos em string legivel */
function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}min`;
  if (m > 0) return `${m}min ${s}s`;
  return `${s}s`;
}

/** Formata pace em min:ss /km */
function formatPace(paceSecondsPerKm: number): string {
  if (!isFinite(paceSecondsPerKm) || paceSecondsPerKm <= 0) return "--:--";
  const m = Math.floor(paceSecondsPerKm / 60);
  const s = Math.round(paceSecondsPerKm % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** Calcula o dia atual da meta (quantos dias ja foram concluidos) */
function getCurrentGoalDay(runs: any[], goalStartDate: string | null): number {
  if (!goalStartDate) return 0;
  const start = new Date(goalStartDate);
  const today = new Date();
  const diff = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return Math.min(diff + 1, runs.length);
}

export default function RunSummaryScreen() {
  const { runId } = useLocalSearchParams<{ runId: string }>();
  const { state, dispatch } = useApp();
  const colors = useColors();

  // Animacoes
  const phoenixScale = useRef(new Animated.Value(0)).current;
  const phoenixRotate = useRef(new Animated.Value(0)).current;
  const confettiOpacity = useRef(new Animated.Value(0)).current;
  const metricsSlide = useRef(new Animated.Value(60)).current;
  const metricsOpacity = useRef(new Animated.Value(0)).current;

  const [adWatched, setAdWatched] = useState(false);

  // Busca os dados da corrida pelo ID
  const run = state.runs.find((r) => r.id === runId);

  // Dia atual da meta
  const currentDay = state.runs.length;
  const goalDays = state.goalDays;

  // Haptic e animacao de entrada
  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Animacao da Fenix: aparece com bounce
    Animated.sequence([
      Animated.spring(phoenixScale, {
        toValue: 1.2,
        tension: 100,
        friction: 5,
        useNativeDriver: true,
      }),
      Animated.spring(phoenixScale, {
        toValue: 1,
        tension: 80,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // Confetti aparece
    Animated.timing(confettiOpacity, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();

    // Metricas deslizam de baixo
    Animated.parallel([
      Animated.timing(metricsSlide, {
        toValue: 0,
        duration: 500,
        delay: 300,
        useNativeDriver: true,
      }),
      Animated.timing(metricsOpacity, {
        toValue: 1,
        duration: 500,
        delay: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Rotacao suave da Fenix
    Animated.loop(
      Animated.sequence([
        Animated.timing(phoenixRotate, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(phoenixRotate, {
          toValue: -1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(phoenixRotate, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const rotateInterpolate = phoenixRotate.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ["-10deg", "0deg", "10deg"],
  });

  /** Simula assistir anuncio para ganhar 50 gemas extras */
  function handleWatchAd() {
    if (adWatched) {
      Alert.alert("Ja assistido!", "Voce ja ganhou o bonus de hoje.");
      return;
    }
    Alert.alert(
      "Assistir Anuncio?",
      "Assista um anuncio curto e ganhe +50 💎 de bonus!",
      [
        { text: "Agora nao", style: "cancel" },
        {
          text: "Assistir e ganhar 50 💎",
          onPress: () => {
            // TODO: Integrar com expo-ads-admob para producao
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            dispatch({ type: "ADD_GEMS", payload: 50 });
            setAdWatched(true);
            Alert.alert("Parabens! 💎", "+50 gemas adicionadas ao seu saldo!");
          },
        },
      ]
    );
  }

  // Calcula o bounding box do mapa
  const route = run?.route ?? [];
  const hasRoute = route.length > 1;
  const mapRegion = hasRoute ? {
    latitude: (Math.max(...route.map((p) => p.latitude)) + Math.min(...route.map((p) => p.latitude))) / 2,
    longitude: (Math.max(...route.map((p) => p.longitude)) + Math.min(...route.map((p) => p.longitude))) / 2,
    latitudeDelta: Math.max(0.01, (Math.max(...route.map((p) => p.latitude)) - Math.min(...route.map((p) => p.latitude))) * 1.5),
    longitudeDelta: Math.max(0.01, (Math.max(...route.map((p) => p.longitude)) - Math.min(...route.map((p) => p.longitude))) * 1.5),
  } : {
    latitude: -5.7945,
    longitude: -35.211,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  const styles = RunSummaryStyles(colors);

  if (!run) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.muted }]}>Corrida nao encontrada.</Text>
        <TouchableOpacity onPress={() => router.replace("/(tabs)")}>
          <Text style={[styles.backLink, { color: colors.primary }]}>Voltar para o inicio</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* ── Cabecalho de celebracao ── */}
        <View style={[styles.celebrationHeader, { backgroundColor: colors.primary }]}>
          {/* Confetti animado */}
          <Animated.View style={[styles.confetti, { opacity: confettiOpacity }]}>
            <Text style={styles.confettiText}>🎊 🎉 🎊 🎉 🎊</Text>
          </Animated.View>

          {/* Fenix animada */}
          <Animated.View style={{
            transform: [
              { scale: phoenixScale },
              { rotate: rotateInterpolate },
            ],
          }}>
            <Text style={styles.phoenixEmoji}>🔥</Text>
          </Animated.View>

          {/* Titulo de celebracao */}
          <Text style={styles.celebrationTitle}>
            Incrivel! Dia {currentDay}/{goalDays} Concluido!
          </Text>
          <Text style={styles.celebrationSubtitle}>
            {state.profile?.name ?? "Atleta"}, voce e demais! 🏆
          </Text>

          {/* Badge de gemas ganhas */}
          <View style={styles.gemsEarned}>
            <Text style={styles.gemsEarnedText}>+25 💎 Gemas Ganhas!</Text>
          </View>

          {/* Progresso da meta */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[
                styles.progressFill,
                { width: `${Math.min(100, (currentDay / goalDays) * 100)}%` },
              ]} />
            </View>
            <Text style={styles.progressText}>
              {currentDay}/{goalDays} dias ({Math.round((currentDay / goalDays) * 100)}%)
            </Text>
          </View>
        </View>

        {/* ── Metricas da corrida ── */}
        <Animated.View style={{
          transform: [{ translateY: metricsSlide }],
          opacity: metricsOpacity,
        }}>
          <View style={[styles.metricsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.metricsTitle, { color: colors.foreground }]}>📊 Resumo da Corrida</Text>
            <View style={styles.metricsGrid}>
              <MetricItem
                label="Distancia"
                value={`${(run.distance / 1000).toFixed(2)} km`}
                emoji="📍"
                colors={colors}
              />
              <MetricItem
                label="Pace medio"
                value={`${formatPace(run.pace)} /km`}
                emoji="⚡"
                colors={colors}
              />
              <MetricItem
                label="Tempo total"
                value={formatDuration(run.duration)}
                emoji="⏱️"
                colors={colors}
              />
              <MetricItem
                label="Calorias"
                value={`${run.calories} kcal`}
                emoji="🔥"
                colors={colors}
              />
            </View>
          </View>

          {/* ── Mapa da rota ── */}
          {hasRoute && (
            <View style={[styles.mapCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.metricsTitle, { color: colors.foreground }]}>🗺️ Sua Rota</Text>
              {Platform.OS !== "web" && MapView ? (
                <MapView
                  style={styles.map}
                  region={mapRegion}
                  scrollEnabled={false}
                  zoomEnabled={false}
                >
                  {Polyline && (
                    <Polyline
                      coordinates={route}
                      strokeColor={colors.primary}
                      strokeWidth={4}
                    />
                  )}
                  {Marker && route.length > 0 && (
                    <>
                      <Marker coordinate={route[0]} title="Inicio" pinColor="green" />
                      <Marker coordinate={route[route.length - 1]} title="Fim" pinColor="red" />
                    </>
                  )}
                </MapView>
              ) : (
                <MapFallback />
              )}
            </View>
          )}

          {/* ── Bonus de anuncio ── */}
          {!adWatched && (
            <TouchableOpacity
              style={[styles.adButton, { backgroundColor: colors.warning + "20", borderColor: colors.warning }]}
              onPress={handleWatchAd}
            >
              <Text style={styles.adEmoji}>📺</Text>
              <View style={styles.adInfo}>
                <Text style={[styles.adTitle, { color: colors.foreground }]}>Ganhe mais 50 💎!</Text>
                <Text style={[styles.adSubtitle, { color: colors.muted }]}>Assista um anuncio curto</Text>
              </View>
              <Text style={[styles.adBadge, { backgroundColor: colors.warning, color: "#FFFFFF" }]}>+50 💎</Text>
            </TouchableOpacity>
          )}

          {adWatched && (
            <View style={[styles.adWatchedBadge, { backgroundColor: colors.success + "20", borderColor: colors.success }]}>
              <Text style={[styles.adWatchedText, { color: colors.success }]}>
                ✅ Bonus de anuncio ja coletado hoje!
              </Text>
            </View>
          )}

          {/* ── Mensagem motivacional ── */}
          <View style={[styles.motivationCard, { backgroundColor: colors.primary + "15", borderColor: colors.primary }]}>
            <Text style={[styles.motivationText, { color: colors.primary }]}>
              {currentDay >= goalDays
                ? "🏆 VOCE COMPLETOU O DESAFIO! Sua Fenix e livre!"
                : currentDay >= goalDays * 0.75
                ? "🔥 Incrivel! Voce esta nos 75%! A linha de chegada esta proxima!"
                : currentDay >= goalDays * 0.5
                ? "💪 Metade do caminho! Voce e consistente!"
                : currentDay >= 7
                ? "⚡ Uma semana completa! Habito formado!"
                : `🌱 Dia ${currentDay} concluido! Cada passo conta!`}
            </Text>
          </View>

          {/* ── Botao de voltar ── */}
          <TouchableOpacity
            style={[styles.homeButton, { backgroundColor: colors.primary }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.replace("/(tabs)");
            }}
          >
            <Text style={styles.homeButtonText}>🏠 Voltar ao Inicio</Text>
          </TouchableOpacity>

          <View style={{ height: 32 }} />
        </Animated.View>
      </ScrollView>
    </View>
  );
}

/** Componente de metrica individual */
function MetricItem({ label, value, emoji, colors }: { label: string; value: string; emoji: string; colors: any }) {
  return (
    <View style={{ alignItems: "center", flex: 1, minWidth: "45%", marginBottom: 16 }}>
      <Text style={{ fontSize: 24, marginBottom: 4 }}>{emoji}</Text>
      <Text style={{ fontSize: 20, fontWeight: "800", color: colors.foreground }}>{value}</Text>
      <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>{label}</Text>
    </View>
  );
}

