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
import { Ionicons } from "@expo/vector-icons";
import { MetricItem } from "@/components/metric-item";
import { MapView } from "@/components/map-view";
import { ShareRunModal } from "@/components/share-run-modal";

MapboxGL.setAccessToken(Constants.expoConfig?.extra?.MAPBOX_PUBLIC_TOKEN ?? "");

export default function RunSummaryScreen() {
  const { t } = useTranslation();
  const { runId } = useLocalSearchParams<{ runId: string }>();
  const { state, dispatch } = useApp();
  const colors = useColors();

  const run = state.runs.find((r) => r.id === runId);
  const currentDay = state.runs.length;
  const goalDays = state.goalDays;
  const styles = RunSummaryStyles(colors);

  const phoenixScale = useRef(new Animated.Value(0)).current;
  const phoenixRotate = useRef(new Animated.Value(0)).current;
  const confettiOpacity = useRef(new Animated.Value(0)).current;
  const metricsSlide = useRef(new Animated.Value(60)).current;
  const metricsOpacity = useRef(new Animated.Value(0)).current;

  const [adWatched, setAdWatched] = useState(false);
  const [showShare, setShowShare] = useState(false);

  const { showAd, loaded } = useRewardedAd(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    dispatch({ type: "ADD_GEMS", payload: 25 });
    setAdWatched(true);
    Alert.alert(t("ad_reward_title"), t("ad_reward_message"));
  });

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

  if (!run) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, marginBottom: 60 }]}>
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
        <View style={[styles.celebrationHeader]}>

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
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <Text style={[styles.metricsTitle, { color: colors.foreground, marginBottom: 0 }]}>📊 {t("run_summary_title")}</Text>
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowShare(true);
                }}
                style={{
                  flexDirection: "row", alignItems: "center", gap: 4,
                  backgroundColor: "#FF8C5A" + "22", borderRadius: 20,
                  paddingHorizontal: 10, paddingVertical: 6,
                }}
              >
                <Ionicons name="share-outline" size={16} color="#FF8C5A" />
                <Text style={{ color: "#FF8C5A", fontSize: 13, fontWeight: "600" }}>{t("celebration_share")}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.metricsGrid}>
              <MetricItem label={t("metric_distance")} value={`${(run.distance / 1000).toFixed(2)} km`} emoji="📍" colors={colors} />
              <MetricItem label={t("metric_pace")} value={`${formatPace(run.pace)} min/km`} emoji="⚡" colors={colors} />
              <MetricItem label={t("metric_duration")} value={formatDuration(run.duration)} emoji="⏱️" colors={colors} />
              <MetricItem label={t("metric_calories")} value={`${run.calories} kcal`} emoji="🔥" colors={colors} />
            </View>
          </View>

          {/* ── Mapa da rota com Mapbox ── */}
          <MapView todayRun={run} type="home" />

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

      {/* Modal de compartilhamento */}
      {run && (
        <ShareRunModal
          run={run}
          visible={showShare}
          onClose={() => setShowShare(false)}
        />
      )}
    </View>
  );
}