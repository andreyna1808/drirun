/**
 * onboarding.tsx
 * Tela de onboarding do DriRun — 4 etapas:
 * 1. Boas-vindas
 * 2. Dados pessoais (nome, sexo, idade, altura)
 * 3. Meta de dias (1-365)
 * 4. Permissao de notificacoes + selecao de horario
 */
import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import * as Notifications from "expo-notifications";
import { useTranslation } from "react-i18next";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/use-colors";

/** Frases motivacionais exibidas na tela de boas-vindas */
const WELCOME_PHRASES = [
  "A jornada de mil milhas comeca com um unico passo.",
  "Voce nao precisa ser rapido. Voce so precisa ir.",
  "Cada corrida te torna mais forte do que ontem.",
  "Sua Fenix esta esperando para renascer com voce.",
  "Consistencia bate talento quando o talento nao e consistente.",
];

/** Horarios disponiveis para o lembrete diario */
const NOTIFICATION_HOURS = [
  "06:00", "07:00", "08:00", "09:00", "10:00",
  "12:00", "14:00", "16:00", "18:00", "19:00", "20:00", "21:00",
];

export default function OnboardingScreen() {
  const { t } = useTranslation();
  const { dispatch } = useApp();
  const colors = useColors();

  // Etapa atual: 0=boas-vindas, 1=perfil, 2=meta, 3=notificacoes
  const [step, setStep] = useState(0);

  // Dados do perfil
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [height, setHeight] = useState("");
  const [sex, setSex] = useState<"male" | "female" | "other" | "">("");

  // Meta de dias
  const [goalDays, setGoalDays] = useState("30");

  // Notificacoes
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean | null>(null);
  const [notificationHour, setNotificationHour] = useState("07:00");

  // Frase motivacional aleatoria (calculada uma vez)
  const phrase = useRef(
    WELCOME_PHRASES[Math.floor(Math.random() * WELCOME_PHRASES.length)]
  ).current;

  // Validacoes
  function validateProfile(): boolean {
    if (!name.trim()) { Alert.alert(t("error"), t("error_name_required")); return false; }
    const ageNum = parseInt(age);
    if (isNaN(ageNum) || ageNum < 5 || ageNum > 120) { Alert.alert(t("error"), t("error_age_invalid")); return false; }
    const heightNum = parseFloat(height);
    if (isNaN(heightNum) || heightNum < 100 || heightNum > 250) { Alert.alert(t("error"), t("error_height_invalid")); return false; }
    if (!sex) { Alert.alert(t("error"), t("error_sex_required")); return false; }
    return true;
  }

  function validateGoal(): boolean {
    const days = parseInt(goalDays);
    if (isNaN(days) || days < 1) { Alert.alert(t("error"), t("error_goal_invalid")); return false; }
    return true;
  }

  /** Ajusta o valor da meta ao sair do campo (max 365) */
  function handleGoalBlur() {
    const days = parseInt(goalDays);
    if (!isNaN(days) && days > 365) {
      Alert.alert(t("onboarding_goal_max_alert_title"), t("onboarding_goal_max_alert_msg"), [{ text: t("ok") }]);
      setGoalDays("365");
    } else if (!isNaN(days) && days < 1) {
      setGoalDays("1");
    }
  }

  /** Avanca para a proxima etapa */
  function handleNext() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step === 0) setStep(1);
    else if (step === 1 && validateProfile()) setStep(2);
    else if (step === 2 && validateGoal()) setStep(3);
  }

  /** Solicita permissao de notificacoes ao SO */
  async function requestNotificationPermission(): Promise<boolean> {
    if (Platform.OS === "web") return false;
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      return status === "granted";
    } catch { return false; }
  }

  /** Agenda notificacao diaria no horario escolhido */
  async function scheduleNotification(petName: string, userName: string, timeStr: string) {
    if (Platform.OS === "web") return;
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      const [h, m] = timeStr.split(":").map(Number);
      await Notifications.scheduleNotificationAsync({
        content: {
          title: t("notification_title", { petName }),
          body: t("notification_body", { userName }),
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: h,
          minute: m,
        },
      });
    } catch (e) { console.warn("Erro ao agendar notificacao:", e); }
  }

  /** Usuario aceita receber notificacoes */
  async function handleAllowNotifications() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const granted = await requestNotificationPermission();
    if (granted) {
      setNotificationsEnabled(true);
    } else {
      Alert.alert("Permissao Negada", "Nao foi possivel ativar as notificacoes. Voce pode ativa-las depois nas Configuracoes.", [
        { text: t("ok"), onPress: () => setNotificationsEnabled(false) },
      ]);
    }
  }

  /** Usuario recusa notificacoes */
  function handleDenyNotifications() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setNotificationsEnabled(false);
  }

  /** Finaliza o onboarding e redireciona para o app */
  async function handleFinish() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const profile = {
      name: name.trim(),
      age: parseInt(age),
      weight: 70,
      height: parseFloat(height),
      sex: sex as "male" | "female" | "other",
    };
    if (notificationsEnabled) {
      await scheduleNotification("Meu Pet", profile.name, notificationHour);
    }
    dispatch({
      type: "COMPLETE_ONBOARDING",
      payload: {
        profile,
        goalDays: parseInt(goalDays),
        notificationsEnabled: notificationsEnabled ?? false,
        notificationHour: notificationsEnabled ? notificationHour : null,
      },
    });
    router.replace("/(tabs)");
  }

  const styles = createStyles(colors);

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Etapa 0: Boas-vindas */}
        {step === 0 && (
          <View style={styles.stepContainer}>
            <Text style={styles.heroEmoji}>🔥</Text>
            <Text style={[styles.appName, { color: colors.primary }]}>DriRun</Text>
            <Text style={[styles.tagline, { color: colors.muted }]}>{t("tagline")}</Text>
            <Text style={[styles.phrase, { color: colors.foreground }]}>"{phrase}"</Text>
            <View style={styles.featureList}>
              {[
                { icon: "🏃", text: "Rastreie suas corridas com GPS" },
                { icon: "🔥", text: "Cuide da sua Fenix virtual" },
                { icon: "📊", text: "Acompanhe sua evolucao" },
                { icon: "🎯", text: "Defina e conquiste suas metas" },
                { icon: "💎", text: "Ganhe gemas e personalize seu pet" },
              ].map((item) => (
                <View key={item.text} style={styles.featureItem}>
                  <Text style={styles.featureIcon}>{item.icon}</Text>
                  <Text style={[styles.featureText, { color: colors.foreground }]}>{item.text}</Text>
                </View>
              ))}
            </View>
            <TouchableOpacity style={[styles.primaryButton, { backgroundColor: colors.primary }]} onPress={handleNext}>
              <Text style={styles.primaryButtonText}>{t("onboarding_start")}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Etapa 1: Dados pessoais */}
        {step === 1 && (
          <View style={styles.stepContainer}>
            <Text style={[styles.stepTitle, { color: colors.foreground }]}>{t("onboarding_profile_title")}</Text>
            <Text style={[styles.stepSubtitle, { color: colors.muted }]}>{t("onboarding_profile_subtitle")}</Text>
            <View style={styles.form}>
              <Text style={[styles.label, { color: colors.muted }]}>{t("onboarding_name_label")}</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground }]}
                placeholder={t("onboarding_name_placeholder")}
                placeholderTextColor={colors.muted}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                returnKeyType="done"
              />
              <Text style={[styles.label, { color: colors.muted }]}>{t("onboarding_sex_label")}</Text>
              <View style={styles.sexRow}>
                {[
                  { key: "male" as const, emoji: "👨", label: t("onboarding_sex_male") },
                  { key: "female" as const, emoji: "👩", label: t("onboarding_sex_female") },
                  { key: "other" as const, emoji: "🧑", label: t("onboarding_sex_other") },
                ].map((s) => (
                  <TouchableOpacity
                    key={s.key}
                    style={[
                      styles.sexButton,
                      { borderColor: colors.border, backgroundColor: colors.surface },
                      sex === s.key && { borderColor: colors.primary, backgroundColor: colors.primary + "20" },
                    ]}
                    onPress={() => { setSex(s.key); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                  >
                    <Text style={styles.sexEmoji}>{s.emoji}</Text>
                    <Text style={[styles.sexButtonText, { color: sex === s.key ? colors.primary : colors.muted }]}>{s.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={[styles.label, { color: colors.muted }]}>{t("onboarding_age_label")}</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground }]}
                placeholder={t("onboarding_age_placeholder")}
                placeholderTextColor={colors.muted}
                value={age}
                onChangeText={setAge}
                keyboardType="numeric"
                returnKeyType="done"
              />
              <Text style={[styles.label, { color: colors.muted }]}>{t("onboarding_height_label")}</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground }]}
                placeholder={t("onboarding_height_placeholder")}
                placeholderTextColor={colors.muted}
                value={height}
                onChangeText={setHeight}
                keyboardType="numeric"
                returnKeyType="done"
              />
            </View>
            <TouchableOpacity style={[styles.primaryButton, { backgroundColor: colors.primary }]} onPress={handleNext}>
              <Text style={styles.primaryButtonText}>{t("next")}</Text>
            </TouchableOpacity>
            <StepIndicator current={1} total={4} colors={colors} />
          </View>
        )}

        {/* Etapa 2: Meta de dias */}
        {step === 2 && (
          <View style={styles.stepContainer}>
            <Text style={styles.goalEmoji}>🎯</Text>
            <Text style={[styles.stepTitle, { color: colors.foreground }]}>{t("onboarding_goal_title")}</Text>
            <Text style={[styles.stepSubtitle, { color: colors.muted }]}>{t("onboarding_goal_subtitle")}</Text>
            <View style={styles.goalContainer}>
              <TextInput
                style={[styles.goalInput, { color: colors.primary, borderBottomColor: colors.primary }]}
                value={goalDays}
                onChangeText={(text) => setGoalDays(text.replace(/[^0-9]/g, ""))}
                onBlur={handleGoalBlur}
                keyboardType="numeric"
                maxLength={3}
                returnKeyType="done"
                selectTextOnFocus
              />
              <Text style={[styles.goalLabel, { color: colors.muted }]}>{t("onboarding_goal_label")}</Text>
              <Text style={[styles.goalHint, { color: colors.muted }]}>{t("onboarding_goal_hint")}</Text>
            </View>
            <View style={styles.goalShortcuts}>
              {[7, 14, 21, 30, 60, 90, 180, 365].map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[
                    styles.shortcutButton,
                    { borderColor: colors.border, backgroundColor: colors.surface },
                    goalDays === String(d) && { borderColor: colors.primary, backgroundColor: colors.primary },
                  ]}
                  onPress={() => { setGoalDays(String(d)); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                >
                  <Text style={[styles.shortcutText, { color: goalDays === String(d) ? "#FFFFFF" : colors.muted }]}>{d}d</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={[styles.petPreview, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={styles.petPreviewEmoji}>🥚</Text>
              <Text style={[styles.petPreviewText, { color: colors.foreground }]}>{t("onboarding_pet_preview")}</Text>
              <Text style={[styles.petPreviewSub, { color: colors.muted }]}>
                Desafio de {goalDays || "30"} dias • Ganhe 25 💎 por dia!
              </Text>
            </View>
            <TouchableOpacity style={[styles.primaryButton, { backgroundColor: colors.primary }]} onPress={handleNext}>
              <Text style={styles.primaryButtonText}>{t("next")}</Text>
            </TouchableOpacity>
            <StepIndicator current={2} total={4} colors={colors} />
          </View>
        )}

        {/* Etapa 3: Notificacoes */}
        {step === 3 && (
          <View style={styles.stepContainer}>
            <Text style={styles.notifEmoji}>🔔</Text>
            <Text style={[styles.stepTitle, { color: colors.foreground }]}>{t("onboarding_notifications_title")}</Text>
            <Text style={[styles.stepSubtitle, { color: colors.muted }]}>{t("onboarding_notifications_subtitle")}</Text>

            {notificationsEnabled === null && (
              <View style={styles.notifButtons}>
                <TouchableOpacity style={[styles.notifAllowButton, { backgroundColor: colors.primary }]} onPress={handleAllowNotifications}>
                  <Text style={styles.notifAllowText}>🔔 {t("onboarding_notifications_allow")}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.notifDenyButton, { borderColor: colors.border, backgroundColor: colors.surface }]} onPress={handleDenyNotifications}>
                  <Text style={[styles.notifDenyText, { color: colors.muted }]}>{t("onboarding_notifications_deny")}</Text>
                </TouchableOpacity>
              </View>
            )}

            {notificationsEnabled === true && (
              <View style={styles.timePickerSection}>
                <View style={[styles.notifConfirm, { backgroundColor: colors.success + "20", borderColor: colors.success }]}>
                  <Text style={[styles.notifConfirmText, { color: colors.success }]}>✅ Notificacoes ativadas!</Text>
                </View>
                <Text style={[styles.timeLabel, { color: colors.foreground }]}>{t("onboarding_notifications_time")}</Text>
                <Text style={[styles.timeHint, { color: colors.muted }]}>{t("onboarding_notifications_time_hint")}</Text>
                <View style={styles.timeGrid}>
                  {NOTIFICATION_HOURS.map((hour) => (
                    <TouchableOpacity
                      key={hour}
                      style={[
                        styles.timeButton,
                        { borderColor: colors.border, backgroundColor: colors.surface },
                        notificationHour === hour && { borderColor: colors.primary, backgroundColor: colors.primary },
                      ]}
                      onPress={() => { setNotificationHour(hour); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                    >
                      <Text style={[styles.timeButtonText, { color: notificationHour === hour ? "#FFFFFF" : colors.muted }]}>{hour}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TouchableOpacity style={[styles.primaryButton, { backgroundColor: colors.primary }]} onPress={handleFinish}>
                  <Text style={styles.primaryButtonText}>{t("onboarding_finish")}</Text>
                </TouchableOpacity>
              </View>
            )}

            {notificationsEnabled === false && (
              <View style={styles.notifDeniedSection}>
                <View style={[styles.notifDeniedCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Text style={[styles.notifDeniedText, { color: colors.muted }]}>
                    Tudo bem! Voce pode ativar as notificacoes depois nas Configuracoes.
                  </Text>
                </View>
                <TouchableOpacity style={[styles.primaryButton, { backgroundColor: colors.primary }]} onPress={handleFinish}>
                  <Text style={styles.primaryButtonText}>{t("onboarding_finish")}</Text>
                </TouchableOpacity>
              </View>
            )}

            <StepIndicator current={3} total={4} colors={colors} />
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/** Indicador de progresso das etapas */
function StepIndicator({ current, total, colors }: { current: number; total: number; colors: any }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "center", gap: 8, marginTop: 24 }}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={{
            width: i === current ? 24 : 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: i === current ? colors.primary : colors.border,
          }}
        />
      ))}
    </View>
  );
}

function createStyles(colors: any) {
  return StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40 },
    stepContainer: { flex: 1, alignItems: "center" },
    heroEmoji: { fontSize: 72, marginBottom: 8 },
    appName: { fontSize: 40, fontWeight: "900", letterSpacing: 3 },
    tagline: { fontSize: 16, marginBottom: 20, letterSpacing: 1 },
    phrase: { fontSize: 15, fontStyle: "italic", textAlign: "center", marginBottom: 32, lineHeight: 22 },
    featureList: { width: "100%", marginBottom: 32 },
    featureItem: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 },
    featureIcon: { fontSize: 22 },
    featureText: { fontSize: 15, flex: 1 },
    primaryButton: { borderRadius: 16, paddingVertical: 16, paddingHorizontal: 40, width: "100%", alignItems: "center", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
    primaryButtonText: { color: "#FFFFFF", fontSize: 17, fontWeight: "700", letterSpacing: 0.5 },
    stepTitle: { fontSize: 28, fontWeight: "800", marginBottom: 8, textAlign: "center" },
    stepSubtitle: { fontSize: 15, textAlign: "center", marginBottom: 28, lineHeight: 22 },
    form: { width: "100%", marginBottom: 24 },
    label: { fontSize: 13, marginBottom: 6, fontWeight: "600" },
    input: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 16, marginBottom: 16 },
    sexRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
    sexButton: { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1.5, alignItems: "center", gap: 4 },
    sexEmoji: { fontSize: 22 },
    sexButtonText: { fontSize: 12, fontWeight: "600" },
    goalEmoji: { fontSize: 64, marginBottom: 8 },
    goalContainer: { alignItems: "center", marginBottom: 24, width: "100%" },
    goalInput: { fontSize: 72, fontWeight: "900", textAlign: "center", width: 180, borderBottomWidth: 3, paddingBottom: 8 },
    goalLabel: { fontSize: 18, marginTop: 8, fontWeight: "600" },
    goalHint: { fontSize: 12, marginTop: 8 },
    goalShortcuts: { flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "center", marginBottom: 24 },
    shortcutButton: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1.5 },
    shortcutText: { fontSize: 13, fontWeight: "600" },
    petPreview: { borderRadius: 16, padding: 20, width: "100%", alignItems: "center", marginBottom: 24, borderWidth: 1 },
    petPreviewEmoji: { fontSize: 48, marginBottom: 8 },
    petPreviewText: { fontSize: 16, fontWeight: "700", marginBottom: 6, textAlign: "center" },
    petPreviewSub: { fontSize: 13, textAlign: "center", lineHeight: 20 },
    notifEmoji: { fontSize: 64, marginBottom: 8 },
    notifButtons: { width: "100%", gap: 12, marginTop: 8 },
    notifAllowButton: { paddingVertical: 16, borderRadius: 16, alignItems: "center" },
    notifAllowText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
    notifDenyButton: { paddingVertical: 14, borderRadius: 16, alignItems: "center", borderWidth: 1 },
    notifDenyText: { fontSize: 15, fontWeight: "600" },
    notifConfirm: { borderRadius: 12, padding: 12, borderWidth: 1, marginBottom: 20, width: "100%", alignItems: "center" },
    notifConfirmText: { fontSize: 15, fontWeight: "700" },
    timePickerSection: { width: "100%", alignItems: "center" },
    timeLabel: { fontSize: 18, fontWeight: "700", marginBottom: 6, textAlign: "center" },
    timeHint: { fontSize: 13, marginBottom: 16, textAlign: "center" },
    timeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "center", marginBottom: 24, width: "100%" },
    timeButton: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1.5, minWidth: 70, alignItems: "center" },
    timeButtonText: { fontSize: 14, fontWeight: "600" },
    notifDeniedSection: { width: "100%", alignItems: "center", gap: 16 },
    notifDeniedCard: { borderRadius: 12, padding: 16, borderWidth: 1, width: "100%" },
    notifDeniedText: { fontSize: 14, lineHeight: 22, textAlign: "center" },
  });
}
