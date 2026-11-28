import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  RefreshControl,
  SafeAreaView,
  SectionList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { listCoupons, buyCoupon } from "../api";
import { showError, showSuccess } from "../notify";
import {
  Button,
  CategoryTiles,
  ChipRow,
  CouponCard,
  Dialog,
  EmptyState,
  ErrorState,
  HomeBar,
  HomeSkeleton,
  Rail,
  expiryInfo,
  listPadding,
  rupees,
} from "../ui";
import { MAX_WIDTH, space, type, useTheme } from "../theme";
import { CATEGORIES } from "./SellCouponsScreen";

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
  const [category, setCategory] = useState("");
  const [failed, setFailed] = useState(false);
  const [confirming, setConfirming] = useState(null);

  const load = useCallback(async () => {
    try {
      setCoupons(await listCoupons());
      setFailed(false);
    } catch (error) {
      showError(error.message);
      setFailed(true);
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
      showSuccess(
        `You bought ${coupon.name} for ${rupees(coupon.value)}.${coupon.hasCode ? " Your voucher code is under Profile, Bought." : ""}`,
      );
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
      (c) =>
        (!needle || c.name.toLowerCase().includes(needle)) &&
        (!category || c.category === category),
    );
    return FILTERS.slice(1)
      .filter((name) => filter === "All" || filter === name)
      .map((title) => ({
        title,
        data: matching.filter((c) => bucket(c.expiryDate) === title),
      }))
      .filter((section) => section.data.length > 0);
  }, [coupons, query, filter, category]);

  const browsing = !query.trim() && !category && filter === "All";
  const rails = useMemo(() => {
    const list = coupons ?? [];
    const soon = list.filter(
      (c) => new Date(c.expiryDate) - new Date() <= 7 * DAY,
    );
    const biggest = [...list].sort((a, b) => b.value - a.value).slice(0, 8);
    const newest = [...list]
      .sort((a, b) => new Date(b.createdAt ?? 0) - new Date(a.createdAt ?? 0))
      .slice(0, 8);
    const same = (a, b) =>
      a.length === b.length && a.every((c, i) => c.id === b[i].id);
    // A rail that repeats the one above it adds nothing: drop it (a short list sorts the same way twice).
    return {
      soon: soon.slice(0, 8),
      biggest,
      newest: same(newest, biggest) ? [] : newest,
    };
  }, [coupons]);

  const confirmBuy = async () => {
    const coupon = confirming;
    setConfirming(null);
    await buy(coupon);
  };

  const count = sections.reduce((n, x) => n + x.data.length, 0);

  const header = (
    <View>
      <HomeBar query={query} onQuery={setQuery} />
      <CategoryTiles
        categories={CATEGORIES}
        value={category}
        onChange={setCategory}
      />
      {browsing && coupons && coupons.length > 0 ? (
        <>
          <Rail
            title="Expiring soon"
            subtitle="Seven days or less left"
            coupons={rails.soon}
            onPick={setConfirming}
          />
          <Rail
            title="Biggest value"
            subtitle="Highest face value first"
            coupons={rails.biggest}
            onPick={setConfirming}
          />
          <Rail
            title="Just listed"
            coupons={rails.newest}
            onPick={setConfirming}
          />
        </>
      ) : null}
      <View style={styles.filters}>
        <Text style={[type.heading, { color: t.text, marginTop: space.md }]}>
          {browsing
            ? "All coupons"
            : `${count} ${count === 1 ? "result" : "results"}`}
        </Text>
        <ChipRow
          options={FILTERS}
          value={filter}
          onChange={(v) => setFilter(v || "All")}
          scroll
        />
      </View>
    </View>
  );

  if (coupons === null) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.column}>
          <HomeBar query="" onQuery={() => {}} />
          <HomeSkeleton />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]}>
      <View style={styles.column}>
        <SectionList
          sections={sections}
          ListHeaderComponent={header}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ paddingBottom: listPadding.paddingBottom }}
          stickySectionHeadersEnabled={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refresh} />
          }
          renderSectionHeader={({ section }) => (
            <Text
              style={[
                type.label,
                styles.section,
                styles.pad,
                { color: t.muted },
              ]}
            >
              {section.title === "Today"
                ? "Expiring today"
                : section.title === "Later"
                  ? "More than a month left"
                  : `Expiring ${section.title.toLowerCase()}`}
            </Text>
          )}
          renderItem={({ item }) => (
            <View style={[styles.item, styles.pad]}>
              <CouponCard
                coupon={item}
                action={
                  <Button
                    small
                    label="Buy"
                    loading={buying === item.id}
                    disabled={
                      expiryInfo(item.expiryDate).expired || buying !== null
                    }
                    onPress={() => buy(item)}
                  />
                }
              />
            </View>
          )}
          ListEmptyComponent={
            failed ? (
              <ErrorState
                title="Could not load coupons"
                text="Check your connection and try again."
                onRetry={load}
              />
            ) : (
              <EmptyState
                title={
                  coupons.length === 0
                    ? "Nothing for sale yet"
                    : "No coupons match"
                }
                text={
                  coupons.length === 0
                    ? "Listings from other people show up here. Pull down to refresh, or list one of your own on the Sell tab."
                    : "Try a different name or another expiry window."
                }
              />
            )
          }
        />
        <Dialog
          visible={confirming !== null}
          title={confirming ? `Buy ${confirming.name}?` : ""}
          message={
            confirming
              ? `You pay ${rupees(confirming.value)}. ${expiryInfo(confirming.expiryDate).label}.`
              : ""
          }
          onClose={() => setConfirming(null)}
          actions={
            <>
              <Button
                small
                variant="secondary"
                label="Cancel"
                onPress={() => setConfirming(null)}
              />
              <Button small label="Buy" onPress={confirmBuy} />
            </>
          }
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  column: { flex: 1, width: "100%", maxWidth: MAX_WIDTH, alignSelf: "center" },
  pad: { marginHorizontal: space.md },
  filters: {
    paddingHorizontal: space.md,
    gap: space.sm,
    paddingBottom: space.xs,
  },
  section: {
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: space.md,
    marginBottom: space.sm,
  },
  item: { marginBottom: space.sm + 2 },
});

export default BuyCouponsScreen;
