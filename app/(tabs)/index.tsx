import React, { useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";
import { useApp, hasRunToday, getTodayRun } from "@/context/AppContext";
import { useColors } from "@/hooks/use-colors";
import { ScreenContainer } from "@/components/screen-container";
import { LoggedStyles } from "@/styles/tabs/styles";
import { BannerAd, BannerAdSize } from "react-native-google-mobile-ads";
import { BANNER_AD_UNIT_ID } from "@/hooks/use-ads";
import { calculateStreak, MOTIVATIONAL_PHRASE_KEYS, formatPace, formatDuration } from "@/utils/tabs";
import { RunMetricRow } from "@/components/run-metric-row";

export default function LoggedHomeScreen() {
  const { t, i18n } = useTranslation();
  const { state, refreshPetState } = useApp();
  const colors = useColors();

  const alreadyRan = hasRunToday(state.runs);
  const todayRun = getTodayRun(state.runs);

  const daysCompleted = state.pet.totalDaysCompleted;
  const progressPercent = Math.min(
    Math.round((daysCompleted / state.goalDays) * 100),
    100
  );

  useEffect(() => {
    refreshPetState();
  }, [refreshPetState]);

  const streak = calculateStreak(state.runs);

  // Frase motivacional baseada no dia do ano
  const phraseKey = MOTIVATIONAL_PHRASE_KEYS[Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  ) % MOTIVATIONAL_PHRASE_KEYS.length];

  function handleStartRun() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push("/tracking" as any);
  }

  const styles = LoggedStyles(colors);
  const locale = i18n.language;

  return (
    <ScreenContainer>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>
              {t("home_greeting", { name: state.profile?.name?.split(" ")[0] ?? t("settings_athlete") })}
            </Text>
            <Text style={styles.date}>
              {new Date().toLocaleDateString(locale, {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </Text>
          </View>
          <View style={styles.streakBadge}>
            <Text style={styles.streakEmoji}>🔥</Text>
            <Text style={styles.streakCount}>{streak}</Text>
          </View>
        </View>

        {/* Progresso da meta */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>
              {t("home_goal_label", { days: state.goalDays })}
            </Text>
            <Text style={styles.progressPercent}>{progressPercent}%</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
          </View>
          <Text style={styles.progressSub}>
            {t("home_goal_progress", { done: daysCompleted, total: state.goalDays })}
          </Text>
        </View>

        {/* Status do dia */}
        {alreadyRan ? (
          <View style={styles.doneCard}>
            <Text style={styles.doneEmoji}>🎉</Text>
            <Text style={styles.doneTitle}>{t("home_today_done_title")}</Text>
            <Text style={styles.doneSub}>{t("home_today_done_subtitle")}</Text>
          </View>
        ) : (
          <View style={styles.startCard}>
            <Text style={styles.phraseText}>“{t(phraseKey)}”</Text>
            <TouchableOpacity style={styles.startButton} onPress={handleStartRun}>
              <Text style={styles.startButtonText}>{t("home_start_run")}</Text>
            </TouchableOpacity>
            <Text style={styles.startHint}>{t("home_start_run_hint")}</Text>
          </View>
        )}

        {/* Atividade de hoje */}
        {todayRun && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t("home_history_title")}</Text>
            <View style={styles.todayRunCard}>
              <RunMetricRow label={t("home_distance")} value={`${(todayRun.distance / 1000).toFixed(2)} km`} colors={colors} />
              <RunMetricRow label={t("home_pace")} value={`${formatPace(todayRun.pace)} /km`} colors={colors} />
              <RunMetricRow label={t("home_time")} value={formatDuration(todayRun.duration)} colors={colors} />
              <RunMetricRow label={t("home_calories")} value={`${todayRun.calories} kcal`} colors={colors} isLast />
            </View>
          </View>
        )}

        {/* Últimas atividades */}
        {state.runs.length > 1 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t("home_recent_activities")}</Text>
            {state.runs
              .slice(-3)
              .reverse()
              .filter((r) => r.id !== todayRun?.id)
              .map((run) => (
                <View key={run.id} style={styles.recentRunCard}>
                  <View>
                    <Text style={styles.recentRunDate}>
                      {new Date(run.date).toLocaleDateString(locale, {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                      })}
                    </Text>
                    <Text style={styles.recentRunDistance}>{(run.distance / 1000).toFixed(2)} km</Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={styles.recentRunPace}>{formatPace(run.pace)} /km</Text>
                    <Text style={styles.recentRunTime}>{formatDuration(run.duration)}</Text>
                  </View>
                </View>
              ))}
          </View>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>

      {/* Banner de anúncio */}
      {!state.hasRemovedAds && (
        <View style={styles.adBanner}>
          <BannerAd
            unitId={BANNER_AD_UNIT_ID}
            size={BannerAdSize.LARGE_ANCHORED_ADAPTIVE_BANNER}
            requestOptions={{ requestNonPersonalizedAdsOnly: true }}
          />
        </View>
      )}
    </ScreenContainer>
  );
}