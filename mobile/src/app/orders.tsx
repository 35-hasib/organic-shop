import { useEffect, useState } from "react";
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api, errorMessage } from "../lib/api";
import type { Order } from "../types";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { colors } from "../theme";
import { Badge, EmptyState, ErrorState, LoadingState, Screen, ScreenHeader } from "../components/ui";
import { date, money, statusLabel, statusTone } from "../lib/format";

export default function OrdersScreen() {
  const { user } = useAuth();
  const { t, pick } = useLanguage();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) router.replace({ pathname: "/login", params: { redirect: "/orders" } });
  }, [user]);

  const load = async () => {
    if (!user) return;
    setError("");
    try {
      const data = await api<{ orders: Order[] }>("/orders?pageSize=50", { auth: true });
      setOrders(data.orders);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user) load();
  }, [user?.id]);

  if (!user || loading) return <Screen><LoadingState /></Screen>;

  return (
    <Screen>
      <ScreenHeader title={t("orders")} subtitle={pick("Track every delivery", "প্রতিটি ডেলিভারি ট্র্যাক করুন")} back right={<Pressable onPress={load} style={styles.refresh}><Ionicons name="refresh" size={18} color={colors.leaf700} /></Pressable>} />
      {error ? <ErrorState message={error} onRetry={load} /> : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.leaf700} />}
          ListEmptyComponent={<EmptyState title={pick("No orders yet", "এখনো কোনো অর্ডার নেই")} text={pick("Your first order will appear here.", "আপনার প্রথম অর্ডার এখানে দেখা যাবে।")} action={t("continueShopping")} onAction={() => router.push("/(tabs)/shop")} icon="receipt-outline" />}
          renderItem={({ item }) => (
            <Pressable onPress={() => router.push(`/order/${item.id}`)} style={({ pressed }) => [styles.card, pressed ? { opacity: 0.9 } : null]}>
              <View style={styles.cardTop}>
                <View>
                  <Text style={styles.number}>{item.orderNumber}</Text>
                  <Text style={styles.date}>{date(item.createdAt)}</Text>
                </View>
                <Badge label={statusLabel(item.status)} tone={statusTone(item.status)} />
              </View>
              <Text style={styles.items} numberOfLines={1}>
                {item.items.map((line) => `${line.productName} × ${line.quantity}`).join(", ")}
              </Text>
              <View style={styles.cardBottom}>
                <Text style={styles.itemCount}>{item.items.length} {pick("items", "পণ্য")}</Text>
                <View style={styles.totalRow}>
                  <Text style={styles.total}>{money(item.total)}</Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.muted} />
                </View>
              </View>
            </Pressable>
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  refresh: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
  list: { padding: 20, paddingBottom: 40, gap: 12 },
  card: { borderRadius: 18, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, padding: 16 },
  cardTop: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 10 },
  number: { fontSize: 14, fontWeight: "800", color: colors.ink },
  date: { fontSize: 11, color: colors.muted, marginTop: 3 },
  items: { fontSize: 12, color: colors.body, marginTop: 12 },
  cardBottom: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border },
  itemCount: { fontSize: 11, color: colors.muted },
  totalRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  total: { fontSize: 16, fontWeight: "800", color: colors.leaf800 },
});
