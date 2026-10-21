import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { login, register } from "../api";
import { showError } from "../notify";
import { Button, Card, Field } from "../ui";
import { MAX_WIDTH, space, type, useTheme } from "../theme";

const LoginScreen = () => {
  const t = useTheme();
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const creating = mode === "register";

  const submit = async () => {
    if (!email.trim() || !password) {
      showError("Enter your email and password.");
      return;
    }
    setBusy(true);
    try {
      await (creating ? register : login)(email.trim(), password);
    } catch (error) {
      showError(error.message);
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]}>
      <View style={styles.column}>
        <Text style={[type.title, { color: t.text }]} accessibilityRole="header">
          Cash Your Coupons
        </Text>
        <Text style={[type.body, styles.lead, { color: t.muted }]}>
          Sell the coupons you will not use and buy the ones you will.
        </Text>

        <Card style={styles.form}>
          <Text style={[type.heading, { color: t.text }]}>
            {creating ? "Create an account" : "Sign in"}
          </Text>
          <Field
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
          />
          <Field
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete={creating ? "new-password" : "current-password"}
            textContentType={creating ? "newPassword" : "password"}
            onSubmitEditing={submit}
          />
          <Button
            label={creating ? "Create account" : "Sign in"}
            onPress={submit}
            loading={busy}
          />
          <Button
            variant="secondary"
            label={creating ? "I already have an account" : "Create a new account"}
            onPress={() => setMode(creating ? "login" : "register")}
            disabled={busy}
          />
        </Card>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, justifyContent: "center" },
  column: { width: "100%", maxWidth: Math.min(MAX_WIDTH, 440), alignSelf: "center", padding: space.md },
  lead: { marginTop: space.xs, marginBottom: space.lg },
  form: { gap: space.md },
});

export default LoginScreen;
