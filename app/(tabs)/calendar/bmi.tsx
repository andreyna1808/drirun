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
import Svg, { Circle, Path } from "react-native-svg";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/use-colors";
import { ScreenContainer } from "@/components/screen-container";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";
import { BmiStyles } from "./styles";

const { width } = Dimensions.get("window");

// ─── Estrutura das categorias (apenas dados) ────────────────────────────────

interface BMICategoryData {
  key: string;
  range: string;       // faixa numérica (mostrada na tabela)
  color: string;
  emoji: string;
  min: number;
  max: number;
}

const BMI_CATEGORIES_DATA: BMICategoryData[] = [
  { key: "bmi_underweight", range: "< 18.5", color: "#60A5FA", emoji: "⚠️", min: 0, max: 18.5 },
  { key: "bmi_normal", range: "18.5 – 24.9", color: "#22C55E", emoji: "✅", min: 18.5, max: 25 },
  { key: "bmi_overweight", range: "25.0 – 29.9", color: "#F59E0B", emoji: "⚡", min: 25, max: 30 },
  { key: "bmi_obese1", range: "30.0 – 34.9", color: "#F97316", emoji: "🔴", min: 30, max: 35 },
  { key: "bmi_obese2", range: "35.0 – 39.9", color: "#EF4444", emoji: "🔴", min: 35, max: 40 },
  { key: "bmi_obese3", range: "≥ 40.0", color: "#DC2626", emoji: "🚨", min: 40, max: 999 },
];

function getBMICategory(bmi: number): BMICategoryData {
  return BMI_CATEGORIES_DATA.find((c) => bmi >= c.min && bmi < c.max) ?? BMI_CATEGORIES_DATA[5];
}

function calculateBMI(weightKg: number, heightCm: number): number {
  const heightM = heightCm / 100;
  return weightKg / (heightM * heightM);
}

function calculateIdealWeight(heightCm: number): { min: number; max: number } {
  const heightM = heightCm / 100;
  const minBMI = 18.5;
  const maxBMI = 24.9;
  return {
    min: Math.round(minBMI * heightM * heightM * 10) / 10,
    max: Math.round(maxBMI * heightM * heightM * 10) / 10,
  };
}

// ─── Gauge (inalterado) ──────────────────────────────────────────────────────

function BMIGauge({ bmi, color }: { bmi: number; color: string }) {
  const size = width * 0.55;
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.38;
  const strokeWidth = size * 0.08;

  const minBMI = 10;
  const maxBMI = 45;
  const clampedBMI = Math.max(minBMI, Math.min(maxBMI, bmi));
  const angle = -150 + ((clampedBMI - minBMI) / (maxBMI - minBMI)) * 300;
  const angleRad = (angle * Math.PI) / 180;

  const needleX = cx + r * Math.cos(angleRad);
  const needleY = cy + r * Math.sin(angleRad);

  const arcStart = -150;
  const arcEnd = 150;
  const startRad = (arcStart * Math.PI) / 180;
  const endRad = (arcEnd * Math.PI) / 180;
  const arcPath = `M ${cx + r * Math.cos(startRad)} ${cy + r * Math.sin(startRad)} A ${r} ${r} 0 1 1 ${cx + r * Math.cos(endRad)} ${cy + r * Math.sin(endRad)}`;

  const progressEndRad = (angle * Math.PI) / 180;
  const progressPath = `M ${cx + r * Math.cos(startRad)} ${cy + r * Math.sin(startRad)} A ${r} ${r} 0 ${angle - arcStart > 180 ? 1 : 0} 1 ${cx + r * Math.cos(progressEndRad)} ${cy + r * Math.sin(progressEndRad)}`;

  return (
    <Svg width={size} height={size * 0.75}>
      <Path d={arcPath} stroke="#E5E7EB" strokeWidth={strokeWidth} fill="none" strokeLinecap="round" />
      <Path d={progressPath} stroke={color} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" />
      <Path d={`M ${cx} ${cy} L ${needleX} ${needleY}`} stroke={color} strokeWidth={3} strokeLinecap="round" />
      <Circle cx={cx} cy={cy} r={6} fill={color} />
    </Svg>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function BMIScreen() {
  const { t } = useTranslation();
  const { state, dispatch } = useApp();
  const colors = useColors();

  const [weight, setWeight] = useState(String(state.profile?.weight ?? ""));
  const [height, setHeight] = useState(String(state.profile?.height ?? ""));

  const weightNum = parseFloat(weight);
  const heightNum = parseFloat(height);
  const isValid = !isNaN(weightNum) && !isNaN(heightNum) && weightNum > 0 && heightNum > 0;

  const bmi = isValid ? calculateBMI(weightNum, heightNum) : null;
  const category = bmi ? getBMICategory(bmi) : null;
  const idealWeight = isValid ? calculateIdealWeight(heightNum) : null;

  function handleUpdateProfile() {
    if (!isValid || !state.profile) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    dispatch({
      type: "UPDATE_PROFILE",
      payload: { ...state.profile, weight: weightNum, height: heightNum },
    });
  }

  const styles = BmiStyles(colors);

  if (!state.profile) {
    return (
      <ScreenContainer>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>⚖️</Text>
          <Text style={styles.emptyTitle}>{t("bmi_no_profile_title")}</Text>
          <Text style={styles.emptyText}>{t("bmi_no_profile_text")}</Text>
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
        <Text style={styles.title}>{t("bmi_title")}</Text>
        <Text style={styles.subtitle}>{t("bmi_subtitle")}</Text>

        <View style={styles.inputRow}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{t("bmi_weight_label")}</Text>
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
            <Text style={styles.inputLabel}>{t("bmi_height_label")}</Text>
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

        {(weightNum !== state.profile.weight || heightNum !== state.profile.height) && isValid && (
          <TouchableOpacity style={styles.updateButton} onPress={handleUpdateProfile}>
            <Text style={styles.updateButtonText}>{t("bmi_update_profile")}</Text>
          </TouchableOpacity>
        )}

        {bmi && category ? (
          <>
            <View style={styles.gaugeContainer}>
              <BMIGauge bmi={bmi} color={category.color} />
              <View style={styles.bmiValueContainer}>
                <Text style={[styles.bmiValue, { color: category.color }]}>{bmi.toFixed(1)}</Text>
                <Text style={styles.bmiLabel}>{t("bmi_unit")}</Text>
              </View>
            </View>

            <View style={[styles.categoryCard, { borderColor: category.color + "40", backgroundColor: category.color + "10" }]}>
              <Text style={styles.categoryEmoji}>{category.emoji}</Text>
              <Text style={[styles.categoryLabel, { color: category.color }]}>
                {t(`bmi_category_${category.key}`)}
              </Text>
              <Text style={styles.categoryRange}>
                {t("bmi_value_label", { value: category.range })}
              </Text>
              <Text style={styles.categoryDescription}>
                {t(`bmi_desc_${category.key}`)}
              </Text>
            </View>

            {idealWeight && (
              <View style={styles.idealWeightCard}>
                <Text style={styles.idealWeightTitle}>{t("bmi_ideal_weight")}</Text>
                <Text style={styles.idealWeightValue}>
                  {t("bmi_ideal_weight_range", { min: idealWeight.min, max: idealWeight.max })}
                </Text>
                <Text style={styles.idealWeightSub}>
                  {t("bmi_ideal_weight_for_height", { height: heightNum })}
                </Text>
                {weightNum > idealWeight.max && (
                  <Text style={[styles.idealWeightDiff, { color: colors.warning }]}>
                    {t("bmi_diff_above", { kg: (weightNum - idealWeight.max).toFixed(1) })}
                  </Text>
                )}
                {weightNum < idealWeight.min && (
                  <Text style={[styles.idealWeightDiff, { color: colors.primary }]}>
                    {t("bmi_diff_below", { kg: (idealWeight.min - weightNum).toFixed(1) })}
                  </Text>
                )}
              </View>
            )}

            <View style={styles.adviceCard}>
              <Text style={styles.adviceTitle}>{t("bmi_health_tip")}</Text>
              <Text style={styles.adviceText}>{t(`bmi_advice_${category.key}`)}</Text>
            </View>

            <View style={styles.referenceCard}>
              <Text style={styles.referenceTitle}>{t("bmi_reference_table")}</Text>
              {BMI_CATEGORIES_DATA.map((cat, i) => (
                <View
                  key={i}
                  style={[
                    styles.referenceRow,
                    i === BMI_CATEGORIES_DATA.length - 1 && { borderBottomWidth: 0 },
                    cat.key === category.key && { backgroundColor: cat.color + "15" },
                  ]}
                >
                  <View style={[styles.referenceDot, { backgroundColor: cat.color }]} />
                  <Text style={[styles.referenceLabel, cat.key === category.key && { fontWeight: "700", color: colors.foreground }]}>
                    {t(`bmi_category_${cat.key}`)}
                  </Text>
                  <Text style={styles.referenceRange}>{cat.range}</Text>
                </View>
              ))}
            </View>
          </>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>⚖️</Text>
            <Text style={styles.emptyText}>{t("bmi_enter_data")}</Text>
          </View>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>
    </ScreenContainer>
  );
}