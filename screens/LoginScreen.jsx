import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { login, register, requestResetCode, resetPassword } from "../api";
import { showError, showSuccess } from "../notify";
import { Button, Card, Field } from "../ui";
import { MAX_WIDTH, space, type, useTheme } from "../theme";

const LoginScreen = () => {
  const t = useTheme();
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  const creating = mode === "register";
  const recovering = mode === "forgot" || mode === "reset";

  const go = (next) => {
    setMode(next);
    setPassword("");
  };

  const recover = async () => {
    setBusy(true);
    try {
      if (mode === "forgot") {
        if (!email.trim()) throw new Error("Enter your email.");
        await requestResetCode(email.trim());
        showSuccess("If that email has an account, a code is on its way.");
        go("reset");
      } else {
        if (!email.trim() || !code.trim() || !password) {
          throw new Error("Enter your email, the code and a new password.");
        }
        await resetPassword(email.trim(), code, password);
        showSuccess("Password changed. Sign in with the new one.");
        setCode("");
        go("login");
      }
    } catch (error) {
      showError(error.message);
    }
    setBusy(false);
  };

  const submit = async () => {
    if (recovering) return recover();
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
        <Text
          style={[type.title, { color: t.text }]}
          accessibilityRole="header"
        >
          Cash Your Coupons
        </Text>
        <Text style={[type.body, styles.lead, { color: t.muted }]}>
          Sell the coupons you will not use and buy the ones you will.
        </Text>

        <Card style={styles.form}>
          <Text style={[type.heading, { color: t.text }]}>
            {creating
              ? "Create an account"
              : recovering
                ? "Reset your password"
                : "Sign in"}
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
          {mode === "reset" && (
            <Field
              label="Code from the email"
              value={code}
              onChangeText={setCode}
              autoCapitalize="characters"
              autoComplete="one-time-code"
              textContentType="oneTimeCode"
            />
          )}
          {mode !== "forgot" && (
            <Field
              label={mode === "reset" ? "New password" : "Password"}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete={
                creating || mode === "reset"
                  ? "new-password"
                  : "current-password"
              }
              textContentType={
                creating || mode === "reset" ? "newPassword" : "password"
              }
              onSubmitEditing={submit}
            />
          )}
          <Button
            label={
              creating
                ? "Create account"
                : mode === "forgot"
                  ? "Send me a code"
                  : mode === "reset"
                    ? "Change password"
                    : "Sign in"
            }
            onPress={submit}
            loading={busy}
          />
          {mode === "login" && (
            <Button
              variant="secondary"
              label="Forgot your password?"
              onPress={() => go("forgot")}
              disabled={busy}
            />
          )}
          <Button
            variant="secondary"
            label={
              recovering
                ? "Back to sign in"
                : creating
                  ? "I already have an account"
                  : "Create a new account"
            }
            onPress={() => go(creating || recovering ? "login" : "register")}
            disabled={busy}
          />
        </Card>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, justifyContent: "center" },
  column: {
    width: "100%",
    maxWidth: Math.min(MAX_WIDTH, 440),
    alignSelf: "center",
    padding: space.md,
  },
  lead: { marginTop: space.xs, marginBottom: space.lg },
  form: { gap: space.md },
});

export default LoginScreen;
