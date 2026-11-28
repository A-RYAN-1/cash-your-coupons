import { useMemo } from "react";
import { StyleSheet } from "react-native";
import { useTheme } from "../theme";

// Builds a StyleSheet from the current theme once per theme change.
export const useStyles = (make) => {
  const theme = useTheme();
  return useMemo(() => StyleSheet.create(make(theme)), [make, theme]);
};
