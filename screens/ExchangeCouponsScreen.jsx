import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
} from "react-native";
import { collection, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "../firebase";
import { notify } from "../notify";

const ExchangeCouponsScreen = () => {
  const [couponName, setCouponName] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [matchingCoupons, setMatchingCoupons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleSearch = async () => {
    if (!couponName.trim() || !category.trim() || !price.trim()) {
      notify("Error", "Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        notify("Error", "Please log in to search coupons.");
        return;
      }

      const couponsRef = collection(db, "coupons");
      const q = query(couponsRef, where("userId", "!=", user.uid));
      const snapshot = await getDocs(q);

      const matchedCoupons = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter(
          (coupon) =>
            coupon.category === category ||
            parseFloat(coupon.value) === parseFloat(price)
        );

      setMatchingCoupons(matchedCoupons);
    } catch (error) {
      console.error("Error fetching coupons:", error.message);
      notify("Error", "Failed to search coupons. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setCouponName("");
    setCategory("");
    setPrice("");
    setMatchingCoupons([]);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await handleSearch();
    setRefreshing(false);
  }, [couponName, category, price]);

  const renderCouponItem = ({ item }) => (
    <View style={styles.couponCard}>
      <Text style={styles.couponName}>{item.name || "Unnamed"}</Text>
      <Text style={styles.couponDetail}>
        Category: {item.category || "N/A"}
      </Text>
      <Text style={styles.couponDetail}>Price: ₹{item.value || "N/A"}</Text>
      {item.expiryDate && (
        <Text style={styles.couponDetail}>
          Expires: {new Date(item.expiryDate).toLocaleDateString()}
        </Text>
      )}
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Searching coupons... </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Exchange Coupons</Text>
      </View>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
      >
        <View style={styles.content}>
          <View style={styles.formCard}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Your Coupon Name</Text>
              <TextInput
                style={styles.input}
                value={couponName}
                onChangeText={setCouponName}
                placeholder="e.g., Amazon ₹100"
                placeholderTextColor="#aaa"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Coupon Category</Text>
              <TextInput
                style={styles.input}
                value={category}
                onChangeText={setCategory}
                placeholder="e.g., Shopping, Food, Travel"
                placeholderTextColor="#aaa"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Coupon Price</Text>
              <TextInput
                style={styles.input}
                value={price}
                onChangeText={setPrice}
                keyboardType="numeric"
                placeholder="e.g., 100"
                placeholderTextColor="#aaa"
              />
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.clearButton}
                onPress={handleClear}
              >
                <Text style={styles.buttonText}>Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.addButton}
                onPress={handleSearch}
                disabled={loading}
              >
                <Text style={styles.buttonText}>Search Coupons</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.subHeading}>Matching Coupons</Text>
          <FlatList
            data={matchingCoupons}
            renderItem={renderCouponItem}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No matching coupons found</Text>
            }
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  container: {
    flex: 1,
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
    flex: 1,
    marginTop: 70,
    padding: 16,
  },
  formCard: {
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
  inputGroup: {
    marginBottom: 12,
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
    fontFamily: "System",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    gap: 12,
  },
  clearButton: {
    backgroundColor: "#EF4444",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    flex: 1,
  },
  addButton: {
    backgroundColor: "#4F46E5",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    flex: 1,
    opacity: 1, // Removed hardcoded opacity
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "System",
  },
  subHeading: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 12,
    fontFamily: "System",
  },
  couponCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  couponName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 6,
    fontFamily: "System",
  },
  couponDetail: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 4,
    fontFamily: "System",
  },
  emptyText: {
    textAlign: "center",
    fontSize: 16,
    color: "#6B7280",
    marginTop: 24,
    fontFamily: "System",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#6B7280",
    fontFamily: "System",
  },
  listContent: {
    paddingBottom: 24,
  },
});

export default ExchangeCouponsScreen;
