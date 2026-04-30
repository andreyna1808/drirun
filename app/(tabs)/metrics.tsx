import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/use-colors";
import { ScreenContainer } from "@/components/screen-container";
import { MetricsStyles } from "../../styles/tabs/metrics.styles";
import { BannerAd, BannerAdSize } from "react-native-google-mobile-ads";
import { BANNER_AD_UNIT_ID } from "@/hooks/use-ads";
import { BarChart } from "@/components/charts/bar-chart";
import { ChartCard } from "@/components/charts/card-chart";
import { LineChart } from "@/components/charts/line-chart";
import { SummaryCard } from "@/components/summary-card";
import { FilterPeriod } from "@/interfaces/metrics";
import { getLocale, aggregateRuns, getLastNDays, getDayLabel, getWeekLabel, getMonthLabel, formatPaceShort, formatDurationShort } from "@/utils/metrics";

export default function MetricsScreen() {
  const { t, i18n } = useTranslation();
  const { state } = useApp();
  const colors = useColors();
  const [period, setPeriod] = useState<FilterPeriod>("weekly");

  const locale = getLocale(i18n.language);

  // Dados para cada métrica com labels localizadas
  const makeData = (metric: "distance" | "calories" | "pace" | "duration") => {
    const raw = aggregateRuns(state.runs, period, metric);
    let labelLookup: string[] = [];
    if (period === "daily") {
      labelLookup = getLastNDays(7).map((d) => getDayLabel(d, locale));
    } else if (period === "weekly") {
      labelLookup = [3, 2, 1, 0].map((i) => getWeekLabel(i, t));
    } else {
      labelLookup = Array.from({ length: 6 }, (_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - (5 - i));
        return getMonthLabel(d.toISOString().substring(0, 7), locale);
      });
    }
    return raw.map((item, idx) => ({
      ...item,
      label: labelLookup[idx] ?? "",
    }));
  };

  const distanceData = useMemo(() => makeData("distance"), [state.runs, period, locale, t]);
  const caloriesData = useMemo(() => makeData("calories"), [state.runs, period, locale, t]);
  const paceData = useMemo(() => makeData("pace"), [state.runs, period, locale, t]);
  const durationData = useMemo(() => makeData("duration"), [state.runs, period, locale, t]);

  // Totais do período
  const totalDistance = distanceData.reduce((s, d) => s + d.value, 0).toFixed(1);
  const totalCalories = Math.round(caloriesData.reduce((s, d) => s + d.value, 0));
  const totalDuration = Math.round(durationData.reduce((s, d) => s + d.value, 0));
  const avgPace = paceData.filter((d) => d.value > 0);
  const avgPaceValue = avgPace.length > 0
    ? (avgPace.reduce((s, d) => s + d.value, 0) / avgPace.length).toFixed(2)
    : "--";

  // Totais gerais
  const totalRuns = state.runs.length;
  const totalDistanceAllTime = (state.runs.reduce((s, r) => s + r.distance / 1000, 0)).toFixed(1);
  const totalCaloriesAllTime = state.runs.reduce((s, r) => s + r.calories, 0);
  const validPaces = state.runs.filter(run => run.pace > 0).map(run => run.pace);
  const avgPaceOverall = validPaces.length > 0
    ? validPaces.reduce((a, b) => a + b, 0) / validPaces.length
    : 0;
  const avgDurationOverall = state.runs.length > 0
    ? state.runs.reduce((sum, run) => sum + run.duration, 0) / state.runs.length
    : 0;

  const styles = MetricsStyles(colors);

  if (state.runs.length === 0) {
    return (
      <ScreenContainer>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>📊</Text>
          <Text style={styles.emptyTitle}>{t("metrics_empty_title")}</Text>
          <Text style={styles.emptyText}>{t("metrics_empty_text")}</Text>
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
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>{t("metrics_title")}</Text>

        {/* Filtro de período */}
        <View style={styles.filterRow}>
          {(["daily", "weekly", "monthly"] as FilterPeriod[]).map((p) => (
            <TouchableOpacity
              key={p}
              style={[styles.filterButton, period === p && styles.filterButtonActive]}
              onPress={() => setPeriod(p)}
            >
              <Text style={[styles.filterText, period === p && styles.filterTextActive]}>
                {t(`metrics_filter_${p}`)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Cards de resumo */}
        <View style={styles.summaryRow}>
          <SummaryCard label={t("metrics_summary_runs")} value={String(totalRuns)} colors={colors} />
          <SummaryCard label={t("metrics_summary_distance")} value={totalDistanceAllTime} colors={colors} />
          <SummaryCard label={t("metrics_summary_calories")} value={String(totalCaloriesAllTime)} colors={colors} />
        </View>
        <View style={styles.summaryRow}>
          <SummaryCard label={t("metrics_summary_pace")} value={formatPaceShort(avgPaceOverall)} colors={colors} />
          <SummaryCard label={t("metrics_summary_duration")} value={formatDurationShort(avgDurationOverall)} colors={colors} />
        </View>

        {/* Gráficos */}
        <ChartCard title={t("metrics_chart_distance")} unit="km" totalValue={totalDistance} colors={colors}>
          <BarChart data={distanceData} color={colors.primary} colors={colors} />
        </ChartCard>

        <ChartCard title={t("metrics_chart_calories")} unit="kcal" totalValue={String(totalCalories)} colors={colors}>
          <BarChart data={caloriesData} color="#FF6B35" colors={colors} />
        </ChartCard>

        <ChartCard title={t("metrics_chart_pace")} unit="min/km" totalValue={avgPaceValue} colors={colors}>
          <LineChart data={paceData} color="#FFD700" colors={colors} />
        </ChartCard>

        <ChartCard title={t("metrics_chart_duration")} unit="min" totalValue={String(totalDuration)} colors={colors}>
          <BarChart data={durationData} color="#22C55E" colors={colors} />
        </ChartCard>

        <View style={{ height: 20 }} />
      </ScrollView>

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