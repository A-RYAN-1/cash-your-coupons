import React, { useState, useEffect, useCallback, useMemo } from "react";
import { RefreshControl, SectionList, StyleSheet, Text, View } from "react-native";
import { listCoupons, buyCoupon } from "../api";
import { showError, showSuccess } from "../notify";
import { Button, ChipRow, CouponCard, EmptyState, Field, Loading, Screen, expiryInfo, listPadding, rupees } from "../ui";
import { space, type, useTheme } from "../theme";

const DAY = 24 * 60 * 60 * 1000;

const FILTERS = ["All", "Today", "This week", "This month", "Later"];

// The server sends other people's unexpired listings, soonest expiry first.
const bucket = (expiryDate) => {
  const left = new Date(expiryDate) - new Date();
  if (left <= DAY) return "Today";
  if (left <= 7 * DAY) return "This week";
  if (left <= 30 * DAY) return "This month";
  return "Later";
};

const BuyCouponsScreen = () => {
  const t = useTheme();
  const [coupons, setCoupons] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [buying, setBuying] = useState(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");

  const load = useCallback(async () => {
    try {
      setCoupons(await listCoupons());
    } catch (error) {
      showError(error.message);
      setCoupons((current) => current ?? []);
    }
  }, []);

  useEffect(() => {
    // Load on mount; the loader sets state only after the request returns.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const refresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const buy = async (coupon) => {
    setBuying(coupon.id);
    try {
      await buyCoupon(coupon.id);
      showSuccess(`You bought ${coupon.name} for ${rupees(coupon.value)}.`);
      setCoupons((list) => list.filter((c) => c.id !== coupon.id));
    } catch (error) {
      showError(error.message);
    } finally {
      setBuying(null);
    }
  };

  const sections = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const matching = (coupons ?? []).filter(
      (c) => !needle || c.name.toLowerCase().includes(needle)
    );
    return FILTERS.slice(1)
      .filter((name) => filter === "All" || filter === name)
      .map((title) => ({ title, data: matching.filter((c) => bucket(c.expiryDate) === title) }))
      .filter((section) => section.data.length > 0);
  }, [coupons, query, filter]);

  if (coupons === null) return <Screen title="Buy"><Loading /></Screen>;

  return (
    <Screen title="Buy" subtitle={`${coupons.length} coupons for sale`}>
      <View style={styles.filters}>
        <Field
          label="Search"
          value={query}
          onChangeText={setQuery}
          placeholder="Brand or coupon name"
          returnKeyType="search"
        />
        <ChipRow options={FILTERS} value={filter} onChange={(v) => setFilter(v || "All")} scroll />
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={listPadding}
        stickySectionHeadersEnabled={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
        renderSectionHeader={({ section }) => (
          <Text style={[type.label, styles.section, { color: t.muted }]}>
            {section.title === "Today" ? "Expiring today" : section.title === "Later" ? "More than a month left" : `Expiring ${section.title.toLowerCase()}`}
          </Text>
        )}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <CouponCard
              coupon={item}
              action={
                <Button
                  small
                  label="Buy"
                  loading={buying === item.id}
                  disabled={expiryInfo(item.expiryDate).expired || buying !== null}
                  onPress={() => buy(item)}
                />
              }
            />
          </View>
        )}
        ListEmptyComponent={
          <EmptyState
            title={coupons.length === 0 ? "Nothing for sale yet" : "No coupons match"}
            text={
              coupons.length === 0
                ? "Listings from other people show up here. Pull down to refresh, or list one of your own on the Sell tab."
                : "Try a different name or another expiry window."
            }
          />
        }
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
  filters: { paddingHorizontal: space.md, gap: space.sm, paddingBottom: space.xs },
  section: { textTransform: "uppercase", letterSpacing: 0.5, marginTop: space.md, marginBottom: space.sm },
  item: { marginBottom: space.sm + 2 },
});

export default BuyCouponsScreen;
