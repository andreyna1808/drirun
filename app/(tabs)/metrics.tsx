import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from "react-native";
import Svg, { Rect, Line, Text as SvgText, Path, Circle } from "react-native-svg";
import { useTranslation } from "react-i18next";
import { useApp, RunRecord } from "@/context/AppContext";
import { useColors } from "@/hooks/use-colors";
import { ScreenContainer } from "@/components/screen-container";
import { MetricsStyles } from "../../styles/tabs/metrics.styles";

const { width } = Dimensions.get("window");
const CHART_WIDTH = width - 48;
const CHART_HEIGHT = 180;
const PADDING = { top: 16, right: 16, bottom: 32, left: 48 };

type FilterPeriod = "daily" | "weekly" | "monthly";

interface ChartDataPoint {
  label: string;
  value: number;
}

// ─── Funções auxiliares ───────────────────────────────────────────────────────

function formatPaceShort(paceSecondsPerKm: number): string {
  if (!paceSecondsPerKm || paceSecondsPerKm <= 0) return "--:--";
  const m = Math.floor(paceSecondsPerKm / 60);
  const s = Math.round(paceSecondsPerKm % 60);
  return `${m}:${s.toString().padStart(2, "0")} min/km`;
}

function formatDurationShort(totalSeconds: number): string {
  if (!totalSeconds || totalSeconds <= 0) return "--:--";
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")} min`;
}

function getLocale(language: string): string {
  switch (language) {
    case "pt": return "pt-BR";
    case "en": return "en-US";
    case "es": return "es-ES";
    default: return "pt-BR";
  }
}

function getLastNDays(n: number): string[] {
  const days: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split("T")[0]);
  }
  return days;
}

function getDayLabel(dateStr: string, locale: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString(locale, { weekday: "short" }).replace(".", "");
}

function getWeekLabel(weekIndex: number, t: (key: string) => string): string {
  return t("metrics_week_prefix") + (weekIndex + 1);
}

function getMonthLabel(monthStr: string, locale: string): string {
  const d = new Date(monthStr + "-01T12:00:00");
  return d.toLocaleDateString(locale, { month: "short" }).replace(".", "");
}

function aggregateRuns(
  runs: RunRecord[],
  period: FilterPeriod,
  metric: "distance" | "calories" | "pace" | "duration"
): ChartDataPoint[] {
  if (period === "daily") {
    const days = getLastNDays(7);
    return days.map((day) => {
      const dayRuns = runs.filter((r) => r.date === day);
      let value = 0;
      if (dayRuns.length > 0) {
        if (metric === "distance") value = dayRuns.reduce((s, r) => s + r.distance / 1000, 0);
        else if (metric === "calories") value = dayRuns.reduce((s, r) => s + r.calories, 0);
        else if (metric === "pace") {
          const validPaces = dayRuns.filter((r) => r.pace > 0).map((r) => r.pace / 60);
          value = validPaces.length > 0 ? validPaces.reduce((a, b) => a + b) / validPaces.length : 0;
        }
        else if (metric === "duration") value = dayRuns.reduce((s, r) => s + r.duration / 60, 0);
      }
      return { label: "", value: Math.round(value * 100) / 100 };
    });
  }

  if (period === "weekly") {
    const weeks: ChartDataPoint[] = [];
    for (let w = 3; w >= 0; w--) {
      const weekRuns = runs.filter((r) => {
        const runDate = new Date(r.date + "T12:00:00");
        const today = new Date();
        today.setHours(12, 0, 0, 0);
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay() - w * 7);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        return runDate >= weekStart && runDate <= weekEnd;
      });
      let value = 0;
      if (weekRuns.length > 0) {
        if (metric === "distance") value = weekRuns.reduce((s, r) => s + r.distance / 1000, 0);
        else if (metric === "calories") value = weekRuns.reduce((s, r) => s + r.calories, 0);
        else if (metric === "pace") {
          const validPaces = weekRuns.filter((r) => r.pace > 0).map((r) => r.pace / 60);
          value = validPaces.length > 0 ? validPaces.reduce((a, b) => a + b) / validPaces.length : 0;
        }
        else if (metric === "duration") value = weekRuns.reduce((s, r) => s + r.duration / 60, 0);
      }
      weeks.push({ label: "", value: Math.round(value * 100) / 100 });
    }
    return weeks;
  }

  const months: ChartDataPoint[] = [];
  for (let m = 5; m >= 0; m--) {
    const d = new Date();
    d.setMonth(d.getMonth() - m);
    const monthStr = d.toISOString().substring(0, 7);
    const monthRuns = runs.filter((r) => r.date.startsWith(monthStr));
    let value = 0;
    if (monthRuns.length > 0) {
      if (metric === "distance") value = monthRuns.reduce((s, r) => s + r.distance / 1000, 0);
      else if (metric === "calories") value = monthRuns.reduce((s, r) => s + r.calories, 0);
      else if (metric === "pace") {
        const validPaces = monthRuns.filter((r) => r.pace > 0).map((r) => r.pace / 60);
        value = validPaces.length > 0 ? validPaces.reduce((a, b) => a + b) / validPaces.length : 0;
      }
      else if (metric === "duration") value = monthRuns.reduce((s, r) => s + r.duration / 60, 0);
    }
    months.push({ label: "", value: Math.round(value * 100) / 100 });
  }
  return months;
}

// ─── Gráficos ─────────────────────────────────────────────────────────────────

function BarChart({ data, color, colors }: { data: ChartDataPoint[]; color: string; colors: any }) {
  const maxValue = Math.max(...data.map((d) => d.value), 0.01);
  const innerWidth = CHART_WIDTH - PADDING.left - PADDING.right;
  const innerHeight = CHART_HEIGHT - PADDING.top - PADDING.bottom;
  const barWidth = (innerWidth / data.length) * 0.6;
  const barGap = (innerWidth / data.length) * 0.4;

  return (
    <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
      {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
        const y = PADDING.top + innerHeight * (1 - ratio);
        const labelValue = maxValue * ratio;
        return (
          <React.Fragment key={ratio}>
            <Line
              x1={PADDING.left} y1={y}
              x2={PADDING.left + innerWidth} y2={y}
              stroke={colors.border} strokeWidth={1}
              strokeDasharray={ratio === 0 ? "0" : "4,4"}
            />
            {ratio > 0 && (
              <SvgText
                x={PADDING.left - 4} y={y + 4}
                textAnchor="end" fontSize={10} fill={colors.muted}
              >
                {labelValue >= 100 ? Math.round(labelValue) : labelValue.toFixed(1)}
              </SvgText>
            )}
          </React.Fragment>
        );
      })}

      {data.map((point, i) => {
        const barHeight = maxValue > 0 ? (point.value / maxValue) * innerHeight : 0;
        const x = PADDING.left + i * (innerWidth / data.length) + barGap / 2;
        const y = PADDING.top + innerHeight - barHeight;
        return (
          <React.Fragment key={i}>
            <Rect
              x={x} y={y} width={barWidth} height={barHeight} rx={4}
              fill={point.value > 0 ? color : colors.border}
              opacity={point.value > 0 ? 1 : 0.4}
            />
            <SvgText
              x={x + barWidth / 2} y={PADDING.top + innerHeight + 18}
              textAnchor="middle" fontSize={11} fill={colors.muted}
            >
              {point.label}
            </SvgText>
          </React.Fragment>
        );
      })}
    </Svg>
  );
}

function LineChart({ data, color, colors }: { data: ChartDataPoint[]; color: string; colors: any }) {
  const maxValue = Math.max(...data.map((d) => d.value), 0.01);
  const innerWidth = CHART_WIDTH - PADDING.left - PADDING.right;
  const innerHeight = CHART_HEIGHT - PADDING.top - PADDING.bottom;

  const points = data.map((point, i) => ({
    x: PADDING.left + (i / (data.length - 1)) * innerWidth,
    y: PADDING.top + innerHeight * (1 - (maxValue > 0 ? point.value / maxValue : 0)),
    value: point.value,
    label: point.label,
  }));

  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

  return (
    <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
      {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
        const y = PADDING.top + innerHeight * (1 - ratio);
        const labelValue = maxValue * ratio;
        return (
          <React.Fragment key={ratio}>
            <Line
              x1={PADDING.left} y1={y}
              x2={PADDING.left + innerWidth} y2={y}
              stroke={colors.border} strokeWidth={1}
              strokeDasharray={ratio === 0 ? "0" : "4,4"}
            />
            {ratio > 0 && (
              <SvgText
                x={PADDING.left - 4} y={y + 4}
                textAnchor="end" fontSize={10} fill={colors.muted}
              >
                {labelValue.toFixed(1)}
              </SvgText>
            )}
          </React.Fragment>
        );
      })}

      {data.some((d) => d.value > 0) && (
        <Path d={pathD} stroke={color} strokeWidth={2.5} fill="none" />
      )}

      {points.map((p, i) => (
        <React.Fragment key={i}>
          {p.value > 0 && <Circle cx={p.x} cy={p.y} r={4} fill={color} />}
          <SvgText
            x={p.x} y={PADDING.top + innerHeight + 18}
            textAnchor="middle" fontSize={11} fill={colors.muted}
          >
            {p.label}
          </SvgText>
        </React.Fragment>
      ))}
    </Svg>
  );
}

// ─── Componentes de layout ────────────────────────────────────────────────────

function ChartCard({
  title, unit, children, totalValue, colors,
}: {
  title: string; unit?: string; children: React.ReactNode; totalValue?: string; colors: any;
}) {
  return (
    <View style={{
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
    }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
        <Text style={{ fontSize: 15, fontWeight: "700", color: colors.foreground }}>{title}</Text>
        {totalValue && (
          <Text style={{ fontSize: 14, color: colors.primary, fontWeight: "600" }}>
            {totalValue}{unit ? ` ${unit}` : ""}
          </Text>
        )}
      </View>
      {children}
    </View>
  );
}

function SummaryCard({ label, value, colors }: { label: string; value: string; colors: any }) {
  return (
    <View style={{
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 12,
      alignItems: "center",
      marginHorizontal: 3,
      borderWidth: 1,
      borderColor: colors.border,
    }}>
      <Text style={{ fontSize: 20, fontWeight: "800", color: colors.primary }}>{value}</Text>
      <Text style={{ fontSize: 11, color: colors.muted, marginTop: 2 }}>{label}</Text>
    </View>
  );
}

// ─── Tela principal ───────────────────────────────────────────────────────────

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
    </ScreenContainer>
  );
}