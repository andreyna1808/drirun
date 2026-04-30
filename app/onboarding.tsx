import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import * as Notifications from "expo-notifications";
import { useTranslation } from "react-i18next";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/use-colors";
import DateTimePicker from "@react-native-community/datetimepicker";
import { OnboardingStyles } from "@/styles/onboarding.styles";

const WELCOME_PHRASES = [
  "A jornada de mil milhas começa com um único passo.",
  "Você não precisa ser rápido. Você só precisa ir.",
  "Cada corrida te torna mais forte do que ontem.",
  "Sua Fênix está esperando para renascer com você.",
  "Consistência bate talento quando o talento não é consistente.",
];

export default function OnboardingScreen() {
  const { t } = useTranslation();
  const { dispatch, state } = useApp();
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState(0);

  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [sex, setSex] = useState<"male" | "female" | "other" | "">("");
  const [useImperial, setUseImperial] = useState(false);
  const [goalDays, setGoalDays] = useState("30");
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean | null>(null);
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);

  const [imperialHeightText, setImperialHeightText] = useState("");
  const [imperialWeightText, setImperialWeightText] = useState("");

  const phrase = useRef(WELCOME_PHRASES[Math.floor(Math.random() * WELCOME_PHRASES.length)]).current;

  // Pré‑carrega dados se já existir algum perfil (ex.: retorno após interrupção)
  useEffect(() => {
    if (state.profile) {
      setName(state.profile.name);
      setAge(state.profile.age.toString());
      setHeightCm(state.profile.height.toString());
      setWeightKg(state.profile.weight.toString());
      setSex(state.profile.sex);
      setGoalDays(state.goalDays.toString());
      if (state.notifications.enabled) {
        setNotificationsEnabled(true);
        const [h, m] = state.notifications.hour?.split(":").map(Number) ?? [7, 0];
        const time = new Date();
        time.setHours(h, m);
        setSelectedTime(time);
      }
    }
  }, []);

  // Se o estado já estiver como onboarded (ex.: retomou de um estado salvo), redireciona imediatamente
  useEffect(() => {
    if (state.isOnboarded) {
      router.replace("/(tabs)");
    }
  }, [state.isOnboarded]);

  // Conversões imperiais/métricas
  const cmToImperial = (cm: number) => {
    const totalInches = cm / 2.54;
    const feet = Math.floor(totalInches / 12);
    const inches = Math.round(totalInches % 12);
    return { feet, inches };
  };
  const imperialToCm = (feet: number, inches: number) => (feet * 12 + inches) * 2.54;
  const kgToLb = (kg: number) => kg * 2.20462;
  const lbToKg = (lb: number) => lb / 2.20462;

  const getDisplayHeight = () => {
    if (!heightCm) return "";
    const cm = parseFloat(heightCm);
    if (isNaN(cm)) return "";
    if (useImperial) {
      const { feet, inches } = cmToImperial(cm);
      return `${feet}'${inches}"`;
    }
    return cm.toString();
  };
  const getDisplayWeight = () => {
    if (!weightKg) return "";
    const kg = parseFloat(weightKg);
    if (isNaN(kg)) return "";
    if (useImperial) return Math.round(kgToLb(kg)).toString();
    return kg.toString();
  };

  useEffect(() => {
    if (useImperial) {
      const cm = parseFloat(heightCm);
      if (!isNaN(cm) && cm > 0) {
        const { feet, inches } = cmToImperial(cm);
        setImperialHeightText(`${feet}'${inches}"`);
      } else setImperialHeightText("");
      const kg = parseFloat(weightKg);
      if (!isNaN(kg) && kg > 0) setImperialWeightText(Math.round(kgToLb(kg)).toString());
      else setImperialWeightText("");
    }
  }, [useImperial, heightCm, weightKg]);

  const onImperialHeightBlur = () => {
    const match = imperialHeightText.match(/(\d+)'(\d+)"?/);
    if (match) {
      const feet = parseInt(match[1]);
      const inches = parseInt(match[2]);
      const cm = imperialToCm(feet, inches);
      setHeightCm(Math.round(cm).toString());
    } else {
      const cm = parseFloat(heightCm);
      if (!isNaN(cm) && cm > 0) {
        const { feet, inches } = cmToImperial(cm);
        setImperialHeightText(`${feet}'${inches}"`);
      } else setImperialHeightText("");
    }
  };
  const onImperialWeightBlur = () => {
    const lb = parseFloat(imperialWeightText);
    if (!isNaN(lb) && lb > 0) setWeightKg(lbToKg(lb).toFixed(1));
    else {
      const kg = parseFloat(weightKg);
      if (!isNaN(kg) && kg > 0) setImperialWeightText(Math.round(kgToLb(kg)).toString());
      else setImperialWeightText("");
    }
  };

  // Validações
  const validateProfile = (): boolean => {
    if (!name.trim()) { Alert.alert(t("error"), t("error_name_required")); return false; }
    const ageNum = parseInt(age);
    if (isNaN(ageNum) || ageNum < 5 || ageNum > 120) { Alert.alert(t("error"), t("error_age_invalid")); return false; }
    const heightNum = parseFloat(heightCm);
    if (isNaN(heightNum) || heightNum < 100 || heightNum > 250) { Alert.alert(t("error"), t("error_height_invalid")); return false; }
    const weightNum = parseFloat(weightKg);
    if (isNaN(weightNum) || weightNum < 20 || weightNum > 300) { Alert.alert(t("error"), t("error_weight_invalid")); return false; }
    if (!sex) { Alert.alert(t("error"), t("error_sex_required")); return false; }
    return true;
  };
  const validateGoal = (): boolean => {
    const days = parseInt(goalDays);
    if (isNaN(days) || days < 1) { Alert.alert(t("error"), t("error_goal_invalid")); return false; }
    return true;
  };

  const goToNext = () => {
    if (step === 0) setStep(1);
    else if (step === 1 && validateProfile()) setStep(2);
    else if (step === 2 && validateGoal()) setStep(3);
    else if (step === 3) handleFinish();
  };
  const goToPrev = () => {
    if (step > 0) setStep(step - 1);
  };

  // Notificações
  async function scheduleNotification(petName: string, userName: string, time: Date) {
    try {
      const Notifications = await import('expo-notifications');
      await Notifications.cancelAllScheduledNotificationsAsync();
      const hour = time.getHours();
      const minute = time.getMinutes();
      await Notifications.scheduleNotificationAsync({
        content: {
          title: t("notification_title", { petName }),
          body: t("notification_body", { userName }),
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour,
          minute,
        },
      });
    } catch (e) {
      console.warn("Erro ao agendar notificação:", e);
    }
  }

  async function requestNotificationPermission(): Promise<boolean> {
    try {
      const Notifications = await import('expo-notifications');
      const { status } = await Notifications.requestPermissionsAsync();
      return status === "granted";
    } catch {
      return false;
    }
  }


  async function handleAllowNotifications() {
    const granted = await requestNotificationPermission();
    if (granted) setNotificationsEnabled(true);
    else Alert.alert(
      "Permissão Negada",
      "Não foi possível ativar notificações. Você pode ativá-las depois nas Configurações.",
      [{ text: t("ok"), onPress: () => setNotificationsEnabled(false) }]
    );
  }
  function handleDenyNotifications() {
    setNotificationsEnabled(false);
  }

  // ⭐ HANDLE FINISH CORRIGIDO – salva e navega imediatamente
  const handleFinish = useCallback(async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const profile = {
      name: name.trim(),
      age: parseInt(age),
      weight: parseFloat(weightKg),
      height: parseFloat(heightCm),
      sex: sex as "male" | "female" | "other",
    };

    if (notificationsEnabled) {
      await scheduleNotification("Meu Pet", profile.name, selectedTime);
    }

    // Dispara a action que atualiza o estado global e persiste

    console.log("profile:", { profile, goalDays, notificationsEnabled, selectedTime });
    dispatch({
      type: "COMPLETE_ONBOARDING",
      payload: {
        profile,
        goalDays: parseInt(goalDays),
        notificationsEnabled: notificationsEnabled ?? false,
        notificationHour: notificationsEnabled
          ? `${selectedTime.getHours().toString().padStart(2, "0")}:${selectedTime.getMinutes().toString().padStart(2, "0")}`
          : null,
      },
    });

    // Navega programaticamente para a home (não depende mais do useEffect)
  }, [name, age, weightKg, heightCm, sex, goalDays, notificationsEnabled, selectedTime, dispatch]);

  // RENDERIZAÇÃO DAS ETAPAS (mantida integralmente)
  const renderStepContent = () => {
    switch (step) {
      case 0:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.heroEmoji}>🔥</Text>
            <Text style={[styles.appName, { color: colors.primary }]}>DriRun</Text>
            <Text style={[styles.tagline, { color: colors.muted }]}>{t("tagline")}</Text>
            <Text style={[styles.phrase, { color: colors.foreground }]}>"{phrase}"</Text>
            <View style={styles.featureList}>
              {[
                { icon: "🏃", text: "Rastreie suas corridas com GPS" },
                { icon: "🔥", text: "Cuide da sua Fênix virtual" },
                { icon: "📊", text: "Acompanhe sua evolução" },
                { icon: "🎯", text: "Defina e conquiste suas metas" },
                { icon: "💎", text: "Ganhe gemas e personalize seu pet" },
              ].map((item) => (
                <View key={item.text} style={styles.featureItem}>
                  <Text style={styles.featureIcon}>{item.icon}</Text>
                  <Text style={[styles.featureText, { color: colors.foreground }]}>{item.text}</Text>
                </View>
              ))}
            </View>
          </View>
        );
      case 1:
        return (
          <View style={styles.stepContainer}>
            <View>
              <Text style={[styles.stepTitle, { color: colors.foreground }]}>{t("onboarding_profile_title")}</Text>
              <Text style={[styles.stepSubtitle, { color: colors.muted }]}>{t("onboarding_profile_subtitle")}</Text>
            </View>

            <View style={styles.form}>
              <Text style={[styles.label, { color: colors.muted }]}>{t("onboarding_name_label")}</Text>
              <TextInput style={styles.input} value={name} onChangeText={setName} placeholder={t("onboarding_name_placeholder")} placeholderTextColor={colors.muted} />
              <Text style={[styles.label, { color: colors.muted }]}>{t("onboarding_sex_label")}</Text>
              <View style={styles.sexRow}>
                {[
                  { key: "male" as const, label: t("onboarding_sex_male") },
                  { key: "female" as const, label: t("onboarding_sex_female") },
                  { key: "other" as const, label: t("onboarding_sex_other") },
                ].map((s) => (
                  <TouchableOpacity
                    key={s.key}
                    style={[styles.sexButton, sex === s.key && { borderColor: colors.primary, backgroundColor: colors.primary + "20" }]}
                    onPress={() => setSex(s.key)}
                  >
                    <Text style={[styles.sexButtonText, { color: sex === s.key ? colors.primary : colors.muted }]}>{s.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={[styles.label, { color: colors.muted }]}>{t("onboarding_age_label")}</Text>
              <TextInput style={styles.input} value={age} onChangeText={setAge} keyboardType="numeric" placeholder={t("onboarding_age_placeholder")} />
              <View style={{ flexDirection: "row", marginBottom: 8, marginTop: 12 }}>
                <TouchableOpacity style={[styles.unitButton, !useImperial && styles.unitButtonActive]} onPress={() => setUseImperial(false)}>
                  <Text style={[styles.unitText, !useImperial && { color: "#FFF" }]}>cm / kg</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.unitButton, useImperial && styles.unitButtonActive, { marginHorizontal: 12 }]} onPress={() => setUseImperial(true)}>
                  <Text style={[styles.unitText, useImperial && { color: "#FFF" }]}>ft / lb</Text>
                </TouchableOpacity>
              </View>
              <Text style={[styles.label, { color: colors.muted }]}>{t("onboarding_height_label")}</Text>
              {!useImperial ? (
                <TextInput style={styles.input} value={heightCm} onChangeText={setHeightCm} keyboardType="numeric" placeholder="cm (ex: 175)" />
              ) : (
                <TextInput style={styles.input} value={imperialHeightText} onChangeText={setImperialHeightText} onBlur={onImperialHeightBlur} placeholder="ex: 5'10\" />
              )}
              <Text style={[styles.label, { color: colors.muted }]}>{t("onboarding_weight_label")}</Text>
              {!useImperial ? (
                <TextInput style={styles.input} value={weightKg} onChangeText={setWeightKg} keyboardType="numeric" placeholder="kg (ex: 70)" />
              ) : (
                <TextInput style={styles.input} value={imperialWeightText} onChangeText={setImperialWeightText} onBlur={onImperialWeightBlur} keyboardType="numeric" placeholder="lb (ex: 154)" />
              )}
            </View>
          </View>
        );
      case 2:
        return (
          <View style={styles.stepContainer}>
            <Text style={[styles.stepTitle, { color: colors.foreground }]}>{t("onboarding_goal_title")}</Text>
            <Text style={[styles.stepSubtitle, { color: colors.muted }]}>{t("onboarding_goal_subtitle")}</Text>
            <View style={styles.goalContainer}>
              <TextInput
                style={styles.goalInput}
                value={goalDays}
                onChangeText={(text) => setGoalDays(text.replace(/[^0-9]/g, ""))}
                onBlur={() => {
                  let d = parseInt(goalDays);
                  if (isNaN(d)) d = 30;
                  if (d > 365) { Alert.alert(t("onboarding_goal_max_alert_title"), t("onboarding_goal_max_alert_msg")); setGoalDays("365"); }
                  else if (d < 1) setGoalDays("1");
                }}
                keyboardType="numeric"
                maxLength={3}
              />
              <Text style={[styles.goalLabel, { color: colors.muted }]}>{t("onboarding_goal_label")}</Text>
              <Text style={[styles.goalHint, { color: colors.muted }]}>{t("onboarding_goal_hint")}</Text>
            </View>
            <View style={styles.goalShortcuts}>
              {[7, 14, 21, 30, 60, 90, 180, 365].map((d) => (
                <TouchableOpacity key={d} style={[styles.shortcutButton, goalDays === String(d) && { backgroundColor: colors.primary }]} onPress={() => setGoalDays(String(d))}>
                  <Text style={[styles.shortcutText, { color: goalDays === String(d) ? "#FFF" : colors.muted }]}>{d}d</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.petPreview}>
              <Text style={styles.petPreviewEmoji}>🥚</Text>
              <Text style={[styles.petPreviewText, { color: colors.foreground }]}>{t("onboarding_pet_preview")}</Text>
              <Text style={[styles.petPreviewSub, { color: colors.muted }]}>Desafio de {goalDays || "30"} dias • Ganhe 25 💎 por dia!</Text>
            </View>
          </View>
        );
      case 3:
        return (
          <View style={styles.stepContainer}>
            <View>
              <Text style={[styles.stepTitle, { color: colors.foreground }]}>{t("onboarding_notifications_title")}</Text>
              <Text style={[styles.stepSubtitle, { color: colors.muted }]}>{t("onboarding_notifications_subtitle")}</Text>
            </View>
            {!notificationsEnabled && (
              <View style={styles.notifButtons}>
                <TouchableOpacity style={[styles.notifAllowButton, { backgroundColor: colors.primary }]} onPress={handleAllowNotifications}>
                  <Text style={styles.notifAllowText}>🔔 {t("onboarding_notifications_allow")}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.notifDenyButton, { borderColor: colors.border, backgroundColor: colors.surface }]} onPress={handleDenyNotifications}>
                  <Text style={[styles.notifDenyText, { color: colors.muted }]}>{t("onboarding_notifications_deny")}</Text>
                </TouchableOpacity>
              </View>
            )}
            {!!notificationsEnabled && (
              <View style={styles.timePickerSection}>
                <View style={[styles.notifConfirm, { backgroundColor: colors.success + "20", borderColor: colors.success }]}>
                  <Text style={[styles.notifConfirmText, { color: colors.success }]}>✅ Notificações ativadas!</Text>
                </View>
                <Text style={[styles.timeLabel, { color: colors.foreground }]}>{t("onboarding_notifications_time")}</Text>
                <TouchableOpacity style={[styles.timePickerButton, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => setShowTimePicker(true)}>
                  <Text style={{ color: colors.primary, fontSize: 18, fontWeight: "600" }}>{selectedTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</Text>
                </TouchableOpacity>
                {showTimePicker && (
                  <DateTimePicker
                    value={selectedTime}
                    mode="time"
                    display="spinner"
                    onValueChange={(event, date) => {
                      setShowTimePicker(false);
                      if (date) setSelectedTime(date);
                    }}
                  />
                )}
              </View>
            )}
            {!notificationsEnabled && (
              <View style={styles.notifDeniedSection}>
                <View style={[styles.notifDeniedCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Text style={[styles.notifDeniedText, { color: colors.muted }]}>Tudo bem! Você pode ativar as notificações depois nas Configurações.</Text>
                </View>
              </View>
            )}
          </View>
        );
      default:
        return null;
    }
  };

  const styles = OnboardingStyles(colors);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView
        style={{ flex: 1, height: "100%" }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <ScrollView
          contentContainerStyle={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 24,
            height: "100%",
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {renderStepContent()}
          <View>
            <StepIndicator current={step} total={4} colors={colors} />
            <View style={[styles.navigationButtons]}>
              {step > 0 && (
                <TouchableOpacity style={[styles.navButton, styles.backButton]} onPress={goToPrev}>
                  <Text style={styles.backButtonText}>← {t("back")}</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.navButton, styles.nextButton, step === 0 && { flex: 1 }]}
                onPress={goToNext}
              >
                <Text style={styles.nextButtonText}>{step === 3 ? t("onboarding_finish") : t("next")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// Componente StepIndicator (mantido)
function StepIndicator({ current, total, colors }: { current: number; total: number; colors: any }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "center", gap: 8, marginTop: 8 }}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={{
            width: i === current ? 24 : 8,
            height: 8,
            borderRadius: 10,
            backgroundColor: i === current ? colors.primary : colors.border,
          }}
        />
      ))}
    </View>
  );
}

