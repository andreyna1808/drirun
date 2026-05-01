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
import { BannerAd, BannerAdSize } from "react-native-google-mobile-ads";
import { BANNER_AD_UNIT_ID } from "@/hooks/use-ads";
import { StatBox } from "@/components/calendar/stat-box";
import { BMI_CATEGORIES, getAllDays, getAllStatus, getBMICategory } from "@/utils/calendar";
import { LegendItem } from "@/components/calendar/legend-item";
import { TouchableOpacity, Alert } from "react-native";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";


export default function CalendarScreen() {
  const { t } = useTranslation();
  const { state } = useApp();
  const colors = useColors();
  const styles = CalendarStyles(colors);

  // ── Cálculo do IMC ──────────────────────────────────────────────────────
  const bmiData = useMemo(() => {
    if (!state.profile) return null;
    const { weight, height } = state.profile;
    const heightM = height / 100;
    const bmi = weight / (heightM * heightM);
    const category = getBMICategory(bmi);
    return { bmi, category };
  }, [state.profile]);

  const calendarDays = useMemo(() => {
    if (!state.goalStartDate) return [];

    return getAllDays(state);
  }, [state.goalStartDate, state.goalDays, state.runs]);

  const stats = useMemo(() => {
    return getAllStatus(calendarDays);
  }, [calendarDays]);

  const handleDayPress = (day: typeof calendarDays[0]) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (day.status === "future") {
      Alert.alert(
        t("calendar_future_title"),
        t("calendar_future_message"),
        [{ text: t("ok") }]
      );
      return;
    }

    if (day.status === "today" && !day.hasRun) {
      Alert.alert(
        t("calendar_today_title"),
        t("calendar_today_message"),
        [{ text: t("ok") }]
      );
      return;
    }

    if (day.status === "missed") {
      Alert.alert(
        t("calendar_missed_title"),
        t("calendar_missed_message"),
        [{ text: t("ok") }]
      );
      return;
    }

    // "done" — navega, a tela de destino cuida do anúncio
    router.push(`/calendar-track?date=${day.date}` as any);
  }

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
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
                  <Text style={[styles.bmiCategoryLabel, { color: bmiData.category.color }]}>
                    {t("calendar_bmi_section_title")}: {' '}
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
                      day.status === "today" ? "" :
                        "";

                return (
                  <TouchableOpacity
                    key={day.dayNumber}
                    onPress={() => handleDayPress(day)}
                    activeOpacity={0.7}
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
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          <View style={{ height: 32 }} />
        </View>
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
