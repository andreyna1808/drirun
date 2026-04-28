/**
 * metrics.tsx
 * Tela de Métricas do DriRun.
 * Exibe gráficos de distância, kcal, pace e tempo com filtros diário/semanal/mensal.
 * Usa SVG nativo para os gráficos (sem dependência de bibliotecas externas pesadas).
 */

import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
} from "react-native";
import Svg, { Rect, Line, Text as SvgText, Path, Circle } from "react-native-svg";
import { useApp, RunRecord } from "@/context/AppContext";
import { useColors } from "@/hooks/use-colors";
import { ScreenContainer } from "@/components/screen-container";

const { width } = Dimensions.get("window");
const CHART_WIDTH = width - 48;
const CHART_HEIGHT = 180;
const PADDING = { top: 16, right: 16, bottom: 32, left: 48 };

// ─── Tipos ────────────────────────────────────────────────────────────────────

type FilterPeriod = "daily" | "weekly" | "monthly";

interface ChartDataPoint {
  label: string;
  value: number;
}

// ─── Utilitários de data ──────────────────────────────────────────────────────

/** Retorna os últimos N dias como strings YYYY-MM-DD */
function getLastNDays(n: number): string[] {
  const days: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split("T")[0]);
  }
  return days;
}

/** Retorna o rótulo curto de uma data (ex: "Seg", "Ter") */
function getDayLabel(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "");
}

/** Retorna o rótulo de semana (ex: "S1", "S2") */
function getWeekLabel(weekIndex: number): string {
  return `S${weekIndex + 1}`;
}

/** Retorna o rótulo de mês (ex: "Jan", "Fev") */
function getMonthLabel(dateStr: string): string {
  const d = new Date(dateStr + "-01");
  return d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
}

// ─── Agregação de dados ───────────────────────────────────────────────────────

/**
 * Agrega as corridas por período e retorna pontos de dados para os gráficos.
 */
function aggregateRuns(
  runs: RunRecord[],
  period: FilterPeriod,
  metric: "distance" | "calories" | "pace" | "duration"
): ChartDataPoint[] {
  if (period === "daily") {
    // Últimos 7 dias
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
      return { label: getDayLabel(day), value: Math.round(value * 100) / 100 };
    });
  }

  if (period === "weekly") {
    // Últimas 4 semanas
    const weeks: ChartDataPoint[] = [];
    for (let w = 3; w >= 0; w--) {
      const weekRuns = runs.filter((r) => {
        const runDate = new Date(r.date);
        const today = new Date();
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
      weeks.push({ label: getWeekLabel(3 - w), value: Math.round(value * 100) / 100 });
    }
    return weeks;
  }

  // Mensal — últimos 6 meses
  const months: ChartDataPoint[] = [];
  for (let m = 5; m >= 0; m--) {
    const d = new Date();
    d.setMonth(d.getMonth() - m);
    const monthStr = d.toISOString().substring(0, 7); // YYYY-MM
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
    months.push({ label: getMonthLabel(monthStr), value: Math.round(value * 100) / 100 });
  }
  return months;
}

// ─── Componente de gráfico de barras ──────────────────────────────────────────

function BarChart({
  data,
  color,
  unit,
  colors,
}: {
  data: ChartDataPoint[];
  color: string;
  unit: string;
  colors: any;
}) {
  const maxValue = Math.max(...data.map((d) => d.value), 0.01);
  const innerWidth = CHART_WIDTH - PADDING.left - PADDING.right;
  const innerHeight = CHART_HEIGHT - PADDING.top - PADDING.bottom;
  const barWidth = (innerWidth / data.length) * 0.6;
  const barGap = (innerWidth / data.length) * 0.4;

  return (
    <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
      {/* Linhas horizontais de referência */}
      {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
        const y = PADDING.top + innerHeight * (1 - ratio);
        const labelValue = maxValue * ratio;
        return (
          <React.Fragment key={ratio}>
            <Line
              x1={PADDING.left}
              y1={y}
              x2={PADDING.left + innerWidth}
              y2={y}
              stroke={colors.border}
              strokeWidth={1}
              strokeDasharray={ratio === 0 ? "0" : "4,4"}
            />
            {ratio > 0 && (
              <SvgText
                x={PADDING.left - 4}
                y={y + 4}
                textAnchor="end"
                fontSize={10}
                fill={colors.muted}
              >
                {labelValue >= 100 ? Math.round(labelValue) : labelValue.toFixed(1)}
              </SvgText>
            )}
          </React.Fragment>
        );
      })}

      {/* Barras */}
      {data.map((point, i) => {
        const barHeight = maxValue > 0 ? (point.value / maxValue) * innerHeight : 0;
        const x = PADDING.left + i * (innerWidth / data.length) + barGap / 2;
        const y = PADDING.top + innerHeight - barHeight;

        return (
          <React.Fragment key={i}>
            <Rect
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              rx={4}
              fill={point.value > 0 ? color : colors.border}
              opacity={point.value > 0 ? 1 : 0.4}
            />
            {/* Rótulo do eixo X */}
            <SvgText
              x={x + barWidth / 2}
              y={PADDING.top + innerHeight + 18}
              textAnchor="middle"
              fontSize={11}
              fill={colors.muted}
            >
              {point.label}
            </SvgText>
          </React.Fragment>
        );
      })}
    </Svg>
  );
}

// ─── Componente de gráfico de linha ───────────────────────────────────────────

function LineChart({
  data,
  color,
  colors,
}: {
  data: ChartDataPoint[];
  color: string;
  colors: any;
}) {
  const maxValue = Math.max(...data.map((d) => d.value), 0.01);
  const innerWidth = CHART_WIDTH - PADDING.left - PADDING.right;
  const innerHeight = CHART_HEIGHT - PADDING.top - PADDING.bottom;

  // Calcula os pontos da linha
  const points = data.map((point, i) => ({
    x: PADDING.left + (i / (data.length - 1)) * innerWidth,
    y: PADDING.top + innerHeight * (1 - (maxValue > 0 ? point.value / maxValue : 0)),
    value: point.value,
    label: point.label,
  }));

  // Gera o path da linha
  const pathD = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  return (
    <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
      {/* Linhas horizontais de referência */}
      {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
        const y = PADDING.top + innerHeight * (1 - ratio);
        const labelValue = maxValue * ratio;
        return (
          <React.Fragment key={ratio}>
            <Line
              x1={PADDING.left}
              y1={y}
              x2={PADDING.left + innerWidth}
              y2={y}
              stroke={colors.border}
              strokeWidth={1}
              strokeDasharray={ratio === 0 ? "0" : "4,4"}
            />
            {ratio > 0 && (
              <SvgText
                x={PADDING.left - 4}
                y={y + 4}
                textAnchor="end"
                fontSize={10}
                fill={colors.muted}
              >
                {labelValue.toFixed(1)}
              </SvgText>
            )}
          </React.Fragment>
        );
      })}

      {/* Linha do gráfico */}
      {data.some((d) => d.value > 0) && (
        <Path d={pathD} stroke={color} strokeWidth={2.5} fill="none" />
      )}

      {/* Pontos e rótulos */}
      {points.map((p, i) => (
        <React.Fragment key={i}>
          {p.value > 0 && (
            <Circle cx={p.x} cy={p.y} r={4} fill={color} />
          )}
          <SvgText
            x={p.x}
            y={PADDING.top + innerHeight + 18}
            textAnchor="middle"
            fontSize={11}
            fill={colors.muted}
          >
            {p.label}
          </SvgText>
        </React.Fragment>
      ))}
    </Svg>
  );
}

// ─── Componente de card de gráfico ────────────────────────────────────────────

function ChartCard({
  title,
  unit,
  children,
  totalValue,
  colors,
}: {
  title: string;
  unit: string;
  children: React.ReactNode;
  totalValue?: string;
  colors: any;
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
            {totalValue} {unit}
          </Text>
        )}
      </View>
      {children}
    </View>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function MetricsScreen() {
  const { state } = useApp();
  const colors = useColors();
  const [period, setPeriod] = useState<FilterPeriod>("weekly");

  // Agrega os dados para cada métrica
  const distanceData = useMemo(() => aggregateRuns(state.runs, period, "distance"), [state.runs, period]);
  const caloriesData = useMemo(() => aggregateRuns(state.runs, period, "calories"), [state.runs, period]);
  const paceData = useMemo(() => aggregateRuns(state.runs, period, "pace"), [state.runs, period]);
  const durationData = useMemo(() => aggregateRuns(state.runs, period, "duration"), [state.runs, period]);

  // Totais do período
  const totalDistance = distanceData.reduce((s, d) => s + d.value, 0).toFixed(1);
  const totalCalories = Math.round(caloriesData.reduce((s, d) => s + d.value, 0));
  const totalDuration = Math.round(durationData.reduce((s, d) => s + d.value, 0));
  const avgPace = paceData.filter((d) => d.value > 0);
  const avgPaceValue = avgPace.length > 0
    ? (avgPace.reduce((s, d) => s + d.value, 0) / avgPace.length).toFixed(2)
    : "--";

  // Estatísticas gerais
  const totalRuns = state.runs.length;
  const totalDistanceAllTime = (state.runs.reduce((s, r) => s + r.distance / 1000, 0)).toFixed(1);
  const totalCaloriesAllTime = state.runs.reduce((s, r) => s + r.calories, 0);

  const styles = createStyles(colors);

  if (state.runs.length === 0) {
    return (
      <ScreenContainer>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>📊</Text>
          <Text style={styles.emptyTitle}>Sem dados ainda</Text>
          <Text style={styles.emptyText}>
            Complete sua primeira corrida para ver as métricas aqui!
          </Text>
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
        {/* ── Cabeçalho ── */}
        <Text style={styles.title}>Métricas</Text>

        {/* ── Filtro de período ── */}
        <View style={styles.filterRow}>
          {(["daily", "weekly", "monthly"] as FilterPeriod[]).map((p) => (
            <TouchableOpacity
              key={p}
              style={[styles.filterButton, period === p && styles.filterButtonActive]}
              onPress={() => setPeriod(p)}
            >
              <Text style={[styles.filterText, period === p && styles.filterTextActive]}>
                {p === "daily" ? "Diário" : p === "weekly" ? "Semanal" : "Mensal"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Cards de resumo geral ── */}
        <View style={styles.summaryRow}>
          <SummaryCard label="Corridas" value={String(totalRuns)} colors={colors} />
          <SummaryCard label="Total km" value={totalDistanceAllTime} colors={colors} />
          <SummaryCard label="Total kcal" value={String(totalCaloriesAllTime)} colors={colors} />
        </View>

        {/* ── Gráfico de Distância ── */}
        <ChartCard
          title="Distância (km)"
          unit="km"
          totalValue={totalDistance}
          colors={colors}
        >
          <BarChart data={distanceData} color={colors.primary} unit="km" colors={colors} />
        </ChartCard>

        {/* ── Gráfico de Calorias ── */}
        <ChartCard
          title="Calorias (kcal)"
          unit="kcal"
          totalValue={String(totalCalories)}
          colors={colors}
        >
          <BarChart data={caloriesData} color="#FF6B35" unit="kcal" colors={colors} />
        </ChartCard>

        {/* ── Gráfico de Pace ── */}
        <ChartCard
          title="Pace Médio (min/km)"
          unit="min/km"
          totalValue={avgPaceValue}
          colors={colors}
        >
          <LineChart data={paceData} color="#FFD700" colors={colors} />
        </ChartCard>

        {/* ── Gráfico de Tempo ── */}
        <ChartCard
          title="Tempo de Corrida (min)"
          unit="min"
          totalValue={String(totalDuration)}
          colors={colors}
        >
          <BarChart data={durationData} color="#22C55E" unit="min" colors={colors} />
        </ChartCard>

        <View style={{ height: 20 }} />
      </ScrollView>
    </ScreenContainer>
  );
}

// ─── Componente de card de resumo ─────────────────────────────────────────────

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

// ─── Estilos ─────────────────────────────────────────────────────────────────

function createStyles(colors: any) {
  return StyleSheet.create({
    scroll: { flex: 1 },
    content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20 },
    title: {
      fontSize: 24,
      fontWeight: "800",
      color: colors.foreground,
      marginBottom: 16,
    },
    filterRow: {
      flexDirection: "row",
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 4,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    filterButton: {
      flex: 1,
      paddingVertical: 8,
      borderRadius: 8,
      alignItems: "center",
    },
    filterButtonActive: {
      backgroundColor: colors.primary,
    },
    filterText: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.muted,
    },
    filterTextActive: {
      color: "#FFFFFF",
    },
    summaryRow: {
      flexDirection: "row",
      marginBottom: 16,
    },
    emptyContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: 40,
    },
    emptyEmoji: {
      fontSize: 64,
      marginBottom: 16,
    },
    emptyTitle: {
      fontSize: 22,
      fontWeight: "700",
      color: colors.foreground,
      marginBottom: 8,
    },
    emptyText: {
      fontSize: 15,
      color: colors.muted,
      textAlign: "center",
      lineHeight: 22,
    },
  });
}
