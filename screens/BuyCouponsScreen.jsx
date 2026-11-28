import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  RefreshControl,
  SafeAreaView,
  SectionList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { listCoupons, buyCoupon } from "../api";
import { showError, showSuccess } from "../notify";
import {
  Button,
  CategoryTiles,
  FilterBar,
  FilterSheet,
  CouponCard,
  Banners,
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
const SORTS = ["Soonest expiry", "Highest value", "Lowest value", "Newest"];

const sectionLabel = (title) => {
  if (SORTS.includes(title)) return `Sorted by ${title.toLowerCase()}`;
  if (title === "Today") return "Expiring today";
  if (title === "Later") return "More than a month left";
  return `Expiring ${title.toLowerCase()}`;
};

const SORTERS = {
  "Soonest expiry": (a, b) => new Date(a.expiryDate) - new Date(b.expiryDate),
  "Highest value": (a, b) => b.value - a.value,
  "Lowest value": (a, b) => a.value - b.value,
  Newest: (a, b) => new Date(b.createdAt ?? 0) - new Date(a.createdAt ?? 0),
};

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
  const navigation = useNavigation();
  const [coupons, setCoupons] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [buying, setBuying] = useState(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const [sort, setSort] = useState(SORTS[0]);
  const [sheet, setSheet] = useState(false);
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

  const matchFor = useCallback(
    (window) => {
      const needle = query.trim().toLowerCase();
      return (coupons ?? []).filter(
        (c) =>
          (!needle || c.name.toLowerCase().includes(needle)) &&
          (!category || c.category === category) &&
          (window === "All" || bucket(c.expiryDate) === window),
      );
    },
    [coupons, query, category],
  );

  const sections = useMemo(() => {
    const matching = matchFor(filter);
    if (sort !== SORTS[0]) {
      return matching.length > 0
        ? [{ title: sort, data: [...matching].sort(SORTERS[sort]) }]
        : [];
    }
    return FILTERS.slice(1)
      .map((title) => ({
        title,
        data: matching.filter((c) => bucket(c.expiryDate) === title),
      }))
      .filter((section) => section.data.length > 0);
  }, [matchFor, filter, sort]);

  const browsing =
    !query.trim() && !category && filter === "All" && sort === SORTS[0];
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
      {browsing ? (
        <Banners
          items={[
            {
              title: "Unused coupon?",
              text: "List it in a minute and let someone use it.",
              cta: "Sell now",
              onPress: () => navigation.navigate("Sell"),
            },
            {
              title: "Swap, do not waste",
              text: "Trade a coupon for one you will use.",
              cta: "Find a swap",
              onPress: () => navigation.navigate("Exchange"),
            },
            {
              title: "Expiring this week",
              text: "Grab these before they are gone.",
              cta: "See filters",
              onPress: () => setSheet(true),
            },
          ]}
        />
      ) : null}
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
        <FilterBar
          title={
            browsing
              ? "All coupons"
              : `${count} ${count === 1 ? "result" : "results"}`
          }
          active={(filter !== "All" ? 1 : 0) + (sort !== SORTS[0] ? 1 : 0)}
          onOpen={() => setSheet(true)}
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
              {sectionLabel(section.title)}
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
        <FilterSheet
          visible={sheet}
          onClose={() => setSheet(false)}
          windows={FILTERS}
          sorts={SORTS}
          value={{ window: filter, sort }}
          onApply={(v) => {
            setFilter(v.window);
            setSort(v.sort);
          }}
          countFor={(v) => matchFor(v.window).length}
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
