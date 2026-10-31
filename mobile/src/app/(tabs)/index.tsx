import { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  Image,
  ImageBackground,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api, errorMessage } from "../../lib/api";
import type { Banner, Category, Product } from "../../types";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { useLanguage } from "../../context/LanguageContext";
import { colors } from "../../theme";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  ProductCard,
  Screen,
  SectionHeader,
} from "../../components/ui";

const screenWidth = Dimensions.get("window").width;
const heroWidth = screenWidth - 40;

export default function HomeScreen() {
  const { user } = useAuth();
  const { add } = useCart();
  const { t, pick } = useLanguage();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [featured, setFeatured] = useState<Product[]>([]);
  const [fresh, setFresh] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setError("");
    try {
      const [bannerData, categoryData, featuredData, freshData] = await Promise.all([
        api<{ banners: Banner[] }>("/banners"),
        api<{ categories: Category[] }>("/categories"),
        api<{ products: Product[] }>("/products?featured=1&pageSize=6"),
        api<{ products: Product[] }>("/products?pageSize=8&sort=newest"),
      ]);
      setBanners(bannerData.banners);
      setCategories(categoryData.categories);
      setFeatured(featuredData.products);
      setFresh(freshData.products);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleAdd = async (product: Product) => {
    if (!user) {
      router.push({ pathname: "/login", params: { redirect: "/(tabs)" } });
      return;
    }
    try {
      await add(product.id);
      Alert.alert(t("added"), product.name);
    } catch (err) {
      Alert.alert("Could not add item", errorMessage(err));
    }
  };

  if (loading) return <Screen><LoadingState /></Screen>;
  if (error) return <Screen><ErrorState message={error} onRetry={() => { setLoading(true); load(); }} /></Screen>;

  const cardWidth = (screenWidth - 52) / 2;

  return (
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.leaf700} />}
      >
        <View style={styles.topBar}>
          <View style={styles.brand}>
            <View style={styles.logo}><Ionicons name="leaf" size={20} color={colors.white} /></View>
            <View>
              <Text style={styles.brandName}>{pick("Organic Shop", "অর্গানিক শপ")}</Text>
              <Text style={styles.brandHint}>{pick("Farm fresh, every day", "প্রতিদিন খামারের টাটকা")}</Text>
            </View>
          </View>
          <Pressable onPress={() => router.push("/notifications")} style={styles.iconButton}>
            <Ionicons name="notifications-outline" size={21} color={colors.ink} />
          </Pressable>
        </View>

        <View style={{ paddingHorizontal: 20 }}>
          <Text style={styles.eyebrow}>{pick("FRESH FROM THE SOURCE", "সরাসরি খামার থেকে")}</Text>
          <Text style={styles.heroTitle}>{pick("Good food,\ngrown right.", "ভালো খাবার,\nসঠিকভাবে চাষকৃত।")}</Text>
        </View>

        {banners.length > 0 ? (
          <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}>
            {banners.map((banner) => (
              <Pressable key={banner.id} onPress={() => router.push("/(tabs)/shop")} style={{ width: heroWidth, height: 190 }}>
                <ImageBackground source={{ uri: banner.imageUrl }} style={styles.banner} imageStyle={styles.bannerImage}>
                  <View style={styles.bannerOverlay} />
                  <View style={styles.bannerContent}>
                    <Text style={styles.bannerTag}>{pick("THIS WEEK", "এই সপ্তাহে")}</Text>
                    <Text style={styles.bannerTitle}>{pick(banner.title, banner.titleBn)}</Text>
                    {banner.subtitle ? <Text style={styles.bannerSubtitle}>{pick(banner.subtitle, banner.subtitleBn || banner.subtitle)}</Text> : null}
                    <View style={styles.bannerButton}>
                      <Text style={styles.bannerButtonText}>{t("shop")}</Text>
                      <Ionicons name="arrow-forward" size={14} color={colors.white} />
                    </View>
                  </View>
                </ImageBackground>
              </Pressable>
            ))}
          </ScrollView>
        ) : (
          <View style={{ paddingHorizontal: 20 }}>
            <View style={[styles.banner, { backgroundColor: colors.leaf800 }]}>
              <View style={styles.bannerOverlay} />
              <View style={styles.bannerContent}>
                <Text style={styles.bannerTag}>{pick("ORGANIC", "অর্গানিক")}</Text>
                <Text style={styles.bannerTitle}>{pick("Pure, local and seasonal", "খাঁটি, স্থানীয় ও মৌসুমি")}</Text>
                <Pressable style={styles.bannerButton} onPress={() => router.push("/(tabs)/shop")}>
                  <Text style={styles.bannerButtonText}>{t("shop")}</Text>
                  <Ionicons name="arrow-forward" size={14} color={colors.white} />
                </Pressable>
              </View>
            </View>
          </View>
        )}

        <SectionHeader title={t("categories")} action={t("viewAll")} onAction={() => router.push("/(tabs)/shop")} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 14 }}>
          {categories.map((category) => (
            <Pressable
              key={category.id}
              onPress={() => router.push({ pathname: "/(tabs)/shop", params: { category: category.slug } })}
              style={styles.category}
            >
              {category.imageUrl ? (
                <Image source={{ uri: category.imageUrl }} style={styles.categoryImage} />
              ) : (
                <View style={[styles.categoryImage, styles.categoryPlaceholder]}>
                  <Ionicons name="nutrition-outline" size={24} color={colors.leaf600} />
                </View>
              )}
              <Text numberOfLines={1} style={styles.categoryName}>{pick(category.name, category.nameBn)}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {featured.length > 0 ? (
          <>
            <SectionHeader title={t("featured")} action={t("viewAll")} onAction={() => router.push("/(tabs)/shop")} />
            <View style={styles.grid}>
              {featured.map((product) => (
                <View key={product.id} style={{ width: cardWidth }}>
                  <ProductCard
                    product={product}
                    onPress={() => router.push(`/product/${product.slug}`)}
                    onAdd={() => handleAdd(product)}
                  />
                </View>
              ))}
            </View>
          </>
        ) : null}

        <SectionHeader title={t("freshPicks")} action={t("viewAll")} onAction={() => router.push("/(tabs)/shop")} />
        {fresh.length === 0 ? (
          <EmptyState title={t("noProducts")} />
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}>
            {fresh.map((product) => (
              <View key={product.id} style={{ width: 162 }}>
                <ProductCard
                  product={product}
                  onPress={() => router.push(`/product/${product.slug}`)}
                  onAdd={() => handleAdd(product)}
                />
              </View>
            ))}
          </ScrollView>
        )}

        <View style={styles.promise}>
          <View style={styles.promiseItem}>
            <Ionicons name="leaf-outline" size={20} color={colors.leaf600} />
            <Text style={styles.promiseTitle}>{pick("Certified organic", "সার্টিফাইড অর্গানিক")}</Text>
            <Text style={styles.promiseText}>{pick("No harmful chemicals", "ক্ষতিকর রাসায়নিক মুক্ত")}</Text>
          </View>
          <View style={styles.promiseItem}>
            <Ionicons name="bicycle-outline" size={20} color={colors.leaf600} />
            <Text style={styles.promiseTitle}>{pick("Fast delivery", "দ্রুত ডেলিভারি")}</Text>
            <Text style={styles.promiseText}>{pick("Across Dhaka city", "ঢাকা শহরজুড়ে")}</Text>
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 8, paddingBottom: 20 },
  brand: { flexDirection: "row", alignItems: "center", gap: 10 },
  logo: { width: 38, height: 38, borderRadius: 12, backgroundColor: colors.leaf700, alignItems: "center", justifyContent: "center" },
  brandName: { fontSize: 16, fontWeight: "800", color: colors.ink },
  brandHint: { fontSize: 10, color: colors.muted, marginTop: 1 },
  iconButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
  eyebrow: { fontSize: 10, fontWeight: "800", letterSpacing: 1.4, color: colors.leaf600 },
  heroTitle: { fontSize: 34, lineHeight: 38, fontWeight: "800", color: colors.ink, letterSpacing: -1, marginTop: 6, marginBottom: 18 },
  banner: { borderRadius: 22, overflow: "hidden", justifyContent: "flex-end" },
  bannerImage: { borderRadius: 22 },
  bannerOverlay: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, backgroundColor: "rgba(17,34,15,0.48)" },
  bannerContent: { padding: 20 },
  bannerTag: { fontSize: 9, fontWeight: "800", letterSpacing: 1.4, color: colors.leaf200 },
  bannerTitle: { fontSize: 24, fontWeight: "800", color: colors.white, marginTop: 5, maxWidth: "85%" },
  bannerSubtitle: { fontSize: 12, color: "#e6ede2", marginTop: 4, maxWidth: "85%" },
  bannerButton: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", backgroundColor: colors.leaf600, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 9, marginTop: 14 },
  bannerButtonText: { color: colors.white, fontSize: 12, fontWeight: "700" },
  category: { alignItems: "center", width: 74, gap: 7 },
  categoryImage: { width: 64, height: 64, borderRadius: 22, backgroundColor: colors.leaf50 },
  categoryPlaceholder: { alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.leaf100 },
  categoryName: { fontSize: 11, fontWeight: "600", color: colors.body, textAlign: "center" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12, paddingHorizontal: 20 },
  promise: { flexDirection: "row", gap: 12, marginHorizontal: 20, marginTop: 30, backgroundColor: colors.leaf50, borderRadius: 20, padding: 18 },
  promiseItem: { flex: 1, gap: 5 },
  promiseTitle: { fontSize: 12, fontWeight: "700", color: colors.ink },
  promiseText: { fontSize: 11, color: colors.muted, lineHeight: 16 },
});
