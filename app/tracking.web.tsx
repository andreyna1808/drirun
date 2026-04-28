/**
 * tracking.web.tsx
 * Versão web da tela de rastreamento — sem react-native-maps.
 * Exibe mensagem informando que o rastreamento GPS só funciona no app nativo.
 */
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";

export default function TrackingWebScreen() {
  const colors = useColors();

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]}>
      <View style={styles.container}>
        <Text style={[styles.icon]}>🗺️</Text>
        <Text style={[styles.title, { color: colors.foreground }]}>
          Rastreamento GPS
        </Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>
          O rastreamento de corrida com mapa está disponível apenas no app nativo (iOS e Android).
        </Text>
        <Text style={[styles.hint, { color: colors.muted }]}>
          Escaneie o QR Code para abrir no Expo Go e testar no seu celular.
        </Text>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={() => router.back()}
        >
          <Text style={styles.buttonText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  icon: {
    fontSize: 80,
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 16,
  },
  hint: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 32,
    fontStyle: "italic",
  },
  button: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
