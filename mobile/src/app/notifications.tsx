import { useEffect, useState } from "react";
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api, errorMessage } from "../lib/api";
import type { Notification } from "../types";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { colors } from "../theme";
import { EmptyState, ErrorState, LoadingState, Screen, ScreenHeader } from "../components/ui";
import { dateTime } from "../lib/format";

export default function NotificationsScreen() {
  const { user } = useAuth();
  const { t, pick } = useLanguage();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const unread = notifications.filter((item) => !item.read).length;

  useEffect(() => {
    if (!user) router.replace({ pathname: "/login", params: { redirect: "/notifications" } });
  }, [user]);

  const load = async () => {
    if (!user) return;
    setError("");
    try {
      const data = await api<{ notifications: Notification[] }>("/notifications?pageSize=50", { auth: true });
      setNotifications(data.notifications);
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

  const markRead = async (notification: Notification) => {
    if (notification.read) return;
    setNotifications((current) => current.map((item) => item.id === notification.id ? { ...item, read: true } : item));
    try {
      await api(`/notifications/${notification.id}/read`, { method: "PATCH", auth: true });
    } catch {
      setNotifications((current) => current.map((item) => item.id === notification.id ? { ...item, read: false } : item));
    }
  };

  const readAll = async () => {
    try {
      await api("/notifications/read-all", { method: "POST", auth: true });
      setNotifications((current) => current.map((item) => ({ ...item, read: true })));
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  if (!user || loading) return <Screen><LoadingState /></Screen>;

  return (
    <Screen>
      <ScreenHeader
        title={t("notifications")}
        subtitle={unread > 0 ? `${unread} ${pick("unread", "অপঠিত")}` : pick("You are all caught up", "সব পড়া হয়েছে")}
        back
        right={unread > 0 ? <Pressable onPress={readAll} style={styles.readAll}><Text style={styles.readAllText}>{pick("Read all", "সব পড়ুন")}</Text></Pressable> : undefined}
      />
      {error ? <ErrorState message={error} onRetry={load} /> : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.leaf700} />}
          ListEmptyComponent={<EmptyState title={pick("No notifications", "কোনো নোটিফিকেশন নেই")} text={pick("Order updates and offers will appear here.", "অর্ডার আপডেট ও অফার এখানে দেখা যাবে।")} icon="notifications-outline" />}
          renderItem={({ item }) => (
            <Pressable onPress={() => markRead(item)} style={[styles.card, !item.read ? styles.unreadCard : null]}>
              <View style={[styles.icon, !item.read ? styles.iconUnread : null]}>
                <Ionicons name={item.read ? "notifications-outline" : "notifications"} size={19} color={item.read ? colors.muted : colors.leaf700} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.titleRow}>
                  <Text style={[styles.title, !item.read ? styles.titleUnread : null]}>{item.title}</Text>
                  {!item.read ? <View style={styles.dot} /> : null}
                </View>
                <Text style={styles.message}>{item.message}</Text>
                <Text style={styles.date}>{dateTime(item.createdAt)}</Text>
              </View>
            </Pressable>
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  readAll: { borderRadius: 999, backgroundColor: colors.leaf50, paddingHorizontal: 12, paddingVertical: 8 },
  readAllText: { fontSize: 11, fontWeight: "800", color: colors.leaf700 },
  list: { padding: 20, paddingBottom: 40, gap: 10 },
  card: { flexDirection: "row", gap: 10, borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, padding: 14 },
  unreadCard: { borderColor: colors.leaf200, backgroundColor: colors.leaf50 },
  icon: { width: 36, height: 36, borderRadius: 11, backgroundColor: colors.creamDeep, alignItems: "center", justifyContent: "center" },
  iconUnread: { backgroundColor: colors.white },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  title: { flex: 1, fontSize: 13, fontWeight: "600", color: colors.body },
  titleUnread: { fontWeight: "800", color: colors.ink },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.leaf600 },
  message: { fontSize: 12, color: colors.body, lineHeight: 18, marginTop: 4 },
  date: { fontSize: 10, color: colors.muted, marginTop: 6 },
});
