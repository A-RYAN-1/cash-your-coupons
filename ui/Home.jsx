import React from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import {
  TARGET,
  bannerColors,
  categoryColors,
  elevation,
  radius,
  space,
  type,
  useCategoryColor,
  useIsDark,
  useTheme,
} from "../theme";
import { Icon } from "./Icon";
import { Tile } from "./Tile";
import { Skeleton } from "./Skeleton";
import { expiryInfo, rupees } from "./core";
import { useStyles } from "./useStyles";

const barStyles = (t) => ({
  bar: {
    paddingHorizontal: space.md,
    paddingTop: space.md,
    paddingBottom: space.sm,
    gap: space.sm,
  },
  brand: { ...type.title, color: t.text },
  tagline: { ...type.caption, color: t.muted },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    minHeight: TARGET,
    paddingHorizontal: space.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: t.border,
    backgroundColor: t.surface,
  },
  input: { flex: 1, color: t.text, ...type.body, paddingVertical: space.sm },
});

// The top of the home screen: app name and one search pill (pattern B1).
export function HomeBar({ query, onQuery }) {
  const s = useStyles(barStyles);
  const t = useTheme();
  return (
    <View style={s.bar}>
      <View>
        <Text style={s.brand} accessibilityRole="header" aria-level={1}>
          Cash Your Coupons
        </Text>
        <Text style={s.tagline}>Buy coupons other people will not use</Text>
      </View>
      <View style={s.pill}>
        <Icon name="search" tone="muted" />
        <TextInput
          accessibilityLabel="Search coupons"
          placeholder="Search a brand or coupon"
          placeholderTextColor={t.muted}
          value={query}
          onChangeText={onQuery}
          returnKeyType="search"
          style={s.input}
        />
        {query ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Clear search"
            hitSlop={space.sm}
            onPress={() => onQuery("")}
          >
            <Icon name="close-circle" tone="muted" />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const CATEGORY_ICONS = {
  Food: "fast-food-outline",
  Clothes: "shirt-outline",
  Travel: "airplane-outline",
  Electronics: "phone-portrait-outline",
  "Online Gaming": "game-controller-outline",
  Beauty: "sparkles-outline",
  "Health & Wellness": "fitness-outline",
  Others: "grid-outline",
};

const tileStyles = (t) => ({
  row: {
    paddingHorizontal: space.md,
    gap: space.md,
    paddingVertical: space.sm,
  },
  item: { width: 72, alignItems: "center", gap: space.xs + 2 },
  box: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  boxOn: { borderColor: t.text },
  label: { ...type.caption, color: t.text, textAlign: "center" },
});

// Round-cornered icon tiles, one per category; tapping one filters the list (pattern B6).
export function CategoryTiles({ categories, value, onChange }) {
  const s = useStyles(tileStyles);
  const colors = categoryColors[useIsDark() ? "dark" : "light"];
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={s.row}
    >
      {categories.map((name) => {
        const on = value === name;
        return (
          <Pressable
            key={name}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            accessibilityLabel={name}
            onPress={() => onChange(on ? "" : name)}
            style={s.item}
          >
            <View
              style={[
                s.box,
                { backgroundColor: (colors[name] ?? colors.Others).bg },
                on && s.boxOn,
              ]}
            >
              <Icon
                name={CATEGORY_ICONS[name] ?? "pricetag-outline"}
                size="lg"
                color={(colors[name] ?? colors.Others).fg}
              />
            </View>
            <Text style={s.label} numberOfLines={2}>
              {name}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const railStyles = (t) => ({
  head: {
    paddingHorizontal: space.md,
    paddingTop: space.md,
    paddingBottom: space.sm,
  },
  title: { ...type.heading, color: t.text },
  sub: { ...type.caption, color: t.muted },
  row: {
    paddingHorizontal: space.md,
    gap: space.sm + 2,
    paddingBottom: space.xs,
  },
  card: {
    width: 168,
    gap: space.sm,
    padding: space.md - 2,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: t.border,
    backgroundColor: t.surface,
    shadowColor: t.shadow,
    ...elevation.card,
  },
  name: { ...type.label, color: t.text },
  value: { ...type.title, color: t.accent, fontVariant: ["tabular-nums"] },
  expiry: { ...type.caption, color: t.text },
  warn: { color: t.warning },
});

// A small coupon card for a horizontal rail: brand tile, name, value and expiry. Tapping buys.
export function MiniCoupon({ coupon, onPress }) {
  const s = useStyles(railStyles);
  const expiry = expiryInfo(coupon.expiryDate);
  const tint = useCategoryColor(coupon.category);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${coupon.name}, ${rupees(coupon.value)}, ${expiry.label}. Buy`}
      onPress={onPress}
      style={[s.card, { backgroundColor: tint.bg, borderColor: tint.bg }]}
    >
      <Tile name={coupon.name} category={coupon.category} onTint />
      <Text style={s.name} numberOfLines={1}>
        {coupon.name}
      </Text>
      <Text style={[s.value, { color: tint.fg }]}>{rupees(coupon.value)}</Text>
      <Text style={[s.expiry, expiry.tone === "warn" && s.warn]}>
        {expiry.label}
      </Text>
    </Pressable>
  );
}

// A titled horizontal row of coupons (pattern B7). Renders nothing when empty.
export function Rail({ title, subtitle, coupons, onPick }) {
  const s = useStyles(railStyles);
  if (coupons.length === 0) return null;
  return (
    <View>
      <View style={s.head}>
        <Text style={s.title} accessibilityRole="header">
          {title}
        </Text>
        {subtitle ? <Text style={s.sub}>{subtitle}</Text> : null}
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.row}
      >
        {coupons.map((c) => (
          <MiniCoupon key={c.id} coupon={c} onPress={() => onPick(c)} />
        ))}
      </ScrollView>
    </View>
  );
}

// The loading shape of the home screen: tiles and one rail of cards.
export function HomeSkeleton() {
  return (
    <View
      accessibilityLabel="Loading"
      style={{
        paddingHorizontal: space.md,
        gap: space.md,
        paddingTop: space.sm,
      }}
    >
      <View style={{ flexDirection: "row", gap: space.md }}>
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} width={56} height={56} round={radius.lg} />
        ))}
      </View>
      <Skeleton width="40%" height={18} />
      <View style={{ flexDirection: "row", gap: space.sm + 2 }}>
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} width={168} height={140} round={radius.lg} />
        ))}
      </View>
    </View>
  );
}

const bannerStyles = () => ({
  row: {
    paddingHorizontal: space.md,
    gap: space.sm + 2,
    paddingTop: space.xs,
    paddingBottom: space.sm,
  },
  card: {
    width: 280,
    minHeight: 112,
    borderRadius: radius.xl,
    padding: space.md,
    justifyContent: "space-between",
    gap: space.sm,
  },
  title: { ...type.heading },
  sub: { ...type.caption },
  cta: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: space.xs,
    minHeight: 36,
    paddingHorizontal: space.md - 2,
    borderRadius: radius.pill,
  },
  ctaLabel: { ...type.label },
});

// Solid-colour promo cards in a swipeable row: sell an unused coupon, swap one, buy before it expires (pattern B14).
export function Banners({ items }) {
  const s = useStyles(bannerStyles);
  const palette = bannerColors[useIsDark() ? "dark" : "light"];
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={s.row}
    >
      {items.map((item, i) => {
        const c = palette[i % palette.length];
        return (
          <View key={item.title} style={[s.card, { backgroundColor: c.bg }]}>
            <View style={{ gap: space.xxs }}>
              <Text style={[s.title, { color: c.fg }]}>{item.title}</Text>
              <Text style={[s.sub, { color: c.sub }]}>{item.text}</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={item.onPress}
              style={[s.cta, { backgroundColor: c.fg }]}
            >
              <Text style={[s.ctaLabel, { color: c.bg }]}>{item.cta}</Text>
              <Icon name="arrow-forward" size="sm" color={c.bg} />
            </Pressable>
          </View>
        );
      })}
    </ScrollView>
  );
}
