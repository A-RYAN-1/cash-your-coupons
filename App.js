import React, { useState, useEffect } from "react";
import { NavigationContainer, DefaultTheme, DarkTheme } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { restoreSession, onSessionChange } from "./api";
import BuyCouponsScreen from "./screens/BuyCouponsScreen";
import SellCouponsScreen from "./screens/SellCouponsScreen";
import ExchangeCouponsScreen from "./screens/ExchangeCouponsScreen";
import ProfileScreen from "./screens/ProfileScreen";
import LoginScreen from "./screens/LoginScreen";
import { Loading, ToastHost } from "./ui";
import { useTheme } from "./theme";

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const icons = {
  Buy: ["cart", "cart-outline"],
  Sell: ["pricetag", "pricetag-outline"],
  Exchange: ["swap-horizontal", "swap-horizontal-outline"],
  Profile: ["person", "person-outline"],
};

const MainTabs = () => {
  const t = useTheme();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color }) => (
          <Ionicons name={icons[route.name][focused ? 0 : 1]} size={22} color={color} />
        ),
        tabBarActiveTintColor: t.accent,
        tabBarInactiveTintColor: t.muted,
        tabBarStyle: { backgroundColor: t.surface, borderTopColor: t.border, height: 60, paddingTop: 6, paddingBottom: 6 },
        tabBarLabelStyle: { fontSize: 12, lineHeight: 16, flexShrink: 0, fontWeight: "600" },
      })}
    >
      <Tab.Screen name="Buy" component={BuyCouponsScreen} />
      <Tab.Screen name="Sell" component={SellCouponsScreen} />
      <Tab.Screen name="Exchange" component={ExchangeCouponsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

const App = () => {
  const t = useTheme();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSessionChange(setIsAuthenticated);
    restoreSession().finally(() => setIsLoading(false));
    return unsubscribe;
  }, []);

  const base = t.bg === "#111210" ? DarkTheme : DefaultTheme;
  const navTheme = {
    ...base,
    colors: { ...base.colors, background: t.bg, card: t.surface, border: t.border, text: t.text, primary: t.accent },
  };

  return (
    <>
      <StatusBar style={t.bg === "#111210" ? "light" : "dark"} />
      {isLoading ? (
        <Loading />
      ) : (
        <NavigationContainer theme={navTheme}>
          <Stack.Navigator screenOptions={{ headerShown: false, animation: "none" }}>
            {isAuthenticated ? (
              <Stack.Screen name="Main" component={MainTabs} />
            ) : (
              <Stack.Screen name="Login" component={LoginScreen} />
            )}
          </Stack.Navigator>
        </NavigationContainer>
      )}
      <ToastHost />
    </>
  );
};

export default App;
