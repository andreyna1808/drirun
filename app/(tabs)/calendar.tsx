/**
 * calendar.tsx
 * Tela de Calendario do DriRun.
 * Exibe: calculo de IMC com gauge visual, seguido da grade de dias da meta.
 * Cada quadradinho: verde com 😊 = feito, vermelho com 😢 = perdido, cinza = futuro.
 */
import React, { useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
} from "react-native";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/use-colors";
import { ScreenContainer } from "@/components/screen-container";

const { width } = Dimensions.get("window");

// Grade de 7 colunas com espacamento uniforme
const COLUMNS = 7;
const GRID_PADDING = 20;
const CELL_GAP = 4;
const CELL_SIZE = Math.floor(
  (width - GRID_PADDING * 2 - CELL_GAP * (COLUMNS - 1)) / COLUMNS
);

// ── Classificacao do IMC ──────────────────────────────────────────────────────

interface BMICategory {
  label: string;
  color: string;
  emoji: string;
  min: number;
  max: number;
}

const BMI_CATEGORIES: BMICategory[] = [
  { label: "Abaixo do peso",  color: "#60A5FA", emoji: "📉", min: 0,    max: 18.5 },
  { label: "Peso normal",     color: "#34D399", emoji: "✅", min: 18.5, max: 25   },
  { label: "Sobrepeso",       color: "#FBBF24", emoji: "⚠️", min: 25,   max: 30   },
  { label: "Obesidade I",     color: "#F97316", emoji: "🔶", min: 30,   max: 35   },
  { label: "Obesidade II",    color: "#EF4444", emoji: "🔴", min: 35,   max: 40   },
  { label: "Obesidade III",   color: "#991B1B", emoji: "🚨", min: 40,   max: 999  },
];

function getBMICategory(bmi: number): BMICategory {
  return BMI_CATEGORIES.find((c) => bmi >= c.min && bmi < c.max) ?? BMI_CATEGORIES[0];
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function CalendarScreen() {
  const { state } = useApp();
  const colors = useColors();

  // ── Calculo do IMC ──────────────────────────────────────────────────────────
  const bmiData = useMemo(() => {
    if (!state.profile) return null;
    const { weight, height } = state.profile;
    const heightM = height / 100;
    const bmi = weight / (heightM * heightM);
    const category = getBMICategory(bmi);
    return { bmi, category };
  }, [state.profile]);

  // ── Grade do calendario ─────────────────────────────────────────────────────
  const calendarDays = useMemo(() => {
    if (!state.goalStartDate) return [];
    const startDate = new Date(state.goalStartDate);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const days = [];
    for (let i = 0; i < state.goalDays; i++) {
      const dayDate = new Date(startDate);
      dayDate.setDate(startDate.getDate() + i);
      const dateStr = dayDate.toISOString().split("T")[0];
      const hasRun = state.runs.some((r) => r.date === dateStr);
      const isPast = dayDate < today;
      const isToday = dayDate.toDateString() === new Date().toDateString();
      let status: "done" | "missed" | "future" | "today";
      if (isToday) {
        status = hasRun ? "done" : "today";
      } else if (isPast) {
        status = hasRun ? "done" : "missed";
      } else {
        status = "future";
      }
      days.push({ dayNumber: i + 1, date: dateStr, status, hasRun });
    }
    return days;
  }, [state.goalStartDate, state.goalDays, state.runs]);

  // Estatisticas
  const stats = useMemo(() => {
    const done = calendarDays.filter((d) => d.status === "done").length;
    const missed = calendarDays.filter((d) => d.status === "missed").length;
    const remaining = calendarDays.filter((d) => d.status === "future" || d.status === "today").length;
    const percent = calendarDays.length > 0 ? Math.round((done / calendarDays.length) * 100) : 0;
    return { done, missed, remaining, percent };
  }, [calendarDays]);

  const styles = createStyles(colors);

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>

          {/* ── Secao de IMC ── */}
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>📊 Seu IMC</Text>

          {bmiData ? (
            <View style={[styles.bmiCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {/* Valor do IMC */}
              <View style={styles.bmiValueRow}>
                <View style={styles.bmiValueContainer}>
                  <Text style={[styles.bmiValue, { color: bmiData.category.color }]}>
                    {bmiData.bmi.toFixed(1)}
                  </Text>
                  <Text style={[styles.bmiUnit, { color: colors.muted }]}>kg/m²</Text>
                </View>
                <View style={[styles.bmiCategoryBadge, { backgroundColor: bmiData.category.color + "20" }]}>
                  <Text style={styles.bmiCategoryEmoji}>{bmiData.category.emoji}</Text>
                  <Text style={[styles.bmiCategoryLabel, { color: bmiData.category.color }]}>
                    {bmiData.category.label}
                  </Text>
                </View>
              </View>

              {/* Barra de IMC */}
              <View style={styles.bmiBarContainer}>
                {BMI_CATEGORIES.map((cat, i) => (
                  <View
                    key={i}
                    style={[
                      styles.bmiBarSegment,
                      { backgroundColor: cat.color + "60" },
                      i === 0 && { borderTopLeftRadius: 6, borderBottomLeftRadius: 6 },
                      i === BMI_CATEGORIES.length - 1 && { borderTopRightRadius: 6, borderBottomRightRadius: 6 },
                    ]}
                  />
                ))}
                {/* Indicador da posicao atual */}
                <View
                  style={[
                    styles.bmiIndicator,
                    {
                      left: `${Math.min(95, Math.max(2, ((bmiData.bmi - 10) / 50) * 100))}%`,
                      backgroundColor: bmiData.category.color,
                    },
                  ]}
                />
              </View>

              {/* Legenda */}
              <View style={styles.bmiLegend}>
                <Text style={[styles.bmiLegendItem, { color: colors.muted }]}>10</Text>
                <Text style={[styles.bmiLegendItem, { color: colors.muted }]}>18.5</Text>
                <Text style={[styles.bmiLegendItem, { color: colors.muted }]}>25</Text>
                <Text style={[styles.bmiLegendItem, { color: colors.muted }]}>30</Text>
                <Text style={[styles.bmiLegendItem, { color: colors.muted }]}>40+</Text>
              </View>

              {/* Dados do perfil */}
              <View style={[styles.bmiProfileRow, { borderTopColor: colors.border }]}>
                <Text style={[styles.bmiProfileItem, { color: colors.muted }]}>
                  ⚖️ {state.profile?.weight} kg
                </Text>
                <Text style={[styles.bmiProfileItem, { color: colors.muted }]}>
                  📏 {state.profile?.height} cm
                </Text>
                <Text style={[styles.bmiProfileItem, { color: colors.muted }]}>
                  🎂 {state.profile?.age} anos
                </Text>
              </View>
            </View>
          ) : (
            <View style={[styles.bmiCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.noBmiText, { color: colors.muted }]}>
                Complete o perfil para calcular o IMC.
              </Text>
            </View>
          )}

          {/* ── Secao do Calendario ── */}
          <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 24 }]}>
            🗓️ Calendário do Desafio
          </Text>

          {/* Estatisticas */}
          <View style={styles.statsRow}>
            <StatBox value={stats.done}      label="Feitos"    color={colors.success}  colors={colors} />
            <StatBox value={stats.missed}    label="Perdidos"  color={colors.error}    colors={colors} />
            <StatBox value={stats.remaining} label="Restantes" color={colors.muted}    colors={colors} />
            <StatBox value={`${stats.percent}%`} label="Progresso" color={colors.primary} colors={colors} />
          </View>

          {/* Legenda */}
          <View style={styles.legendRow}>
            <LegendItem color={colors.success} emoji="😊" label="Feito" />
            <LegendItem color={colors.error}   emoji="😢" label="Perdido" />
            <LegendItem color={colors.muted}   emoji="○"  label="Futuro" />
          </View>

          {/* Grade de dias */}
          {calendarDays.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={styles.emptyEmoji}>🗓️</Text>
              <Text style={[styles.emptyText, { color: colors.muted }]}>
                Nenhum desafio ativo. Configure sua meta nas Configuracoes.
              </Text>
            </View>
          ) : (
            <View style={styles.grid}>
              {calendarDays.map((day) => {
                const bgColor =
                  day.status === "done"   ? colors.success :
                  day.status === "missed" ? colors.error :
                  day.status === "today"  ? colors.primary :
                  colors.surface;

                const borderColor =
                  day.status === "today" ? colors.primary :
                  day.status === "done"  ? colors.success :
                  day.status === "missed"? colors.error :
                  colors.border;

                const emoji =
                  day.status === "done"   ? "😊" :
                  day.status === "missed" ? "😢" :
                  day.status === "today"  ? "⭐" :
                  "";

                return (
                  <View
                    key={day.dayNumber}
                    style={[
                      styles.dayCell,
                      {
                        width: CELL_SIZE,
                        height: CELL_SIZE,
                        backgroundColor: bgColor + (day.status === "future" ? "" : "30"),
                        borderColor: borderColor,
                        borderWidth: day.status === "today" ? 2 : 1,
                      },
                    ]}
                  >
                    {emoji ? (
                      <Text style={styles.dayCellEmoji}>{emoji}</Text>
                    ) : (
                      <Text style={[
                        styles.dayCellNumber,
                        { color: day.status === "future" ? colors.muted : colors.foreground },
                      ]}>
                        {day.dayNumber}
                      </Text>
                    )}
                  </View>
                );
              })}
            </View>
          )}

          <View style={{ height: 32 }} />
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

// ── Subcomponentes ────────────────────────────────────────────────────────────

function StatBox({ value, label, color, colors }: { value: any; label: string; color: string; colors: any }) {
  return (
    <View style={[{ flex: 1, alignItems: "center", padding: 8, borderRadius: 12, backgroundColor: color + "15", marginHorizontal: 3 }]}>
      <Text style={{ fontSize: 20, fontWeight: "800", color }}>{value}</Text>
      <Text style={{ fontSize: 11, color: colors.muted, marginTop: 2 }}>{label}</Text>
    </View>
  );
}

function LegendItem({ color, emoji, label }: { color: string; emoji: string; label: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
      <Text style={{ fontSize: 14 }}>{emoji}</Text>
      <Text style={{ fontSize: 12, color }}>{label}</Text>
    </View>
  );
}

// ── Estilos ───────────────────────────────────────────────────────────────────

function createStyles(colors: any) {
  return StyleSheet.create({
    content: { padding: GRID_PADDING },
    sectionTitle: { fontSize: 20, fontWeight: "800", marginBottom: 12 },
    bmiCard: {
      borderRadius: 20,
      padding: 20,
      borderWidth: 1,
      marginBottom: 8,
    },
    bmiValueRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 16,
    },
    bmiValueContainer: { alignItems: "flex-start" },
    bmiValue: { fontSize: 48, fontWeight: "900", lineHeight: 52 },
    bmiUnit: { fontSize: 13, marginTop: 2 },
    bmiCategoryBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 12,
    },
    bmiCategoryEmoji: { fontSize: 20 },
    bmiCategoryLabel: { fontSize: 14, fontWeight: "700" },
    bmiBarContainer: {
      flexDirection: "row",
      height: 12,
      borderRadius: 6,
      overflow: "visible",
      marginBottom: 4,
      position: "relative",
    },
    bmiBarSegment: { flex: 1, height: 12 },
    bmiIndicator: {
      position: "absolute",
      top: -4,
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: "#FFFFFF",
      marginLeft: -10,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 4,
    },
    bmiLegend: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 8,
      marginBottom: 12,
    },
    bmiLegendItem: { fontSize: 10 },
    bmiProfileRow: {
      flexDirection: "row",
      justifyContent: "space-around",
      paddingTop: 12,
      borderTopWidth: 1,
    },
    bmiProfileItem: { fontSize: 13 },
    noBmiText: { fontSize: 14, textAlign: "center", paddingVertical: 16 },
    statsRow: { flexDirection: "row", marginBottom: 12 },
    legendRow: {
      flexDirection: "row",
      gap: 16,
      marginBottom: 16,
      justifyContent: "center",
    },
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: CELL_GAP,
    },
    dayCell: {
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
    },
    dayCellEmoji: { fontSize: CELL_SIZE * 0.45 },
    dayCellNumber: { fontSize: CELL_SIZE * 0.3, fontWeight: "600" },
    emptyCard: {
      borderRadius: 16,
      padding: 32,
      borderWidth: 1,
      alignItems: "center",
      gap: 12,
    },
    emptyEmoji: { fontSize: 48 },
    emptyText: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  });
}
