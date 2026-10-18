import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { createCoupon } from "../api";
import { notify } from "../notify";
import { Picker } from "@react-native-picker/picker";

const SellCouponsScreen = () => {
  const [couponName, setCouponName] = useState("");
  const [couponValue, setCouponValue] = useState("");
  const [couponDetails, setCouponDetails] = useState("");
  const [category, setCategory] = useState("");
  const [expiryDate, setExpiryDate] = useState(""); // Changed to string for DD-MM-YYYY input

  const couponNameRef = useRef(null);
  const couponValueRef = useRef(null);
  const couponDetailsRef = useRef(null);

  const categories = [
    "Food",
    "Clothes",
    "Travel",
    "Electronics",
    "Online Gaming",
    "Beauty",
    "Health & Wellness",
    "Others",
  ];

  const parseDate = (dateStr) => {
    const [day, month, year] = dateStr.split("-").map(Number);
    if (
      !day ||
      !month ||
      !year ||
      day < 1 ||
      day > 31 ||
      month < 1 ||
      month > 12 ||
      year < 2025 ||
      year > 2100
    ) {
      return null;
    }
    const date = new Date(year, month - 1, day, 23, 59, 59); // Set to 23:59:59
    return date > new Date() ? date : null; // Ensure future date
  };

  const handleAddCoupon = async () => {
    if (
      !couponName ||
      !couponValue ||
      !couponDetails ||
      !category ||
      !expiryDate
    ) {
      notify("Incomplete", "Please fill in all fields");
      return;
    }

    const parsedDate = parseDate(expiryDate);
    if (!parsedDate) {
      notify(
        "Invalid Date",
        "Please enter a valid future date in DD-MM-YYYY format (e.g., 11-04-2025)"
      );
      return;
    }

    try {
      await createCoupon({
        name: couponName,
        value: parseFloat(couponValue),
        details: couponDetails,
        expiryDate: parsedDate.toISOString(),
        category,
      });
      setCouponName("");
      setCouponValue("");
      setCouponDetails("");
      setCategory("");
      setExpiryDate("");
      notify("Success", "Coupon listed for sale!");
      if (couponNameRef.current) couponNameRef.current.focus();
    } catch (error) {
      notify("Error", error.message || "Failed to add coupon. Try again.");
    }
  };

  const renderForm = () => (
    <KeyboardAvoidingView
      style={styles.formContainer}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
    >
      <Text style={styles.label}>Title</Text>
      <TextInput
        ref={couponNameRef}
        style={styles.input}
        placeholder="Enter the name of the brand"
        value={couponName}
        onChangeText={setCouponName}
        returnKeyType="next"
        onSubmitEditing={() => couponValueRef.current?.focus()}
        blurOnSubmit={false}
        autoFocus={true}
      />

      <Text style={styles.label}>Category</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={category}
          onValueChange={setCategory}
          style={styles.picker}
        >
          <Picker.Item label="Select a category" value="" enabled={false} />
          {categories.map((cat, index) => (
            <Picker.Item key={index} label={cat} value={cat} />
          ))}
        </Picker>
      </View>

      <Text style={styles.label}>Price (₹)</Text>
      <TextInput
        ref={couponValueRef}
        style={styles.input}
        placeholder="Enter price at which you want to sell"
        value={couponValue}
        onChangeText={setCouponValue}
        keyboardType="numeric"
        returnKeyType="next"
        onSubmitEditing={() => couponDetailsRef.current?.focus()}
        blurOnSubmit={false}
      />

      <Text style={styles.label}>Expiry Date</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter expiry date (DD-MM-YYYY)"
        value={expiryDate}
        onChangeText={setExpiryDate}
        keyboardType="numeric"
        maxLength={10} // DD-MM-YYYY format
        returnKeyType="next"
        onSubmitEditing={() => couponDetailsRef.current?.focus()}
        blurOnSubmit={false}
      />

      <Text style={styles.label}>Description</Text>
      <TextInput
        ref={couponDetailsRef}
        style={[styles.input, styles.multilineInput]}
        placeholder="Enter coupon details like percentage off, terms, etc."
        value={couponDetails}
        onChangeText={setCouponDetails}
        multiline
        numberOfLines={4}
        returnKeyType="done"
        onSubmitEditing={handleAddCoupon}
        blurOnSubmit={false}
      />

      <TouchableOpacity style={styles.submitButton} onPress={handleAddCoupon}>
        <Text style={styles.buttonText}>Submit</Text>
      </TouchableOpacity>

      <View style={styles.divider} />
    </KeyboardAvoidingView>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Sell Coupons</Text>
      </View>
      <View style={styles.content}>{renderForm()}</View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    padding: 16,
    backgroundColor: "#4F46E5",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
    zIndex: 10,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
  headerText: {
    fontSize: 26,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
    fontFamily: "System",
  },
  content: {
    marginTop: 70,
    padding: 16,
    flex: 1,
  },
  formContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 8,
    fontFamily: "System",
  },
  input: {
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    fontSize: 16,
    color: "#1F2937",
    marginBottom: 16,
    fontFamily: "System",
  },
  multilineInput: {
    height: 120,
    textAlignVertical: "top",
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
  },
  picker: {
    height: 48,
    fontFamily: "System",
  },
  submitButton: {
    backgroundColor: "#10B981",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 16,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "System",
  },
  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 24,
  },
});

export default SellCouponsScreen;
