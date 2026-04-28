/**
 * _layout.tsx (Tabs Layout)
 * Configuracao das abas de navegacao do DriRun.
 * 5 abas: Home, Metricas, Calendario (com IMC), Pet, Configuracoes
 */
import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Platform, View } from "react-native";
import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useApp } from "@/context/AppContext";

export default function TabLayout() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { state } = useApp();
  const bottomPadding = Platform.OS === "web" ? 12 : Math.max(insets.bottom, 8);
  const tabBarHeight = 56 + bottomPadding;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          paddingTop: 8,
          paddingBottom: bottomPadding,
          height: tabBarHeight,
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          borderTopWidth: 0.5,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "600",
        },
      }}
    >
      {/* ── Home ── */}
      <Tabs.Screen
        name="index"
        options={{
          title: "Início",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={26} name="house.fill" color={color} />
          ),
        }}
      />

      {/* ── Métricas ── */}
      <Tabs.Screen
        name="metrics"
        options={{
          title: "Métricas",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={26} name="chart.bar.fill" color={color} />
          ),
        }}
      />

      {/* ── Calendário (inclui IMC) ── */}
      <Tabs.Screen
        name="calendar"
        options={{
          title: "Calendário",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={26} name="calendar" color={color} />
          ),
        }}
      />

      {/* ── Pet ── */}
      <Tabs.Screen
        name="pet"
        options={{
          title: "Meu Pet",
          tabBarIcon: ({ color }) => (
            <View style={{ position: "relative" }}>
              <IconSymbol size={26} name="pawprint.fill" color={color} />
              {/* Badge de alerta se o pet estiver em perigo */}
              {(state.pet.state === "sad" || state.pet.state === "depressed") && (
                <View style={{
                  position: "absolute",
                  top: -2,
                  right: -4,
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: "#F59E0B",
                }} />
              )}
              {(state.pet.state as string) === "dead" && (
                <View style={{
                  position: "absolute",
                  top: -2,
                  right: -4,
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: "#EF4444",
                }} />
              )}
            </View>
          ),
        }}
      />

      {/* ── Configurações ── */}
      <Tabs.Screen
        name="settings"
        options={{
          title: "Config",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={26} name="gearshape.fill" color={color} />
          ),
        }}
      />

      {/* Aba IMC oculta — conteudo integrado ao Calendario */}
      <Tabs.Screen
        name="bmi"
        options={{
          href: null, // oculta da tab bar
        }}
      />
    </Tabs>
  );
}
