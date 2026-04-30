import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ComponentProps } from "react";
import { type StyleProp, type TextStyle, type OpaqueColorValue } from "react-native";

// Definimos apenas os ícones que usamos no app
export type IconSymbolName =
  | "house.fill"
  | "chart.bar.fill"
  | "calendar"
  | "pawprint.fill"
  | "scalemass.fill"
  | "gearshape.fill"
  | "paperplane.fill"
  | "play.fill"
  | "stop.fill"
  | "pause.fill"
  | "plus"
  | "checkmark"
  | "xmark"
  | "arrow.left"
  | "arrow.right"
  | "pencil"
  | "trash.fill"
  | "chevron.left.forwardslash.chevron.right"
  | "chevron.right"
  | "chevron.left"
  | "flame.fill"
  | "figure.run"
  | "heart.fill"
  | "star.fill"
  | "trophy.fill"
  | "location.fill"
  | "map.fill"
  | "person.fill"
  | "cart.fill"
  | "bell.fill"
  | "info.circle.fill";

const MAPPING: Record<IconSymbolName, ComponentProps<typeof MaterialIcons>["name"]> = {
  "house.fill": "home",
  "chart.bar.fill": "bar-chart",
  "calendar": "calendar-today",
  "pawprint.fill": "pets",
  "scalemass.fill": "monitor-weight",
  "gearshape.fill": "settings",
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
};

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
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}