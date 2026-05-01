import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Switch,
  Platform,
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
import { SettingsStyles } from "@/styles/tabs/settings.styles";
import { SectionHeader } from "@/components/settings/section-header";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as Notifications from "expo-notifications";
import { cancelAllNotifications } from "@/hooks/cancel-notification";
import { scheduleNotification } from "@/hooks/schedule-notification";

export default function SettingsScreen() {
  const { state, dispatch } = useApp();
  const colors = useColors();
  const { t, i18n } = useTranslation();
  const [goalDaysInput, setGoalDaysInput] = useState(String(state.goalDays));
  const [editingGoal, setEditingGoal] = useState(false);
  const [currentLang, setCurrentLang] = useState<SupportedLanguage>(
    i18n.language as SupportedLanguage
  );
  const styles = SettingsStyles(colors);
  const notifEnabled = state.notifications?.enabled ?? false;
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tempTime, setTempTime] = useState(new Date());

  useEffect(() => {
    if (state.notifications?.hour) {
      const [hour, minute] = state.notifications.hour.split(":").map(Number);
      const date = new Date();
      date.setHours(hour || 8, minute || 0, 0);
      setTempTime(date);
    }
  }, [state.notifications?.hour]);

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

  async function handleToggleNotifications(enabled: boolean) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (enabled) {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          t("permission_denied_title"),
          t("permission_denied_message"),
          [{ text: t("ok") }]
        );
        return;
      }

      const hour = tempTime.getHours();
      const minute = tempTime.getMinutes();
      const petName = state.pet.name;
      const userName = state.profile?.name ?? "";
      await scheduleNotification(petName, userName, hour, minute);
    } else {
      await cancelAllNotifications();
    }

    dispatch({
      type: "UPDATE_NOTIFICATIONS",
      payload: {
        enabled,
        hour: enabled
          ? `${tempTime.getHours().toString().padStart(2, "0")}:${tempTime.getMinutes().toString().padStart(2, "0")}`
          : state.notifications?.hour ?? "08:00",
      },
    });
  }

  function openTimePicker() {
    if (!notifEnabled) return;
    setShowTimePicker(true);
  }

  async function onTimeChange(event: any, selectedDate?: Date) {
    setShowTimePicker(false);

    if (!selectedDate) return;

    const hours = selectedDate.getHours();
    const minutes = selectedDate.getMinutes();
    const formatted = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;

    setTempTime(selectedDate);

    dispatch({
      type: "UPDATE_NOTIFICATIONS",
      payload: { enabled: notifEnabled, hour: formatted },
    });

    if (notifEnabled) {
      const petName = state.pet.name;
      const userName = state.profile?.name ?? "";
      await scheduleNotification(petName, userName, hours, minutes);
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
          onPress: async () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            await cancelAllNotifications();
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
              <TouchableOpacity
                style={[styles.timePickerButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={openTimePicker}
              >
                <Text style={{ color: colors.primary, fontSize: 18, fontWeight: "600" }}>
                  {state.notifications?.hour ?? "08:00"}
                </Text>
              </TouchableOpacity>
              {showTimePicker && (
                <DateTimePicker
                  value={tempTime}
                  mode="time"
                  display="spinner"
                  onChange={onTimeChange}
                />
              )}
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