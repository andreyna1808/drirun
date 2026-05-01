import React, { useState } from "react";
import {
    View, Text, TextInput, TouchableOpacity, ScrollView, Alert,
} from "react-native";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/use-colors";
import { ScreenContainer } from "@/components/screen-container";
import { SettingsProfileStyles } from "@/styles/tabs/settings-profile.styles";
import { BannerAd, BannerAdSize } from "react-native-google-mobile-ads";
import { BANNER_AD_UNIT_ID } from "@/hooks/use-ads";

export default function EditProfileScreen() {
    const { t } = useTranslation();
    const { state, dispatch } = useApp();
    const colors = useColors();

    const [name, setName] = useState(state.profile?.name ?? "");
    const [age, setAge] = useState(String(state.profile?.age ?? ""));
    const [height, setHeight] = useState(String(state.profile?.height ?? ""));
    const [weight, setWeight] = useState(String(state.profile?.weight ?? ""));
    const [sex, setSex] = useState<"male" | "female" | "other">(state.profile?.sex ?? "other");

    const styles = SettingsProfileStyles(colors);

    const handleSave = () => {
        const ageNum = parseInt(age, 10);
        const heightNum = parseFloat(height);
        const weightNum = parseFloat(weight);

        if (!name.trim()) { Alert.alert(t("error"), t("error_name_required")); return; }
        if (isNaN(ageNum) || ageNum < 5 || ageNum > 120) { Alert.alert(t("error"), t("error_age_invalid")); return; }
        if (isNaN(heightNum) || heightNum < 100 || heightNum > 250) { Alert.alert(t("error"), t("error_height_invalid")); return; }
        if (isNaN(weightNum) || weightNum < 20 || weightNum > 300) { Alert.alert(t("error"), t("error_weight_invalid")); return; }

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        dispatch({
            type: "UPDATE_PROFILE",
            payload: {
                name: name.trim(),
                age: ageNum,
                height: heightNum,
                weight: weightNum,
                sex,
            },
        });
        Alert.alert(t("success"), t("profile_save_success"), [
            { text: t("ok"), onPress: () => router.push("/settings") },
        ]);
    };

    return (
        <ScreenContainer>
            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
                <Text style={styles.title}>{t("profile_edit_title")}</Text>

                <Text style={styles.label}>{t("onboarding_name_label")}</Text>
                <TextInput style={styles.input} value={name} onChangeText={setName} placeholder={t("onboarding_name_placeholder")} placeholderTextColor={colors.muted} />

                <Text style={styles.label}>{t("onboarding_sex_label")}</Text>
                <View style={styles.sexRow}>
                    {(["male", "female", "other"] as const).map((s) => (
                        <TouchableOpacity
                            key={s}
                            style={[styles.sexBtn, sex === s && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                            onPress={() => setSex(s)}
                        >
                            <Text style={[styles.sexText, sex === s && { color: "#FFF" }]}>
                                {s === "male" ? t("onboarding_sex_male") : s === "female"}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <Text style={styles.label}>{t("onboarding_age_label")}</Text>
                <TextInput style={styles.input} value={age} onChangeText={setAge} keyboardType="numeric" placeholder={t("onboarding_age_placeholder")} />

                <Text style={styles.label}>{t("onboarding_height_label")}</Text>
                <TextInput style={styles.input} value={height} onChangeText={setHeight} keyboardType="numeric" placeholder={t("onboarding_height_placeholder")} />

                <Text style={styles.label}>{t("onboarding_weight_label")}</Text>
                <TextInput style={styles.input} value={weight} onChangeText={setWeight} keyboardType="numeric" placeholder={t("onboarding_weight_placeholder")} />

                <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                    <Text style={styles.saveText}>{t("profile_save_button")}</Text>
                </TouchableOpacity>
            </ScrollView>

            {!state.hasRemovedAds && (
                <View style={styles.adBanner}>
                    <BannerAd
                        unitId={BANNER_AD_UNIT_ID}
                        size={BannerAdSize.LARGE_ANCHORED_ADAPTIVE_BANNER}
                        requestOptions={{ requestNonPersonalizedAdsOnly: true }}
                    />
                </View>
            )}
        </ScreenContainer>
    );
}