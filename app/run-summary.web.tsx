/**
 * run-summary.web.tsx
 * Versão web da tela de resumo de corrida — sem react-native-maps.
 * Exibe as métricas da corrida sem o mapa.
 */
import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/use-colors";
import { ScreenContainer } from "@/components/screen-container";

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}min`;
  if (m > 0) return `${m}min ${s}s`;
  return `${s}s`;
}

function formatPace(paceSecondsPerKm: number): string {
  if (!isFinite(paceSecondsPerKm) || paceSecondsPerKm <= 0) return "--:--";
  const m = Math.floor(paceSecondsPerKm / 60);
  const s = Math.round(paceSecondsPerKm % 60);
  return `${m}:${String(s).padStart(2, "0")} /km`;
}

export default function RunSummaryWebScreen() {
  const colors = useColors();
  const { dispatch } = useApp();
  const params = useLocalSearchParams<{
    duration: string;
    distance: string;
    pace: string;
    calories: string;
    route: string;
    date: string;
  }>();

  const duration = parseInt(params.duration ?? "0");
  const distance = parseFloat(params.distance ?? "0");
  const pace = parseFloat(params.pace ?? "0");
  const calories = parseInt(params.calories ?? "0");
  const date = params.date ?? new Date().toISOString().split("T")[0];

  function handleSave() {
    const runId = `run_${Date.now()}`;
    dispatch({
      type: "ADD_RUN",
      payload: {
        id: runId,
        date,
        duration,
        distance,
        pace,
        calories,
        route: [],
      },
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace("/(tabs)");
  }

  const styles = createStyles(colors);

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Atividade Concluida!</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>Otimo trabalho! Aqui esta seu resumo:</Text>

        <View style={styles.metricsGrid}>
          <View style={[styles.metricCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.metricValue, { color: colors.foreground }]}>{(distance / 1000).toFixed(2)}</Text>
            <Text style={[styles.metricLabel, { color: colors.muted }]}>km</Text>
          </View>
          <View style={[styles.metricCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.metricValue, { color: colors.foreground }]}>{formatDuration(duration)}</Text>
            <Text style={[styles.metricLabel, { color: colors.muted }]}>Tempo</Text>
          </View>
          <View style={[styles.metricCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.metricValue, { color: colors.foreground }]}>{formatPace(pace)}</Text>
            <Text style={[styles.metricLabel, { color: colors.muted }]}>Pace</Text>
          </View>
          <View style={[styles.metricCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.metricValue, { color: colors.foreground }]}>{calories}</Text>
            <Text style={[styles.metricLabel, { color: colors.muted }]}>kcal</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: colors.primary }]}
          onPress={handleSave}
        >
          <Text style={styles.saveButtonText}>Salvar Atividade</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.discardButton, { borderColor: colors.error }]}
          onPress={() => router.replace("/(tabs)")}
        >
          <Text style={[styles.discardButtonText, { color: colors.error }]}>Descartar</Text>
        </TouchableOpacity>
      </ScrollView>
    </ScreenContainer>
  );
}

function createStyles(colors: any) {
  return StyleSheet.create({
    content: {
      padding: 24,
      alignItems: "center",
    },
    title: {
      fontSize: 26,
      fontWeight: "800",
      color: colors.foreground,
      marginBottom: 8,
      textAlign: "center",
    },
    subtitle: {
      fontSize: 15,
      marginBottom: 24,
      textAlign: "center",
    },
    metricsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
      justifyContent: "center",
      marginBottom: 32,
      width: "100%",
    },
    metricCard: {
      width: "45%",
      borderRadius: 16,
      padding: 20,
      alignItems: "center",
    },
    metricValue: {
      fontSize: 24,
      fontWeight: "800",
      marginBottom: 4,
    },
    metricLabel: {
      fontSize: 13,
    },
    saveButton: {
      width: "100%",
      paddingVertical: 16,
      borderRadius: 16,
      alignItems: "center",
      marginBottom: 12,
    },
    saveButtonText: {
      color: "#FFFFFF",
      fontSize: 17,
      fontWeight: "700",
    },
    discardButton: {
      width: "100%",
      paddingVertical: 14,
      borderRadius: 16,
      alignItems: "center",
      borderWidth: 1.5,
    },
    discardButtonText: {
      fontSize: 15,
      fontWeight: "600",
    },
  });
}
