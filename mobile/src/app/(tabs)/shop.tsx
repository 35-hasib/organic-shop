import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api, errorMessage } from "../../lib/api";
import type { Category, Product } from "../../types";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { useLanguage } from "../../context/LanguageContext";
import { colors } from "../../theme";
import { EmptyState, ErrorState, LoadingState, ProductCard, Screen, ScreenHeader } from "../../components/ui";

export default function ShopScreen() {
  const params = useLocalSearchParams<{ category?: string }>();
  const { user } = useAuth();
  const { add } = useCart();
  const { t, pick } = useLanguage();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [category, setCategory] = useState(params.category || "");
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (params.category && params.category !== category) setCategory(params.category);
  }, [params.category]);

  useEffect(() => {
    api<{ categories: Category[] }>("/categories?flat=1")
      .then((data) => setCategories(data.categories))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    loadPage(1, true);
  }, [category, appliedSearch]);

  const loadPage = async (nextPage: number, replace: boolean) => {
    if (replace) setLoading(true);
    else setLoadingMore(true);
    setError("");
    try {
      const query = [
        `page=${nextPage}`,
        "pageSize=12",
        category ? `category=${encodeURIComponent(category)}` : "",
        appliedSearch ? `q=${encodeURIComponent(appliedSearch)}` : "",
      ].filter(Boolean).join("&");
      const data = await api<{ products: Product[]; total: number }>(`/products?${query}`);
      setProducts((current) => (replace ? data.products : [...current, ...data.products]));
      setTotal(data.total);
      setPage(nextPage);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  const submitSearch = () => {
    setAppliedSearch(search.trim());
  };

  const handleAdd = async (product: Product) => {
    if (!user) {
      router.push({ pathname: "/login", params: { redirect: "/(tabs)/shop" } });
      return;
    }
    try {
      await add(product.id);
      Alert.alert(t("added"), product.name);
    } catch (err) {
      Alert.alert("Could not add item", errorMessage(err));
    }
  };

  const header = (
    <View style={styles.filters}>
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={colors.muted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={submitSearch}
            returnKeyType="search"
            placeholder={t("search")}
            placeholderTextColor={colors.muted}
            style={styles.searchInput}
          />
          {search ? (
            <Pressable onPress={() => { setSearch(""); setAppliedSearch(""); }} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={colors.muted} />
            </Pressable>
          ) : null}
        </View>
        <Pressable onPress={submitSearch} style={styles.searchButton}>
          <Ionicons name="arrow-forward" size={19} color={colors.white} />
        </Pressable>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        <Pressable onPress={() => setCategory("")} style={[styles.chip, category === "" ? styles.chipActive : null]}>
          <Text style={[styles.chipText, category === "" ? styles.chipTextActive : null]}>{t("all")}</Text>
        </Pressable>
        {categories.map((item) => (
          <Pressable key={item.id} onPress={() => setCategory(item.slug)} style={[styles.chip, category === item.slug ? styles.chipActive : null]}>
            <Text style={[styles.chipText, category === item.slug ? styles.chipTextActive : null]}>{pick(item.name, item.nameBn)}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <View style={styles.countRow}>
        <Text style={styles.countText}>{total} {pick("products", "পণ্য")}</Text>
        {appliedSearch ? <Text style={styles.countText}>“{appliedSearch}”</Text> : null}
      </View>
    </View>
  );

  return (
    <Screen>
      <ScreenHeader title={t("shop")} subtitle={pick("Good food, grown right", "ভালো খাবার, সঠিক চাষে")} />
      {loading ? <LoadingState /> : error ? <ErrorState message={error} onRetry={() => loadPage(1, true)} /> : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          numColumns={2}
          ListHeaderComponent={header}
          columnWrapperStyle={styles.columns}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadPage(1, true); }} tintColor={colors.leaf700} />}
          onEndReached={() => {
            if (!loadingMore && products.length < total) loadPage(page + 1, false);
          }}
          onEndReachedThreshold={0.4}
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              onPress={() => router.push(`/product/${item.slug}`)}
              onAdd={() => handleAdd(item)}
            />
          )}
          ListEmptyComponent={<EmptyState title={t("noProducts")} text={pick("Try another search or category.", "অন্য কিছু খুঁজুন বা ক্যাটাগরি বদলান।")} />}
          ListFooterComponent={loadingMore ? <ActivityIndicator color={colors.leaf700} style={{ marginVertical: 20 }} /> : undefined}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  filters: { paddingHorizontal: 20, paddingBottom: 12 },
  searchRow: { flexDirection: "row", gap: 8 },
  searchBox: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8, minHeight: 48, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, borderRadius: 14, paddingHorizontal: 14 },
  searchInput: { flex: 1, fontSize: 14, color: colors.ink, paddingVertical: 12 },
  searchButton: { width: 48, height: 48, borderRadius: 14, backgroundColor: colors.leaf700, alignItems: "center", justifyContent: "center" },
  chips: { gap: 8, paddingTop: 14 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border },
  chipActive: { backgroundColor: colors.leaf700, borderColor: colors.leaf700 },
  chipText: { fontSize: 12, fontWeight: "600", color: colors.body },
  chipTextActive: { color: colors.white },
  countRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 14 },
  countText: { fontSize: 11, color: colors.muted, fontWeight: "600" },
  list: { paddingHorizontal: 20, paddingBottom: 30 },
  columns: { gap: 12, marginBottom: 12 },
});
