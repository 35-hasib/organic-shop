import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api, errorMessage } from "../lib/api";
import type { Address, Cart, DeliveryArea, Order } from "../types";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useLanguage } from "../context/LanguageContext";
import { colors } from "../theme";
import { Button, EmptyState, ErrorState, LoadingState, Screen, ScreenHeader, TextField } from "../components/ui";
import { money } from "../lib/format";

export default function CheckoutScreen() {
  const { user } = useAuth();
  const { items, subtotal, refresh } = useCart();
  const { t, pick } = useLanguage();
  const insets = useSafeAreaInsets();
  const idempotencyKey = useRef(`mobile-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`).current;
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [areas, setAreas] = useState<DeliveryArea[]>([]);
  const [addressId, setAddressId] = useState("");
  const [areaId, setAreaId] = useState("");
  const [coupon, setCoupon] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState("0");
  const [couponBusy, setCouponBusy] = useState(false);
  const [couponError, setCouponError] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [placing, setPlacing] = useState(false);

  useEffect(() => {
    if (!user) router.replace({ pathname: "/login", params: { redirect: "/checkout" } });
  }, [user]);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [addressData, areaData] = await Promise.all([
        api<{ addresses: Address[] }>("/addresses", { auth: true }),
        api<{ areas: DeliveryArea[] }>("/delivery-areas"),
      ]);
      setAddresses(addressData.addresses);
      setAreas(areaData.areas);
      const selected = addressData.addresses.find((address) => address.isDefault) || addressData.addresses[0];
      setAddressId(selected?.id || "");
      const match = areaData.areas.find((area) => area.district === selected?.district) || areaData.areas[0];
      setAreaId(match?.id || "");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) load();
  }, [user?.id]);

  if (!user) return <Screen><LoadingState /></Screen>;
  if (loading) return <Screen><LoadingState /></Screen>;
  if (error) return <Screen><ScreenHeader title={t("checkout")} back /><ErrorState message={error} onRetry={load} /></Screen>;

  if (items.length === 0) {
    return (
      <Screen>
        <ScreenHeader title={t("checkout")} back />
        <EmptyState title={t("emptyCart")} action={t("continueShopping")} onAction={() => router.replace("/(tabs)/shop")} icon="basket-outline" />
      </Screen>
    );
  }

  const area = areas.find((item) => item.id === areaId);
  const subtotalValue = Number(subtotal || 0);
  const discountValue = Number(discount || 0);
  const discounted = Math.max(0, subtotalValue - discountValue);
  const threshold = area?.freeDeliveryThreshold ? Number(area.freeDeliveryThreshold) : null;
  const deliveryFee = area ? (threshold !== null && discounted >= threshold ? 0 : Number(area.charge)) : 0;
  const total = discounted + deliveryFee;

  const selectAddress = (address: Address) => {
    setAddressId(address.id);
    const match = areas.find((item) => item.district === address.district);
    if (match) setAreaId(match.id);
  };

  const applyCoupon = async () => {
    if (!coupon.trim()) return;
    setCouponBusy(true);
    setCouponError("");
    try {
      const data = await api<{ code: string; discount: string }>("/coupons/validate", {
        method: "POST",
        auth: true,
        body: { code: coupon.trim() },
      });
      setCouponCode(data.code);
      setDiscount(data.discount);
      setCoupon("");
    } catch (err) {
      setCouponError(errorMessage(err));
      setCouponCode("");
      setDiscount("0");
    } finally {
      setCouponBusy(false);
    }
  };

  const placeOrder = async () => {
    if (!addressId) {
      Alert.alert(pick("Add a delivery address", "ডেলিভারি ঠিকানা যোগ করুন"), pick("Please add an address before placing your order.", "অর্ডার করার আগে ঠিকানা যোগ করুন।"));
      return;
    }
    if (!areaId) {
      Alert.alert(pick("Select a delivery area", "ডেলিভারি এরিয়া নির্বাচন করুন"));
      return;
    }
    setPlacing(true);
    try {
      const data = await api<{ order: Order }>("/orders", {
        method: "POST",
        auth: true,
        body: {
          addressId,
          deliveryAreaId: areaId,
          couponCode: couponCode || null,
          paymentMethod: "COD",
          note: note.trim() || null,
          idempotencyKey,
        },
      });
      await refresh();
      router.replace(`/order/${data.order.id}`);
    } catch (err) {
      Alert.alert("Could not place order", errorMessage(err));
    } finally {
      setPlacing(false);
    }
  };

  return (
    <Screen>
      <ScreenHeader title={t("checkout")} subtitle={pick("Cash on delivery", "ক্যাশ অন ডেলিভারি")} back />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 140 }}>
        <Text style={styles.sectionTitle}>{pick("Delivery address", "ডেলিভারি ঠিকানা")}</Text>
        {addresses.length === 0 ? (
          <Pressable onPress={() => router.push("/addresses")} style={styles.addAddress}>
            <Ionicons name="add-circle-outline" size={20} color={colors.leaf700} />
            <Text style={styles.addAddressText}>{pick("Add a delivery address", "ডেলিভারি ঠিকানা যোগ করুন")}</Text>
          </Pressable>
        ) : (
          <View style={styles.addressList}>
            {addresses.map((address) => (
              <Pressable key={address.id} onPress={() => selectAddress(address)} style={[styles.addressCard, addressId === address.id ? styles.addressCardActive : null]}>
                <View style={[styles.radio, addressId === address.id ? styles.radioActive : null]}>
                  {addressId === address.id ? <View style={styles.radioDot} /> : null}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.addressLabel}>{address.label} · {address.recipientName}</Text>
                  <Text style={styles.addressText}>{address.addressLine}, {address.area}, {address.district}</Text>
                  <Text style={styles.addressPhone}>{address.phone}</Text>
                </View>
              </Pressable>
            ))}
            <Pressable onPress={() => router.push("/addresses")} style={styles.manageAddress}>
              <Ionicons name="settings-outline" size={15} color={colors.leaf700} />
              <Text style={styles.manageText}>{pick("Manage addresses", "ঠিকানা পরিচালনা করুন")}</Text>
            </Pressable>
          </View>
        )}

        <Text style={styles.sectionTitle}>{pick("Delivery area", "ডেলিভারি এরিয়া")}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.areaRow}>
          {areas.map((item) => (
            <Pressable key={item.id} onPress={() => setAreaId(item.id)} style={[styles.areaChip, areaId === item.id ? styles.areaChipActive : null]}>
              <Text style={[styles.areaName, areaId === item.id ? styles.areaNameActive : null]}>{pick(item.name, item.nameBn)}</Text>
              <Text style={[styles.areaCharge, areaId === item.id ? styles.areaNameActive : null]}>{money(item.charge)}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <Text style={styles.sectionTitle}>{pick("Coupon", "কুপন")}</Text>
        {couponCode ? (
          <View style={styles.couponApplied}>
            <Ionicons name="ticket-outline" size={18} color={colors.success} />
            <Text style={styles.couponAppliedText}>{couponCode} {pick("applied", "প্রয়োগ হয়েছে")}</Text>
            <Pressable onPress={() => { setCouponCode(""); setDiscount("0"); }} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={colors.muted} />
            </Pressable>
          </View>
        ) : (
          <View style={styles.couponRow}>
            <TextInput
              value={coupon}
              onChangeText={setCoupon}
              autoCapitalize="characters"
              placeholder="ORGANIC10"
              placeholderTextColor={colors.muted}
              style={styles.couponInput}
            />
            <Button title={pick("Apply", "প্রয়োগ")} onPress={applyCoupon} loading={couponBusy} style={{ paddingHorizontal: 18 }} />
          </View>
        )}
        {couponError ? <Text style={styles.couponError}>{couponError}</Text> : null}

        <Text style={styles.sectionTitle}>{pick("Order note", "অর্ডার নোট")}</Text>
        <TextField value={note} onChangeText={setNote} placeholder={pick("Delivery instructions (optional)", "ডেলিভারি নির্দেশনা (ঐচ্ছিক)")} multiline style={{ minHeight: 86, textAlignVertical: "top", paddingTop: 12 }} />

        <View style={styles.summary}>
          <View style={styles.row}><Text style={styles.rowLabel}>{t("subtotal")}</Text><Text style={styles.rowValue}>{money(subtotal)}</Text></View>
          {discountValue > 0 ? <View style={styles.row}><Text style={[styles.rowLabel, { color: colors.success }]}>{pick("Discount", "ডিসকাউন্ট")}</Text><Text style={[styles.rowValue, { color: colors.success }]}>-{money(discount)}</Text></View> : null}
          <View style={styles.row}><Text style={styles.rowLabel}>{t("delivery")}</Text><Text style={styles.rowValue}>{deliveryFee === 0 ? pick("Free", "ফ্রি") : money(deliveryFee)}</Text></View>
          <View style={[styles.row, styles.totalRow]}><Text style={styles.totalLabel}>{t("total")}</Text><Text style={styles.totalValue}>{money(total)}</Text></View>
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <View>
          <Text style={styles.bottomLabel}>{t("total")}</Text>
          <Text style={styles.bottomValue}>{money(total)}</Text>
        </View>
        <Button title={t("placeOrder")} onPress={placeOrder} loading={placing} style={{ flex: 1 }} icon={<Ionicons name="checkmark-circle-outline" size={18} color={colors.white} />} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { fontSize: 16, fontWeight: "800", color: colors.ink, marginTop: 20, marginBottom: 10 },
  addAddress: { flexDirection: "row", alignItems: "center", gap: 8, padding: 16, borderRadius: 14, borderWidth: 1, borderStyle: "dashed", borderColor: colors.leaf300, backgroundColor: colors.leaf50 },
  addAddressText: { fontSize: 13, fontWeight: "700", color: colors.leaf800 },
  addressList: { gap: 10 },
  addressCard: { flexDirection: "row", gap: 10, padding: 14, borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white },
  addressCardActive: { borderColor: colors.leaf500, backgroundColor: colors.leaf50 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.border, alignItems: "center", justifyContent: "center", marginTop: 2 },
  radioActive: { borderColor: colors.leaf600 },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.leaf600 },
  addressLabel: { fontSize: 13, fontWeight: "800", color: colors.ink },
  addressText: { fontSize: 12, color: colors.body, marginTop: 3, lineHeight: 18 },
  addressPhone: { fontSize: 11, color: colors.muted, marginTop: 2 },
  manageAddress: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 6 },
  manageText: { fontSize: 12, fontWeight: "700", color: colors.leaf700 },
  areaRow: { gap: 8 },
  areaChip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, minWidth: 100 },
  areaChipActive: { backgroundColor: colors.leaf700, borderColor: colors.leaf700 },
  areaName: { fontSize: 12, fontWeight: "700", color: colors.ink },
  areaCharge: { fontSize: 10, color: colors.muted, marginTop: 2 },
  areaNameActive: { color: colors.white },
  couponRow: { flexDirection: "row", gap: 8 },
  couponInput: { flex: 1, minHeight: 48, borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, paddingHorizontal: 14, fontSize: 14, color: colors.ink },
  couponApplied: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 14, backgroundColor: colors.successBg, padding: 14 },
  couponAppliedText: { flex: 1, fontSize: 13, fontWeight: "700", color: colors.success },
  couponError: { fontSize: 12, color: colors.danger, marginTop: 6 },
  summary: { marginTop: 22, borderRadius: 18, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, padding: 16, gap: 9 },
  row: { flexDirection: "row", justifyContent: "space-between" },
  rowLabel: { fontSize: 13, color: colors.body },
  rowValue: { fontSize: 13, fontWeight: "600", color: colors.ink },
  totalRow: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10, marginTop: 2 },
  totalLabel: { fontSize: 15, fontWeight: "800", color: colors.ink },
  totalValue: { fontSize: 19, fontWeight: "800", color: colors.leaf800 },
  bottomBar: { position: "absolute", left: 0, right: 0, bottom: 0, flexDirection: "row", alignItems: "center", gap: 16, backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.border, paddingHorizontal: 20, paddingTop: 12 },
  bottomLabel: { fontSize: 10, color: colors.muted, textTransform: "uppercase", letterSpacing: 0.5 },
  bottomValue: { fontSize: 18, fontWeight: "800", color: colors.ink },
});
