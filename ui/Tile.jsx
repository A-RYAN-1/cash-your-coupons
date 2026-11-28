import React from "react";
import { Text, View } from "react-native";
import {
  categoryColors,
  radius,
  tilePalette,
  type,
  useIsDark,
  useTheme,
} from "../theme";

const SIZES = { sm: 32, md: 44, lg: 64 };

const initials = (name) =>
  String(name || "?")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("");

const slot = (name) =>
  [...String(name || "")].reduce((sum, ch) => sum + ch.charCodeAt(0), 0);

// A rounded square with a brand's initials. The colour comes from the name, so a brand always looks the same.
export function Tile({ name, category, size = "md", onTint }) {
  const mode = useIsDark() ? "dark" : "light";
  const palette = tilePalette[mode];
  // A known category sets the colour, so a Food coupon is always orange; otherwise the name picks one.
  const color =
    categoryColors[mode][category] ?? palette[slot(name) % palette.length];
  const side = SIZES[size];
  const surface = useTheme().surface;
  return (
    <View
      accessible={false}
      style={{
        width: side,
        height: side,
        borderRadius: size === "lg" ? radius.lg : radius.md,
        backgroundColor: onTint ? surface : color.bg,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text
        style={[size === "lg" ? type.heading : type.label, { color: color.fg }]}
      >
        {initials(name)}
      </Text>
    </View>
  );
}
