import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router, useLocalSearchParams, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { errorMessage } from "../lib/api";
import { colors } from "../theme";
import { Button, Screen, TextField } from "../components/ui";

export default function LoginScreen() {
  const { user, login } = useAuth();
  const { t, pick } = useLanguage();
  const params = useLocalSearchParams<{ redirect?: string }>();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const redirect = params.redirect || "/(tabs)";

  useEffect(() => {
    if (user) router.replace(redirect as Href);
  }, [user]);

  const submit = async () => {
    if (!identifier.trim() || !password) {
      setError(pick("Enter your email or mobile and password.", "ইমেইল বা মোবাইল ও পাসওয়ার্ড দিন।"));
      return;
    }
    setBusy(true);
    setError("");
    try {
      await login(identifier.trim(), password);
      router.replace(redirect as Href);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.top}>
            <Pressable onPress={() => router.back()} style={styles.close}>
              <Ionicons name="close" size={22} color={colors.ink} />
            </Pressable>
            <View style={styles.logo}><Ionicons name="leaf" size={28} color={colors.white} /></View>
            <Text style={styles.title}>{pick("Welcome back", "আবার স্বাগতম")}</Text>
            <Text style={styles.subtitle}>{pick("Fresh groceries are one sign-in away.", "টাটকা বাজার নিতে শুধু সাইন ইন করুন।")}</Text>
          </View>

          <View style={styles.card}>
            <TextField label={t("emailOrPhone")} value={identifier} onChangeText={setIdentifier} autoCapitalize="none" keyboardType="email-address" placeholder="customer@organic.test" />
            <View>
              <TextField
                label={t("password")}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                placeholder="••••••••"
              />
              <Pressable onPress={() => setShowPassword((value) => !value)} style={styles.eye} hitSlop={8}>
                <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={18} color={colors.muted} />
              </Pressable>
            </View>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Button title={t("signIn")} onPress={submit} loading={busy} />
            <View style={styles.switchRow}>
              <Text style={styles.switchText}>{pick("New to Organic Shop?", "অর্গানিক শপে নতুন?")}</Text>
              <Pressable onPress={() => router.replace("/register")} hitSlop={8}>
                <Text style={styles.switchLink}>{t("signUp")}</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.demo}>
            <Text style={styles.demoTitle}>{pick("Demo customer", "ডেমো কাস্টমার")}</Text>
            <Text style={styles.demoText}>customer@organic.test / Customer123!</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, justifyContent: "center", padding: 20, paddingVertical: 32 },
  top: { alignItems: "center", marginBottom: 24 },
  close: { position: "absolute", right: 0, top: 0, width: 40, height: 40, borderRadius: 20, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
  logo: { width: 64, height: 64, borderRadius: 22, backgroundColor: colors.leaf700, alignItems: "center", justifyContent: "center", marginBottom: 14 },
  title: { fontSize: 28, fontWeight: "800", color: colors.ink },
  subtitle: { fontSize: 13, color: colors.muted, marginTop: 5, textAlign: "center" },
  card: { backgroundColor: colors.white, borderRadius: 22, borderWidth: 1, borderColor: colors.border, padding: 20, gap: 15 },
  eye: { position: "absolute", right: 14, bottom: 16 },
  error: { color: colors.danger, fontSize: 12, backgroundColor: colors.dangerBg, padding: 10, borderRadius: 10 },
  switchRow: { flexDirection: "row", justifyContent: "center", gap: 5, marginTop: 2 },
  switchText: { fontSize: 12, color: colors.muted },
  switchLink: { fontSize: 12, color: colors.leaf700, fontWeight: "800" },
  demo: { marginTop: 18, borderRadius: 14, backgroundColor: colors.leaf50, padding: 12, alignItems: "center" },
  demoTitle: { fontSize: 10, fontWeight: "800", color: colors.leaf800, letterSpacing: 0.6, textTransform: "uppercase" },
  demoText: { fontSize: 11, color: colors.body, marginTop: 3 },
});
