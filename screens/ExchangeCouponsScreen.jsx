import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { listCoupons, listMyCoupons, offerExchange } from "../api";
import { showError, showSuccess } from "../notify";
import { Button, ChipRow, CouponCard, Dialog, EmptyState, Field, Page, Screen, rupees } from "../ui";
import { CATEGORIES } from "./SellCouponsScreen";
import { space, type, useTheme } from "../theme";

// A listing matches when it has the category or the price you are looking for. From a match you
// offer one of your own listed coupons in exchange; the owner answers under Profile, Offers.
const ExchangeCouponsScreen = () => {
  const t = useTheme();
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [matches, setMatches] = useState(null);
  const [busy, setBusy] = useState(false);
  const [target, setTarget] = useState(null);
  const [mine, setMine] = useState(null);
  const [offering, setOffering] = useState(false);

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

  const startOffer = async (coupon) => {
    setTarget(coupon);
    setMine(null);
    try {
      setMine(await listMyCoupons());
    } catch (error) {
      setTarget(null);
      showError(error.message);
    }
  };

  const closeOffer = () => {
    if (!offering) setTarget(null);
  };

  const sendOffer = async (own) => {
    setOffering(true);
    try {
      await offerExchange(own.id, target.id);
      showSuccess(`Offered ${own.name} for ${target.name}. The answer appears under Profile, Offers.`);
      setTarget(null);
    } catch (error) {
      showError(error.message);
    } finally {
      setOffering(false);
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
              <CouponCard
                key={coupon.id}
                coupon={coupon}
                action={<Button small label="Offer a swap" onPress={() => startOffer(coupon)} />}
              />
            ))}
          </View>
        )}
      </Page>

      <Dialog
        visible={target !== null}
        title="Offer a swap"
        message={target ? `Pick one of your coupons to offer for ${target.name} (${rupees(target.value)}).` : undefined}
        onClose={closeOffer}
        actions={<Button label="Cancel" variant="secondary" onPress={closeOffer} disabled={offering} />}
      >
        {mine === null ? null : mine.length === 0 ? (
          <EmptyState title="Nothing to offer" text="List a coupon on the Sell tab first, then come back to offer it." />
        ) : (
          <View style={styles.group}>
            {mine.map((own) => (
              <Button
                key={own.id}
                variant="secondary"
                label={`${own.name}  ${rupees(own.value)}`}
                onPress={() => sendOffer(own)}
                disabled={offering}
              />
            ))}
          </View>
        )}
      </Dialog>
    </Screen>
  );
};

const styles = StyleSheet.create({
  group: { gap: space.sm },
  actions: { flexDirection: "row", gap: space.sm },
  grow: { flex: 1 },
});

export default ExchangeCouponsScreen;
