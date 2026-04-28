/**
 * about.tsx
 * Tela "Sobre o DriRun" — apresenta a origem do projeto, vídeo motivacional,
 * links para LinkedIn, YouTube e GitHub, e informações de versão.
 * O app é open source e qualquer dev pode clonar e criar sua própria estrutura.
 */
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Linking,
  Platform,
  Alert,
} from "react-native";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";

// ─── Constantes ───────────────────────────────────────────────────────────────

/** URL do vídeo de origem do projeto no YouTube */
const ORIGIN_VIDEO_URL = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"; // substituir pela URL real

/** Links das redes sociais */
const SOCIAL_LINKS = {
  linkedin: "https://www.linkedin.com/",
  youtube: "https://www.youtube.com/",
  github: "https://github.com/",
};

/** Versão do app */
const APP_VERSION = "2.0.0";

// ─── Componente ───────────────────────────────────────────────────────────────

export default function AboutScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const styles = createStyles(colors);

  /**
   * Abre um link externo com tratamento de erro.
   */
  async function openLink(url: string) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert("Erro", "Não foi possível abrir o link.");
      }
    } catch {
      Alert.alert("Erro", "Não foi possível abrir o link.");
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
          <Text style={styles.heroEmoji}>🔥</Text>
          <Text style={[styles.appName, { color: colors.primary }]}>DriRun</Text>
          <Text style={[styles.tagline, { color: colors.muted }]}>
            {t("tagline")}
          </Text>
        </View>

        {/* Descrição do projeto */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>
            💡 O Projeto
          </Text>
          <Text style={[styles.cardText, { color: colors.muted }]}>
            {t("about_description")}
          </Text>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <Text style={[styles.cardText, { color: colors.muted }]}>
            O DriRun combina rastreamento de corrida com GPS, um pet virtual motivacional (a Fênix 🦅), 
            métricas de desempenho e um sistema de recompensas — tudo armazenado localmente no seu dispositivo.
          </Text>
        </View>

        {/* Vídeo de origem */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>
            🎬 {t("about_video_title")}
          </Text>
          <Text style={[styles.cardText, { color: colors.muted }]}>
            Assista ao vídeo que inspirou a criação do DriRun e entenda a filosofia por trás do app.
          </Text>
          <TouchableOpacity
            style={[styles.videoButton, { backgroundColor: colors.error }]}
            onPress={() => openLink(ORIGIN_VIDEO_URL)}
          >
            <Text style={styles.videoButtonIcon}>▶</Text>
            <Text style={styles.videoButtonText}>Assistir no YouTube</Text>
          </TouchableOpacity>
        </View>

        {/* Links sociais */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>
            🔗 {t("about_links")}
          </Text>
          <Text style={[styles.cardText, { color: colors.muted }]}>
            Conecte-se, contribua com o projeto ou acompanhe o desenvolvimento:
          </Text>

          {/* LinkedIn */}
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
                Conecte-se profissionalmente
              </Text>
            </View>
            <Text style={[styles.socialArrow, { color: colors.muted }]}>→</Text>
          </TouchableOpacity>

          {/* YouTube */}
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
                Tutoriais e conteúdo
              </Text>
            </View>
            <Text style={[styles.socialArrow, { color: colors.muted }]}>→</Text>
          </TouchableOpacity>

          {/* GitHub */}
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
                Clone, contribua e crie o seu!
              </Text>
            </View>
            <Text style={[styles.socialArrow, { color: colors.muted }]}>→</Text>
          </TouchableOpacity>
        </View>

        {/* Open Source */}
        <View style={[styles.card, { backgroundColor: colors.primary + "15", borderColor: colors.primary + "40" }]}>
          <Text style={[styles.cardTitle, { color: colors.primary }]}>
            🌟 Open Source
          </Text>
          <Text style={[styles.cardText, { color: colors.muted }]}>
            Este projeto é completamente open source. Se você é desenvolvedor, pode clonar o repositório, 
            estudar o código, fazer melhorias e criar sua própria versão personalizada do DriRun!
          </Text>
          <Text style={[styles.techStack, { color: colors.muted }]}>
            Stack: React Native • Expo • TypeScript • AsyncStorage
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
            Fechar
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </ScreenContainer>
  );
}

// ─── Estilos ─────────────────────────────────────────────────────────────────

function createStyles(colors: any) {
  return StyleSheet.create({
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backButton: {
      width: 40,
      height: 40,
      alignItems: "center",
      justifyContent: "center",
    },
    backIcon: {
      fontSize: 24,
      fontWeight: "700",
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: "700",
    },
    content: {
      padding: 20,
      paddingBottom: 40,
    },
    heroSection: {
      alignItems: "center",
      marginBottom: 24,
      paddingVertical: 20,
    },
    heroEmoji: {
      fontSize: 64,
      marginBottom: 8,
    },
    appName: {
      fontSize: 36,
      fontWeight: "900",
      letterSpacing: 3,
    },
    tagline: {
      fontSize: 15,
      marginTop: 4,
      letterSpacing: 1,
    },
    card: {
      borderRadius: 16,
      padding: 20,
      marginBottom: 16,
      borderWidth: 1,
    },
    cardTitle: {
      fontSize: 17,
      fontWeight: "700",
      marginBottom: 10,
    },
    cardText: {
      fontSize: 14,
      lineHeight: 22,
    },
    divider: {
      height: 1,
      marginVertical: 12,
    },
    videoButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      marginTop: 14,
      paddingVertical: 12,
      borderRadius: 12,
    },
    videoButtonIcon: {
      color: "#FFFFFF",
      fontSize: 16,
    },
    videoButtonText: {
      color: "#FFFFFF",
      fontSize: 15,
      fontWeight: "700",
    },
    socialButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      marginTop: 10,
      padding: 14,
      borderRadius: 12,
      borderWidth: 1,
    },
    socialIcon: {
      fontSize: 24,
    },
    socialInfo: {
      flex: 1,
    },
    socialName: {
      fontSize: 15,
      fontWeight: "600",
    },
    socialHandle: {
      fontSize: 12,
      marginTop: 2,
    },
    socialArrow: {
      fontSize: 18,
      fontWeight: "700",
    },
    techStack: {
      fontSize: 12,
      marginTop: 10,
      fontStyle: "italic",
    },
    version: {
      textAlign: "center",
      fontSize: 12,
      marginTop: 8,
      marginBottom: 16,
    },
    closeButton: {
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: "center",
      borderWidth: 1,
    },
    closeButtonText: {
      fontSize: 15,
      fontWeight: "600",
    },
  });
}
