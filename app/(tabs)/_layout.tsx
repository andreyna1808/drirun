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
      initialRouteName="index"
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
      {/* Home (agora home.tsx) */}
      <Tabs.Screen
        name="index"
        options={{
          title: "Início",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={26} name="house.fill" color={color} />
          ),
        }}
      />

      <Tabs.Screen name="calendar/bmi" options={{ href: null }} />

      <Tabs.Screen name="pet/pet-gallery" options={{ href: null }} />
      <Tabs.Screen name="pet/shop" options={{ href: null }} />

      <Tabs.Screen name="settings/profile/index" options={{ href: null }} />
      <Tabs.Screen name="settings/about/index" options={{ href: null }} />

      {/* Métricas */}
      <Tabs.Screen
        name="metrics/index"
        options={{
          title: "Métricas",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={26} name="chart.bar.fill" color={color} />
          ),
        }}
      />

      {/* Calendário (inclui IMC) */}
      <Tabs.Screen
        name="calendar/index"
        options={{
          title: "Calendário",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={26} name="calendar" color={color} />
          ),
        }}
      />

      {/* Pet */}
      <Tabs.Screen
        name="pet/index"
        options={{
          title: "Meu Pet",
          tabBarIcon: ({ color }) => (
            <View style={{ position: "relative" }}>
              <IconSymbol size={26} name="pawprint.fill" color={color} />
              {(state.pet.state === "sad" || state.pet.state === "depressed") && (
                <View
                  style={{
                    position: "absolute",
                    top: -2,
                    right: -4,
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: "#F59E0B",
                  }}
                />
              )}
              {(state.pet.state as string) === "dead" && (
                <View
                  style={{
                    position: "absolute",
                    top: -2,
                    right: -4,
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: "#EF4444",
                  }}
                />
              )}
            </View>
          ),
        }}
      />

      {/* Configurações */}
      <Tabs.Screen
        name="settings/index"
        options={{
          title: "Config",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={26} name="gearshape.fill" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}