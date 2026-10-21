import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { listCoupons } from "../api";
import { showError } from "../notify";
import { Button, ChipRow, CouponCard, EmptyState, Field, Page, Screen } from "../ui";
import { CATEGORIES } from "./SellCouponsScreen";
import { space, type, useTheme } from "../theme";

// A listing matches when it has the category or the price you are looking for.
const ExchangeCouponsScreen = () => {
  const t = useTheme();
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [matches, setMatches] = useState(null);
  const [busy, setBusy] = useState(false);

  const search = async () => {
    if (!category && !price.trim()) {
      showError("Pick a category or enter a price to search for.");
      return;
    }
    setBusy(true);
    try {
      setMatches(await listCoupons({ category, value: price.trim() }));
    } catch (error) {
      showError(error.message);
    } finally {
      setBusy(false);
    }
  };

  const clear = () => {
    setCategory("");
    setPrice("");
    setMatches(null);
  };

  return (
    <Screen title="Exchange" subtitle="Find a coupon of a similar kind or value">
      <Page>
        <View style={styles.group}>
          <Text style={[type.label, { color: t.text }]}>Category</Text>
          <ChipRow options={CATEGORIES} value={category} onChange={setCategory} />
        </View>
        <Field label="Price (INR)" value={price} onChangeText={setPrice} keyboardType="decimal-pad" placeholder="250" />
        <View style={styles.actions}>
          <Button label="Search" onPress={search} loading={busy} style={styles.grow} />
          <Button label="Clear" variant="secondary" onPress={clear} disabled={busy} />
        </View>

        {matches === null ? null : matches.length === 0 ? (
          <EmptyState title="No matches" text="Nobody is selling a coupon in that category or at that price right now." />
        ) : (
          <View style={styles.group}>
            <Text style={[type.label, { color: t.muted }]}>{matches.length} MATCHING</Text>
            {matches.map((coupon) => (
              <CouponCard key={coupon.id} coupon={coupon} />
            ))}
          </View>
        )}
      </Page>
    </Screen>
  );
};

const styles = StyleSheet.create({
  group: { gap: space.sm },
  actions: { flexDirection: "row", gap: space.sm },
  grow: { flex: 1 },
});

export default ExchangeCouponsScreen;
