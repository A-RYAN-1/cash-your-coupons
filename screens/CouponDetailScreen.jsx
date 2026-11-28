import React, { useCallback, useEffect, useState } from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { buyCoupon, listCoupons } from "../api";
import { showError, showSuccess } from "../notify";
import {
  Button,
  Icon,
  Pill,
  Rail,
  Skeleton,
  Tile,
  expiryInfo,
  rupees,
} from "../ui";
import {
  MAX_WIDTH,
  radius,
  space,
  type,
  useCategoryColor,
  useTheme,
} from "../theme";

// One coupon in full: hero, terms that open and close, similar coupons, and a Buy bar that stays in view (patterns B7, B9).
const CouponDetailScreen = ({ route, navigation }) => {
  const t = useTheme();
  const { coupon } = route.params;
  const tint = useCategoryColor(coupon.category);
  const expiry = expiryInfo(coupon.expiryDate);
  const [open, setOpen] = useState(true);
  const [similar, setSimilar] = useState(null);
  const [buying, setBuying] = useState(false);

  useEffect(() => {
    let live = true;
    listCoupons({ category: coupon.category })
      .then(
        (list) =>
          live &&
          setSimilar(list.filter((c) => c.id !== coupon.id).slice(0, 8)),
      )
      .catch(() => live && setSimilar([]));
    return () => {
      live = false;
    };
  }, [coupon.id, coupon.category]);

  const buy = useCallback(async () => {
    setBuying(true);
    try {
      await buyCoupon(coupon.id);
      showSuccess(
        `You bought ${coupon.name} for ${rupees(coupon.value)}.${coupon.hasCode ? " Your voucher code is under Profile, Bought." : ""}`,
      );
      navigation.goBack();
    } catch (error) {
      showError(error.message);
      setBuying(false);
    }
  }, [coupon, navigation]);

  const goTo = (other) => navigation.replace("CouponDetail", { coupon: other });

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]}>
      <View style={styles.column}>
        <ScrollView contentContainerStyle={styles.body}>
          <View style={[styles.hero, { backgroundColor: tint.bg }]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Back"
              hitSlop={space.sm}
              onPress={() => navigation.goBack()}
              style={[styles.back, { backgroundColor: t.surface }]}
            >
              <Icon name="arrow-back" />
            </Pressable>
            <Tile
              name={coupon.name}
              category={coupon.category}
              size="lg"
              onTint
            />
            <Text
              style={[type.title, { color: t.text }]}
              accessibilityRole="header"
            >
              {coupon.name}
            </Text>
            {coupon.category ? (
              <Text style={[type.label, { color: tint.fg }]}>
                {coupon.category}
              </Text>
            ) : null}
            <Text style={[styles.value, { color: tint.fg }]}>
              {rupees(coupon.value)}
            </Text>
            <View style={styles.tags}>
              <Pill label={expiry.label} tone={expiry.tone} />
              {coupon.hasCode ? <Pill label="Voucher code included" /> : null}
            </View>
          </View>

          <View
            style={[
              styles.section,
              { borderColor: t.border, backgroundColor: t.surface },
            ]}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ expanded: open }}
              onPress={() => setOpen(!open)}
              style={styles.row}
            >
              <Text style={[type.heading, { color: t.text }]}>
                About this coupon
              </Text>
              <Icon name={open ? "chevron-up" : "chevron-down"} tone="muted" />
            </Pressable>
            {open ? (
              <Text style={[type.body, { color: t.muted }]}>
                {coupon.details || "The seller did not add terms."}
              </Text>
            ) : null}
          </View>

          {similar === null ? (
            <View style={styles.skeleton}>
              <Skeleton width="40%" height={18} />
              <View style={{ flexDirection: "row", gap: space.sm + 2 }}>
                <Skeleton width={168} height={140} round={radius.lg} />
                <Skeleton width={168} height={140} round={radius.lg} />
              </View>
            </View>
          ) : (
            <Rail
              title={`More in ${coupon.category}`}
              coupons={similar}
              onPick={goTo}
            />
          )}
        </ScrollView>

        <View
          style={[
            styles.bar,
            { backgroundColor: t.surface, borderTopColor: t.border },
          ]}
        >
          <View>
            <Text style={[type.caption, { color: t.muted }]}>You pay</Text>
            <Text style={[type.title, { color: t.text }]}>
              {rupees(coupon.value)}
            </Text>
          </View>
          <View style={styles.buy}>
            <Button
              label="Buy now"
              loading={buying}
              disabled={expiry.expired || buying}
              onPress={buy}
            />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  column: { flex: 1, width: "100%", maxWidth: MAX_WIDTH, alignSelf: "center" },
  body: { paddingBottom: space.lg },
  hero: {
    alignItems: "center",
    gap: space.sm,
    paddingTop: space.xxl,
    paddingBottom: space.lg,
    paddingHorizontal: space.md,
  },
  back: {
    position: "absolute",
    top: space.md,
    left: space.md,
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  value: { ...type.display },
  tags: {
    flexDirection: "row",
    gap: space.sm,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  section: {
    margin: space.md,
    padding: space.md,
    gap: space.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    minHeight: 32,
  },
  skeleton: { padding: space.md, gap: space.md },
  bar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: space.md,
    padding: space.md,
    borderTopWidth: 1,
  },
  buy: { flex: 1, maxWidth: 220 },
});

export default CouponDetailScreen;
