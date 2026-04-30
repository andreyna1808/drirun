import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Linking,
  Alert,
} from "react-native";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import Constants from "expo-constants";
import { SettingsAboutStyles } from "@/styles/tabs/settings-about.styles";

const { extra } = Constants.expoConfig || {};

const ORIGIN_VIDEO_URL = extra!.ORIGIN_VIDEO_URL as string;
const SOCIAL_LINKS = {
  linkedin: extra!.ORIGIN_LINKEDIN_URL as string,
  youtube: extra!.ORIGIN_YOUTUBE_CHANEL_URL as string,
  github: extra!.ORIGIN_GITHUB_URL as string,
};
const SUPPORT_URL = extra!.ORIGIN_HELP_APP as string;

const APP_VERSION = "1.0.0";


export default function AboutScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const styles = SettingsAboutStyles(colors);

  async function openLink(url: string) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Linking.openURL(url);
    } catch (error) {
      console.error("Erro ao abrir URL:", error);
      Alert.alert(t("error"), t("about_link_error"));
    }
  }

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={[styles.backIcon, { color: colors.primary }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          {t("about_title")}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo e nome */}
        <View style={styles.heroSection}>
          <Text style={[styles.appName, { color: colors.primary }]}>DriRun</Text>
          <Text style={[styles.tagline, { color: colors.muted }]}>
            {t("tagline")}
          </Text>
        </View>

        {/* Descrição do projeto */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>
            💡 {t("about_project_title")}
          </Text>
          <Text style={[styles.cardText, { color: colors.muted }]}>
            {t("about_description")}
          </Text>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <Text style={[styles.cardText, { color: colors.muted }]}>
            {t("about_project_details")}
          </Text>
        </View>

        {/* Vídeo de origem */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>
            🎬 {t("about_video_title")}
          </Text>
          <Text style={[styles.cardText, { color: colors.muted }]}>
            {t("about_video_description")}
          </Text>
          <TouchableOpacity
            style={[styles.videoButton, { backgroundColor: colors.error }]}
            onPress={() => openLink(ORIGIN_VIDEO_URL)}
          >
            <Text style={styles.videoButtonIcon}>▶</Text>
            <Text style={styles.videoButtonText}>{t("about_video_button")}</Text>
          </TouchableOpacity>
        </View>

        {/* Links sociais */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>
            🔗 {t("about_links")}
          </Text>
          <Text style={[styles.cardText, { color: colors.muted }]}>
            {t("about_social_intro")}
          </Text>

          <TouchableOpacity
            style={[styles.socialButton, { backgroundColor: "#0077B5" + "20", borderColor: "#0077B5" }]}
            onPress={() => openLink(SOCIAL_LINKS.linkedin)}
          >
            <Text style={styles.socialIcon}>💼</Text>
            <View style={styles.socialInfo}>
              <Text style={[styles.socialName, { color: colors.foreground }]}>
                {t("about_linkedin")}
              </Text>
              <Text style={[styles.socialHandle, { color: colors.muted }]}>
                {t("about_social_linkedin_desc")}
              </Text>
            </View>
            <Text style={[styles.socialArrow, { color: colors.muted }]}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.socialButton, { backgroundColor: "#FF0000" + "20", borderColor: "#FF0000" }]}
            onPress={() => openLink(SOCIAL_LINKS.youtube)}
          >
            <Text style={styles.socialIcon}>📺</Text>
            <View style={styles.socialInfo}>
              <Text style={[styles.socialName, { color: colors.foreground }]}>
                {t("about_youtube")}
              </Text>
              <Text style={[styles.socialHandle, { color: colors.muted }]}>
                {t("about_social_youtube_desc")}
              </Text>
            </View>
            <Text style={[styles.socialArrow, { color: colors.muted }]}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.socialButton, { backgroundColor: colors.foreground + "10", borderColor: colors.border }]}
            onPress={() => openLink(SOCIAL_LINKS.github)}
          >
            <Text style={styles.socialIcon}>🐙</Text>
            <View style={styles.socialInfo}>
              <Text style={[styles.socialName, { color: colors.foreground }]}>
                {t("about_github")}
              </Text>
              <Text style={[styles.socialHandle, { color: colors.muted }]}>
                {t("about_social_github_desc")}
              </Text>
            </View>
            <Text style={[styles.socialArrow, { color: colors.muted }]}>→</Text>
          </TouchableOpacity>
        </View>

        {/* Apoie o projeto */}
        <View style={[styles.card, { backgroundColor: colors.success + "15", borderColor: colors.success + "40" }]}>
          <Text style={[styles.cardTitle, { color: colors.success }]}>
            ❤️ {t("about_support_title")}
          </Text>
          <Text style={[styles.cardText, { color: colors.muted }]}>
            {t("about_support_description")}
          </Text>
          <TouchableOpacity
            style={[styles.videoButton, { backgroundColor: colors.success }]}
            onPress={() => openLink(SUPPORT_URL)}
          >
            <Text style={styles.videoButtonIcon}>💎</Text>
            <Text style={styles.videoButtonText}>{t("about_support_button")}</Text>
          </TouchableOpacity>
        </View>

        {/* Open Source */}
        <View style={[styles.card, { backgroundColor: colors.primary + "15", borderColor: colors.primary + "40" }]}>
          <Text style={[styles.cardTitle, { color: colors.primary }]}>
            🌟 {t("about_open_source_title")}
          </Text>
          <Text style={[styles.cardText, { color: colors.muted }]}>
            {t("about_open_source_description")}
          </Text>
          <Text style={[styles.techStack, { color: colors.muted }]}>
            {t("about_tech_stack")}
          </Text>
        </View>

        {/* Versão */}
        <Text style={[styles.version, { color: colors.muted }]}>
          {t("about_version", { version: APP_VERSION })}
        </Text>

        {/* Fechar */}
        <TouchableOpacity
          style={[styles.closeButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => router.back()}
        >
          <Text style={[styles.closeButtonText, { color: colors.foreground }]}>
            {t("close")}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </ScreenContainer>
  );
}