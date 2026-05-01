import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Animated,
  ActivityIndicator,
} from "react-native";
import MapboxGL from "@rnmapbox/maps";
import Constants from "expo-constants";
import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/use-colors";
import { formatDuration, formatPace } from "@/utils/tabs";
import { MetricItem } from "@/components/metric-item";
import { MapView } from "@/components/map-view";
import { RunSummaryStyles } from "@/styles/run-summary.styles";
import { useRewardedAd } from "@/hooks/use-ads";

MapboxGL.setAccessToken(Constants.expoConfig?.extra?.MAPBOX_PUBLIC_TOKEN ?? "");

export default function CalendarTrackScreen() {
  const { t } = useTranslation();
  const { date } = useLocalSearchParams<{ date: string }>();
  const { state } = useApp();
  const colors = useColors();
  const styles = RunSummaryStyles(colors);

  const [adDone, setAdDone] = useState(false);

  const metricsSlide = useRef(new Animated.Value(60)).current;
  const metricsOpacity = useRef(new Animated.Value(0)).current;

  const { showAd, loaded: adLoaded } = useRewardedAd(() => {
    setAdDone(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  });

  // Assim que entrar na tela, tenta exibir o anúncio
  useEffect(() => {
    if (adLoaded) {
      showAd();
    } else {
      // Anúncio não carregou, mostra direto
      setAdDone(true);
    }
  }, [adLoaded]);

  // Animação entra após o ad
  useEffect(() => {
    if (!adDone) return;
    Animated.parallel([
      Animated.timing(metricsSlide, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(metricsOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, [adDone]);

  const run = state.runs.find((r) => r.date === date);

  // Qual número do dia na meta
  const dayNumber = state.runs
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
    .findIndex((r) => r.date === date) + 1;

  const formattedDate = new Date(date + "T12:00:00").toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Enquanto o anúncio não terminou
  if (!adDone) {
    return (
      <View style={{
        flex: 1,
        backgroundColor: colors.background,
        justifyContent: "center",
        alignItems: "center",
        gap: 16,
      }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.muted, fontSize: 14 }}>
          {t("loading_ad")}
        </Text>
      </View>
    );
  }

  if (!run) {
    return (
      <View style={{
        flex: 1,
        backgroundColor: colors.background,
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
      }}>
        <Text style={{ fontSize: 48, marginBottom: 12 }}>🔍</Text>
        <Text style={{ color: colors.muted, textAlign: "center", fontSize: 16 }}>
          {t("run_not_found")}
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ marginTop: 20, padding: 12 }}
        >
          <Text style={{ color: colors.primary, fontSize: 16 }}>
            ← {t("back")}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── Header ── */}
        <View style={[styles.celebrationHeader, { backgroundColor: colors.primary }]}>
          <Text style={styles.celebrationTitle}>
            🗓️ {t("calendar_track_title", { day: dayNumber })}
          </Text>
          <Text style={styles.celebrationSubtitle}>
            {formattedDate}
          </Text>

          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[
                styles.progressFill,
                { width: `${Math.min(100, (dayNumber / state.goalDays) * 100)}%` },
              ]} />
            </View>
            <Text style={styles.progressText}>
              {t("progress_text", {
                current: dayNumber,
                total: state.goalDays,
                percent: Math.round((dayNumber / state.goalDays) * 100),
              })}
            </Text>
          </View>
        </View>

        {/* ── Métricas + Mapa ── */}
        <Animated.View style={{
          transform: [{ translateY: metricsSlide }],
          opacity: metricsOpacity,
        }}>
          <View style={[styles.metricsCard, {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          }]}>
            <Text style={[styles.metricsTitle, { color: colors.foreground }]}>
              📊 {t("run_summary_title")}
            </Text>
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

          {/* ── Mapa ── */}
          <MapView todayRun={run} type="home" />

          {/* ── Botão voltar ── */}
          <TouchableOpacity
            style={[styles.homeButton, { backgroundColor: colors.primary, margin: 16 }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
          >
            <Text style={styles.homeButtonText}>← {t("back")}</Text>
          </TouchableOpacity>

          <View style={{ height: 32 }} />
        </Animated.View>
      </ScrollView>
    </View>
  );
}