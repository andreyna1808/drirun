import React, { useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/use-colors";
import { ScreenContainer } from "@/components/screen-container";
import { CalendarStyles, CELL_SIZE } from "@/styles/tabs/calendar.styles";

interface BMICategory {
  key: string;           // chave de tradução
  color: string;
  emoji: string;
  min: number;
  max: number;
}

const BMI_CATEGORIES: BMICategory[] = [
  { key: "bmi_underweight", color: "#60A5FA", emoji: "📉", min: 0, max: 18.5 },
  { key: "bmi_normal", color: "#34D399", emoji: "✅", min: 18.5, max: 25 },
  { key: "bmi_overweight", color: "#FBBF24", emoji: "⚠️", min: 25, max: 30 },
  { key: "bmi_obese1", color: "#F97316", emoji: "🔶", min: 30, max: 35 },
  { key: "bmi_obese2", color: "#EF4444", emoji: "🔴", min: 35, max: 40 },
  { key: "bmi_obese3", color: "#991B1B", emoji: "🚨", min: 40, max: 999 },
];

function getBMICategory(bmi: number): BMICategory {
  return BMI_CATEGORIES.find((c) => bmi >= c.min && bmi < c.max) ?? BMI_CATEGORIES[0];
}

export default function CalendarScreen() {
  const { t } = useTranslation();
  const { state } = useApp();
  const colors = useColors();

  // ── Cálculo do IMC ──────────────────────────────────────────────────────
  const bmiData = useMemo(() => {
    if (!state.profile) return null;
    const { weight, height } = state.profile;
    const heightM = height / 100;
    const bmi = weight / (heightM * heightM);
    const category = getBMICategory(bmi);
    return { bmi, category };
  }, [state.profile]);

  // ── Grade do calendário ─────────────────────────────────────────────────
  const calendarDays = useMemo(() => {
    if (!state.goalStartDate) return [];

    const [y, m, d] = state.goalStartDate.split("-").map(Number);
    const startDate = new Date(y, m - 1, d);
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);

    const days = [];
    for (let i = 0; i < state.goalDays; i++) {
      const dayDate = new Date(startDate);
      dayDate.setDate(startDate.getDate() + i);
      dayDate.setHours(12, 0, 0, 0);

      const dateStr = dayDate.toISOString().split("T")[0];
      const hasRun = state.runs.some((r) => r.date === dateStr);

      const dayDateOnly = new Date(dayDate.getFullYear(), dayDate.getMonth(), dayDate.getDate());
      const todayDateOnly = new Date(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate());

      const isPast = dayDateOnly < todayDateOnly;
      const isToday = dayDateOnly.getTime() === todayDateOnly.getTime();

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

  const stats = useMemo(() => {
    const done = calendarDays.filter((d) => d.status === "done").length;
    const missed = calendarDays.filter((d) => d.status === "missed").length;
    const remaining = calendarDays.filter((d) => d.status === "future" || d.status === "today").length;
    const percent = calendarDays.length > 0 ? Math.round((done / calendarDays.length) * 100) : 0;
    return { done, missed, remaining, percent };
  }, [calendarDays]);

  const styles = CalendarStyles(colors);

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>

          {/* ── Seção de IMC ── */}
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            📊 {t("calendar_bmi_section_title")}
          </Text>

          {bmiData ? (
            <View style={[styles.bmiCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.bmiValueRow}>
                <View style={styles.bmiValueContainer}>
                  <Text style={[styles.bmiValue, { color: bmiData.category.color }]}>
                    {bmiData.bmi.toFixed(1)}
                  </Text>
                  <Text style={[styles.bmiUnit, { color: colors.muted }]}>
                    {t("bmi_unit_label")}
                  </Text>
                </View>
                <View style={[styles.bmiCategoryBadge, { backgroundColor: bmiData.category.color + "20" }]}>
                  <Text style={styles.bmiCategoryEmoji}>{bmiData.category.emoji}</Text>
                  <Text style={[styles.bmiCategoryLabel, { color: bmiData.category.color }]}>
                    {t(`bmi_category_short_${bmiData.category.key}`)}
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

              {/* Legenda numérica */}
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
                  ⚖️ {t("bmi_profile_weight", { weight: state.profile?.weight })}
                </Text>
                <Text style={[styles.bmiProfileItem, { color: colors.muted }]}>
                  📏 {t("bmi_profile_height", { height: state.profile?.height })}
                </Text>
                <Text style={[styles.bmiProfileItem, { color: colors.muted }]}>
                  🎂 {t("bmi_profile_age", { age: state.profile?.age })}
                </Text>
              </View>
            </View>
          ) : (
            <View style={[styles.bmiCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.noBmiText, { color: colors.muted }]}>
                {t("calendar_bmi_no_profile")}
              </Text>
            </View>
          )}

          {/* ── Seção do Calendário ── */}
          <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 24 }]}>
            🗓️ {t("calendar_title")}
          </Text>

          {/* Estatísticas */}
          <View style={styles.statsRow}>
            <StatBox value={stats.done} label={t("calendar_stat_done")} color={colors.success} colors={colors} />
            <StatBox value={stats.missed} label={t("calendar_stat_missed")} color={colors.error} colors={colors} />
            <StatBox value={stats.remaining} label={t("calendar_stat_remaining")} color={colors.muted} colors={colors} />
            <StatBox value={`${stats.percent}%`} label={t("calendar_stat_progress")} color={colors.primary} colors={colors} />
          </View>

          {/* Legenda */}
          <View style={styles.legendRow}>
            <LegendItem color={colors.success} emoji="😊" label={t("calendar_legend_done")} />
            <LegendItem color={colors.error} emoji="😢" label={t("calendar_legend_missed")} />
            <LegendItem color={colors.muted} emoji="○" label={t("calendar_legend_future")} />
          </View>

          {/* Grade de dias */}
          {calendarDays.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={styles.emptyEmoji}>🗓️</Text>
              <Text style={[styles.emptyText, { color: colors.muted }]}>
                {t("calendar_empty")}
              </Text>
            </View>
          ) : (
            <View style={styles.grid}>
              {calendarDays.map((day) => {
                const bgColor =
                  day.status === "done" ? colors.success :
                    day.status === "missed" ? colors.error :
                      day.status === "today" ? colors.primary :
                        colors.surface;

                const borderColor =
                  day.status === "today" ? colors.primary :
                    day.status === "done" ? colors.success :
                      day.status === "missed" ? colors.error :
                        colors.border;

                const emoji =
                  day.status === "done" ? "😊" :
                    day.status === "missed" ? "😢" :
                      day.status === "today" ? "⭐" :
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