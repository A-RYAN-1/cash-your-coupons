/* global setTimeout, clearTimeout */
// Shared building blocks. Screens compose these and hold no colours or sizes of their own.
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { subscribe } from "./notify";
import { MAX_WIDTH, radius, space, type, useTheme } from "./theme";

const useStyles = (make) => {
  const theme = useTheme();
  return useMemo(() => StyleSheet.create(make(theme)), [make, theme]);
};

const screenStyles = (t) => ({
  safe: { flex: 1, backgroundColor: t.bg },
  column: { flex: 1, width: "100%", maxWidth: MAX_WIDTH, alignSelf: "center" },
  header: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: space.md,
    paddingTop: space.md,
    paddingBottom: space.sm,
  },
  title: { ...type.title, color: t.text },
  subtitle: { ...type.caption, color: t.muted, marginTop: 2 },
});

export function Screen({ title, subtitle, action, children }) {
  const s = useStyles(screenStyles);
  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <View style={s.column}>
        <View style={s.header}>
          <View>
            <Text style={s.title} accessibilityRole="header">
              {title}
            </Text>
            {subtitle ? <Text style={s.subtitle}>{subtitle}</Text> : null}
          </View>
          {action}
        </View>
        {children}
      </View>
    </SafeAreaView>
  );
}

// A scrolling form or page body with the standard padding.
export function Page({ children, ...props }) {
  return (
    <ScrollView
      contentContainerStyle={{ padding: space.md, paddingBottom: space.xl, gap: space.md }}
      keyboardShouldPersistTaps="handled"
      {...props}
    >
      {children}
    </ScrollView>
  );
}

export const listPadding = { padding: space.md, paddingBottom: space.xl };

const buttonStyles = (t) => ({
  base: {
    minHeight: 44,
    paddingHorizontal: space.md,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: space.sm,
    borderWidth: 1,
  },
  primary: { backgroundColor: t.accent, borderColor: t.accent },
  secondary: { backgroundColor: t.surface, borderColor: t.border },
  danger: { backgroundColor: t.surface, borderColor: t.danger },
  small: { minHeight: 34, paddingHorizontal: space.md - 4 },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.85 },
  label: { ...type.label, fontSize: 15 },
  primaryLabel: { color: t.accentText },
  secondaryLabel: { color: t.text },
  dangerLabel: { color: t.danger },
});

export function Button({ label, onPress, variant = "primary", small, loading, disabled, style }) {
  const s = useStyles(buttonStyles);
  const t = useTheme();
  const inactive = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: Boolean(inactive), busy: Boolean(loading) }}
      onPress={inactive ? undefined : onPress}
      style={({ pressed }) => [
        s.base,
        s[variant],
        small && s.small,
        inactive && s.disabled,
        pressed && !inactive && s.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variant === "primary" ? t.accentText : t.muted} />
      ) : null}
      <Text style={[s.label, s[`${variant}Label`]]}>{label}</Text>
    </Pressable>
  );
}

const fieldStyles = (t) => ({
  wrap: { gap: 6 },
  label: { ...type.label, color: t.text },
  input: {
    minHeight: 44,
    paddingHorizontal: space.md - 4,
    paddingVertical: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: t.border,
    backgroundColor: t.surface,
    color: t.text,
    fontSize: 15,
  },
  multiline: { minHeight: 96, textAlignVertical: "top" },
  hint: { ...type.caption, color: t.muted },
});

export function Field({ label, hint, multiline, ...inputProps }) {
  const s = useStyles(fieldStyles);
  const t = useTheme();
  return (
    <View style={s.wrap}>
      <Text style={s.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={t.muted}
        multiline={multiline}
        style={[s.input, multiline && s.multiline]}
        {...inputProps}
      />
      {hint ? <Text style={s.hint}>{hint}</Text> : null}
    </View>
  );
}

const chipStyles = (t) => ({
  chip: {
    paddingHorizontal: space.md - 2,
    paddingVertical: 7,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: t.border,
    backgroundColor: t.surface,
  },
  selected: { backgroundColor: t.accentSoft, borderColor: t.accent },
  label: { ...type.label, color: t.muted },
  selectedLabel: { color: t.accent },
  row: { flexDirection: "row", flexWrap: "wrap", gap: space.sm },
});

export function ChipRow({ options, value, onChange, scroll }) {
  const s = useStyles(chipStyles);
  const chips = options.map((option) => {
    const selected = option === value;
    return (
      <Pressable
        key={option}
        accessibilityRole="button"
        accessibilityState={{ selected }}
        onPress={() => onChange(selected && option !== "All" ? "" : option)}
        style={[s.chip, selected && s.selected]}
      >
        <Text style={[s.label, selected && s.selectedLabel]}>{option}</Text>
      </Pressable>
    );
  });
  if (scroll) {
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[s.row, { flexWrap: "nowrap" }]}>
        {chips}
      </ScrollView>
    );
  }
  return <View style={s.row}>{chips}</View>;
}

const cardStyles = (t) => ({
  card: {
    backgroundColor: t.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: t.border,
    padding: space.md,
    gap: space.sm,
  },
});

export function Card({ children, style }) {
  const s = useStyles(cardStyles);
  return <View style={[s.card, style]}>{children}</View>;
}

const pillStyles = (t) => ({
  pill: { alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.pill, backgroundColor: t.surfaceAlt },
  warn: { backgroundColor: t.warningSoft },
  bad: { backgroundColor: t.dangerSoft },
  label: { ...type.caption, fontWeight: "600", color: t.muted },
  warnLabel: { color: t.warning },
  badLabel: { color: t.danger },
});

export function Pill({ label, tone }) {
  const s = useStyles(pillStyles);
  return (
    <View style={[s.pill, tone && s[tone]]}>
      <Text style={[s.label, tone && s[`${tone}Label`]]}>{label}</Text>
    </View>
  );
}

const DAY = 24 * 60 * 60 * 1000;

// "Expires in 3 days" with a tone that rises as the date approaches.
export function expiryInfo(expiryDate) {
  const left = new Date(expiryDate) - new Date();
  if (left <= 0) return { label: "Expired", tone: "bad", expired: true };
  const days = Math.ceil(left / DAY);
  if (days <= 1) return { label: "Expires today", tone: "warn" };
  if (days <= 7) return { label: `Expires in ${days} days`, tone: "warn" };
  return {
    label: `Expires ${new Date(expiryDate).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}`,
  };
}

export const rupees = (value) => `₹${Number(value).toLocaleString("en-IN")}`;

const couponStyles = (t) => ({
  top: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: space.md },
  name: { ...type.heading, color: t.text, flexShrink: 1 },
  value: { ...type.heading, color: t.accent, fontVariant: ["tabular-nums"] },
  details: { ...type.body, color: t.muted },
  footer: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: space.md, marginTop: space.xs },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: space.sm, flexShrink: 1 },
});

export function CouponCard({ coupon, action }) {
  const s = useStyles(couponStyles);
  const expiry = expiryInfo(coupon.expiryDate);
  return (
    <Card>
      <View style={s.top}>
        <Text style={s.name}>{coupon.name}</Text>
        <Text style={s.value}>{rupees(coupon.value)}</Text>
      </View>
      {coupon.details ? (
        <Text style={s.details} numberOfLines={3}>
          {coupon.details}
        </Text>
      ) : null}
      <View style={s.footer}>
        <View style={s.tags}>
          {coupon.category ? <Pill label={coupon.category} /> : null}
          <Pill label={expiry.label} tone={expiry.tone} />
        </View>
        {action}
      </View>
    </Card>
  );
}

const emptyStyles = (t) => ({
  wrap: { alignItems: "center", paddingVertical: space.xl, paddingHorizontal: space.lg, gap: 6 },
  title: { ...type.heading, color: t.text, textAlign: "center" },
  text: { ...type.body, color: t.muted, textAlign: "center", maxWidth: 360 },
});

export function EmptyState({ title, text, children }) {
  const s = useStyles(emptyStyles);
  return (
    <View style={s.wrap}>
      <Text style={s.title}>{title}</Text>
      <Text style={s.text}>{text}</Text>
      {children}
    </View>
  );
}

export function Loading() {
  const t = useTheme();
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <ActivityIndicator size="large" color={t.accent} />
    </View>
  );
}

const segmentStyles = (t) => ({
  wrap: { flexDirection: "row", backgroundColor: t.surfaceAlt, borderRadius: radius.md, padding: 3 },
  item: { flex: 1, alignItems: "center", paddingVertical: 8, borderRadius: radius.md - 3 },
  selected: { backgroundColor: t.surface },
  label: { ...type.label, color: t.muted },
  selectedLabel: { color: t.text },
});

export function Segmented({ options, value, onChange }) {
  const s = useStyles(segmentStyles);
  return (
    <View style={s.wrap}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            style={[s.item, selected && s.selected]}
          >
            <Text style={[s.label, selected && s.selectedLabel]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const dialogStyles = (t) => ({
  scrim: { flex: 1, backgroundColor: t.scrim, justifyContent: "center", alignItems: "center", padding: space.md },
  box: { width: "100%", maxWidth: 440, maxHeight: "90%", backgroundColor: t.surface, borderRadius: radius.lg, padding: space.lg, gap: space.md },
  title: { ...type.heading, fontSize: 19, color: t.text },
  message: { ...type.body, color: t.muted },
  actions: { flexDirection: "row", justifyContent: "flex-end", gap: space.sm },
});

export function Dialog({ visible, title, message, onClose, children, actions }) {
  const s = useStyles(dialogStyles);
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={s.scrim}>
        <View style={s.box} accessibilityViewIsModal>
          <Text style={s.title} accessibilityRole="header">
            {title}
          </Text>
          {message ? <Text style={s.message}>{message}</Text> : null}
          {children ? <ScrollView style={{ flexShrink: 1 }}>{children}</ScrollView> : null}
          <View style={s.actions}>{actions}</View>
        </View>
      </View>
    </Modal>
  );
}

const toastStyles = (t) => ({
  toast: {
    position: "absolute",
    left: space.md,
    right: space.md,
    bottom: 84,
    maxWidth: 480,
    alignSelf: "center",
    paddingHorizontal: space.md,
    paddingVertical: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: t.border,
    backgroundColor: t.surface,
  },
  success: { borderColor: t.accent },
  error: { borderColor: t.danger, backgroundColor: t.dangerSoft },
  text: { ...type.body, color: t.text },
});

// Mounted once in App: shows toasts and confirmation dialogs sent through notify.js.
export function ToastHost() {
  const s = useStyles(toastStyles);
  const [toast, setToast] = useState(null);
  const [confirm, setConfirm] = useState(null);

  useEffect(
    () =>
      subscribe((event) => {
        if (event.type === "toast") setToast(event);
        else setConfirm(event);
      }),
    []
  );

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(timer);
  }, [toast]);

  const answer = (result) => {
    confirm.resolve(result);
    setConfirm(null);
  };

  return (
    <>
      {toast ? (
        <View
          style={[s.toast, s[toast.kind]]}
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
        >
          <Text style={s.text}>{toast.message}</Text>
        </View>
      ) : null}
      <Dialog
        visible={Boolean(confirm)}
        title={confirm?.title}
        message={confirm?.message}
        onClose={() => answer(false)}
        actions={
          <>
            <Button label="Cancel" variant="secondary" onPress={() => answer(false)} />
            <Button label={confirm?.confirmLabel || "Confirm"} variant="danger" onPress={() => answer(true)} />
          </>
        }
      />
    </>
  );
}
