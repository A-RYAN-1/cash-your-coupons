import React, { useEffect, useState } from "react";
import { Animated, View } from "react-native";
import { motion, radius, space, useTheme } from "../theme";
import { useNativeDriver, useReduceMotion } from "./motion";

// A grey block that pulses while content loads (pattern B31). Still when reduced motion is on.
export function Skeleton({
  width = "100%",
  height = 14,
  round = radius.sm,
  style,
}) {
  const t = useTheme();
  const reduce = useReduceMotion();
  const [phase] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (reduce) return undefined;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(phase, {
          toValue: 1,
          duration: motion.shimmer / 2,
          useNativeDriver,
        }),
        Animated.timing(phase, {
          toValue: 0,
          duration: motion.shimmer / 2,
          useNativeDriver,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [phase, reduce]);

  const opacity = reduce
    ? 1
    : phase.interpolate({ inputRange: [0, 1], outputRange: [1, 0.55] });
  return (
    <Animated.View
      accessible={false}
      style={[
        {
          width,
          height,
          borderRadius: round,
          backgroundColor: t.skeleton,
          opacity,
        },
        style,
      ]}
    />
  );
}

// The loading shape of one coupon card: brand tile, two text lines, price and button row.
export function CouponCardSkeleton() {
  const t = useTheme();
  return (
    <View
      accessibilityLabel="Loading"
      style={{
        backgroundColor: t.surface,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: t.border,
        padding: space.md,
        gap: space.md,
      }}
    >
      <View
        style={{ flexDirection: "row", gap: space.md, alignItems: "center" }}
      >
        <Skeleton width={44} height={44} round={radius.md} />
        <View style={{ flex: 1, gap: space.sm }}>
          <Skeleton width="60%" height={16} />
          <Skeleton width="35%" height={12} />
        </View>
      </View>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Skeleton width={96} height={24} />
        <Skeleton width={72} height={36} round={radius.md} />
      </View>
    </View>
  );
}

export function ListSkeleton({ count = 4 }) {
  return (
    <View style={{ padding: space.md, gap: space.md }}>
      {Array.from({ length: count }, (_, i) => (
        <CouponCardSkeleton key={i} />
      ))}
    </View>
  );
}
