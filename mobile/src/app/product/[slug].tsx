import { useEffect, useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api, errorMessage } from "../../lib/api";
import type { Product } from "../../types";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { useLanguage } from "../../context/LanguageContext";
import { colors } from "../../theme";
import { Button, ErrorState, LoadingState, QuantityStepper, Screen, ScreenHeader } from "../../components/ui";
import { money, date } from "../../lib/format";

export default function ProductScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { user } = useAuth();
  const { add } = useCart();
  const { t, pick } = useLanguage();
  const insets = useSafeAreaInsets();
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(false);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api<{ product: Product }>(`/products/slug/${slug}`);
      setProduct(data.product);
      setSelectedImage(0);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [slug]);

  const handleAdd = async () => {
    if (!product) return;
    if (!user) {
      router.push({ pathname: "/login", params: { redirect: `/product/${slug}` } });
      return;
    }
    setAdding(true);
    try {
      await add(product.id, quantity);
      Alert.alert(t("added"), `${product.name} × ${quantity}`);
    } catch (err) {
      Alert.alert("Could not add item", errorMessage(err));
    } finally {
      setAdding(false);
    }
  };

  if (loading) return <Screen><LoadingState /></Screen>;
  if (error || !product) return <Screen><ErrorState message={error || "Product not found"} onRetry={load} /></Screen>;

  const name = pick(product.name, product.nameBn);
  const hasSale = product.salePrice !== null;
  const facts = [
    { label: pick("Ingredients", "উপাদান"), value: product.ingredients },
    { label: pick("Origin", "উৎস"), value: product.origin },
    { label: pick("Storage", "সংরক্ষণ"), value: product.storageInstructions },
    { label: pick("Quality", "মান"), value: product.certification },
  ].filter((fact) => fact.value);

  return (
    <Screen>
      <ScreenHeader title={pick("Product details", "পণ্যের বিবরণ")} back />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={styles.imageWrap}>
          {product.images.length > 0 ? (
            <Image source={{ uri: product.images[selectedImage] }} style={styles.image} resizeMode="cover" />
          ) : (
            <View style={[styles.image, styles.imagePlaceholder]}>
              <Ionicons name="leaf-outline" size={56} color={colors.leaf400} />
            </View>
          )}
          {hasSale ? <View style={styles.saleBadge}><Text style={styles.saleText}>SALE</Text></View> : null}
          {product.images.length > 1 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbs}>
              {product.images.map((image, index) => (
                <Pressable key={`${image}-${index}`} onPress={() => setSelectedImage(index)} style={[styles.thumbWrap, index === selectedImage ? styles.thumbActive : null]}>
                  <Image source={{ uri: image }} style={styles.thumb} />
                </Pressable>
              ))}
            </ScrollView>
          ) : null}
        </View>

        <View style={styles.content}>
          <View style={styles.metaRow}>
            <Text style={styles.category}>{product.category ? pick(product.category.name, product.category.nameBn) : pick("Organic", "অর্গানিক")}</Text>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={13} color="#e6a700" />
              <Text style={styles.rating}>{product.reviewCount ? `${product.ratingAverage.toFixed(1)} (${product.reviewCount})` : pick("New", "নতুন")}</Text>
            </View>
          </View>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.unit}>{product.unit}</Text>

          <View style={styles.priceRow}>
            <Text style={styles.price}>{money(product.effectivePrice)}</Text>
            {hasSale ? <Text style={styles.oldPrice}>{money(product.price)}</Text> : null}
            <View style={[styles.stockBadge, { backgroundColor: product.inStock ? colors.successBg : colors.dangerBg }]}>
              <Text style={{ color: product.inStock ? colors.success : colors.danger, fontSize: 11, fontWeight: "700" }}>
                {product.inStock ? pick("In stock", "স্টকে আছে") : pick("Out of stock", "স্টক নেই")}
              </Text>
            </View>
          </View>

          <View style={styles.qtyRow}>
            <Text style={styles.sectionLabel}>{t("quantity")}</Text>
            <QuantityStepper value={quantity} onChange={setQuantity} max={Math.max(1, Math.min(product.stock, 99))} />
          </View>

          <View style={styles.block}>
            <Text style={styles.blockTitle}>{t("description")}</Text>
            <Text style={styles.bodyText}>{pick(product.description, product.descriptionBn)}</Text>
          </View>

          {facts.length > 0 ? (
            <View style={styles.block}>
              <Text style={styles.blockTitle}>{pick("Good to know", "জেনে রাখুন")}</Text>
              <View style={styles.facts}>
                {facts.map((fact) => (
                  <View key={fact.label} style={styles.factRow}>
                    <Text style={styles.factLabel}>{fact.label}</Text>
                    <Text style={styles.factValue}>{fact.value}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {product.reviews && product.reviews.length > 0 ? (
            <View style={styles.block}>
              <Text style={styles.blockTitle}>{pick("Customer reviews", "ক্রেতাদের মতামত")}</Text>
              {product.reviews.slice(0, 4).map((review) => (
                <View key={review.id} style={styles.review}>
                  <View style={styles.reviewTop}>
                    <Text style={styles.reviewName}>{review.user.name}</Text>
                    <View style={styles.stars}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Ionicons key={star} name={star <= review.rating ? "star" : "star-outline"} size={11} color="#e6a700" />
                      ))}
                    </View>
                  </View>
                  {review.comment ? <Text style={styles.reviewText}>{review.comment}</Text> : null}
                  <Text style={styles.reviewDate}>{date(review.createdAt)}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <View>
          <Text style={styles.bottomLabel}>{pick("Total", "মোট")}</Text>
          <Text style={styles.bottomPrice}>{money(Number(product.effectivePrice) * quantity)}</Text>
        </View>
        <Button
          title={product.inStock ? t("addToCart") : pick("Out of stock", "স্টক নেই")}
          onPress={handleAdd}
          loading={adding}
          disabled={!product.inStock}
          style={{ flex: 1 }}
          icon={<Ionicons name="bag-add-outline" size={18} color={colors.white} />}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  imageWrap: { marginHorizontal: 20, borderRadius: 24, overflow: "hidden", backgroundColor: colors.leaf50 },
  image: { width: "100%", height: 340 },
  imagePlaceholder: { alignItems: "center", justifyContent: "center" },
  saleBadge: { position: "absolute", top: 14, left: 14, backgroundColor: colors.warning, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  saleText: { color: colors.white, fontSize: 10, fontWeight: "800", letterSpacing: 0.7 },
  thumbs: { gap: 8, padding: 10 },
  thumbWrap: { borderRadius: 10, borderWidth: 2, borderColor: "transparent", overflow: "hidden" },
  thumbActive: { borderColor: colors.white },
  thumb: { width: 50, height: 50 },
  content: { padding: 20 },
  metaRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  category: { fontSize: 11, fontWeight: "700", color: colors.leaf600, textTransform: "uppercase", letterSpacing: 0.7 },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  rating: { fontSize: 11, color: colors.muted, fontWeight: "600" },
  name: { fontSize: 26, lineHeight: 31, fontWeight: "800", color: colors.ink, marginTop: 8 },
  unit: { fontSize: 13, color: colors.muted, marginTop: 3 },
  priceRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 16 },
  price: { fontSize: 24, fontWeight: "800", color: colors.leaf800 },
  oldPrice: { fontSize: 14, color: colors.muted, textDecorationLine: "line-through" },
  stockBadge: { marginLeft: "auto", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  qtyRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 22, paddingVertical: 14, borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.border },
  sectionLabel: { fontSize: 14, fontWeight: "700", color: colors.ink },
  block: { marginTop: 24, gap: 8 },
  blockTitle: { fontSize: 16, fontWeight: "800", color: colors.ink },
  bodyText: { fontSize: 14, lineHeight: 22, color: colors.body },
  facts: { borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, overflow: "hidden" },
  factRow: { flexDirection: "row", justifyContent: "space-between", gap: 16, paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  factLabel: { fontSize: 12, color: colors.muted, width: 92 },
  factValue: { flex: 1, fontSize: 12, fontWeight: "600", color: colors.ink, textAlign: "right" },
  review: { borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, padding: 14, marginTop: 2, gap: 5 },
  reviewTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  reviewName: { fontSize: 13, fontWeight: "700", color: colors.ink },
  stars: { flexDirection: "row", gap: 2 },
  reviewText: { fontSize: 13, lineHeight: 19, color: colors.body },
  reviewDate: { fontSize: 10, color: colors.muted },
  bottomBar: { position: "absolute", left: 0, right: 0, bottom: 0, flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 20, paddingTop: 12, backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.border },
  bottomLabel: { fontSize: 10, color: colors.muted, textTransform: "uppercase", letterSpacing: 0.5 },
  bottomPrice: { fontSize: 18, fontWeight: "800", color: colors.ink },
});
