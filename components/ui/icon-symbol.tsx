/**
 * icon-symbol.tsx
 * Mapeamento de SF Symbols (iOS) para Material Icons (Android/Web).
 * Adicione novos ícones aqui ANTES de usá-los nas tabs.
 */

import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolWeight, SymbolViewProps } from "expo-symbols";
import { ComponentProps } from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

type IconMapping = Record<SymbolViewProps["name"], ComponentProps<typeof MaterialIcons>["name"]>;
type IconSymbolName = keyof typeof MAPPING;

/**
 * Mapeamento de SF Symbols para Material Icons.
 * SF Symbols: https://developer.apple.com/sf-symbols/
 * Material Icons: https://icons.expo.fyi
 */
const MAPPING = {
  // Navegação principal
  "house.fill": "home",
  "chart.bar.fill": "bar-chart",
  "calendar": "calendar-today",
  "pawprint.fill": "pets",
  "scalemass.fill": "monitor-weight",
  "gearshape.fill": "settings",

  // Ações
  "paperplane.fill": "send",
  "play.fill": "play-arrow",
  "stop.fill": "stop",
  "pause.fill": "pause",
  "plus": "add",
  "checkmark": "check",
  "xmark": "close",
  "arrow.left": "arrow-back",
  "arrow.right": "arrow-forward",
  "pencil": "edit",
  "trash.fill": "delete",

  // Misc
  "chevron.left.forwardslash.chevron.right": "code",
  "chevron.right": "chevron-right",
  "chevron.left": "chevron-left",
  "flame.fill": "local-fire-department",
  "figure.run": "directions-run",
  "heart.fill": "favorite",
  "star.fill": "star",
  "trophy.fill": "emoji-events",
  "location.fill": "location-on",
  "map.fill": "map",
  "person.fill": "person",
  "cart.fill": "shopping-cart",
  "bell.fill": "notifications",
  "info.circle.fill": "info",
} as IconMapping;

/**
 * Componente de ícone que usa SF Symbols no iOS e Material Icons no Android/Web.
 * Garante aparência consistente entre plataformas.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
