// Design tokens: every colour, spacing step and radius in the app comes from this file.
import { useColorScheme } from "react-native";

const light = {
  bg: "#F6F5F2",
  surface: "#FFFFFF",
  surfaceAlt: "#EFEDE8",
  border: "#E2DFD8",
  text: "#1D1C19",
  muted: "#6A675F",
  accent: "#176B45",
  accentText: "#FFFFFF",
  accentSoft: "#E3F1E9",
  danger: "#B3261E",
  dangerSoft: "#FBE9E7",
  warning: "#8A5A00",
  warningSoft: "#FDF1D8",
  scrim: "rgba(20, 20, 18, 0.45)",
};

const dark = {
  bg: "#111210",
  surface: "#1A1B19",
  surfaceAlt: "#232522",
  border: "#2E302C",
  text: "#ECEBE6",
  muted: "#9C9A92",
  accent: "#4CC38A",
  accentText: "#06210F",
  accentSoft: "#17301F",
  danger: "#F2766D",
  dangerSoft: "#3A1C19",
  warning: "#E5B04A",
  warningSoft: "#33270E",
  scrim: "rgba(0, 0, 0, 0.6)",
};

export const space = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 };
export const radius = { sm: 6, md: 10, lg: 14, pill: 999 };
export const type = {
  title: { fontSize: 24, fontWeight: "700", letterSpacing: -0.3 },
  heading: { fontSize: 17, fontWeight: "650" },
  body: { fontSize: 15, lineHeight: 22 },
  label: { fontSize: 13, fontWeight: "600" },
  caption: { fontSize: 13, lineHeight: 18 },
};

export const MAX_WIDTH = 720;

export const useTheme = () => (useColorScheme() === "dark" ? dark : light);
