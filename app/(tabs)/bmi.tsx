/**
 * bmi.tsx
 * Tela de IMC (Índice de Massa Corporal) do DriRun.
 * Calcula o IMC do usuário com base no peso e altura do perfil,
 * exibe a classificação e fornece informações sobre saúde.
 */

import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
} from "react-native";
import Svg, { Circle, Path, Text as SvgText } from "react-native-svg";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/use-colors";
import { ScreenContainer } from "@/components/screen-container";
import * as Haptics from "expo-haptics";

const { width } = Dimensions.get("window");

// ─── Classificações de IMC ────────────────────────────────────────────────────

interface BMICategory {
  label: string;
  range: string;
  color: string;
  emoji: string;
  description: string;
  advice: string;
}

const BMI_CATEGORIES: BMICategory[] = [
  {
    label: "Abaixo do peso",
    range: "< 18.5",
    color: "#60A5FA",
    emoji: "⚠️",
    description: "Seu peso está abaixo do ideal para sua altura.",
    advice: "Considere consultar um nutricionista para aumentar sua ingestão calórica de forma saudável.",
  },
  {
    label: "Peso normal",
    range: "18.5 – 24.9",
    color: "#22C55E",
    emoji: "✅",
    description: "Parabéns! Seu peso está dentro da faixa saudável.",
    advice: "Continue mantendo uma alimentação equilibrada e praticando exercícios regularmente.",
  },
  {
    label: "Sobrepeso",
    range: "25.0 – 29.9",
    color: "#F59E0B",
    emoji: "⚡",
    description: "Seu peso está um pouco acima do ideal.",
    advice: "Aumentar a frequência de exercícios e ajustar a alimentação pode ajudar a atingir o peso ideal.",
  },
  {
    label: "Obesidade Grau I",
    range: "30.0 – 34.9",
    color: "#F97316",
    emoji: "🔴",
    description: "Seu IMC indica obesidade de grau I.",
    advice: "Recomenda-se consultar um médico e iniciar um programa de exercícios supervisionado.",
  },
  {
    label: "Obesidade Grau II",
    range: "35.0 – 39.9",
    color: "#EF4444",
    emoji: "🔴",
    description: "Seu IMC indica obesidade de grau II.",
    advice: "É importante buscar acompanhamento médico especializado para um plano de saúde personalizado.",
  },
  {
    label: "Obesidade Grau III",
    range: "≥ 40.0",
    color: "#DC2626",
    emoji: "🚨",
    description: "Seu IMC indica obesidade mórbida.",
    advice: "Busque acompanhamento médico urgente. Com dedicação e suporte profissional, é possível melhorar sua saúde.",
  },
];

/**
 * Retorna a categoria de IMC baseada no valor calculado.
 */
function getBMICategory(bmi: number): BMICategory {
  if (bmi < 18.5) return BMI_CATEGORIES[0];
  if (bmi < 25) return BMI_CATEGORIES[1];
  if (bmi < 30) return BMI_CATEGORIES[2];
  if (bmi < 35) return BMI_CATEGORIES[3];
  if (bmi < 40) return BMI_CATEGORIES[4];
  return BMI_CATEGORIES[5];
}

/**
 * Calcula o IMC: peso(kg) / (altura(m))²
 */
function calculateBMI(weightKg: number, heightCm: number): number {
  const heightM = heightCm / 100;
  return weightKg / (heightM * heightM);
}

/**
 * Calcula o peso ideal (fórmula de Lorentz):
 * Homem: altura(cm) - 100 - (altura(cm) - 150) / 4
 * Mulher: altura(cm) - 100 - (altura(cm) - 150) / 2
 */
function calculateIdealWeight(heightCm: number, sex: string): { min: number; max: number } {
  const heightM = heightCm / 100;
  const minBMI = 18.5;
  const maxBMI = 24.9;
  return {
    min: Math.round(minBMI * heightM * heightM * 10) / 10,
    max: Math.round(maxBMI * heightM * heightM * 10) / 10,
  };
}

// ─── Componente de gauge de IMC ───────────────────────────────────────────────

function BMIGauge({ bmi, color }: { bmi: number; color: string }) {
  const size = width * 0.55;
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.38;
  const strokeWidth = size * 0.08;

  // Ângulo do ponteiro: IMC 10 = -150°, IMC 40 = 150° (arco de 300°)
  const minBMI = 10;
  const maxBMI = 45;
  const clampedBMI = Math.max(minBMI, Math.min(maxBMI, bmi));
  const angle = -150 + ((clampedBMI - minBMI) / (maxBMI - minBMI)) * 300;
  const angleRad = (angle * Math.PI) / 180;

  // Posição do ponteiro
  const needleX = cx + r * Math.cos(angleRad);
  const needleY = cy + r * Math.sin(angleRad);

  // Arco de fundo (cinza)
  const arcStart = -150;
  const arcEnd = 150;
  const startRad = (arcStart * Math.PI) / 180;
  const endRad = (arcEnd * Math.PI) / 180;
  const arcPath = `M ${cx + r * Math.cos(startRad)} ${cy + r * Math.sin(startRad)} A ${r} ${r} 0 1 1 ${cx + r * Math.cos(endRad)} ${cy + r * Math.sin(endRad)}`;

  // Arco colorido (progresso)
  const progressAngle = angle;
  const progressEndRad = (progressAngle * Math.PI) / 180;
  const progressPath = `M ${cx + r * Math.cos(startRad)} ${cy + r * Math.sin(startRad)} A ${r} ${r} 0 ${progressAngle - arcStart > 180 ? 1 : 0} 1 ${cx + r * Math.cos(progressEndRad)} ${cy + r * Math.sin(progressEndRad)}`;

  return (
    <Svg width={size} height={size * 0.75}>
      {/* Arco de fundo */}
      <Path
        d={arcPath}
        stroke="#E5E7EB"
        strokeWidth={strokeWidth}
        fill="none"
        strokeLinecap="round"
      />
      {/* Arco colorido */}
      <Path
        d={progressPath}
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
        strokeLinecap="round"
      />
      {/* Ponteiro */}
      <Path
        d={`M ${cx} ${cy} L ${needleX} ${needleY}`}
        stroke={color}
        strokeWidth={3}
        strokeLinecap="round"
      />
      <Circle cx={cx} cy={cy} r={6} fill={color} />
    </Svg>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function BMIScreen() {
  const { state, dispatch } = useApp();
  const colors = useColors();

  // Permite editar peso e altura temporariamente na tela de IMC
  const [weight, setWeight] = useState(String(state.profile?.weight ?? ""));
  const [height, setHeight] = useState(String(state.profile?.height ?? ""));

  const weightNum = parseFloat(weight);
  const heightNum = parseFloat(height);
  const isValid = !isNaN(weightNum) && !isNaN(heightNum) && weightNum > 0 && heightNum > 0;

  const bmi = isValid ? calculateBMI(weightNum, heightNum) : null;
  const category = bmi ? getBMICategory(bmi) : null;
  const idealWeight = isValid ? calculateIdealWeight(heightNum, state.profile?.sex ?? "other") : null;

  function handleUpdateProfile() {
    if (!isValid || !state.profile) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    dispatch({
      type: "UPDATE_PROFILE",
      payload: { ...state.profile, weight: weightNum, height: heightNum },
    });
  }

  const styles = createStyles(colors);

  if (!state.profile) {
    return (
      <ScreenContainer>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>⚖️</Text>
          <Text style={styles.emptyTitle}>Perfil não encontrado</Text>
          <Text style={styles.emptyText}>Complete o onboarding para ver seu IMC.</Text>
        </View>
      </ScreenContainer>
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
        {/* ── Cabeçalho ── */}
        <Text style={styles.title}>IMC</Text>
        <Text style={styles.subtitle}>Índice de Massa Corporal</Text>

        {/* ── Campos de entrada ── */}
        <View style={styles.inputRow}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>PESO (kg)</Text>
            <TextInput
              style={[styles.input, { color: colors.foreground }]}
              value={weight}
              onChangeText={setWeight}
              keyboardType="decimal-pad"
              placeholder="70.0"
              placeholderTextColor={colors.muted}
              returnKeyType="done"
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>ALTURA (cm)</Text>
            <TextInput
              style={[styles.input, { color: colors.foreground }]}
              value={height}
              onChangeText={setHeight}
              keyboardType="numeric"
              placeholder="175"
              placeholderTextColor={colors.muted}
              returnKeyType="done"
            />
          </View>
        </View>

        {/* Botão de atualizar perfil */}
        {(weightNum !== state.profile.weight || heightNum !== state.profile.height) && isValid && (
          <TouchableOpacity style={styles.updateButton} onPress={handleUpdateProfile}>
            <Text style={styles.updateButtonText}>Atualizar Perfil</Text>
          </TouchableOpacity>
        )}

        {/* ── Resultado do IMC ── */}
        {bmi && category ? (
          <>
            {/* Gauge */}
            <View style={styles.gaugeContainer}>
              <BMIGauge bmi={bmi} color={category.color} />
              <View style={styles.bmiValueContainer}>
                <Text style={[styles.bmiValue, { color: category.color }]}>
                  {bmi.toFixed(1)}
                </Text>
                <Text style={styles.bmiLabel}>IMC</Text>
              </View>
            </View>

            {/* Card de categoria */}
            <View style={[styles.categoryCard, { borderColor: category.color + "40", backgroundColor: category.color + "10" }]}>
              <Text style={styles.categoryEmoji}>{category.emoji}</Text>
              <Text style={[styles.categoryLabel, { color: category.color }]}>
                {category.label}
              </Text>
              <Text style={styles.categoryRange}>IMC: {category.range}</Text>
              <Text style={styles.categoryDescription}>{category.description}</Text>
            </View>

            {/* Peso ideal */}
            {idealWeight && (
              <View style={styles.idealWeightCard}>
                <Text style={styles.idealWeightTitle}>⚖️ Peso Ideal</Text>
                <Text style={styles.idealWeightValue}>
                  {idealWeight.min} – {idealWeight.max} kg
                </Text>
                <Text style={styles.idealWeightSub}>
                  Para sua altura de {heightNum} cm
                </Text>
                {weightNum > idealWeight.max && (
                  <Text style={[styles.idealWeightDiff, { color: colors.warning }]}>
                    Diferença: {(weightNum - idealWeight.max).toFixed(1)} kg acima do ideal
                  </Text>
                )}
                {weightNum < idealWeight.min && (
                  <Text style={[styles.idealWeightDiff, { color: colors.primary }]}>
                    Diferença: {(idealWeight.min - weightNum).toFixed(1)} kg abaixo do ideal
                  </Text>
                )}
              </View>
            )}

            {/* Conselho */}
            <View style={styles.adviceCard}>
              <Text style={styles.adviceTitle}>💡 Dica de Saúde</Text>
              <Text style={styles.adviceText}>{category.advice}</Text>
            </View>

            {/* Tabela de referência */}
            <View style={styles.referenceCard}>
              <Text style={styles.referenceTitle}>Tabela de Referência</Text>
              {BMI_CATEGORIES.map((cat, i) => (
                <View
                  key={i}
                  style={[
                    styles.referenceRow,
                    i === BMI_CATEGORIES.length - 1 && { borderBottomWidth: 0 },
                    cat.label === category.label && { backgroundColor: cat.color + "15" },
                  ]}
                >
                  <View style={[styles.referenceDot, { backgroundColor: cat.color }]} />
                  <Text style={[styles.referenceLabel, cat.label === category.label && { fontWeight: "700", color: colors.foreground }]}>
                    {cat.label}
                  </Text>
                  <Text style={styles.referenceRange}>{cat.range}</Text>
                </View>
              ))}
            </View>
          </>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>⚖️</Text>
            <Text style={styles.emptyText}>
              Insira seu peso e altura para calcular o IMC.
            </Text>
          </View>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>
    </ScreenContainer>
  );
}

// ─── Estilos ─────────────────────────────────────────────────────────────────

function createStyles(colors: any) {
  return StyleSheet.create({
    scroll: { flex: 1 },
    content: {
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 20,
    },
    title: {
      fontSize: 24,
      fontWeight: "800",
      color: colors.foreground,
      marginBottom: 4,
    },
    subtitle: {
      fontSize: 14,
      color: colors.muted,
      marginBottom: 20,
    },
    inputRow: {
      flexDirection: "row",
      gap: 12,
      marginBottom: 12,
    },
    inputGroup: {
      flex: 1,
    },
    inputLabel: {
      fontSize: 11,
      fontWeight: "700",
      color: colors.muted,
      marginBottom: 6,
      letterSpacing: 0.5,
    },
    input: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 12,
      fontSize: 18,
      fontWeight: "700",
      textAlign: "center",
    },
    updateButton: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: 12,
      alignItems: "center",
      marginBottom: 20,
    },
    updateButtonText: {
      color: "#FFFFFF",
      fontSize: 15,
      fontWeight: "700",
    },
    gaugeContainer: {
      alignItems: "center",
      marginBottom: 20,
      position: "relative",
    },
    bmiValueContainer: {
      position: "absolute",
      bottom: 0,
      alignItems: "center",
    },
    bmiValue: {
      fontSize: 40,
      fontWeight: "900",
    },
    bmiLabel: {
      fontSize: 13,
      color: colors.muted,
      fontWeight: "600",
    },
    categoryCard: {
      borderRadius: 16,
      padding: 20,
      alignItems: "center",
      marginBottom: 16,
      borderWidth: 1.5,
    },
    categoryEmoji: {
      fontSize: 36,
      marginBottom: 8,
    },
    categoryLabel: {
      fontSize: 20,
      fontWeight: "800",
      marginBottom: 4,
    },
    categoryRange: {
      fontSize: 13,
      color: colors.muted,
      marginBottom: 8,
    },
    categoryDescription: {
      fontSize: 14,
      color: colors.foreground,
      textAlign: "center",
      lineHeight: 20,
    },
    idealWeightCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
    },
    idealWeightTitle: {
      fontSize: 15,
      fontWeight: "700",
      color: colors.foreground,
      marginBottom: 4,
    },
    idealWeightValue: {
      fontSize: 24,
      fontWeight: "800",
      color: colors.success,
      marginBottom: 4,
    },
    idealWeightSub: {
      fontSize: 12,
      color: colors.muted,
    },
    idealWeightDiff: {
      fontSize: 13,
      fontWeight: "600",
      marginTop: 4,
    },
    adviceCard: {
      backgroundColor: colors.primary + "10",
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.primary + "30",
    },
    adviceTitle: {
      fontSize: 15,
      fontWeight: "700",
      color: colors.foreground,
      marginBottom: 8,
    },
    adviceText: {
      fontSize: 14,
      color: colors.foreground,
      lineHeight: 20,
    },
    referenceCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: colors.border,
    },
    referenceTitle: {
      fontSize: 14,
      fontWeight: "700",
      color: colors.muted,
      padding: 12,
      paddingBottom: 8,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    referenceRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    referenceDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      marginRight: 10,
    },
    referenceLabel: {
      flex: 1,
      fontSize: 13,
      color: colors.muted,
    },
    referenceRange: {
      fontSize: 12,
      color: colors.muted,
    },
    emptyContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: 40,
      paddingTop: 60,
    },
    emptyEmoji: {
      fontSize: 64,
      marginBottom: 16,
    },
    emptyTitle: {
      fontSize: 22,
      fontWeight: "700",
      color: colors.foreground,
      marginBottom: 8,
    },
    emptyText: {
      fontSize: 15,
      color: colors.muted,
      textAlign: "center",
      lineHeight: 22,
    },
  });
}
