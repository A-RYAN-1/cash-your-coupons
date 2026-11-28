import React from "react";
import { Text, View } from "react-native";
import { radius, tilePalette, type, useIsDark } from "../theme";

const SIZES = { sm: 32, md: 44, lg: 64 };

const initials = (name) =>
  String(name || "?")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("");

const slot = (name) => [...String(name || "")].reduce((sum, ch) => sum + ch.charCodeAt(0), 0);

// A rounded square with a brand's initials. The colour comes from the name, so a brand always looks the same.
export function Tile({ name, size = "md" }) {
  const palette = tilePalette[useIsDark() ? "dark" : "light"];
  const color = palette[slot(name) % palette.length];
  const side = SIZES[size];
  return (
    <View
      accessible={false}
      style={{
        width: side,
        height: side,
        borderRadius: size === "lg" ? radius.lg : radius.md,
        backgroundColor: color.bg,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={[size === "lg" ? type.heading : type.label, { color: color.fg }]}>{initials(name)}</Text>
    </View>
  );
}
