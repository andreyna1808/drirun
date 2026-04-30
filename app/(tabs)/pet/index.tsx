import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Animated,
  Alert,
  Modal,
} from "react-native";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { useApp, PetState, calculatePetState, calculateDaysSinceLastRun } from "@/context/AppContext";
import { useColors } from "@/hooks/use-colors";
import { ScreenContainer } from "@/components/screen-container";
import { PetStyles } from "@/styles/tabs/pet.styles";
import { BANNER_AD_UNIT_ID, useRewardedAd } from "@/hooks/use-ads";
import { BannerAd, BannerAdSize } from "react-native-google-mobile-ads";

// ─── Configuração dos estados do pet ─────────────────────────────────────────

interface PetStateConfig {
  emoji: string;
  title: string;        // chave de tradução
  description: string;  // chave de tradução
  color: string;
  animation: "float" | "shake" | "pulse" | "spin" | "none";
}

/** Configuração visual para cada estado da Fênix (textos vêm do i18n) */
const PET_STATES: Record<PetState, PetStateConfig> = {
  egg: {
    emoji: "🥚",
    title: "pet_state_egg_title",
    description: "pet_state_egg_description",
    color: "#FFD700",
    animation: "pulse",
  },
  hatchling: {
    emoji: "🐣",
    title: "pet_state_hatchling_title",
    description: "pet_state_hatchling_description",
    color: "#FF8C5A",
    animation: "float",
  },
  young: {
    emoji: "🦅",
    title: "pet_state_young_title",
    description: "pet_state_young_description",
    color: "#FF6B35",
    animation: "float",
  },
  adult: {
    emoji: "🔥",
    title: "pet_state_adult_title",
    description: "pet_state_adult_description",
    color: "#FFD700",
    animation: "pulse",
  },
  free: {
    emoji: "✨",
    title: "pet_state_free_title",
    description: "pet_state_free_description",
    color: "#FFD700",
    animation: "spin",
  },
  sad: {
    emoji: "😢",
    title: "pet_state_sad_title",
    description: "pet_state_sad_description",
    color: "#6B7280",
    animation: "none",
  },
  depressed: {
    emoji: "😞",
    title: "pet_state_depressed_title",
    description: "pet_state_depressed_description",
    color: "#4B5563",
    animation: "shake",
  },
  dead: {
    emoji: "💀",
    title: "pet_state_dead_title",
    description: "pet_state_dead_description",
    color: "#374151",
    animation: "none",
  },
  reborn: {
    emoji: "🌟",
    title: "pet_state_reborn_title",
    description: "pet_state_reborn_description",
    color: "#FF6B35",
    animation: "spin",
  },
};

// ─── Componente da Fênix animada ──────────────────────────────────────────────

function PhoenixDisplay({
  petState,
  petName,
  colors,
  t,
}: {
  petState: PetState;
  petName: string;
  colors: any;
  t: any;
}) {
  const config = PET_STATES[petState];
  const animValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let animation: Animated.CompositeAnimation | null = null;

    if (config.animation === "float") {
      animation = Animated.loop(
        Animated.sequence([
          Animated.timing(animValue, { toValue: -12, duration: 1200, useNativeDriver: true }),
          Animated.timing(animValue, { toValue: 0, duration: 1200, useNativeDriver: true }),
        ])
      );
    } else if (config.animation === "pulse") {
      animation = Animated.loop(
        Animated.sequence([
          Animated.timing(animValue, { toValue: 1, duration: 800, useNativeDriver: true }),
          Animated.timing(animValue, { toValue: 0, duration: 800, useNativeDriver: true }),
        ])
      );
    } else if (config.animation === "shake") {
      animation = Animated.loop(
        Animated.sequence([
          Animated.timing(animValue, { toValue: -6, duration: 100, useNativeDriver: true }),
          Animated.timing(animValue, { toValue: 6, duration: 100, useNativeDriver: true }),
          Animated.timing(animValue, { toValue: -6, duration: 100, useNativeDriver: true }),
          Animated.timing(animValue, { toValue: 0, duration: 100, useNativeDriver: true }),
          Animated.delay(2000),
        ])
      );
    } else if (config.animation === "spin") {
      animation = Animated.loop(
        Animated.timing(animValue, { toValue: 1, duration: 3000, useNativeDriver: true })
      );
    }

    animation?.start();
    return () => {
      animation?.stop();
      animValue.setValue(0);
    };
  }, [petState]);

  const animStyle = (() => {
    if (config.animation === "float" || config.animation === "shake") {
      return { transform: [{ translateY: animValue }] };
    }
    if (config.animation === "pulse") {
      return {
        transform: [{
          scale: animValue.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] }),
        }],
      };
    }
    if (config.animation === "spin") {
      return {
        transform: [{
          rotate: animValue.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] }),
        }],
      };
    }
    return {};
  })();

  return (
    <View style={{ alignItems: "center", paddingVertical: 24 }}>
      <View
        style={{
          width: 160,
          height: 160,
          borderRadius: 80,
          backgroundColor: config.color + "20",
          alignItems: "center",
          justifyContent: "center",
          borderWidth: 3,
          borderColor: config.color + "40",
          marginBottom: 16,
        }}
      >
        <Animated.Text style={[{ fontSize: 80 }, animStyle]}>
          {config.emoji}
        </Animated.Text>
      </View>

      <Text style={{ fontSize: 22, fontWeight: "800", color: config.color, marginBottom: 4 }}>
        {petName}
      </Text>

      <Text style={{ fontSize: 15, color: "#6B7280", marginBottom: 8 }}>
        {t(config.title)}
      </Text>
    </View>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function PetScreen() {
  const { t } = useTranslation();
  const { state, dispatch, refreshPetState } = useApp();
  const colors = useColors();
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(state.pet.name);
  const [cooldown, setCooldown] = useState(0);

  const { showAd, loaded } = useRewardedAd(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    dispatch({ type: "ADD_GEMS", payload: 25 });
    Alert.alert(t("pet_ad_reward_title"), t("pet_ad_reward_message"));
    setCooldown(30);
  });

  useEffect(() => {
    refreshPetState();
  }, [refreshPetState]);

  const petConfig = PET_STATES[state.pet.state];

  const evolutionProgress = useMemo(() => {
    const { totalDaysCompleted } = state.pet;
    const { goalDays } = state;
    return Math.min(Math.round((totalDaysCompleted / goalDays) * 100), 100);
  }, [state.pet.totalDaysCompleted, state.goalDays]);

  const nextEvolution = useMemo(() => {
    const { totalDaysCompleted } = state.pet;
    if (totalDaysCompleted < 1) return { nameKey: "pet_state_hatchling_title", daysNeeded: 1 };
    if (totalDaysCompleted < 8) return { nameKey: "pet_state_young_title", daysNeeded: 8 };
    if (totalDaysCompleted < 21) return { nameKey: "pet_state_adult_title", daysNeeded: 21 };
    if (totalDaysCompleted < state.goalDays)
      return { nameKey: "pet_state_free_title", daysNeeded: state.goalDays };
    return null;
  }, [state.pet.totalDaysCompleted, state.goalDays]);

  function handleRename() {
    if (!newName.trim()) {
      Alert.alert(t("pet_invalid_name_title"), t("pet_invalid_name_message"));
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    dispatch({ type: "RENAME_PET", payload: newName.trim() });
    setIsRenaming(false);
  }

  const styles = PetStyles(colors);

  // ── Tela de RIP (pet morto) ────────────────────────────────────────────────
  if ((state.pet.state as string) === "dead") {
    return (
      <ScreenContainer>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.ripContainer}>
            <Text style={styles.ripEmoji}>🪦</Text>
            <Text style={styles.ripTitle}>R.I.P.</Text>
            <Text style={styles.ripPetName}>{state.pet.name}</Text>
            <View style={styles.ripCard}>
              <Text style={styles.ripReason}>{t("pet_rip_reason_label")}</Text>
              <Text style={styles.ripText}>
                {state.profile?.name ?? t("pet_rip_fallback_owner")} {t("pet_rip_not_consistent")}
              </Text>
              <Text style={styles.ripDays}>
                {t("pet_rip_days_label", { days: state.pet.daysSinceLastRun })}
              </Text>
            </View>
            <Text style={styles.ripHope}>{t("pet_rip_hope")}</Text>
          </View>
        </ScrollView>
      </ScreenContainer>
    );
  }

  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown(prev => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  return (
    <ScreenContainer>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header com gemas */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 12,
            backgroundColor: colors.primary + "50",
            padding: 12,
            borderRadius: 10,
          }}
        >
          <Text style={styles.shopTitle}>{t("pet_gems_header", { gems: state.gems })}</Text>
          <Text style={[{ fontSize: 12, color: "white" }]}>{t("pet_gems_per_run")}</Text>
        </View>

        <View style={styles.header}>
          <Text style={styles.title}>{t("pet_title")}</Text>
          <TouchableOpacity style={styles.renameButton} onPress={() => setIsRenaming(true)}>
            <Text style={styles.renameButtonText}>{t("pet_rename_button")}</Text>
          </TouchableOpacity>
        </View>

        {/* Exibição da Fênix */}
        <View style={[styles.petCard, { borderColor: petConfig.color + "40" }]}>
          <PhoenixDisplay
            petState={state.pet.state}
            petName={state.pet.name}
            colors={colors}
            t={t}
          />
          <Text style={styles.petDescription}>{t(petConfig.description)}</Text>
        </View>

        <View>
          <TouchableOpacity
            style={[
              styles.shopButton,
              { backgroundColor: colors.primary, marginBottom: 12 },
              (cooldown > 0) && { opacity: 0.5 }
            ]}
            disabled={cooldown > 0}
            onPress={() => {
              if (cooldown > 0) return;
              showAd();
            }}
          >
            <Text>
              {cooldown > 0
                ? `${cooldown}s`
                : t("pet_watch_ad_button")}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Barra de evolução */}
        <View style={styles.evolutionCard}>
          <View style={styles.evolutionHeader}>
            <Text style={styles.evolutionLabel}>{t("pet_evolution_label")}</Text>
            <Text style={styles.evolutionPercent}>{evolutionProgress}%</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${evolutionProgress}%`,
                  backgroundColor: petConfig.color,
                },
              ]}
            />
          </View>
          {nextEvolution && (
            <Text style={styles.evolutionHint}>
              {t("pet_next_evolution", {
                name: t(nextEvolution.nameKey),
                days: nextEvolution.daysNeeded - state.pet.totalDaysCompleted,
              })}
            </Text>
          )}
        </View>

        {/* Estatísticas do pet */}
        <View style={styles.statsGrid}>
          <StatCard
            value={String(state.pet.totalDaysCompleted)}
            label={t("pet_stat_days_run")}
            color={colors.success}
            colors={colors}
          />
          <StatCard
            value={
              state.pet.daysSinceLastRun === 0
                ? t("pet_stat_today")
                : `${state.pet.daysSinceLastRun}d`
            }
            label={t("pet_stat_last_run")}
            color={state.pet.daysSinceLastRun === 0 ? colors.success : colors.warning}
            colors={colors}
          />
          <StatCard
            value={`${state.goalDays - state.pet.totalDaysCompleted}`}
            label={t("pet_stat_days_left")}
            color={colors.primary}
            colors={colors}
          />
        </View>

        {/* Aviso de inatividade */}
        {state.pet.daysSinceLastRun > 0 && state.pet.state !== "dead" && (
          <View
            style={[
              styles.warningCard,
              {
                backgroundColor:
                  state.pet.daysSinceLastRun >= 3 ? colors.error + "15" : colors.warning + "15",
                borderColor:
                  state.pet.daysSinceLastRun >= 3 ? colors.error + "40" : colors.warning + "40",
              },
            ]}
          >
            <Text style={styles.warningText}>
              {state.pet.daysSinceLastRun >= 6
                ? t("pet_warning_urgent", { name: state.pet.name })
                : state.pet.daysSinceLastRun >= 3
                  ? t("pet_warning_depressed", {
                    name: state.pet.name,
                    days: 7 - state.pet.daysSinceLastRun,
                  })
                  : t("pet_warning_sad", { name: state.pet.name })}
            </Text>
          </View>
        )}

        {!state.hasRemovedAds && (
          <View style={styles.adBanner}>
            <BannerAd
              unitId={BANNER_AD_UNIT_ID}
              size={BannerAdSize.LARGE_ANCHORED_ADAPTIVE_BANNER}
              requestOptions={{ requestNonPersonalizedAdsOnly: true }}
            />
          </View>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Modal de renomear */}
      <Modal visible={isRenaming} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{t("pet_rename_modal_title")}</Text>
            <TextInput
              style={styles.modalInput}
              value={newName}
              onChangeText={setNewName}
              placeholder={t("pet_name_placeholder")}
              placeholderTextColor={colors.muted}
              maxLength={20}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleRename}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.border }]}
                onPress={() => {
                  setIsRenaming(false);
                  setNewName(state.pet.name);
                }}
              >
                <Text style={[styles.modalButtonText, { color: colors.foreground }]}>
                  {t("pet_cancel_button")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.primary }]}
                onPress={handleRename}
              >
                <Text style={[styles.modalButtonText, { color: "#FFFFFF" }]}>
                  {t("pet_save_button")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

// ─── Componente de card de estatística ───────────────────────────────────────

function StatCard({
  value,
  label,
  color,
  colors,
}: {
  value: string;
  label: string;
  color: string;
  colors: any;
}) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 12,
        alignItems: "center",
        marginHorizontal: 4,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <Text style={{ fontSize: 20, fontWeight: "800", color }}>{value}</Text>
      <Text style={{ fontSize: 11, color: colors.muted, marginTop: 2, textAlign: "center" }}>
        {label}
      </Text>
    </View>
  );
}