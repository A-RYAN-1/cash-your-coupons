import React from "react";
import { Text, View } from "react-native";
import { radius, space, type } from "../theme";
import { useStyles } from "./useStyles";

const stepperStyles = (t) => ({
  row: { flexDirection: "row", alignItems: "center", gap: space.sm },
  dot: { width: 24, height: 24, borderRadius: radius.pill, alignItems: "center", justifyContent: "center", backgroundColor: t.surfaceAlt },
  dotDone: { backgroundColor: t.accent },
  dotNow: { backgroundColor: t.accentSoft, borderWidth: 1, borderColor: t.accent },
  num: { ...type.micro, color: t.muted },
  numDone: { color: t.accentText },
  numNow: { color: t.accent },
  label: { ...type.label, color: t.text, marginTop: space.xs },
  bar: { flex: 1, height: 2, backgroundColor: t.border },
  barDone: { backgroundColor: t.accent },
});

// Numbered steps joined by a line, for a form or a status (patterns B19, B33). `current` is zero-based.
export function Stepper({ steps, current }) {
  const s = useStyles(stepperStyles);
  return (
    <View accessibilityLabel={`Step ${current + 1} of ${steps.length}: ${steps[current]}`}>
      <View style={s.row}>
        {steps.map((label, i) => (
          <React.Fragment key={label}>
            <View style={[s.dot, i < current && s.dotDone, i === current && s.dotNow]}>
              <Text style={[s.num, i < current && s.numDone, i === current && s.numNow]}>{i + 1}</Text>
            </View>
            {i < steps.length - 1 ? <View style={[s.bar, i < current && s.barDone]} /> : null}
          </React.Fragment>
        ))}
      </View>
      <Text style={s.label}>{steps[current]}</Text>
    </View>
  );
}
