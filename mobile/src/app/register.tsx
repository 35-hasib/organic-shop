import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { errorMessage } from "../lib/api";
import { colors } from "../theme";
import { Button, Screen, TextField } from "../components/ui";

export default function RegisterScreen() {
  const { register } = useAuth();
  const { t, pick } = useLanguage();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (name.trim().length < 2) {
      setError(pick("Please enter your full name.", "আপনার পুরো নাম লিখুন।"));
      return;
    }
    if (!email.trim() && !phone.trim()) {
      setError(pick("Enter an email or mobile number.", "ইমেইল বা মোবাইল নম্বর দিন।"));
      return;
    }
    if (password.length < 6) {
      setError(pick("Password must be at least 6 characters.", "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।"));
      return;
    }
    if (password !== confirm) {
      setError(pick("Passwords do not match.", "পাসওয়ার্ড মিলছে না।"));
      return;
    }
    setBusy(true);
    setError("");
    try {
      await register({ name: name.trim(), email: email.trim() || undefined, phone: phone.trim() || undefined, password });
      router.replace("/(tabs)");
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
            <Text style={styles.eyebrow}>{pick("JOIN THE HARVEST", "আমাদের সাথে যুক্ত হোন")}</Text>
            <Text style={styles.title}>{pick("Create your account", "আপনার অ্যাকাউন্ট খুলুন")}</Text>
            <Text style={styles.subtitle}>{pick("Save addresses, track orders and check out faster.", "ঠিকানা সংরক্ষণ করুন, অর্ডার ট্র্যাক করুন এবং দ্রুত চেকআউট করুন।")}</Text>
          </View>

          <View style={styles.card}>
            <TextField label={t("name")} value={name} onChangeText={setName} autoCapitalize="words" placeholder="Your name" />
            <TextField label={t("email")} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="you@example.com" />
            <TextField label={`${t("phone")} (${pick("optional", "ঐচ্ছিক")})`} value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="01700000000" />
            <TextField label={t("password")} value={password} onChangeText={setPassword} secureTextEntry placeholder="At least 6 characters" />
            <TextField label={pick("Confirm password", "পাসওয়ার্ড নিশ্চিত করুন")} value={confirm} onChangeText={setConfirm} secureTextEntry placeholder="Repeat password" />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Button title={t("signUp")} onPress={submit} loading={busy} />
            <View style={styles.switchRow}>
              <Text style={styles.switchText}>{pick("Already have an account?", "ইতিমধ্যে অ্যাকাউন্ট আছে?")}</Text>
              <Pressable onPress={() => router.replace("/login")} hitSlop={8}>
                <Text style={styles.switchLink}>{t("signIn")}</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, justifyContent: "center", padding: 20, paddingVertical: 28 },
  top: { marginBottom: 20 },
  close: { position: "absolute", right: 0, top: -6, zIndex: 2, width: 40, height: 40, borderRadius: 20, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
  eyebrow: { fontSize: 10, fontWeight: "800", letterSpacing: 1.4, color: colors.leaf600 },
  title: { fontSize: 28, fontWeight: "800", color: colors.ink, marginTop: 6, maxWidth: "85%" },
  subtitle: { fontSize: 13, color: colors.muted, marginTop: 5, maxWidth: "90%", lineHeight: 19 },
  card: { backgroundColor: colors.white, borderRadius: 22, borderWidth: 1, borderColor: colors.border, padding: 20, gap: 14 },
  error: { color: colors.danger, fontSize: 12, backgroundColor: colors.dangerBg, padding: 10, borderRadius: 10 },
  switchRow: { flexDirection: "row", justifyContent: "center", gap: 5 },
  switchText: { fontSize: 12, color: colors.muted },
  switchLink: { fontSize: 12, color: colors.leaf700, fontWeight: "800" },
});
