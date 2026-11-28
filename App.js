import React, { useState, useEffect } from "react";
import { View, useWindowDimensions } from "react-native";
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
import { MAX_WIDTH, TAB_BAR, icon, space, type, WIDE_BREAKPOINT, useIsDark, useTheme } from "./theme";

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
          <Ionicons name={icons[route.name][focused ? 0 : 1]} size={icon.lg} color={color} />
        ),
        tabBarActiveTintColor: t.accent,
        tabBarInactiveTintColor: t.muted,
        tabBarStyle: { backgroundColor: t.surface, borderTopColor: t.border, height: TAB_BAR, paddingTop: space.xs + 2, paddingBottom: space.xs + 2 },
        tabBarLabelStyle: { ...type.label, flexShrink: 0 },
      })}
    >
      <Tab.Screen name="Buy" component={BuyCouponsScreen} />
      <Tab.Screen name="Sell" component={SellCouponsScreen} />
      <Tab.Screen name="Exchange" component={ExchangeCouponsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

// On a wide window the app is a phone-width column in the middle, not stretched (pattern B25).
const Frame = ({ children }) => {
  const t = useTheme();
  const { width } = useWindowDimensions();
  const wide = width >= WIDE_BREAKPOINT;
  return (
    <View style={{ flex: 1, backgroundColor: wide ? t.surfaceAlt : t.bg, alignItems: "center" }}>
      <View
        style={{
          flex: 1,
          width: "100%",
          maxWidth: wide ? MAX_WIDTH : undefined,
          backgroundColor: t.bg,
          borderLeftWidth: wide ? 1 : 0,
          borderRightWidth: wide ? 1 : 0,
          borderColor: t.border,
        }}
      >
        {children}
      </View>
    </View>
  );
};

const App = () => {
  const t = useTheme();
  const dark = useIsDark();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSessionChange(setIsAuthenticated);
    restoreSession().finally(() => setIsLoading(false));
    return unsubscribe;
  }, []);

  const base = dark ? DarkTheme : DefaultTheme;
  const navTheme = {
    ...base,
    colors: { ...base.colors, background: t.bg, card: t.surface, border: t.border, text: t.text, primary: t.accent },
  };

  return (
    <Frame>
      <StatusBar style={dark ? "light" : "dark"} />
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
    </Frame>
  );
};

export default App;
