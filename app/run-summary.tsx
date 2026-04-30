import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Animated,
  Alert,
} from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/use-colors";
import { RunSummaryStyles } from "@/styles/run-summary.styles";
import { useRewardedAd } from "@/hooks/use-ads";
import { formatDuration, formatPace } from "@/utils/tabs";
import { MetricItem } from "@/components/metric-item";

export default function RunSummaryScreen() {
  const { t } = useTranslation();
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

  const { showAd, loaded } = useRewardedAd(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    dispatch({ type: "ADD_GEMS", payload: 25 }); // 25 gemas
    setAdWatched(true);
    Alert.alert(t("ad_reward_title"), t("ad_reward_message"));
  });

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
      Alert.alert(t("ad_already_watched_title"), t("ad_already_watched_message"));
      return;
    }

    if (!loaded) {
      Alert.alert(t("ad_not_ready_title"), t("ad_not_ready_message"));
      return;
    }

    Alert.alert(
      t("watch_ad_confirm_title"),
      t("watch_ad_confirm_message"),
      [
        { text: t("watch_ad_cancel"), style: "cancel" },
        {
          text: t("watch_ad_confirm_button"),
          onPress: () => showAd(),
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
        <Text style={[styles.errorText, { color: colors.muted }]}>{t("run_not_found")}</Text>
        <TouchableOpacity onPress={() => router.replace("/(tabs)")}>
          <Text style={[styles.backLink, { color: colors.primary }]}>{t("back_to_home")}</Text>
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
            {t("celebration_day_completed", { currentDay, goalDays })}
          </Text>
          <Text style={styles.celebrationSubtitle}>
            {t("celebration_praise", { name: state.profile?.name ?? t("athlete_default") })}
          </Text>

          {/* Badge de gemas ganhas */}
          <View style={styles.gemsEarned}>
            <Text style={styles.gemsEarnedText}>{t("gems_earned_badge")}</Text>
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
              {t("progress_text", { current: currentDay, total: goalDays, percent: Math.round((currentDay / goalDays) * 100) })}
            </Text>
          </View>
        </View>

        {/* ── Metricas da corrida ── */}
        <Animated.View style={{
          transform: [{ translateY: metricsSlide }],
          opacity: metricsOpacity,
        }}>
          <View style={[styles.metricsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.metricsTitle, { color: colors.foreground }]}>📊 {t("run_summary_title")}</Text>
            <View style={styles.metricsGrid}>
              <MetricItem
                label={t("metric_distance")}
                value={`${(run.distance / 1000).toFixed(2)} km`}
                emoji="📍"
                colors={colors}
              />
              <MetricItem
                label={t("metric_pace")}
                value={`${formatPace(run.pace)} /km`}
                emoji="⚡"
                colors={colors}
              />
              <MetricItem
                label={t("metric_duration")}
                value={formatDuration(run.duration)}
                emoji="⏱️"
                colors={colors}
              />
              <MetricItem
                label={t("metric_calories")}
                value={`${run.calories} kcal`}
                emoji="🔥"
                colors={colors}
              />
            </View>
          </View>

          {/* ── Mapa da rota ── */}
          {hasRoute && (
            <View style={[styles.mapCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.metricsTitle, { color: colors.foreground }]}>🗺️ {t("route_title")}</Text>
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
                    <Marker coordinate={route[0]} title={t("marker_start")} pinColor="green" />
                    <Marker coordinate={route[route.length - 1]} title={t("marker_end")} pinColor="red" />
                  </>
                )}
              </MapView>
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
                <Text style={[styles.adTitle, { color: colors.foreground }]}>{t("ad_bonus_title")}</Text>
                <Text style={[styles.adSubtitle, { color: colors.muted }]}>{t("ad_bonus_subtitle")}</Text>
              </View>
              <Text style={[styles.adBadge, { backgroundColor: colors.warning, color: "#FFFFFF" }]}>+25 💎</Text>
            </TouchableOpacity>
          )}

          {adWatched && (
            <View style={[styles.adWatchedBadge, { backgroundColor: colors.success + "20", borderColor: colors.success }]}>
              <Text style={[styles.adWatchedText, { color: colors.success }]}>
                {t("ad_already_collected")}
              </Text>
            </View>
          )}

          {/* ── Mensagem motivacional ── */}
          <View style={[styles.motivationCard, { backgroundColor: colors.primary + "15", borderColor: colors.primary }]}>
            <Text style={[styles.motivationText, { color: colors.primary }]}>
              {currentDay >= goalDays
                ? t("motivation_complete")
                : currentDay >= goalDays * 0.75
                  ? t("motivation_75")
                  : currentDay >= goalDays * 0.5
                    ? t("motivation_50")
                    : currentDay >= 7
                      ? t("motivation_7days")
                      : t("motivation_default", { currentDay })}
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
            <Text style={styles.homeButtonText}>{t("back_home_button")}</Text>
          </TouchableOpacity>

          <View style={{ height: 32 }} />
        </Animated.View>
      </ScrollView>
    </View>
  );
}