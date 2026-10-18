import React, { useState, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { restoreSession, onSessionChange } from "./api";
import BuyCouponsScreen from "./screens/BuyCouponsScreen";
import SellCouponsScreen from "./screens/SellCouponsScreen";
import ExchangeCouponsScreen from "./screens/ExchangeCouponsScreen";
import ProfileScreen from "./screens/ProfileScreen";
import LoginScreen from "./screens/LoginScreen";
import { View, Text, StyleSheet } from "react-native";

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const MainTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName;
        if (route.name === "Buy") iconName = focused ? "cart" : "cart-outline";
        else if (route.name === "Sell")
          iconName = focused ? "pricetag" : "pricetag-outline";
        else if (route.name === "Exchange")
          iconName = focused ? "swap-horizontal" : "swap-horizontal-outline";
        else if (route.name === "Profile")
          iconName = focused ? "person" : "person-outline";
        return <Ionicons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: "#4F46E5",
      tabBarInactiveTintColor: "#6B7280",
      tabBarStyle: styles.tabBar,
      tabBarLabelStyle: styles.tabBarLabel,
      headerShown: false,
    })}
  >
    <Tab.Screen name="Buy" component={BuyCouponsScreen} />
    <Tab.Screen name="Sell" component={SellCouponsScreen} />
    <Tab.Screen name="Exchange" component={ExchangeCouponsScreen} />
    <Tab.Screen name="Profile" component={ProfileScreen} />
  </Tab.Navigator>
);

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSessionChange(setIsAuthenticated);
    restoreSession().finally(() => setIsLoading(false));
    return unsubscribe;
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          keyboardHandlingEnabled: true,
          cardStyleInterpolator: ({ current, layouts }) => ({
            cardStyle: {
              transform: [
                {
                  translateX: current.progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [layouts.screen.width, 0],
                  }),
                },
              ],
            },
          }),
        }}
      >
        {isAuthenticated ? (
          <Stack.Screen name="Main" component={MainTabs} />
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
  },
  loadingText: {
    fontSize: 18,
    color: "#6B7280",
    fontFamily: "System",
  },
  tabBar: {
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingBottom: 8,
    paddingTop: 8,
    height: 60,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tabBarLabel: {
    fontSize: 12,
    fontWeight: "600",
    fontFamily: "System",
    marginBottom: 4,
  },
});

export default App;
