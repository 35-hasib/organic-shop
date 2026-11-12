import { useEffect, useState } from "react";
import { Alert, Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api, errorMessage } from "../../lib/api";
import { connectSocket, mergeOrderUpdate, type OrderRealtimePayload } from "../../lib/socket";
import type { Order } from "../../types";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { colors } from "../../theme";
import { Badge, Button, ErrorState, LoadingState, Screen, ScreenHeader } from "../../components/ui";
import { dateTime, money, statusLabel, statusTone } from "../../lib/format";

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { t, pick } = useLanguage();
  const insets = useSafeAreaInsets();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const data = await api<{ order: Order }>(`/orders/${id}`, { auth: true });
      setOrder(data.order);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    load();
  }, [id, user?.id]);

  useEffect(() => {
    if (!order?.orderNumber) return;
    const orderNumber = order.orderNumber;
    const socket = connectSocket();
    const subscribe = () => {
      socket.emit("order:subscribe", orderNumber);
    };
    const handleUpdate = (payload: OrderRealtimePayload) => {
      setOrder((previous) => mergeOrderUpdate(previous, payload));
    };
    subscribe();
    socket.on("connect", subscribe);
    socket.on("order:status", handleUpdate);
    socket.on("order:payment", handleUpdate);
    socket.on("order:updated", handleUpdate);
    return () => {
      socket.emit("order:unsubscribe", orderNumber);
      socket.off("connect", subscribe);
      socket.off("order:status", handleUpdate);
      socket.off("order:payment", handleUpdate);
      socket.off("order:updated", handleUpdate);
    };
  }, [order?.orderNumber]);

  const confirmCancel = () => {
    if (!order) return;
    Alert.alert(pick("Cancel this order?", "অর্ডারটি বাতিল করবেন?"), pick("Stock will be returned to the shop.", "স্টক আবার শপে ফিরে যাবে।"), [
      { text: pick("Keep order", "অর্ডার রাখুন"), style: "cancel" },
      {
        text: pick("Cancel order", "অর্ডার বাতিল"),
        style: "destructive",
        onPress: async () => {
          setCancelling(true);
          try {
            const data = await api<{ order: Order }>(`/orders/${order.id}/cancel`, { method: "POST", auth: true, body: {} });
            setOrder(data.order);
          } catch (err) {
            Alert.alert("Could not cancel order", errorMessage(err));
          } finally {
            setCancelling(false);
          }
        },
      },
    ]);
  };

  if (loading) return <Screen><LoadingState /></Screen>;
  if (error || !order) return <Screen><ScreenHeader title={pick("Order", "অর্ডার")} back /><ErrorState message={error || "Order not found"} onRetry={load} /></Screen>;

  const cancellable = ["PENDING", "CONFIRMED", "PROCESSING"].includes(order.status);

  return (
    <Screen>
      <ScreenHeader title={order.orderNumber} subtitle={dateTime(order.createdAt)} back />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: cancellable ? 100 : 40 }}>
        <View style={styles.statusCard}>
          <View>
            <Text style={styles.statusLabel}>{pick("ORDER STATUS", "অর্ডারের অবস্থা")}</Text>
            <Text style={styles.statusTitle}>{statusLabel(order.status)}</Text>
            <Text style={styles.statusHint}>{pick("Payment", "পেমেন্ট")}: {statusLabel(order.paymentStatus)} · {order.paymentMethod}</Text>
          </View>
          <Badge label={statusLabel(order.status)} tone={statusTone(order.status)} />
        </View>

        <Text style={styles.sectionTitle}>{pick("Items", "পণ্যসমূহ")}</Text>
        <View style={styles.card}>
          {order.items.map((item) => (
            <View key={item.id} style={styles.item}>
              {item.imageUrl ? <Image source={{ uri: item.imageUrl }} style={styles.image} /> : <View style={[styles.image, styles.imagePlaceholder]}><Ionicons name="leaf-outline" size={20} color={colors.leaf400} /></View>}
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>{pick(item.productName, item.productNameBn)}</Text>
                <Text style={styles.itemMeta}>{item.quantity} × {money(item.salePrice || item.price)} · {item.unit}</Text>
              </View>
              <Text style={styles.itemTotal}>{money(item.lineTotal)}</Text>
            </View>
          ))}
          <View style={styles.totals}>
            <View style={styles.row}><Text style={styles.rowLabel}>{t("subtotal")}</Text><Text style={styles.rowValue}>{money(order.subtotal)}</Text></View>
            {Number(order.discount) > 0 ? <View style={styles.row}><Text style={[styles.rowLabel, { color: colors.success }]}>{pick("Discount", "ডিসকাউন্ট")} {order.couponCode ? `(${order.couponCode})` : ""}</Text><Text style={[styles.rowValue, { color: colors.success }]}>-{money(order.discount)}</Text></View> : null}
            <View style={styles.row}><Text style={styles.rowLabel}>{t("delivery")}</Text><Text style={styles.rowValue}>{money(order.deliveryFee)}</Text></View>
            <View style={[styles.row, styles.totalRow]}><Text style={styles.totalLabel}>{t("total")}</Text><Text style={styles.totalValue}>{money(order.total)}</Text></View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>{pick("Delivery details", "ডেলিভারি তথ্য")}</Text>
        <View style={styles.card}>
          <Text style={styles.addressName}>{order.shippingName}</Text>
          <Text style={styles.addressText}>{order.shippingAddress}, {order.shippingArea}, {order.shippingDistrict}, {order.shippingDivision}</Text>
          <Text style={styles.addressPhone}>{order.shippingPhone}</Text>
          {order.note ? <Text style={styles.note}>{pick("Note", "নোট")}: {order.note}</Text> : null}
        </View>

        {order.statusHistory && order.statusHistory.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>{pick("Timeline", "সময়রেখা")}</Text>
            <View style={styles.card}>
              {order.statusHistory.map((entry, index) => (
                <View key={entry.id} style={styles.timelineRow}>
                  <View style={styles.timelineMark}>
                    <View style={[styles.timelineDot, index === order.statusHistory!.length - 1 ? { backgroundColor: colors.leaf600 } : null]} />
                    {index < order.statusHistory!.length - 1 ? <View style={styles.timelineLine} /> : null}
                  </View>
                  <View style={{ flex: 1, paddingBottom: index < order.statusHistory!.length - 1 ? 18 : 0 }}>
                    <Text style={styles.timelineTitle}>{statusLabel(entry.status)}</Text>
                    <Text style={styles.timelineDate}>{dateTime(entry.createdAt)}</Text>
                    {entry.note ? <Text style={styles.timelineNote}>{entry.note}</Text> : null}
                  </View>
                </View>
              ))}
            </View>
          </>
        ) : null}

        {order.requests && order.requests.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>{pick("Requests", "অনুরোধ")}</Text>
            <View style={styles.card}>
              {order.requests.map((request) => (
                <View key={request.id} style={styles.request}>
                  <View style={styles.row}>
                    <Text style={styles.requestType}>{request.type}</Text>
                    <Badge label={statusLabel(request.status)} tone={statusTone(request.status)} />
                  </View>
                  <Text style={styles.addressText}>{request.reason}</Text>
                  {request.adminNote ? <Text style={styles.timelineNote}>{pick("Admin", "অ্যাডমিন")}: {request.adminNote}</Text> : null}
                </View>
              ))}
            </View>
          </>
        ) : null}
      </ScrollView>

      {cancellable ? (
        <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <Button title={pick("Cancel order", "অর্ডার বাতিল করুন")} variant="danger" onPress={confirmCancel} loading={cancelling} style={{ flex: 1 }} />
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  statusCard: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, borderRadius: 20, backgroundColor: colors.leaf800, padding: 18 },
  statusLabel: { fontSize: 9, fontWeight: "800", color: colors.leaf300, letterSpacing: 1 },
  statusTitle: { fontSize: 24, fontWeight: "800", color: colors.white, marginTop: 3 },
  statusHint: { fontSize: 11, color: colors.leaf200, marginTop: 4 },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: colors.ink, marginTop: 22, marginBottom: 10 },
  card: { borderRadius: 18, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, padding: 14, gap: 2 },
  item: { flexDirection: "row", gap: 10, alignItems: "center", paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  image: { width: 48, height: 48, borderRadius: 10, backgroundColor: colors.leaf50 },
  imagePlaceholder: { alignItems: "center", justifyContent: "center" },
  itemName: { fontSize: 13, fontWeight: "700", color: colors.ink },
  itemMeta: { fontSize: 11, color: colors.muted, marginTop: 2 },
  itemTotal: { fontSize: 13, fontWeight: "800", color: colors.leaf800 },
  totals: { marginTop: 8, gap: 8 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  rowLabel: { fontSize: 12, color: colors.body },
  rowValue: { fontSize: 12, fontWeight: "600", color: colors.ink },
  totalRow: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10, marginTop: 2 },
  totalLabel: { fontSize: 15, fontWeight: "800", color: colors.ink },
  totalValue: { fontSize: 19, fontWeight: "800", color: colors.leaf800 },
  addressName: { fontSize: 14, fontWeight: "800", color: colors.ink },
  addressText: { fontSize: 12, lineHeight: 18, color: colors.body, marginTop: 4 },
  addressPhone: { fontSize: 12, color: colors.muted, marginTop: 3 },
  note: { fontSize: 11, color: colors.warning, backgroundColor: colors.warningBg, padding: 8, borderRadius: 8, marginTop: 8 },
  timelineRow: { flexDirection: "row", gap: 10 },
  timelineMark: { alignItems: "center", width: 14 },
  timelineDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.leaf200, marginTop: 4 },
  timelineLine: { width: 2, flex: 1, backgroundColor: colors.border, marginTop: 3 },
  timelineTitle: { fontSize: 13, fontWeight: "700", color: colors.ink },
  timelineDate: { fontSize: 10, color: colors.muted, marginTop: 2 },
  timelineNote: { fontSize: 11, color: colors.body, marginTop: 2 },
  request: { paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border, gap: 5 },
  requestType: { fontSize: 13, fontWeight: "800", color: colors.ink },
  bottomBar: { position: "absolute", left: 0, right: 0, bottom: 0, backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.border, paddingHorizontal: 20, paddingTop: 12 },
});
