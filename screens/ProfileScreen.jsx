import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  FlatList,
  Modal,
  TextInput,
  SafeAreaView,
  RefreshControl,
} from "react-native";
import { auth, db } from "../firebase";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
  setDoc,
} from "firebase/firestore";
import { signOut } from "firebase/auth";

const ProfileScreen = ({ navigation }) => {
  const [soldCoupons, setSoldCoupons] = useState([]);
  const [boughtCoupons, setBoughtCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showSoldDetails, setShowSoldDetails] = useState(false);
  const [showBoughtDetails, setShowBoughtDetails] = useState(false);
  const [userDetails, setUserDetails] = useState({
    name: "",
    gender: "",
    age: "",
    phone: "",
    address: "",
    dob: "", // Date of Birth in DD-MM-YYYY
  });
  const [editModalVisible, setEditModalVisible] = useState(false);

  const fetchUserActivity = useCallback(async () => {
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert("Error", "Please log in to view your profile.");
        return;
      }

      // Fetch user details
      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        setUserDetails(userDocSnap.data());
      } else {
        setUserDetails({
          name: "",
          gender: "",
          age: "",
          phone: "",
          address: "",
          dob: "",
        }); // Default if no data exists
      }

      // Fetch sold coupons
      const soldQuery = query(
        collection(db, "coupons"),
        where("userId", "==", user.uid),
        where("type", "==", "sell")
      );
      const soldSnapshot = await getDocs(soldQuery);
      const soldList = [];
      soldSnapshot.forEach((doc) => {
        soldList.push({ id: doc.id, ...doc.data() });
      });
      setSoldCoupons(soldList);

      // Fetch bought coupons
      const boughtQuery = query(
        collection(db, "transactions"),
        where("buyerId", "==", user.uid),
        where("type", "==", "buy")
      );
      const boughtSnapshot = await getDocs(boughtQuery);
      const boughtList = [];
      boughtSnapshot.forEach((doc) => {
        boughtList.push({ id: doc.id, ...doc.data() });
      });
      setBoughtCoupons(boughtList);
    } catch (error) {
      console.error("Error fetching user activity:", error.message);
      Alert.alert("Error", "Failed to load profile data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUserActivity();
  }, [fetchUserActivity]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      Alert.alert("Success", "Logged out successfully");
      navigation.reset({
        index: 0,
        routes: [{ name: "Login" }],
      });
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchUserActivity();
    setRefreshing(false);
  }, [fetchUserActivity]);

  const saveUserDetails = async () => {
    try {
      const user = auth.currentUser;
      const userDocRef = doc(db, "users", user.uid);
      await setDoc(userDocRef, userDetails, { merge: true });
      setEditModalVisible(false);
      Alert.alert("Success", "Profile details saved!");
    } catch (error) {
      console.error("Error saving user details:", error.message);
      Alert.alert(
        "Error",
        "Failed to save profile details. Please try again."
      );
    }
  };

  const renderSoldCoupon = ({ item }) => (
    <View style={styles.couponCard}>
      <Text style={styles.couponName}>{item.name || "Unnamed"}</Text>
      <Text style={styles.couponValue}>₹{item.value || "N/A"}</Text>
      <Text style={styles.couponDetail}>{item.details || "No details"}</Text>
      <Text style={styles.couponDetail}>
        Expires:{" "}
        {item.expiryDate
          ? new Date(item.expiryDate).toLocaleDateString()
          : "N/A"}
      </Text>
    </View>
  );

  const renderBoughtCoupon = ({ item }) => (
    <View style={styles.couponCard}>
      <Text style={styles.couponName}>{item.couponName || "Unnamed"}</Text>
      <Text style={styles.couponValue}>₹{item.couponValue || "N/A"}</Text>
    </View>
  );

  const renderItem = ({ item }) => {
    switch (item.type) {
      case "profile":
        return (
          <View style={styles.profileCard}>
            <Text style={styles.info}>
              Email: {auth.currentUser?.email || "N/A"}
            </Text>
            <Text style={styles.info}>
              Name: {userDetails.name || "Not set"}
            </Text>
            <Text style={styles.info}>
              Gender: {userDetails.gender || "Not set"}
            </Text>
            <Text style={styles.info}>Age: {userDetails.age || "Not set"}</Text>
            <Text style={styles.info}>
              Phone: {userDetails.phone || "Not set"}
            </Text>
            <Text style={styles.info}>
              Address: {userDetails.address || "Not set"}
            </Text>
            <Text style={styles.info}>DOB: {userDetails.dob || "Not set"}</Text>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => setEditModalVisible(true)}
            >
              <Text style={styles.buttonText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>
        );
      case "sold":
        return (
          <View style={styles.section}>
            <View style={styles.summaryRow}>
              <Text style={styles.sectionTitle}>
                Coupons Listed for Sale
              </Text>
              <Text style={styles.countText}>{soldCoupons.length} Listed</Text>
            </View>
            <TouchableOpacity
              style={styles.detailsButton}
              onPress={() => setShowSoldDetails(!showSoldDetails)}
            >
              <Text style={styles.buttonText}>
                {showSoldDetails ? "Hide Details ↑" : "View Details ↓"}
              </Text>
            </TouchableOpacity>
            {showSoldDetails && (
              <FlatList
                data={soldCoupons}
                renderItem={renderSoldCoupon}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                ListEmptyComponent={
                  <Text style={styles.emptyText}>No coupons listed</Text>
                }
              />
            )}
          </View>
        );
      case "bought":
        return (
          <View style={styles.section}>
            <View style={styles.summaryRow}>
              <Text style={styles.sectionTitle}>Coupons Bought</Text>
              <Text style={styles.countText}>
                {boughtCoupons.length} Bought
              </Text>
            </View>
            <TouchableOpacity
              style={styles.detailsButton}
              onPress={() => setShowBoughtDetails(!showBoughtDetails)}
            >
              <Text style={styles.buttonText}>
                {showBoughtDetails ? "Hide Details ↑" : "View Details ↓"}
              </Text>
            </TouchableOpacity>
            {showBoughtDetails && (
              <FlatList
                data={boughtCoupons}
                renderItem={renderBoughtCoupon}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                ListEmptyComponent={
                  <Text style={styles.emptyText}>No coupons bought</Text>
                }
              />
            )}
          </View>
        );
      case "logout":
        return (
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.buttonText}>Logout</Text>
          </TouchableOpacity>
        );
      default:
        return null;
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Loading profile... </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Profile</Text>
      </View>
      <FlatList
        data={[
          { type: "profile" },
          { type: "sold" },
          { type: "bought" },
          { type: "logout" },
        ]}
        renderItem={renderItem}
        keyExtractor={(item, index) => index.toString()}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />

      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your name"
              value={userDetails.name}
              onChangeText={(text) =>
                setUserDetails((prev) => ({ ...prev, name: text }))
              }
              autoCapitalize="words"
            />
            <TextInput
              style={styles.input}
              placeholder="Enter your gender (e.g., Male/Female/Other)"
              value={userDetails.gender}
              onChangeText={(text) =>
                setUserDetails((prev) => ({ ...prev, gender: text }))
              }
            />
            <TextInput
              style={styles.input}
              placeholder="Enter your age"
              value={userDetails.age}
              onChangeText={(text) =>
                setUserDetails((prev) => ({ ...prev, age: text }))
              }
              keyboardType="numeric"
            />
            <TextInput
              style={styles.input}
              placeholder="Enter your phone number"
              value={userDetails.phone}
              onChangeText={(text) =>
                setUserDetails((prev) => ({ ...prev, phone: text }))
              }
              keyboardType="phone-pad"
            />
            <TextInput
              style={styles.input}
              placeholder="Enter your address"
              value={userDetails.address}
              onChangeText={(text) =>
                setUserDetails((prev) => ({ ...prev, address: text }))
              }
              autoCapitalize="sentences"
            />
            <TextInput
              style={styles.input}
              placeholder="Enter DOB (DD-MM-YYYY)"
              value={userDetails.dob}
              onChangeText={(text) =>
                setUserDetails((prev) => ({ ...prev, dob: text }))
              }
              keyboardType="numeric"
              maxLength={10}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={saveUserDetails}
              >
                <Text style={styles.buttonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  content: {
    marginTop: 70,
    padding: 16,
    paddingBottom: 32,
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
  profileCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  info: {
    fontSize: 16,
    color: "#6B7280",
    lineHeight: 24,
    marginBottom: 8,
    fontFamily: "System",
  },
  editButton: {
    backgroundColor: "#4F46E5",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 16,
  },
  section: {
    marginBottom: 24,
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1F2937",
    fontFamily: "System",
  },
  countText: {
    fontSize: 18,
    fontWeight: "500",
    color: "#10B981",
    fontFamily: "System",
  },
  couponCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  couponName: {
    fontSize: 17,
    fontWeight: "600",
    color: "#1F2937",
    fontFamily: "System",
  },
  couponValue: {
    fontSize: 15,
    color: "#10B981",
    marginTop: 4,
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
    marginVertical: 12,
    fontFamily: "System",
  },
  detailsButton: {
    backgroundColor: "#4F46E5",
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  logoutButton: {
    backgroundColor: "#EF4444",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
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
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1F2937",
    textAlign: "center",
    marginBottom: 24,
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
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  cancelButton: {
    backgroundColor: "#EF4444",
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
    flex: 1,
  },
  saveButton: {
    backgroundColor: "#10B981",
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
    flex: 1,
  },
});

export default ProfileScreen;
