import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  TextInput,
  Alert,
  Switch,
} from "react-native";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/use-colors";
import { ScreenContainer } from "@/components/screen-container";
import {
  SUPPORTED_LANGUAGES,
  SupportedLanguage,
  changeLanguage,
} from "@/lib/i18n";
import { useTranslation } from "react-i18next";

export default function SettingsScreen() {
  const { state, dispatch } = useApp();
  const colors = useColors();
  const { t, i18n } = useTranslation();
  const [goalDaysInput, setGoalDaysInput] = useState(String(state.goalDays));
  const [editingGoal, setEditingGoal] = useState(false);
  const [currentLang, setCurrentLang] = useState<SupportedLanguage>(i18n.language as SupportedLanguage);

  function handleGoalChange(text: string) {
    setGoalDaysInput(text.replace(/[^0-9]/g, ""));
  }

  function handleGoalBlur() {
    let value = parseInt(goalDaysInput, 10);
    if (isNaN(value) || value < 1) value = 30;
    if (value > 365) {
      Alert.alert(
        t("onboarding_goal_max_alert_title"),
        t("onboarding_goal_max_alert_msg"),
        [{ text: t("ok") }]
      );
      value = 365;
    }
    setGoalDaysInput(String(value));
    if (value !== state.goalDays) {
      Alert.alert(
        t("settings_goal_change_title"),
        t("settings_goal_change_msg", { value }),
        [
          {
            text: t("cancel"),
            style: "cancel",
            onPress: () => setGoalDaysInput(String(state.goalDays)),
          },
          {
            text: t("confirm"),
            onPress: () => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              dispatch({ type: "UPDATE_GOAL", payload: { goalDays: value } });
            },
          },
        ]
      );
    }
    setEditingGoal(false);
  }

  async function handleLanguageChange(lang: SupportedLanguage) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await changeLanguage(lang);
    setCurrentLang(lang);
  }

  function handleToggleNotifications(enabled: boolean) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    dispatch({
      type: "UPDATE_NOTIFICATIONS",
      payload: { enabled, hour: state.notifications?.hour ?? "08" },
    });
  }

  function handleNotificationHourChange(text: string) {
    const cleaned = text.replace(/[^0-9]/g, "").slice(0, 2);
    const hour = parseInt(cleaned, 10);
    if (!isNaN(hour) && hour >= 0 && hour <= 23) {
      dispatch({
        type: "UPDATE_NOTIFICATIONS",
        payload: {
          enabled: state.notifications?.enabled ?? false,
          hour: cleaned.padStart(2, "0"),
        },
      });
    }
  }

  function handleReset() {
    Alert.alert(
      t("settings_reset_confirm_title"),
      t("settings_reset_confirm_msg"),
      [
        { text: t("cancel"), style: "cancel" },
        {
          text: t("settings_reset_button"),
          style: "destructive",
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            dispatch({
              type: "LOAD_STATE",
              payload: {
                isOnboarded: false,
                profile: null,
                goalDays: 30,
                goalStartDate: null,
                runs: [],
                pet: {
                  name: t("pet_default_name"),
                  state: "egg",
                  daysSinceLastRun: 0,
                  totalDaysCompleted: 0,
                  ownedItems: [],
                },
                hasRemovedAds: false,
                gems: 0,
                notifications: { enabled: false, hour: null },
              },
            });
            setTimeout(() => {
              Alert.alert(
                t("settings_reset_success_title"),
                t("settings_reset_success_msg"),
                [{ text: t("settings_reset_success_button") }]
              );
            }, 500);
          },
        },
      ]
    );
  }

  function handleRemoveAds() {
    Alert.alert(
      t("settings_remove_ads_title"),
      t("settings_remove_ads_msg"),
      [
        { text: t("cancel"), style: "cancel" },
        {
          text: t("settings_remove_ads_buy"),
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            dispatch({ type: "REMOVE_ADS" });
            Alert.alert(t("success"), t("settings_remove_ads_success"));
          },
        },
      ]
    );
  }

  const styles = createStyles(colors);
  const notifEnabled = state.notifications?.enabled ?? false;
  const notifHour = state.notifications?.hour ?? "08";

  return (
    <ScreenContainer>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>{t("settings_title")}</Text>

        {/* ── Perfil ── */}
        <SectionHeader title={t("settings_profile")} colors={colors} />
        <TouchableOpacity
          style={[styles.aboutButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push("/settings/profile" as any);
          }}
        >
          <Text style={styles.aboutEmoji}>👤</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.aboutTitle, { color: colors.foreground }]}>
              {state.profile?.name ?? t("settings_athlete")}
            </Text>
            <Text style={[styles.aboutSubtitle, { color: colors.muted }]}>
              {state.profile
                ? `${state.profile.age} ${t("settings_years")} • ${state.profile.weight}kg • ${state.profile.height}cm`
                : t("settings_tap_to_edit")}
            </Text>
          </View>
          <Text style={[styles.aboutArrow, { color: colors.muted }]}>›</Text>
        </TouchableOpacity>

        {/* ── Meta de Dias ── */}
        <SectionHeader title={t("settings_goal")} colors={colors} />
        <View style={styles.card}>
          <View style={styles.goalRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.goalLabel, { color: colors.foreground }]}>
                {t("settings_goal_days")}
              </Text>
              <Text style={[styles.goalHint, { color: colors.muted }]}>
                {t("settings_goal_hint")}
              </Text>
            </View>
            {editingGoal ? (
              <TextInput
                style={[styles.goalInput, { color: colors.foreground, borderColor: colors.border }]}
                value={goalDaysInput}
                onChangeText={handleGoalChange}
                keyboardType="numeric"
                autoFocus
                onBlur={handleGoalBlur}
                returnKeyType="done"
                onSubmitEditing={handleGoalBlur}
                maxLength={3}
              />
            ) : (
              <TouchableOpacity
                style={[styles.goalValueButton, { backgroundColor: colors.primary + "20" }]}
                onPress={() => setEditingGoal(true)}
              >
                <Text style={[styles.goalValue, { color: colors.primary }]}>{state.goalDays}</Text>
                <Text style={styles.goalEdit}>✏️</Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.goalProgress}>
            <View style={[styles.progressBarBg, { backgroundColor: colors.border }]}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${Math.min((state.pet.totalDaysCompleted / state.goalDays) * 100, 100)}%`,
                    backgroundColor: colors.primary,
                  },
                ]}
              />
            </View>
            <Text style={[styles.goalProgressText, { color: colors.muted }]}>
              {state.pet.totalDaysCompleted} / {state.goalDays} {t("settings_goal_completed")}
            </Text>
          </View>
        </View>

        {/* ── Notificações ── */}
        <SectionHeader title={t("settings_notifications")} colors={colors} />
        <View style={styles.card}>
          <View style={styles.notifRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.notifLabel, { color: colors.foreground }]}>
                🔔 {t("settings_notifications_daily")}
              </Text>
              <Text style={[styles.notifHint, { color: colors.muted }]}>
                {state.pet.name} {t("settings_notifications_pet_reminder")}
              </Text>
            </View>
            <Switch
              value={notifEnabled}
              onValueChange={handleToggleNotifications}
              trackColor={{ false: colors.border, true: colors.primary + "80" }}
              thumbColor={notifEnabled ? colors.primary : colors.muted}
            />
          </View>
          {notifEnabled && (
            <View style={[styles.notifHourRow, { borderTopColor: colors.border }]}>
              <Text style={[styles.notifLabel, { color: colors.foreground }]}>
                ⏰ {t("settings_notifications_time")}
              </Text>
              <View style={styles.notifHourInput}>
                <TextInput
                  style={[styles.hourInput, { color: colors.foreground, borderColor: colors.border }]}
                  value={String(notifHour)}
                  onChangeText={handleNotificationHourChange}
                  keyboardType="numeric"
                  maxLength={2}
                  returnKeyType="done"
                />
                <Text style={[styles.hourLabel, { color: colors.muted }]}>h (0–23)</Text>
              </View>
            </View>
          )}
        </View>

        {/* ── Idioma ── */}
        <SectionHeader title={t("settings_language")} colors={colors} />
        <View style={styles.card}>
          <View style={styles.langRow}>
            {SUPPORTED_LANGUAGES.map((lang) => (
              <TouchableOpacity
                key={lang.code}
                style={[
                  styles.langButton,
                  {
                    backgroundColor: currentLang === lang.code ? colors.primary : colors.surface,
                    borderColor: currentLang === lang.code ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => handleLanguageChange(lang.code)}
              >
                <Text style={styles.langFlag}>{lang.flag}</Text>
                <Text
                  style={[
                    styles.langLabel,
                    { color: currentLang === lang.code ? "#FFFFFF" : colors.foreground },
                  ]}
                >
                  {lang.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Loja ── */}
        <SectionHeader title={t("settings_shop")} colors={colors} />
        <View style={styles.card}>
          {!state.hasRemovedAds ? (
            <TouchableOpacity style={styles.shopItem} onPress={handleRemoveAds}>
              <View style={styles.shopItemLeft}>
                <Text style={styles.shopItemEmoji}>🚫</Text>
                <View>
                  <Text style={[styles.shopItemTitle, { color: colors.foreground }]}>
                    {t("settings_remove_ads")}
                  </Text>
                  <Text style={[styles.shopItemDesc, { color: colors.muted }]}>
                    {t("settings_remove_ads_desc")}
                  </Text>
                </View>
              </View>
              <View style={[styles.shopItemPrice, { backgroundColor: colors.primary + "20" }]}>
                <Text style={[styles.shopItemPriceText, { color: colors.primary }]}>
                  {t("settings_remove_ads_price")}
                </Text>
              </View>
            </TouchableOpacity>
          ) : (
            <View style={styles.shopItemDone}>
              <Text style={styles.shopItemEmoji}>✅</Text>
              <Text style={[styles.shopItemDoneText, { color: colors.success }]}>
                {t("settings_ads_removed")}
              </Text>
            </View>
          )}
        </View>

        {/* ── Sobre ── */}
        <SectionHeader title={t("settings_about")} colors={colors} />
        <TouchableOpacity
          style={[styles.aboutButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push("/settings/about" as any);
          }}
        >
          <Text style={styles.aboutEmoji}>ℹ️</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.aboutTitle, { color: colors.foreground }]}>
              {t("about_title")}
            </Text>
            <Text style={[styles.aboutSubtitle, { color: colors.muted }]}>
              {t("settings_about_desc")}
            </Text>
          </View>
          <Text style={[styles.aboutArrow, { color: colors.muted }]}>›</Text>
        </TouchableOpacity>

        {/* ── Zona de Perigo ── */}
        <SectionHeader title={t("settings_danger_zone")} colors={colors} />
        <TouchableOpacity
          style={[styles.dangerButton, { backgroundColor: colors.error + "15", borderColor: colors.error }]}
          onPress={handleReset}
        >
          <Text style={[styles.dangerButtonText, { color: colors.error }]}>
            🗑️ {t("settings_reset")}
          </Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </ScreenContainer>
  );
}

// ── Componentes auxiliares (inalterados) ─────────────────────────────────────
function SectionHeader({ title, colors }: { title: string; colors: any }) {
  return (
    <Text style={{
      fontSize: 12,
      fontWeight: "700",
      color: colors.muted,
      textTransform: "uppercase",
      letterSpacing: 0.8,
      marginTop: 20,
      marginBottom: 8,
      marginLeft: 4,
    }}>
      {title}
    </Text>
  );
}

function InfoRow({ label, value, colors, isLast = false }: { label: string; value: string; colors: any; isLast?: boolean }) {
  return (
    <View style={{
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 12,
      borderBottomWidth: isLast ? 0 : 1,
      borderBottomColor: colors.border,
    }}>
      <Text style={{ color: colors.muted, fontSize: 14 }}>{label}</Text>
      <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: "600" }}>{value}</Text>
    </View>
  );
}

// ── Estilos (inalterados) ────────────────────────────────────────────────────
function createStyles(colors: any) {
  return StyleSheet.create({
    scroll: { flex: 1 },
    content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20 },
    title: { fontSize: 24, fontWeight: "800", color: colors.foreground, marginBottom: 4 },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      paddingHorizontal: 16,
      paddingVertical: 4,
      borderWidth: 1,
      borderColor: colors.border,
    },
    goalRow: { flexDirection: "row", alignItems: "center", paddingVertical: 12 },
    goalLabel: { fontSize: 15, fontWeight: "600" },
    goalHint: { fontSize: 12, marginTop: 2 },
    goalInput: {
      borderWidth: 1,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 8,
      fontSize: 20,
      fontWeight: "700",
      width: 72,
      textAlign: "center",
    },
    goalValueButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 12,
    },
    goalValue: { fontSize: 22, fontWeight: "800" },
    goalEdit: { fontSize: 16 },
    goalProgress: { paddingBottom: 12 },
    progressBarBg: { height: 6, borderRadius: 3, overflow: "hidden", marginBottom: 6 },
    progressBarFill: { height: "100%", borderRadius: 3 },
    goalProgressText: { fontSize: 12 },
    notifRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 14,
    },
    notifLabel: { fontSize: 15, fontWeight: "600" },
    notifHint: { fontSize: 12, marginTop: 2 },
    notifHourRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 12,
      borderTopWidth: 1,
    },
    notifHourInput: { flexDirection: "row", alignItems: "center", gap: 8 },
    hourInput: {
      borderWidth: 1,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 8,
      fontSize: 20,
      fontWeight: "700",
      width: 60,
      textAlign: "center",
    },
    hourLabel: { fontSize: 14 },
    langRow: { flexDirection: "row", gap: 8, paddingVertical: 12 },
    langButton: {
      flex: 1,
      alignItems: "center",
      paddingVertical: 10,
      borderRadius: 12,
      borderWidth: 1.5,
      gap: 4,
    },
    langFlag: { fontSize: 22 },
    langLabel: { fontSize: 11, fontWeight: "700" },
    shopItem: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 14,
    },
    shopItemLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
    shopItemEmoji: { fontSize: 24 },
    shopItemTitle: { fontSize: 15, fontWeight: "600" },
    shopItemDesc: { fontSize: 12, marginTop: 2 },
    shopItemPrice: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
    shopItemPriceText: { fontSize: 14, fontWeight: "700" },
    shopItemDone: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 14 },
    shopItemDoneText: { fontSize: 15, fontWeight: "600" },
    divider: { height: 1, marginVertical: 4 },
    gemsBalanceRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 12,
    },
    gemsBalance: { fontSize: 17, fontWeight: "700" },
    goShopButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 12,
    },
    goShopText: { color: "#FFFFFF", fontSize: 13, fontWeight: "700" },
    aboutButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      padding: 16,
      borderRadius: 16,
      borderWidth: 1,
    },
    aboutEmoji: { fontSize: 24 },
    aboutTitle: { fontSize: 15, fontWeight: "700" },
    aboutSubtitle: { fontSize: 12, marginTop: 2 },
    aboutArrow: { fontSize: 22, fontWeight: "300" },
    dangerButton: {
      padding: 16,
      borderRadius: 16,
      alignItems: "center",
      borderWidth: 1,
    },
    dangerButtonText: { fontSize: 15, fontWeight: "700" },
  });
}