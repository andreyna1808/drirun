import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/use-colors";
import { ScreenContainer } from "@/components/screen-container";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";
import { BmiStyles } from "@/styles/tabs/calendar-bmi.styles";
import { BMI_CATEGORIES_DATA, BMIGauge, calculateBMI, calculateIdealWeight, getBMICategoryData } from "@/components/calendar/bmi.components";

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
  const category = bmi ? getBMICategoryData(bmi) : null;
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