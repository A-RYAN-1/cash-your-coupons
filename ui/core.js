/* global setTimeout, clearTimeout */
// Shared building blocks. Screens compose these and hold no colours or sizes of their own.
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { subscribe } from "../notify";
import {
  MAX_WIDTH,
  TAB_BAR,
  TARGET,
  elevation,
  motion,
  radius,
  space,
  type,
  useCategoryColor,
  useTheme,
} from "../theme";
import { Icon } from "./Icon";
import { Tile } from "./Tile";
import { useNativeDriver, usePressScale, useReduceMotion } from "./motion";
import { useStyles } from "./useStyles";

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
      contentContainerStyle={{
        padding: space.md,
        paddingBottom: space.xl,
        gap: space.md,
      }}
      keyboardShouldPersistTaps="handled"
      {...props}
    >
      {children}
    </ScrollView>
  );
}

export const listPadding = { padding: space.md, paddingBottom: space.xl };

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const buttonStyles = (t) => ({
  base: {
    minHeight: TARGET,
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
  small: { minHeight: 36, paddingHorizontal: space.md - 4 },
  disabled: { opacity: 0.5 },
  label: type.button,
  primaryLabel: { color: t.accentText },
  secondaryLabel: { color: t.text },
  dangerLabel: { color: t.danger },
});

// `icon` is an Ionicons name shown before the label. A small button keeps a 44 point touch area through hitSlop.
export function Button({
  label,
  onPress,
  variant = "primary",
  small,
  loading,
  disabled,
  icon,
  style,
}) {
  const s = useStyles(buttonStyles);
  const t = useTheme();
  const press = usePressScale();
  const inactive = disabled || loading;
  const tone =
    variant === "primary"
      ? t.accentText
      : variant === "danger"
        ? t.danger
        : t.text;
  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityState={{
        disabled: Boolean(inactive),
        busy: Boolean(loading),
      }}
      onPress={inactive ? undefined : onPress}
      hitSlop={small ? space.xs : 0}
      {...(inactive ? {} : press.handlers)}
      style={[
        s.base,
        s[variant],
        small && s.small,
        inactive && s.disabled,
        !inactive && press.style,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === "primary" ? t.accentText : t.muted}
        />
      ) : null}
      {icon && !loading ? <Icon name={icon} size="sm" color={tone} /> : null}
      <Text style={[s.label, s[`${variant}Label`]]}>{label}</Text>
    </AnimatedPressable>
  );
}

const fieldStyles = (t) => ({
  wrap: { gap: space.xs + 2 },
  label: { ...type.label, color: t.text },
  input: {
    minHeight: TARGET,
    paddingHorizontal: space.md - 4,
    paddingVertical: space.sm + 2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: t.border,
    backgroundColor: t.surface,
    color: t.text,
    ...type.body,
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
    flexDirection: "row",
    alignItems: "center",
    gap: space.xs + 2,
    paddingHorizontal: space.md - 2,
    paddingVertical: space.sm - 1,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: t.border,
    backgroundColor: t.surface,
  },
  selected: { backgroundColor: t.accentSoft, borderColor: t.accent },
  label: { ...type.label, color: t.muted },
  selectedLabel: { color: t.accent },
  row: { flexDirection: "row", flexWrap: "wrap", gap: space.sm },
  nowrap: { flexWrap: "nowrap" },
});

// `icons` maps an option to an Ionicons name shown before its label.
export function ChipRow({ options, value, onChange, scroll, icons = {} }) {
  const s = useStyles(chipStyles);
  const chips = options.map((option) => {
    const selected = option === value;
    return (
      <Pressable
        key={option}
        accessibilityRole="button"
        accessibilityState={{ selected }}
        onPress={() => onChange(selected && option !== "All" ? "" : option)}
        hitSlop={space.xs}
        style={[s.chip, selected && s.selected]}
      >
        {icons[option] ? (
          <Icon
            name={icons[option]}
            size="sm"
            tone={selected ? "accent" : "muted"}
          />
        ) : null}
        <Text style={[s.label, selected && s.selectedLabel]}>{option}</Text>
      </Pressable>
    );
  });
  if (scroll) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[s.row, s.nowrap]}
      >
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
    shadowColor: t.shadow,
    ...elevation.card,
  },
});

export function Card({ children, style, onPress, label }) {
  const s = useStyles(cardStyles);
  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={onPress}
        style={[s.card, style]}
      >
        {children}
      </Pressable>
    );
  }
  return <View style={[s.card, style]}>{children}</View>;
}

const pillStyles = (t) => ({
  pill: {
    alignSelf: "flex-start",
    paddingHorizontal: space.sm,
    paddingVertical: space.xxs,
    borderRadius: radius.pill,
    backgroundColor: t.surfaceAlt,
  },
  warn: { backgroundColor: t.warningSoft },
  bad: { backgroundColor: t.dangerSoft },
  label: { ...type.micro, color: t.muted },
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
  top: { flexDirection: "row", alignItems: "center", gap: space.md },
  heading: { flex: 1, gap: space.xxs },
  name: { ...type.heading, color: t.text },
  category: { ...type.label },
  value: { ...type.title, color: t.accent, fontVariant: ["tabular-nums"] },
  details: { ...type.body, color: t.muted },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: space.md,
    marginTop: space.xs,
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: space.sm,
    flexShrink: 1,
  },
});

const codeStyles = (t) => ({
  box: {
    gap: space.xxs,
    padding: space.sm + 2,
    borderRadius: radius.md,
    backgroundColor: t.surfaceAlt,
  },
  label: { ...type.caption, color: t.muted },
  code: {
    ...type.heading,
    color: t.text,
    fontFamily: Platform.select({
      ios: "Menlo",
      android: "monospace",
      default: "ui-monospace, Menlo, Consolas, monospace",
    }),
    letterSpacing: 0.5,
  },
});

// A voucher code in a box the user can select and copy. `label` says who may see it.
export function CodeBox({ label, code }) {
  const s = useStyles(codeStyles);
  return (
    <View style={s.box}>
      <Text style={s.label}>{label}</Text>
      <Text selectable style={s.code}>
        {code}
      </Text>
    </View>
  );
}

// Brand tile, name and category on the left, face value on the right, expiry badge and action below (pattern B2).
export function CouponCard({ coupon, action, code, onPress }) {
  const s = useStyles(couponStyles);
  const expiry = expiryInfo(coupon.expiryDate);
  const tint = useCategoryColor(coupon.category);
  return (
    <Card
      onPress={onPress}
      label={
        onPress ? `${coupon.name}, ${rupees(coupon.value)}. Open` : undefined
      }
    >
      <View style={s.top}>
        <Tile name={coupon.name} category={coupon.category} />
        <View style={s.heading}>
          <Text style={s.name}>{coupon.name}</Text>
          {coupon.category ? (
            <Text style={[s.category, { color: tint.fg }]}>
              {coupon.category}
            </Text>
          ) : null}
        </View>
        <Text style={s.value}>{rupees(coupon.value)}</Text>
      </View>
      {coupon.details ? (
        <Text style={s.details} numberOfLines={3}>
          {coupon.details}
        </Text>
      ) : null}
      <View style={s.footer}>
        <View style={s.tags}>
          <Pill label={expiry.label} tone={expiry.tone} />
          {coupon.hasCode ? <Pill label="Voucher code included" /> : null}
        </View>
        {action}
      </View>
      {code ? <CodeBox label={code.label} code={code.value} /> : null}
    </Card>
  );
}

const emptyStyles = (t) => ({
  wrap: {
    alignItems: "center",
    paddingVertical: space.xl,
    paddingHorizontal: space.lg,
    gap: space.xs + 2,
  },
  badge: {
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: t.surfaceAlt,
    marginBottom: space.sm,
  },
  badgeError: { backgroundColor: t.dangerSoft },
  title: { ...type.heading, color: t.text, textAlign: "center" },
  text: { ...type.body, color: t.muted, textAlign: "center", maxWidth: 360 },
  action: { marginTop: space.md },
});

// Nothing to show yet. `icon` is an Ionicons name.
export function EmptyState({
  title,
  text,
  icon = "file-tray-outline",
  children,
}) {
  const s = useStyles(emptyStyles);
  return (
    <View style={s.wrap}>
      <View style={s.badge}>
        <Icon name={icon} size="xl" tone="muted" />
      </View>
      <Text style={s.title}>{title}</Text>
      <Text style={s.text}>{text}</Text>
      {children}
    </View>
  );
}

// The request failed. Always offers a way to try again.
export function ErrorState({ title = "Something went wrong", text, onRetry }) {
  const s = useStyles(emptyStyles);
  return (
    <View style={s.wrap} accessibilityRole="alert">
      <View style={[s.badge, s.badgeError]}>
        <Icon name="cloud-offline-outline" size="xl" tone="danger" />
      </View>
      <Text style={s.title}>{title}</Text>
      {text ? <Text style={s.text}>{text}</Text> : null}
      {onRetry ? (
        <View style={s.action}>
          <Button
            label="Try again"
            variant="secondary"
            icon="refresh"
            onPress={onRetry}
          />
        </View>
      ) : null}
    </View>
  );
}

const segmentStyles = (t) => ({
  wrap: {
    flexDirection: "row",
    backgroundColor: t.surfaceAlt,
    borderRadius: radius.md,
    padding: space.xs - 1,
  },
  item: {
    flex: 1,
    alignItems: "center",
    paddingVertical: space.sm,
    borderRadius: radius.md - 3,
  },
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
            <Text style={[s.label, selected && s.selectedLabel]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const dialogStyles = (t) => ({
  scrim: {
    flex: 1,
    backgroundColor: t.scrim,
    justifyContent: "center",
    alignItems: "center",
    padding: space.md,
  },
  box: {
    width: "100%",
    maxWidth: 440,
    maxHeight: "90%",
    backgroundColor: t.surface,
    borderRadius: radius.lg,
    padding: space.lg,
    gap: space.md,
  },
  title: { ...type.heading, color: t.text },
  message: { ...type.body, color: t.muted },
  actions: { flexDirection: "row", justifyContent: "flex-end", gap: space.sm },
});

export function Dialog({
  visible,
  title,
  message,
  onClose,
  children,
  actions,
}) {
  const s = useStyles(dialogStyles);
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={s.scrim}>
        <View style={s.box} accessibilityViewIsModal>
          <Text style={s.title} accessibilityRole="header">
            {title}
          </Text>
          {message ? <Text style={s.message}>{message}</Text> : null}
          {children ? (
            <ScrollView style={{ flexShrink: 1 }}>{children}</ScrollView>
          ) : null}
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
    bottom: TAB_BAR + space.md,
    maxWidth: MAX_WIDTH - 2 * space.md,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm + 2,
    paddingHorizontal: space.md,
    paddingVertical: space.md - 4,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: t.border,
    backgroundColor: t.surface,
    shadowColor: t.shadow,
    ...elevation.sheet,
  },
  success: { borderColor: t.accent },
  error: { borderColor: t.danger, backgroundColor: t.dangerSoft },
  text: { ...type.body, color: t.text, flex: 1 },
  cover: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
});

// One toast: fades and rises in under 160 ms (pattern B27); tap to dismiss.
function Toast({ toast, onDismiss }) {
  const s = useStyles(toastStyles);
  const reduce = useReduceMotion();
  const [enter] = useState(() => new Animated.Value(reduce ? 1 : 0));

  useEffect(() => {
    if (reduce) return;
    enter.setValue(0);
    Animated.timing(enter, {
      toValue: 1,
      duration: motion.fade,
      useNativeDriver,
    }).start();
  }, [toast, reduce, enter]);

  const rise = enter.interpolate({
    inputRange: [0, 1],
    outputRange: [space.md, 0],
  });
  const failed = toast.kind === "error";
  return (
    <Animated.View
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={[
        s.toast,
        s[toast.kind],
        { opacity: enter, transform: [{ translateY: rise }] },
      ]}
    >
      <Icon
        name={failed ? "alert-circle" : "checkmark-circle"}
        tone={failed ? "danger" : "accent"}
      />
      <Text style={s.text}>{toast.message}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Dismiss message"
        onPress={onDismiss}
        style={s.cover}
      />
    </Animated.View>
  );
}

// Mounted once in App: shows toasts and confirmation dialogs sent through notify.js.
export function ToastHost() {
  const [toast, setToast] = useState(null);
  const [confirm, setConfirm] = useState(null);

  useEffect(
    () =>
      subscribe((event) => {
        if (event.type === "toast") setToast(event);
        else setConfirm(event);
      }),
    [],
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
      {toast ? <Toast toast={toast} onDismiss={() => setToast(null)} /> : null}
      <Dialog
        visible={Boolean(confirm)}
        title={confirm?.title}
        message={confirm?.message}
        onClose={() => answer(false)}
        actions={
          <>
            <Button
              label="Cancel"
              variant="secondary"
              onPress={() => answer(false)}
            />
            <Button
              label={confirm?.confirmLabel || "Confirm"}
              variant="danger"
              onPress={() => answer(true)}
            />
          </>
        }
      />
    </>
  );
}
