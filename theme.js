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
  offer: "#B3321E",
  offerText: "#FFFFFF",
  skeleton: "#E9E6DF",
  skeletonHigh: "#F4F2ED",
  shadow: "rgba(29, 28, 25, 0.12)",
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
  offer: "#F2766D",
  offerText: "#2B0A07",
  skeleton: "#262825",
  skeletonHigh: "#30332F",
  shadow: "rgba(0, 0, 0, 0.5)",
  scrim: "rgba(0, 0, 0, 0.6)",
};

// 4 and 8 point spacing steps; hairline is the one-pixel rule width.
export const space = {
  hair: 1,
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};
export const radius = { sm: 6, md: 10, lg: 14, xl: 20, pill: 999 };
export const type = {
  display: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  title: { fontSize: 24, fontWeight: "700", letterSpacing: -0.3 },
  heading: { fontSize: 17, fontWeight: "650" },
  body: { fontSize: 15, lineHeight: 22 },
  bodyStrong: { fontSize: 15, lineHeight: 22, fontWeight: "600" },
  button: { fontSize: 15, fontWeight: "600" },
  label: { fontSize: 13, fontWeight: "600" },
  caption: { fontSize: 13, lineHeight: 18 },
  micro: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
};

// Icon sizes and the smallest touch target (44 points, the platform guideline).
export const icon = { sm: 16, md: 20, lg: 24, xl: 32 };
export const TARGET = 44;
export const TAB_BAR = 64;

// Motion: every animation is at most 250 ms and is skipped when the person asks for less motion.
export const motion = { press: 90, sheet: 240, fade: 160, shimmer: 1100 };

// Raised surfaces. Colour comes from the theme (`shadow`); the web build reads boxShadow.
export const elevation = {
  card: {
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 1,
  },
  sheet: {
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 8,
  },
};

// Brand tiles take a colour from this list by name, so a brand always looks the same.
export const tilePalette = {
  light: [
    { bg: "#E3F1E9", fg: "#176B45" },
    { bg: "#E6EDF9", fg: "#244A8F" },
    { bg: "#FBE9E7", fg: "#9A2C20" },
    { bg: "#FDF1D8", fg: "#7A4F00" },
    { bg: "#EDE7F6", fg: "#55318F" },
    { bg: "#E0F2F1", fg: "#0F6A66" },
  ],
  dark: [
    { bg: "#17301F", fg: "#4CC38A" },
    { bg: "#1B2638", fg: "#8CB0F2" },
    { bg: "#3A1C19", fg: "#F2766D" },
    { bg: "#33270E", fg: "#E5B04A" },
    { bg: "#2A2140", fg: "#B79CF0" },
    { bg: "#12302E", fg: "#5CD1CB" },
  ],
};

// One colour pair per category, so Food always reads orange and Travel blue (pattern B6).
export const categoryColors = {
  light: {
    Food: { bg: "#FFE9D6", fg: "#B4500A" },
    Clothes: { bg: "#F9E1EE", fg: "#A3225F" },
    Travel: { bg: "#DDEBFB", fg: "#1D5CA8" },
    Electronics: { bg: "#E6E3FA", fg: "#4636B0" },
    "Online Gaming": { bg: "#E7DDF7", fg: "#6A2FB3" },
    Beauty: { bg: "#FDE2E4", fg: "#B02A3C" },
    "Health & Wellness": { bg: "#DDF3E4", fg: "#1B7A43" },
    Others: { bg: "#ECEAE3", fg: "#5E5B52" },
  },
  dark: {
    Food: { bg: "#3A2412", fg: "#FFA95E" },
    Clothes: { bg: "#3A1829", fg: "#F58DBF" },
    Travel: { bg: "#142A44", fg: "#7DB4F5" },
    Electronics: { bg: "#232048", fg: "#A9A0F5" },
    "Online Gaming": { bg: "#2C1C48", fg: "#C29CF5" },
    Beauty: { bg: "#3C1A1F", fg: "#F58C98" },
    "Health & Wellness": { bg: "#12301E", fg: "#6FD596" },
    Others: { bg: "#262622", fg: "#B5B2A8" },
  },
};

// Solid banner colours for the home carousel (no gradients).
export const bannerColors = {
  light: [
    { bg: "#176B45", fg: "#FFFFFF", sub: "#CFE8DA" },
    { bg: "#1D5CA8", fg: "#FFFFFF", sub: "#CFE0F5" },
    { bg: "#B4500A", fg: "#FFFFFF", sub: "#FBE0CB" },
  ],
  dark: [
    { bg: "#1F5E40", fg: "#ECFBF3", sub: "#A9D9C0" },
    { bg: "#1D3F6E", fg: "#EAF3FF", sub: "#A5C4EA" },
    { bg: "#6B3410", fg: "#FFF1E5", sub: "#E6B98F" },
  ],
};

export const useCategoryColor = (name) => {
  const table = categoryColors[useColorScheme() === "dark" ? "dark" : "light"];
  return table[name] ?? table.Others;
};

// Phone-width column. Wider windows show it centred, never stretched (pattern B25).
export const MAX_WIDTH = 480;
export const WIDE_BREAKPOINT = 768;

export const useIsDark = () => useColorScheme() === "dark";
export const useTheme = () => (useColorScheme() === "dark" ? dark : light);
