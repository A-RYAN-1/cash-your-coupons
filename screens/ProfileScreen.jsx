import React, { useState, useEffect, useCallback } from "react";
import { RefreshControl, StyleSheet, Text, View } from "react-native";
import {
  getProfile,
  saveProfile,
  listMyCoupons,
  listPurchases,
  listExchanges,
  withdrawCoupon,
  acceptExchange,
  declineExchange,
  cancelExchange,
  logout,
} from "../api";
import { showError, showSuccess, confirmAction } from "../notify";
import { Button, Card, CouponCard, Dialog, EmptyState, Field, Loading, Page, Pill, Screen, Segmented, rupees } from "../ui";
import { space, type, useTheme } from "../theme";

const DETAILS = [
  ["name", "Name"],
  ["gender", "Gender"],
  ["age", "Age"],
  ["phone", "Phone"],
  ["address", "Address"],
  ["dob", "Date of birth"],
];

const pickDetails = (profile) =>
  Object.fromEntries(DETAILS.map(([key]) => [key, profile[key] ?? ""]));

const STATUS_LABEL = { pending: "Pending", accepted: "Accepted", declined: "Declined", cancelled: "Cancelled" };
const STATUS_TONE = { pending: "warn", declined: "bad", cancelled: "bad" };

// One exchange offer, worded from the viewer's side, with the actions that side may take.
const OfferCard = ({ offer, onAnswer }) => {
  const t = useTheme();
  const sent = offer.role === "offered";
  const give = sent ? offer.offered : offer.requested;
  const get = sent ? offer.requested : offer.offered;
  return (
    <Card>
      <Text style={[type.caption, { color: t.muted }]}>{sent ? "YOU OFFERED" : "OFFER FOR YOUR COUPON"}</Text>
      <View style={styles.cardHead}>
        <Text style={[type.heading, styles.rowValue, { color: t.text, textAlign: "left" }]}>{give.name}</Text>
        <Text style={[type.heading, { color: t.accent }]}>{rupees(give.value)}</Text>
      </View>
      <Text style={[type.caption, { color: t.muted }]}>in exchange for</Text>
      <View style={styles.cardHead}>
        <Text style={[type.heading, styles.rowValue, { color: t.text, textAlign: "left" }]}>{get.name}</Text>
        <Text style={[type.heading, { color: t.accent }]}>{rupees(get.value)}</Text>
      </View>
      <View style={styles.cardHead}>
        <Pill label={STATUS_LABEL[offer.status]} tone={STATUS_TONE[offer.status]} />
        {offer.status === "pending" ? (
          <View style={styles.offerActions}>
            {sent ? (
              <Button small variant="secondary" label="Cancel offer" onPress={() => onAnswer(cancelExchange, offer, "Offer cancelled.")} />
            ) : (
              <>
                <Button small variant="secondary" label="Decline" onPress={() => onAnswer(declineExchange, offer, "Offer declined.")} />
                <Button
                  small
                  label="Accept"
                  onPress={() =>
                    onAnswer(acceptExchange, offer, `Exchanged. ${offer.offered.name} is yours.`, {
                      title: "Accept this exchange",
                      message: `Give up "${offer.requested.name}" and take "${offer.offered.name}"? This cannot be undone.`,
                      confirm: "Accept",
                    })
                  }
                />
              </>
            )}
          </View>
        ) : null}
      </View>
    </Card>
  );
};

const ProfileScreen = () => {
  const t = useTheme();
  const [email, setEmail] = useState("");
  const [details, setDetails] = useState(null);
  const [selling, setSelling] = useState([]);
  const [bought, setBought] = useState([]);
  const [offers, setOffers] = useState([]);
  const [tab, setTab] = useState("selling");
  const [refreshing, setRefreshing] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const [profile, sold, purchases, exchanges] = await Promise.all([
        getProfile(),
        listMyCoupons(),
        listPurchases(),
        listExchanges(),
      ]);
      setEmail(profile.email);
      setDetails(pickDetails(profile));
      setSelling(sold);
      setBought(purchases);
      setOffers(exchanges);
    } catch (error) {
      showError(error.message);
      setDetails((current) => current ?? pickDetails({}));
    }
  }, []);

  useEffect(() => {
    // Load on mount; the loader sets state only after the requests return.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const refresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const save = async () => {
    setSaving(true);
    try {
      setDetails(pickDetails(await saveProfile(editing)));
      setEditing(null);
      showSuccess("Profile saved.");
    } catch (error) {
      showError(error.message);
    } finally {
      setSaving(false);
    }
  };

  const withdraw = async (coupon) => {
    const confirmed = await confirmAction(
      "Withdraw listing",
      `Remove "${coupon.name}" from sale? Buyers will no longer see it.`,
      "Withdraw"
    );
    if (!confirmed) return;
    try {
      await withdrawCoupon(coupon.id);
      setSelling((list) => list.filter((c) => c.id !== coupon.id));
      showSuccess(`${coupon.name} is no longer listed.`);
    } catch (error) {
      showError(error.message);
    }
  };

  // Accept, decline or cancel. An answer can change coupons too, so reload everything, also on a
  // failure (the other side may have answered first).
  const answer = async (call, offer, done, ask) => {
    if (ask && !(await confirmAction(ask.title, ask.message, ask.confirm))) return;
    try {
      await call(offer.id);
      showSuccess(done);
    } catch (error) {
      showError(error.message);
    }
    await load();
  };

  const pending = offers.filter((offer) => offer.status === "pending").length;

  if (details === null) return <Screen title="Profile"><Loading /></Screen>;

  return (
    <Screen title="Profile" subtitle={email}>
      <Page refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}>
        <Card>
          <View style={styles.cardHead}>
            <Text style={[type.heading, { color: t.text }]}>Your details</Text>
            <Button small variant="secondary" label="Edit" onPress={() => setEditing(details)} />
          </View>
          {DETAILS.map(([key, label]) => (
            <View key={key} style={[styles.row, { borderTopColor: t.border }]}>
              <Text style={[type.caption, { color: t.muted }]}>{label}</Text>
              <Text style={[type.body, styles.rowValue, { color: details[key] ? t.text : t.muted }]}>
                {details[key] || "Not set"}
              </Text>
            </View>
          ))}
        </Card>

        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { value: "selling", label: `Selling (${selling.length})` },
            { value: "bought", label: `Bought (${bought.length})` },
            { value: "offers", label: pending > 0 ? `Offers (${pending})` : "Offers" },
          ]}
        />

        {tab === "selling" ? (
          selling.length === 0 ? (
            <EmptyState title="Nothing listed" text="Coupons you list on the Sell tab appear here until someone buys them." />
          ) : (
            selling.map((coupon) => (
              <CouponCard
                key={coupon.id}
                coupon={coupon}
                action={<Button small variant="danger" label="Withdraw" onPress={() => withdraw(coupon)} />}
              />
            ))
          )
        ) : tab === "offers" ? (
          offers.length === 0 ? (
            <EmptyState title="No offers" text="Offer a swap from the Exchange tab. Offers you send and receive appear here." />
          ) : (
            offers.map((offer) => <OfferCard key={offer.id} offer={offer} onAnswer={answer} />)
          )
        ) : bought.length === 0 ? (
          <EmptyState title="No purchases yet" text="Coupons you buy appear here." />
        ) : (
          bought.map((purchase) => (
            <Card key={purchase.id}>
              <View style={styles.cardHead}>
                <Text style={[type.heading, { color: t.text }]}>{purchase.couponName}</Text>
                <Text style={[type.heading, { color: t.accent }]}>{rupees(purchase.couponValue)}</Text>
              </View>
            </Card>
          ))
        )}

        <Button label="Sign out" variant="secondary" onPress={logout} />
      </Page>

      <Dialog
        visible={editing !== null}
        title="Edit details"
        onClose={() => setEditing(null)}
        actions={
          <>
            <Button label="Cancel" variant="secondary" onPress={() => setEditing(null)} disabled={saving} />
            <Button label="Save" onPress={save} loading={saving} />
          </>
        }
      >
        <View style={styles.form}>
          {editing &&
            DETAILS.map(([key, label]) => (
              <Field
                key={key}
                label={label}
                value={editing[key]}
                onChangeText={(text) => setEditing((current) => ({ ...current, [key]: text }))}
                keyboardType={key === "age" ? "number-pad" : key === "phone" ? "phone-pad" : "default"}
                placeholder={key === "dob" ? "DD-MM-YYYY" : undefined}
                maxLength={key === "dob" ? 10 : undefined}
              />
            ))}
        </View>
      </Dialog>
    </Screen>
  );
};

const styles = StyleSheet.create({
  cardHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: space.md },
  row: { flexDirection: "row", justifyContent: "space-between", gap: space.md, paddingTop: space.sm, borderTopWidth: StyleSheet.hairlineWidth },
  rowValue: { flexShrink: 1, textAlign: "right" },
  form: { gap: space.sm + 4 },
  offerActions: { flexDirection: "row", gap: space.sm },
});

export default ProfileScreen;
