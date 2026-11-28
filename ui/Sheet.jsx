import React, { useEffect, useState } from "react";
import {
  Animated,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import {
  MAX_WIDTH,
  WIDE_BREAKPOINT,
  elevation,
  motion,
  radius,
  space,
  type,
} from "../theme";
import { useStyles } from "./useStyles";
import { useNativeDriver, useReduceMotion } from "./motion";

const sheetStyles = (t) => ({
  fill: { flex: 1, justifyContent: "flex-end", alignItems: "center" },
  scrim: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: t.scrim,
  },
  panel: {
    width: "100%",
    maxWidth: MAX_WIDTH,
    maxHeight: "88%",
    backgroundColor: t.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingTop: space.sm,
    shadowColor: t.shadow,
    ...elevation.sheet,
  },
  panelWide: { borderRadius: radius.xl, marginBottom: space.xl },
  grip: {
    alignSelf: "center",
    width: 36,
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: t.border,
    marginBottom: space.sm,
  },
  title: {
    ...type.heading,
    color: t.text,
    paddingHorizontal: space.md,
    paddingBottom: space.sm,
  },
  body: { paddingHorizontal: space.md, paddingBottom: space.md },
  footer: {
    flexDirection: "row",
    gap: space.sm,
    padding: space.md,
    borderTopWidth: 1,
    borderTopColor: t.border,
  },
});

// A bottom sheet on a phone, a centred card on a wide window (pattern B3). Slides in under 250 ms.
export function Sheet({ visible, title, onClose, children, footer }) {
  const s = useStyles(sheetStyles);
  const reduce = useReduceMotion();
  const { width } = useWindowDimensions();
  const [slide] = useState(() => new Animated.Value(1));

  useEffect(() => {
    if (!visible) return;
    slide.setValue(reduce ? 0 : 1);
    if (!reduce)
      Animated.timing(slide, {
        toValue: 0,
        duration: motion.sheet,
        useNativeDriver,
      }).start();
  }, [visible, reduce, slide]);

  const translateY = slide.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 320],
  });
  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={s.fill}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          style={s.scrim}
          onPress={onClose}
        />
        <Animated.View
          accessibilityViewIsModal
          style={[
            s.panel,
            width >= WIDE_BREAKPOINT && s.panelWide,
            { transform: [{ translateY }] },
          ]}
        >
          <View style={s.grip} />
          {title ? (
            <Text style={s.title} accessibilityRole="header">
              {title}
            </Text>
          ) : null}
          <ScrollView
            style={{ flexShrink: 1 }}
            contentContainerStyle={s.body}
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>
          {footer ? <View style={s.footer}>{footer}</View> : null}
        </Animated.View>
      </View>
    </Modal>
  );
}
