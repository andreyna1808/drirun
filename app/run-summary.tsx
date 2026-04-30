import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Animated,
  Alert,
} from "react-native";
import MapboxGL from "@rnmapbox/maps";
import Constants from "expo-constants";
import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/use-colors";
import { RunSummaryStyles } from "@/styles/run-summary.styles";
import { useRewardedAd } from "@/hooks/use-ads";
import { formatDuration, formatPace } from "@/utils/tabs";
import { MetricItem } from "@/components/metric-item";

MapboxGL.setAccessToken(Constants.expoConfig?.extra?.MAPBOX_PUBLIC_TOKEN ?? "");

export default function RunSummaryScreen() {
  const { t } = useTranslation();
  const { runId } = useLocalSearchParams<{ runId: string }>();
  const { state, dispatch } = useApp();
  const colors = useColors();

  const phoenixScale = useRef(new Animated.Value(0)).current;
  const phoenixRotate = useRef(new Animated.Value(0)).current;
  const confettiOpacity = useRef(new Animated.Value(0)).current;
  const metricsSlide = useRef(new Animated.Value(60)).current;
  const metricsOpacity = useRef(new Animated.Value(0)).current;

  const [adWatched, setAdWatched] = useState(false);

  const { showAd, loaded } = useRewardedAd(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    dispatch({ type: "ADD_GEMS", payload: 25 });
    setAdWatched(true);
    Alert.alert(t("ad_reward_title"), t("ad_reward_message"));
  });

  const run = state.runs.find((r) => r.id === runId);
  const currentDay = state.runs.length;
  const goalDays = state.goalDays;

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    Animated.sequence([
      Animated.spring(phoenixScale, { toValue: 1.2, tension: 100, friction: 5, useNativeDriver: true }),
      Animated.spring(phoenixScale, { toValue: 1, tension: 80, friction: 8, useNativeDriver: true }),
    ]).start();

    Animated.timing(confettiOpacity, { toValue: 1, duration: 400, useNativeDriver: true }).start();

    Animated.parallel([
      Animated.timing(metricsSlide, { toValue: 0, duration: 500, delay: 300, useNativeDriver: true }),
      Animated.timing(metricsOpacity, { toValue: 1, duration: 500, delay: 300, useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(phoenixRotate, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(phoenixRotate, { toValue: -1, duration: 2000, useNativeDriver: true }),
        Animated.timing(phoenixRotate, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const rotateInterpolate = phoenixRotate.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ["-10deg", "0deg", "10deg"],
  });

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
        { text: t("watch_ad_confirm_button"), onPress: () => showAd() },
      ]
    );
  }

  const route = run?.route ?? [];
  const hasRoute = route.length > 1;

  // GeoJSON da rota para o Mapbox
  const routeGeoJSON: GeoJSON.Feature<GeoJSON.LineString> = {
    type: "Feature",
    geometry: {
      type: "LineString",
      coordinates: route.map((p) => [p.longitude, p.latitude]),
    },
    properties: {},
  };

  // Bounding box para encaixar a rota na câmera
  const bounds = hasRoute ? {
    ne: [
      Math.max(...route.map((p) => p.longitude)),
      Math.max(...route.map((p) => p.latitude)),
    ],
    sw: [
      Math.min(...route.map((p) => p.longitude)),
      Math.min(...route.map((p) => p.latitude)),
    ],
    paddingTop: 30,
    paddingBottom: 30,
    paddingLeft: 30,
    paddingRight: 30,
  } : null;

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
        {/* ── Cabeçalho de celebração ── */}
        <View style={[styles.celebrationHeader, { backgroundColor: colors.primary }]}>
          <Animated.View style={[styles.confetti, { opacity: confettiOpacity }]}>
            <Text style={styles.confettiText}>🎊 🎉 🎊 🎉 🎊</Text>
          </Animated.View>

          <Animated.View style={{ transform: [{ scale: phoenixScale }, { rotate: rotateInterpolate }] }}>
            <Text style={styles.phoenixEmoji}>🔥</Text>
          </Animated.View>

          <Text style={styles.celebrationTitle}>
            {t("celebration_day_completed", { currentDay, goalDays })}
          </Text>
          <Text style={styles.celebrationSubtitle}>
            {t("celebration_praise", { name: state.profile?.name ?? t("athlete_default") })}
          </Text>

          <View style={styles.gemsEarned}>
            <Text style={styles.gemsEarnedText}>{t("gems_earned_badge")}</Text>
          </View>

          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${Math.min(100, (currentDay / goalDays) * 100)}%` }]} />
            </View>
            <Text style={styles.progressText}>
              {t("progress_text", { current: currentDay, total: goalDays, percent: Math.round((currentDay / goalDays) * 100) })}
            </Text>
          </View>
        </View>

        {/* ── Métricas ── */}
        <Animated.View style={{ transform: [{ translateY: metricsSlide }], opacity: metricsOpacity }}>
          <View style={[styles.metricsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.metricsTitle, { color: colors.foreground }]}>📊 {t("run_summary_title")}</Text>
            <View style={styles.metricsGrid}>
              <MetricItem label={t("metric_distance")} value={`${(run.distance / 1000).toFixed(2)} km`} emoji="📍" colors={colors} />
              <MetricItem label={t("metric_pace")} value={`${formatPace(run.pace)} /km`} emoji="⚡" colors={colors} />
              <MetricItem label={t("metric_duration")} value={formatDuration(run.duration)} emoji="⏱️" colors={colors} />
              <MetricItem label={t("metric_calories")} value={`${run.calories} kcal`} emoji="🔥" colors={colors} />
            </View>
          </View>

          {/* ── Mapa da rota com Mapbox ── */}
          {hasRoute && (
            <View style={[styles.mapCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.metricsTitle, { color: colors.foreground }]}>🗺️ {t("route_title")}</Text>
              <MapboxGL.MapView
                style={styles.map}
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
                  coordinate={[route[0].longitude, route[0].latitude]}
                >
                  <View style={{
                    width: 14, height: 14, borderRadius: 7,
                    backgroundColor: "green", borderWidth: 2, borderColor: "#fff"
                  }} />
                </MapboxGL.PointAnnotation>

                {/* Marcador de fim */}
                <MapboxGL.PointAnnotation
                  id="end"
                  coordinate={[route[route.length - 1].longitude, route[route.length - 1].latitude]}
                >
                  <View style={{
                    width: 14, height: 14, borderRadius: 7,
                    backgroundColor: "red", borderWidth: 2, borderColor: "#fff"
                  }} />
                </MapboxGL.PointAnnotation>
              </MapboxGL.MapView>
            </View>
          )}

          {/* ── Bônus de anúncio ── */}
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

          {/* ── Botão voltar ── */}
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