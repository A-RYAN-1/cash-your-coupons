import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { icon as sizes, useTheme } from "../theme";

// Vector icon from the Ionicons set. `tone` picks a theme colour; `size` is a token name.
export function Icon({ name, size = "md", tone = "text", color }) {
  const t = useTheme();
  return <Ionicons name={name} size={sizes[size]} color={color ?? t[tone]} accessible={false} />;
}
