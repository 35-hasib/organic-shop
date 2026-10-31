import { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api, errorMessage } from "../lib/api";
import type { Address } from "../types";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { colors } from "../theme";
import { Button, EmptyState, ErrorState, LoadingState, Screen, ScreenHeader, TextField } from "../components/ui";

const emptyForm = {
  label: "Home",
  recipientName: "",
  phone: "",
  division: "Dhaka",
  district: "Dhaka",
  area: "",
  addressLine: "",
  postalCode: "",
};

export default function AddressesScreen() {
  const { user } = useAuth();
  const { pick } = useLanguage();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) router.replace({ pathname: "/login", params: { redirect: "/addresses" } });
  }, [user]);

  const load = async () => {
    if (!user) return;
    try {
      const data = await api<{ addresses: Address[] }>("/addresses", { auth: true });
      setAddresses(data.addresses);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) load();
  }, [user?.id]);

  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));

  const save = async () => {
    if (!form.recipientName.trim() || !form.phone.trim() || !form.area.trim() || !form.addressLine.trim()) {
      Alert.alert(pick("Missing details", "তথ্য অসম্পূর্ণ"), pick("Please complete name, phone, area and address.", "নাম, ফোন, এলাকা ও ঠিকানা পূরণ করুন।"));
      return;
    }
    setBusy(true);
    try {
      await api("/addresses", {
        method: "POST",
        auth: true,
        body: { ...form, postalCode: form.postalCode || null, isDefault: addresses.length === 0 },
      });
      setForm(emptyForm);
      setShowForm(false);
      await load();
    } catch (err) {
      Alert.alert("Could not save address", errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const setDefault = async (address: Address) => {
    try {
      await api(`/addresses/${address.id}`, { method: "PUT", auth: true, body: { isDefault: true } });
      await load();
    } catch (err) {
      Alert.alert("Could not update address", errorMessage(err));
    }
  };

  const remove = (address: Address) => {
    Alert.alert(pick("Delete address?", "ঠিকানা মুছবেন?"), `${address.label} · ${address.area}`, [
      { text: pick("Cancel", "বাতিল"), style: "cancel" },
      {
        text: pick("Delete", "মুছুন"),
        style: "destructive",
        onPress: async () => {
          try {
            await api(`/addresses/${address.id}`, { method: "DELETE", auth: true });
            await load();
          } catch (err) {
            Alert.alert("Could not delete address", errorMessage(err));
          }
        },
      },
    ]);
  };

  if (!user || loading) return <Screen><LoadingState /></Screen>;

  return (
    <Screen>
      <ScreenHeader
        title={pick("Saved addresses", "সংরক্ষিত ঠিকানা")}
        back
        right={
          <Pressable onPress={() => setShowForm((value) => !value)} style={styles.addButton}>
            <Ionicons name={showForm ? "close" : "add"} size={20} color={colors.white} />
          </Pressable>
        }
      />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {error ? <ErrorState message={error} onRetry={load} /> : null}
          {showForm ? (
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>{pick("Add a new address", "নতুন ঠিকানা যোগ করুন")}</Text>
              <TextField label={pick("Label", "লেবেল")} value={form.label} onChangeText={(value) => update("label", value)} placeholder="Home / Office" />
              <TextField label={pick("Recipient name", "গ্রহীতার নাম")} value={form.recipientName} onChangeText={(value) => update("recipientName", value)} autoCapitalize="words" />
              <TextField label={pick("Phone", "ফোন")} value={form.phone} onChangeText={(value) => update("phone", value)} keyboardType="phone-pad" />
              <View style={styles.twoCols}>
                <View style={{ flex: 1 }}><TextField label={pick("Division", "বিভাগ")} value={form.division} onChangeText={(value) => update("division", value)} /></View>
                <View style={{ flex: 1 }}><TextField label={pick("District", "জেলা")} value={form.district} onChangeText={(value) => update("district", value)} /></View>
              </View>
              <TextField label={pick("Area", "এলাকা")} value={form.area} onChangeText={(value) => update("area", value)} placeholder="Dhanmondi" />
              <TextField label={pick("Full address", "সম্পূর্ণ ঠিকানা")} value={form.addressLine} onChangeText={(value) => update("addressLine", value)} multiline style={{ minHeight: 80, textAlignVertical: "top", paddingTop: 12 }} />
              <TextField label={pick("Postal code (optional)", "পোস্ট কোড (ঐচ্ছিক)")} value={form.postalCode} onChangeText={(value) => update("postalCode", value)} keyboardType="number-pad" />
              <Button title={pick("Save address", "ঠিকানা সংরক্ষণ")} onPress={save} loading={busy} />
            </View>
          ) : null}

          {addresses.length === 0 && !showForm ? (
            <EmptyState title={pick("No saved addresses", "কোনো ঠিকানা নেই")} text={pick("Add an address to make checkout faster.", "দ্রুত চেকআউটের জন্য ঠিকানা যোগ করুন।")} action={pick("Add address", "ঠিকানা যোগ করুন")} onAction={() => setShowForm(true)} icon="location-outline" />
          ) : (
            addresses.map((address) => (
              <View key={address.id} style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={styles.iconWrap}><Ionicons name="location-outline" size={19} color={colors.leaf700} /></View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.labelRow}>
                      <Text style={styles.label}>{address.label}</Text>
                      {address.isDefault ? <View style={styles.defaultBadge}><Text style={styles.defaultText}>{pick("DEFAULT", "ডিফল্ট")}</Text></View> : null}
                    </View>
                    <Text style={styles.name}>{address.recipientName} · {address.phone}</Text>
                    <Text style={styles.address}>{address.addressLine}, {address.area}, {address.district}, {address.division}</Text>
                  </View>
                </View>
                <View style={styles.actions}>
                  {!address.isDefault ? <Pressable onPress={() => setDefault(address)} hitSlop={6}><Text style={styles.actionText}>{pick("Set default", "ডিফল্ট করুন")}</Text></Pressable> : <View />}
                  <Pressable onPress={() => remove(address)} hitSlop={6}><Text style={[styles.actionText, { color: colors.danger }]}>{pick("Delete", "মুছুন")}</Text></Pressable>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  addButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.leaf700, alignItems: "center", justifyContent: "center" },
  content: { padding: 20, paddingBottom: 40, gap: 12 },
  formCard: { backgroundColor: colors.white, borderRadius: 20, borderWidth: 1, borderColor: colors.border, padding: 16, gap: 12 },
  formTitle: { fontSize: 16, fontWeight: "800", color: colors.ink },
  twoCols: { flexDirection: "row", gap: 10 },
  card: { backgroundColor: colors.white, borderRadius: 18, borderWidth: 1, borderColor: colors.border, padding: 14 },
  cardTop: { flexDirection: "row", gap: 10 },
  iconWrap: { width: 38, height: 38, borderRadius: 12, backgroundColor: colors.leaf50, alignItems: "center", justifyContent: "center" },
  labelRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  label: { fontSize: 14, fontWeight: "800", color: colors.ink },
  defaultBadge: { backgroundColor: colors.leaf50, borderRadius: 999, paddingHorizontal: 7, paddingVertical: 2 },
  defaultText: { fontSize: 8, fontWeight: "800", color: colors.leaf700, letterSpacing: 0.6 },
  name: { fontSize: 12, color: colors.body, marginTop: 3 },
  address: { fontSize: 12, color: colors.muted, lineHeight: 18, marginTop: 3 },
  actions: { flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: colors.border, marginTop: 12, paddingTop: 10 },
  actionText: { fontSize: 11, fontWeight: "700", color: colors.leaf700 },
});
