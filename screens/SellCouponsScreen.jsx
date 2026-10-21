import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from "react-native";
import { createCoupon } from "../api";
import { showError, showSuccess } from "../notify";
import { Button, ChipRow, Field, Page, Screen } from "../ui";
import { space, type, useTheme } from "../theme";

export const CATEGORIES = [
  "Food",
  "Clothes",
  "Travel",
  "Electronics",
  "Online Gaming",
  "Beauty",
  "Health & Wellness",
  "Others",
];

const pad = (n) => String(n).padStart(2, "0");
const formatDate = (date) => `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()}`;

// "In 1 week" style shortcuts for the common expiry windows.
const SHORTCUTS = [
  { label: "1 week", days: 7 },
  { label: "1 month", days: 30 },
  { label: "3 months", days: 90 },
];

const parseDate = (text) => {
  const [day, month, year] = text.split("-").map(Number);
  if (!day || !month || !year || month > 12 || day > 31 || year < 2025 || year > 2100) return null;
  const date = new Date(year, month - 1, day, 23, 59, 59);
  if (date.getMonth() !== month - 1) return null;
  return date > new Date() ? date : null;
};

const SellCouponsScreen = () => {
  const t = useTheme();
  const [name, setName] = useState("");
  const [value, setValue] = useState("");
  const [details, setDetails] = useState("");
  const [category, setCategory] = useState("");
  const [expiry, setExpiry] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!name.trim() || !value || !details.trim() || !category || !expiry) {
      showError("Fill in every field before listing the coupon.");
      return;
    }
    const price = parseFloat(value);
    if (!(price > 0)) {
      showError("Enter a price above zero.");
      return;
    }
    const date = parseDate(expiry);
    if (!date) {
      showError("Enter a future expiry date as DD-MM-YYYY, for example 11-04-2027.");
      return;
    }
    setBusy(true);
    try {
      await createCoupon({
        name: name.trim(),
        value: price,
        details: details.trim(),
        expiryDate: date.toISOString(),
        category,
      });
      setName("");
      setValue("");
      setDetails("");
      setCategory("");
      setExpiry("");
      showSuccess("Your coupon is listed. Find it under Profile, Selling.");
    } catch (error) {
      showError(error.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen title="Sell" subtitle="List a coupon you will not use">
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <Page>
          <Field label="Brand or coupon name" value={name} onChangeText={setName} placeholder="Swiggy, Myntra, Amazon" maxLength={80} />

          <View style={styles.group}>
            <Text style={[type.label, { color: t.text }]}>Category</Text>
            <ChipRow options={CATEGORIES} value={category} onChange={setCategory} />
          </View>

          <Field label="Price (INR)" value={value} onChangeText={setValue} keyboardType="decimal-pad" placeholder="250" />

          <View style={styles.group}>
            <Field
              label="Expiry date"
              value={expiry}
              onChangeText={setExpiry}
              placeholder="DD-MM-YYYY"
              keyboardType="numbers-and-punctuation"
              maxLength={10}
            />
            <ChipRow
              options={SHORTCUTS.map((s) => s.label)}
              value=""
              onChange={(label) => {
                const days = SHORTCUTS.find((s) => s.label === label).days;
                setExpiry(formatDate(new Date(Date.now() + days * 24 * 60 * 60 * 1000)));
              }}
            />
          </View>

          <Field
            label="Details"
            value={details}
            onChangeText={setDetails}
            multiline
            placeholder="What it gives, minimum order, terms"
            maxLength={500}
          />

          <Button label="List coupon" onPress={submit} loading={busy} />
        </Page>
      </KeyboardAvoidingView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  group: { gap: space.sm },
});

export default SellCouponsScreen;
