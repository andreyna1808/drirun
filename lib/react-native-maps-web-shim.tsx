/**
 * react-native-maps-web-shim.tsx
 * Shim de react-native-maps para a plataforma web.
 * Substitui o pacote nativo por componentes vazios para evitar erros de build.
 */
import React from "react";
import { View, Text, StyleSheet } from "react-native";

const MapFallback = ({ style, children }: any) => (
  <View style={[styles.container, style]}>
    <Text style={styles.icon}>🗺️</Text>
    <Text style={styles.text}>Mapa disponível apenas no app nativo</Text>
    {children}
  </View>
);

const Marker = () => null;
const Polyline = () => null;
const Circle = () => null;
const Callout = () => null;
const Polygon = () => null;
const Overlay = () => null;

const PROVIDER_DEFAULT = null;
const PROVIDER_GOOGLE = "google";

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#1A1A2E",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    minHeight: 200,
  },
  icon: { fontSize: 40, marginBottom: 8 },
  text: { color: "#9CA3AF", fontSize: 14 },
});

export default MapFallback;
export {
  Marker,
  Polyline,
  Circle,
  Callout,
  Polygon,
  Overlay,
  PROVIDER_DEFAULT,
  PROVIDER_GOOGLE,
};
