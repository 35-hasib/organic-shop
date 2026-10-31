import { useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { useLanguage } from "../../context/LanguageContext";
import { colors } from "../../theme";
import { Button, EmptyState, LoadingState, QuantityStepper, Screen, ScreenHeader } from "../../components/ui";
import { money } from "../../lib/format";
import { errorMessage } from "../../lib/api";

export default function CartScreen() {
  const { user } = useAuth();
  const { items, count, subtotal, loading, update, remove, refresh } = useCart();
  const { t, pick } = useLanguage();
  const [refreshing, setRefreshing] = useState(false);
  const [pendingId, setPendingId] = useState("");

  const changeQuantity = async (itemId: string, quantity: number) => {
    setPendingId(itemId);
    try {
      await update(itemId, quantity);
    } catch (err) {
      Alert.alert("Could not update quantity", errorMessage(err));
    } finally {
      setPendingId("");
    }
  };

  const confirmRemove = (itemId: string, name: string) => {
    Alert.alert(pick("Remove item?", "পণ্যটি সরাবেন?"), name, [
      { text: pick("Cancel", "বাতিল"), style: "cancel" },
      {
        text: pick("Remove", "সরান"),
        style: "destructive",
        onPress: async () => {
          try {
            await remove(itemId);
          } catch (err) {
            Alert.alert("Could not remove item", errorMessage(err));
          }
        },
      },
    ]);
  };

  if (!user) {
    return (
      <Screen>
        <ScreenHeader title={t("cart")} />
        <EmptyState
          title={t("loginRequired")}
          text={pick("Your basket is waiting for you. Sign in to add fresh produce.", "আপনার কার্ট অপেক্ষা করছে। টাটকা পণ্য যোগ করতে সাইন ইন করুন।")}
          action={t("signIn")}
          onAction={() => router.push({ pathname: "/login", params: { redirect: "/(tabs)/cart" } })}
          icon="bag-handle-outline"
        />
      </Screen>
    );
  }

  if (loading && items.length === 0) return <Screen><LoadingState /></Screen>;

  return (
    <Screen>
      <ScreenHeader title={t("cart")} subtitle={`${count} ${pick("items", "পণ্য")}`} />
      {items.length === 0 ? (
        <EmptyState
          title={t("emptyCart")}
          text={pick("Add something fresh from the shop.", "শপ থেকে টাটকা কিছু যোগ করুন।")}
          action={t("continueShopping")}
          onAction={() => router.push("/(tabs)/shop")}
          icon="basket-outline"
        />
      ) : (
        <>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 180 }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={async () => {
                  setRefreshing(true);
                  await refresh();
                  setRefreshing(false);
                }}
                tintColor={colors.leaf700}
              />
            }
          >
            {items.map((item) => (
              <View key={item.id} style={styles.item}>
                {item.product.images[0] ? (
                  <Image source={{ uri: item.product.images[0] }} style={styles.image} />
                ) : (
                  <View style={[styles.image, styles.imagePlaceholder]}>
                    <Ionicons name="leaf-outline" size={24} color={colors.leaf400} />
                  </View>
                )}
                <View style={styles.itemContent}>
                  <View style={styles.itemTop}>
                    <View style={{ flex: 1 }}>
                      <Text numberOfLines={2} style={styles.itemName}>{pick(item.product.name, item.product.nameBn)}</Text>
                      <Text style={styles.itemUnit}>{item.product.unit} · {money(item.unitPrice)}</Text>
                    </View>
                    <Pressable onPress={() => confirmRemove(item.id, item.product.name)} hitSlop={8} style={styles.removeButton}>
                      <Ionicons name="trash-outline" size={17} color={colors.muted} />
                    </Pressable>
                  </View>
                  <View style={styles.itemBottom}>
                    <View pointerEvents={pendingId === item.id ? "none" : "auto"} style={pendingId === item.id ? { opacity: 0.5 } : null}>
                      <QuantityStepper
                        value={item.quantity}
                        max={Math.min(item.product.stock, 99)}
                        onChange={(value) => changeQuantity(item.id, value)}
                        compact
                      />
                    </View>
                    <Text style={styles.lineTotal}>{money(item.lineTotal)}</Text>
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>

          <View style={styles.summary}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{t("subtotal")}</Text>
              <Text style={styles.summaryValue}>{money(subtotal)}</Text>
            </View>
            <Text style={styles.summaryHint}>{pick("Delivery charge is calculated at checkout.", "ডেলিভারি চার্জ চেকআউটে যোগ হবে।")}</Text>
            <Button
              title={t("checkout")}
              onPress={() => router.push("/checkout")}
              icon={<Ionicons name="arrow-forward" size={18} color={colors.white} />}
              style={{ marginTop: 12 }}
            />
          </View>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  item: { flexDirection: "row", gap: 12, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 18, padding: 12, marginBottom: 12 },
  image: { width: 78, height: 88, borderRadius: 12, backgroundColor: colors.leaf50 },
  imagePlaceholder: { alignItems: "center", justifyContent: "center" },
  itemContent: { flex: 1, justifyContent: "space-between", gap: 8 },
  itemTop: { flexDirection: "row", gap: 6 },
  itemName: { fontSize: 14, fontWeight: "700", color: colors.ink, lineHeight: 19 },
  itemUnit: { fontSize: 11, color: colors.muted, marginTop: 2 },
  removeButton: { width: 28, height: 28, alignItems: "center", justifyContent: "center" },
  itemBottom: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  lineTotal: { fontSize: 15, fontWeight: "800", color: colors.leaf800 },
  summary: { position: "absolute", left: 0, right: 0, bottom: 0, backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.border, padding: 20, paddingBottom: 26 },
  summaryRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  summaryLabel: { fontSize: 14, color: colors.body, fontWeight: "600" },
  summaryValue: { fontSize: 20, fontWeight: "800", color: colors.ink },
  summaryHint: { fontSize: 11, color: colors.muted, marginTop: 4 },
});
