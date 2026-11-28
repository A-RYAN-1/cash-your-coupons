// Motion helpers. Nothing here animates when the person has asked for reduced motion.
import { useEffect, useState } from "react";
import { AccessibilityInfo, Animated, Platform } from "react-native";
import { motion } from "../theme";

export const useNativeDriver = Platform.OS !== "web";

export function useReduceMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    let live = true;
    AccessibilityInfo.isReduceMotionEnabled().then((value) => {
      if (live) setReduce(Boolean(value));
    });
    const sub = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduce);
    return () => {
      live = false;
      sub.remove();
    };
  }, []);
  return reduce;
}

// Pressed feedback (pattern B26): scale to 0.97 and dim a little. Spread `handlers` on an animated Pressable and
// add `style` to its style array (an animated component cannot take a style function).
export function usePressScale() {
  const reduce = useReduceMotion();
  const [value] = useState(() => new Animated.Value(0));
  const to = (target) => {
    if (reduce) {
      value.setValue(target);
      return;
    }
    Animated.timing(value, { toValue: target, duration: motion.press, useNativeDriver }).start();
  };
  return {
    style: {
      opacity: value.interpolate({ inputRange: [0, 1], outputRange: [1, 0.85] }),
      transform: [{ scale: value.interpolate({ inputRange: [0, 1], outputRange: [1, 0.97] }) }],
    },
    handlers: { onPressIn: () => to(1), onPressOut: () => to(0) },
  };
}
