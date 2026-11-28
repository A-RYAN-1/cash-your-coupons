import React, { useEffect, useState } from "react";
import { Animated, Text, View } from "react-native";
import { motion, radius, space, type, useTheme } from "../theme";
import { Icon } from "./Icon";
import { Skeleton } from "./Skeleton";
import { useNativeDriver, useReduceMotion } from "./motion";

// The full-screen loader: the app mark breathing above a skeleton caption (pattern B31).
export function Loading({ label = "Loading" }) {
  const t = useTheme();
  const reduce = useReduceMotion();
  const [beat] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (reduce) return undefined;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(beat, {
          toValue: 1,
          duration: motion.shimmer / 2,
          useNativeDriver,
        }),
        Animated.timing(beat, {
          toValue: 0,
          duration: motion.shimmer / 2,
          useNativeDriver,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [beat, reduce]);

  const scale = beat.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.12],
  });
  return (
    <View
      accessibilityLabel={label}
      accessibilityRole="progressbar"
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: space.md,
      }}
    >
      <Animated.View
        style={{
          width: 72,
          height: 72,
          borderRadius: radius.xl,
          backgroundColor: t.accent,
          alignItems: "center",
          justifyContent: "center",
          transform: [{ scale }],
        }}
      >
        <Icon name="pricetag" size="xl" color={t.accentText} />
      </Animated.View>
      <Text style={{ ...type.label, color: t.muted }}>{label}</Text>
      <Skeleton width={120} height={8} round={radius.pill} />
    </View>
  );
}
