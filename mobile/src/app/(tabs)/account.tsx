import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { colors, cardShadow } from "../../theme";
import { Button, Screen, ScreenHeader } from "../../components/ui";

export default function AccountScreen() {
  const { user, logout } = useAuth();
  const { t, pick, language, setLanguage } = useLanguage();

  const confirmLogout = () => {
    Alert.alert(pick("Sign out?", "সাইন আউট করবেন?"), pick("You can sign back in anytime.", "আপনি যেকোনো সময় আবার সাইন ইন করতে পারবেন।"), [
      { text: pick("Cancel", "বাতিল"), style: "cancel" },
      { text: t("signOut"), style: "destructive", onPress: () => logout() },
    ]);
  };

  const menus = [
    { label: t("orders"), icon: "receipt-outline" as const, onPress: () => router.push("/orders") },
    { label: t("addresses"), icon: "location-outline" as const, onPress: () => router.push("/addresses") },
    { label: t("notifications"), icon: "notifications-outline" as const, onPress: () => router.push("/notifications") },
  ];

  return (
    <Screen>
      <ScreenHeader title={t("account")} subtitle={pick("Your details and preferences", "আপনার তথ্য ও পছন্দ")} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        {user ? (
          <View style={styles.profile}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{user.name.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{user.name}</Text>
              <Text style={styles.contact}>{user.email || user.phone}</Text>
              {user.email && user.phone ? <Text style={styles.contact}>{user.phone}</Text> : null}
            </View>
            <View style={styles.memberBadge}><Text style={styles.memberText}>{pick("MEMBER", "সদস্য")}</Text></View>
          </View>
        ) : (
          <View style={styles.guest}>
            <View style={styles.guestIcon}><Ionicons name="leaf-outline" size={34} color={colors.leaf700} /></View>
            <Text style={styles.guestTitle}>{pick("Eat well, live well.", "ভালো খান, ভালো থাকুন।")}</Text>
            <Text style={styles.guestText}>{pick("Sign in to track orders, save addresses and shop faster.", "অর্ডার ট্র্যাক করতে, ঠিকানা সংরক্ষণ করতে এবং দ্রুত কিনতে সাইন ইন করুন।")}</Text>
            <Button title={t("signIn")} onPress={() => router.push("/login")} style={{ alignSelf: "stretch", marginTop: 8 }} />
            <Button title={t("signUp")} variant="secondary" onPress={() => router.push("/register")} style={{ alignSelf: "stretch" }} />
          </View>
        )}

        {user ? (
          <View style={styles.menu}>
            {menus.map((item) => (
              <Pressable key={item.label} onPress={item.onPress} style={({ pressed }) => [styles.menuRow, pressed ? { backgroundColor: colors.leaf50 } : null]}>
                <View style={styles.menuIcon}><Ionicons name={item.icon} size={19} color={colors.leaf700} /></View>
                <Text style={styles.menuLabel}>{item.label}</Text>
                <Ionicons name="chevron-forward" size={18} color={colors.muted} />
              </Pressable>
            ))}
          </View>
        ) : null}

        <View style={styles.languageCard}>
          <View style={styles.languageHeader}>
            <Ionicons name="language-outline" size={20} color={colors.leaf700} />
            <Text style={styles.languageTitle}>{t("language")}</Text>
          </View>
          <View style={styles.segmented}>
            <Pressable onPress={() => setLanguage("en")} style={[styles.segment, language === "en" ? styles.segmentActive : null]}>
              <Text style={[styles.segmentText, language === "en" ? styles.segmentTextActive : null]}>English</Text>
            </Pressable>
            <Pressable onPress={() => setLanguage("bn")} style={[styles.segment, language === "bn" ? styles.segmentActive : null]}>
              <Text style={[styles.segmentText, language === "bn" ? styles.segmentTextActive : null]}>বাংলা</Text>
            </Pressable>
          </View>
        </View>

        {user ? (
          <View style={styles.menu}>
            <Pressable onPress={confirmLogout} style={({ pressed }) => [styles.menuRow, pressed ? { backgroundColor: colors.dangerBg } : null]}>
              <View style={[styles.menuIcon, { backgroundColor: colors.dangerBg }]}><Ionicons name="log-out-outline" size={19} color={colors.danger} /></View>
              <Text style={[styles.menuLabel, { color: colors.danger }]}>{t("signOut")}</Text>
            </Pressable>
          </View>
        ) : null}

        <View style={styles.footer}>
          <Ionicons name="leaf" size={18} color={colors.leaf600} />
          <Text style={styles.footerText}>Organic Shop · {pick("Grown with care", "যত্নে চাষকৃত")}</Text>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  profile: { flexDirection: "row", alignItems: "center", gap: 14, padding: 18, borderRadius: 20, backgroundColor: colors.leaf800, ...cardShadow },
  avatar: { width: 58, height: 58, borderRadius: 20, backgroundColor: colors.leaf500, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 24, fontWeight: "800", color: colors.white },
  name: { fontSize: 19, fontWeight: "800", color: colors.white },
  contact: { fontSize: 12, color: colors.leaf200, marginTop: 2 },
  memberBadge: { backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5 },
  memberText: { color: colors.leaf100, fontSize: 8, fontWeight: "800", letterSpacing: 0.8 },
  guest: { padding: 24, borderRadius: 22, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, alignItems: "center", gap: 10, ...cardShadow },
  guestIcon: { width: 68, height: 68, borderRadius: 22, backgroundColor: colors.leaf50, alignItems: "center", justifyContent: "center", marginBottom: 2 },
  guestTitle: { fontSize: 22, fontWeight: "800", color: colors.ink, textAlign: "center" },
  guestText: { fontSize: 13, lineHeight: 20, color: colors.muted, textAlign: "center", marginBottom: 8 },
  menu: { marginTop: 18, borderRadius: 18, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, overflow: "hidden" },
  menuRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 14, paddingVertical: 13, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  menuIcon: { width: 36, height: 36, borderRadius: 11, backgroundColor: colors.leaf50, alignItems: "center", justifyContent: "center" },
  menuLabel: { flex: 1, fontSize: 14, fontWeight: "600", color: colors.ink },
  languageCard: { marginTop: 18, borderRadius: 18, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, padding: 14, gap: 12 },
  languageHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  languageTitle: { fontSize: 14, fontWeight: "700", color: colors.ink },
  segmented: { flexDirection: "row", backgroundColor: colors.leaf50, borderRadius: 12, padding: 4 },
  segment: { flex: 1, alignItems: "center", paddingVertical: 9, borderRadius: 9 },
  segmentActive: { backgroundColor: colors.white, ...cardShadow },
  segmentText: { fontSize: 13, fontWeight: "600", color: colors.muted },
  segmentTextActive: { color: colors.leaf800, fontWeight: "800" },
  footer: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 28 },
  footerText: { fontSize: 11, color: colors.muted },
});
