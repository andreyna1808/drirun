/**
 * MapViewWrapper.tsx
 * Wrapper para o MapView que funciona em todas as plataformas.
 * No web, exibe uma mensagem de que o mapa só funciona no app nativo.
 */
import { Platform, View, Text, StyleSheet } from "react-native";

// Importação condicional para evitar erro no web
let MapView: any = null;
let Marker: any = null;
let Polyline: any = null;

if (Platform.OS !== "web") {
  const maps = require("react-native-maps");
  MapView = maps.default;
  Marker = maps.Marker;
  Polyline = maps.Polyline;
}

export { MapView, Marker, Polyline };

/**
 * Componente de fallback para web quando o mapa não está disponível.
 */
export function MapFallback({ style }: { style?: any }) {
  return (
    <View style={[styles.fallback, style]}>
      <Text style={styles.icon}>🗺️</Text>
      <Text style={styles.text}>Mapa disponível apenas no app nativo</Text>
      <Text style={styles.sub}>iOS e Android</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    backgroundColor: "#1A1A2E",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },
  icon: { fontSize: 48, marginBottom: 8 },
  text: { color: "#F8F9FA", fontSize: 16, fontWeight: "600" },
  sub: { color: "#9CA3AF", fontSize: 13, marginTop: 4 },
});
