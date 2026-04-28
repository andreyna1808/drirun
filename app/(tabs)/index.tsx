/**
 * index.tsx (Home Screen)
 * Tela principal do DriRun. Mostra o status do dia, botão de iniciar corrida,
 * frase motivacional, histórico do dia e banner de anúncio.
 */

import React, { useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  Dimensions,
} from "react-native";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { useApp, hasRunToday, getTodayRun } from "@/context/AppContext";
import { useColors } from "@/hooks/use-colors";
import { ScreenContainer } from "@/components/screen-container";

const { width } = Dimensions.get("window");

// ─── Frases motivacionais ─────────────────────────────────────────────────────

const MOTIVATIONAL_PHRASES = [
  "Cada quilômetro é uma vitória sobre a preguiça. 💪",
  "Você não precisa ser rápido. Só precisa ir. 🏃",
  "A consistência bate o talento todo dia. 🔥",
  "Sua Fênix está esperando para crescer com você. 🦅",
  "Um passo de cada vez. Você consegue! ⚡",
  "O único treino ruim é o que não aconteceu. 🎯",
  "Corra hoje. Agradeça amanhã. 🌅",
  "Cada suor é uma lágrima da preguiça. 💦",
  "Você já fez isso antes. Você pode de novo. 🏆",
  "Movimento é vida. Vá em frente! 🌟",
];

/** Retorna uma frase motivacional baseada no dia atual (consistente durante o dia) */
function getDailyPhrase(): string {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
  return MOTIVATIONAL_PHRASES[dayOfYear % MOTIVATIONAL_PHRASES.length];
}

/** Formata segundos em string legível */
function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}min`;
  if (m > 0) return `${m}min ${String(s).padStart(2, "0")}s`;
  return `${s}s`;
}

/** Formata pace em min:ss /km */
function formatPace(paceSecondsPerKm: number): string {
  if (!isFinite(paceSecondsPerKm) || paceSecondsPerKm <= 0) return "--:--";
  const m = Math.floor(paceSecondsPerKm / 60);
  const s = Math.round(paceSecondsPerKm % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

// ─── Componente ───────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const { state, refreshPetState } = useApp();
  const colors = useColors();

  const alreadyRan = hasRunToday(state.runs);
  const todayRun = getTodayRun(state.runs);
  const phrase = getDailyPhrase();

  // Calcula o progresso da meta
  const daysCompleted = state.pet.totalDaysCompleted;
  const progressPercent = Math.min(
    Math.round((daysCompleted / state.goalDays) * 100),
    100
  );

  // Atualiza o estado do pet ao abrir a tela
  useEffect(() => {
    refreshPetState();
  }, [refreshPetState]);

  // Calcula o streak atual (dias consecutivos com corrida)
  const streak = calculateStreak(state.runs);

  function handleStartRun() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push("/tracking" as any);
  }

  const styles = createStyles(colors);

  return (
    <ScreenContainer>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>
              Olá, {state.profile?.name?.split(" ")[0] ?? "Atleta"}! 👋
            </Text>
            <Text style={styles.date}>
              {new Date().toLocaleDateString("pt-BR", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </Text>
          </View>
          {/* Streak badge */}
          <View style={styles.streakBadge}>
            <Text style={styles.streakEmoji}>🔥</Text>
            <Text style={styles.streakCount}>{streak}</Text>
          </View>
        </View>

        {/* ── Progresso da meta ── */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Meta: {state.goalDays} dias</Text>
            <Text style={styles.progressPercent}>{progressPercent}%</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
          </View>
          <Text style={styles.progressSub}>
            {daysCompleted} de {state.goalDays} dias concluídos
          </Text>
        </View>

        {/* ── Status do dia ── */}
        {alreadyRan ? (
          /* Já correu hoje — mensagem de parabéns */
          <View style={styles.doneCard}>
            <Text style={styles.doneEmoji}>🎉</Text>
            <Text style={styles.doneTitle}>Incrível! Você arrasou hoje!</Text>
            <Text style={styles.doneSub}>
              Descanse bem. Te esperamos amanhã para mais uma conquista!
            </Text>
          </View>
        ) : (
          /* Ainda não correu — botão de iniciar */
          <View style={styles.startCard}>
            <Text style={styles.phraseText}>"{phrase}"</Text>
            <TouchableOpacity style={styles.startButton} onPress={handleStartRun}>
              <Text style={styles.startButtonText}>🏃 Iniciar Corrida</Text>
            </TouchableOpacity>
            <Text style={styles.startHint}>
              Toque para começar sua atividade de hoje
            </Text>
          </View>
        )}

        {/* ── Histórico do dia ── */}
        {todayRun && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Atividade de Hoje</Text>
            <View style={styles.todayRunCard}>
              <RunMetricRow
                label="Distância"
                value={`${(todayRun.distance / 1000).toFixed(2)} km`}
                colors={colors}
              />
              <RunMetricRow
                label="Pace Médio"
                value={`${formatPace(todayRun.pace)} /km`}
                colors={colors}
              />
              <RunMetricRow
                label="Tempo"
                value={formatDuration(todayRun.duration)}
                colors={colors}
              />
              <RunMetricRow
                label="Calorias"
                value={`${todayRun.calories} kcal`}
                colors={colors}
                isLast
              />
            </View>
          </View>
        )}

        {/* ── Histórico recente ── */}
        {state.runs.length > 1 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Últimas Atividades</Text>
            {state.runs
              .slice(-3)
              .reverse()
              .filter((r) => r.id !== todayRun?.id)
              .map((run) => (
                <View key={run.id} style={styles.recentRunCard}>
                  <View>
                    <Text style={styles.recentRunDate}>
                      {new Date(run.date).toLocaleDateString("pt-BR", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                      })}
                    </Text>
                    <Text style={styles.recentRunDistance}>
                      {(run.distance / 1000).toFixed(2)} km
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={styles.recentRunPace}>
                      {formatPace(run.pace)} /km
                    </Text>
                    <Text style={styles.recentRunTime}>
                      {formatDuration(run.duration)}
                    </Text>
                  </View>
                </View>
              ))}
          </View>
        )}

        {/* Espaço para o banner de anúncio */}
        <View style={{ height: 60 }} />
      </ScrollView>

      {/* ── Banner de anúncio (fixo na parte inferior) ── */}
      {!state.hasRemovedAds && (
        <View style={styles.adBanner}>
          <Text style={styles.adText}>📢 Publicidade — Remova os anúncios</Text>
        </View>
      )}
    </ScreenContainer>
  );
}

// ─── Componente auxiliar de linha de métrica ──────────────────────────────────

function RunMetricRow({
  label, value, colors, isLast = false,
}: {
  label: string;
  value: string;
  colors: any;
  isLast?: boolean;
}) {
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

// ─── Cálculo de streak ────────────────────────────────────────────────────────

/** Calcula quantos dias consecutivos o usuário correu até hoje */
function calculateStreak(runs: Array<{ date: string }>): number {
  if (runs.length === 0) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let streak = 0;
  let checkDate = new Date(today);

  while (true) {
    const dateStr = checkDate.toISOString().split("T")[0];
    const hasRun = runs.some((r) => r.date === dateStr);
    if (!hasRun) break;
    streak++;
    checkDate.setDate(checkDate.getDate() - 1);
  }

  return streak;
}

// ─── Estilos ─────────────────────────────────────────────────────────────────

function createStyles(colors: any) {
  return StyleSheet.create({
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 20,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 20,
    },
    greeting: {
      fontSize: 22,
      fontWeight: "800",
      color: colors.foreground,
    },
    date: {
      fontSize: 13,
      color: colors.muted,
      marginTop: 2,
      textTransform: "capitalize",
    },
    streakBadge: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.primary + "20",
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 20,
      gap: 4,
    },
    streakEmoji: {
      fontSize: 18,
    },
    streakCount: {
      fontSize: 18,
      fontWeight: "800",
      color: colors.primary,
    },
    progressCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    progressHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 8,
    },
    progressLabel: {
      fontSize: 14,
      color: colors.muted,
      fontWeight: "600",
    },
    progressPercent: {
      fontSize: 14,
      color: colors.primary,
      fontWeight: "700",
    },
    progressBarBg: {
      height: 8,
      backgroundColor: colors.border,
      borderRadius: 4,
      marginBottom: 6,
    },
    progressBarFill: {
      height: 8,
      backgroundColor: colors.primary,
      borderRadius: 4,
    },
    progressSub: {
      fontSize: 12,
      color: colors.muted,
    },
    doneCard: {
      backgroundColor: colors.success + "15",
      borderRadius: 20,
      padding: 24,
      alignItems: "center",
      marginBottom: 20,
      borderWidth: 1,
      borderColor: colors.success + "40",
    },
    doneEmoji: {
      fontSize: 48,
      marginBottom: 12,
    },
    doneTitle: {
      fontSize: 20,
      fontWeight: "800",
      color: colors.foreground,
      textAlign: "center",
      marginBottom: 8,
    },
    doneSub: {
      fontSize: 14,
      color: colors.muted,
      textAlign: "center",
      lineHeight: 20,
    },
    startCard: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: 24,
      alignItems: "center",
      marginBottom: 20,
      borderWidth: 1,
      borderColor: colors.border,
    },
    phraseText: {
      fontSize: 15,
      color: colors.foreground,
      fontStyle: "italic",
      textAlign: "center",
      marginBottom: 20,
      lineHeight: 22,
    },
    startButton: {
      backgroundColor: colors.primary,
      borderRadius: 20,
      paddingVertical: 18,
      paddingHorizontal: 48,
      marginBottom: 12,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.4,
      shadowRadius: 12,
      elevation: 8,
    },
    startButtonText: {
      color: "#FFFFFF",
      fontSize: 18,
      fontWeight: "800",
      letterSpacing: 0.5,
    },
    startHint: {
      fontSize: 12,
      color: colors.muted,
    },
    section: {
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: 17,
      fontWeight: "700",
      color: colors.foreground,
      marginBottom: 12,
    },
    todayRunCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      paddingHorizontal: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    recentRunCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 14,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    recentRunDate: {
      fontSize: 13,
      color: colors.muted,
      textTransform: "capitalize",
      marginBottom: 2,
    },
    recentRunDistance: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.foreground,
    },
    recentRunPace: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.primary,
    },
    recentRunTime: {
      fontSize: 13,
      color: colors.muted,
    },
    adBanner: {
      height: 50,
      backgroundColor: colors.surface,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
    },
    adText: {
      fontSize: 12,
      color: colors.muted,
    },
  });
}
