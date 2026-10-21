import React, { useState, useEffect, useCallback } from "react";
import { RefreshControl, StyleSheet, Text, View } from "react-native";
import { getProfile, saveProfile, listMyCoupons, listPurchases, withdrawCoupon, logout } from "../api";
import { showError, showSuccess, confirmAction } from "../notify";
import { Button, Card, CouponCard, Dialog, EmptyState, Field, Loading, Page, Screen, Segmented, rupees } from "../ui";
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

const ProfileScreen = () => {
  const t = useTheme();
  const [email, setEmail] = useState("");
  const [details, setDetails] = useState(null);
  const [selling, setSelling] = useState([]);
  const [bought, setBought] = useState([]);
  const [tab, setTab] = useState("selling");
  const [refreshing, setRefreshing] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const [profile, sold, purchases] = await Promise.all([getProfile(), listMyCoupons(), listPurchases()]);
      setEmail(profile.email);
      setDetails(pickDetails(profile));
      setSelling(sold);
      setBought(purchases);
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
});

export default ProfileScreen;
