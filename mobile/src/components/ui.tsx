import type { ReactNode } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type GestureResponderEvent,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { cardShadow, colors } from "../theme";
import { money } from "../lib/format";
import type { Product } from "../types";

export function Screen({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <SafeAreaView edges={["top"]} style={[styles.screen, style]}>{children}</SafeAreaView>;
}

export function ScreenHeader({
  title,
  subtitle,
  back = false,
  right,
}: {
  title: string;
  subtitle?: string;
  back?: boolean;
  right?: ReactNode;
}) {
  return (
    <View style={styles.header}>
      {back && (
        <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={10}>
          <Ionicons name="arrow-back" size={22} color={colors.ink} />
        </Pressable>
      )}
      <View style={{ flex: 1 }}>
        <Text style={styles.headerTitle}>{title}</Text>
        {subtitle ? <Text style={styles.headerSubtitle}>{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );
}

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

export function Button({
  title,
  onPress,
  variant = "primary",
  loading = false,
  disabled = false,
  icon,
  style,
}: {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  icon?: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.button,
        buttonStyles[variant],
        pressed && !isDisabled ? { opacity: 0.85 } : null,
        isDisabled ? { opacity: 0.5 } : null,
        style,
      ]}
    >
      {loading ? <ActivityIndicator color={variant === "primary" || variant === "danger" ? colors.white : colors.leaf700} /> : icon}
      <Text style={[styles.buttonText, buttonTextStyles[variant]]}>{title}</Text>
    </Pressable>
  );
}

export function TextField({
  label,
  error,
  style,
  ...props
}: TextInputProps & { label?: string; error?: string }) {
  return (
    <View style={{ gap: 6 }}>
      {label ? <Text style={styles.fieldLabel}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={colors.muted}
        style={[styles.input, error ? { borderColor: colors.danger } : null, style]}
        {...props}
      />
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

const tones = {
  success: { bg: colors.successBg, text: colors.success },
  warning: { bg: colors.warningBg, text: colors.warning },
  danger: { bg: colors.dangerBg, text: colors.danger },
  info: { bg: colors.infoBg, text: colors.info },
  neutral: { bg: colors.leaf50, text: colors.leaf700 },
} as const;

export function Badge({ label, tone = "neutral" }: { label: string; tone?: keyof typeof tones }) {
  const palette = tones[tone];
  return (
    <View style={[styles.badge, { backgroundColor: palette.bg }]}>
      <Text style={[styles.badgeText, { color: palette.text }]}>{label}</Text>
    </View>
  );
}

export function ProductCard({
  product,
  onPress,
  onAdd,
}: {
  product: Product;
  onPress: () => void;
  onAdd?: () => void;
}) {
  const hasSale = product.salePrice !== null;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.productCard, pressed ? { opacity: 0.9 } : null]}>
      <Image source={{ uri: product.images[0] }} style={styles.productImage} resizeMode="cover" />
      {hasSale ? <View style={styles.saleTag}><Text style={styles.saleText}>SALE</Text></View> : null}
      <View style={styles.productBody}>
        <Text numberOfLines={2} style={styles.productName}>{product.name}</Text>
        <Text style={styles.productUnit}>{product.unit}</Text>
        <View style={styles.productFooter}>
          <View>
            <Text style={styles.productPrice}>{money(product.effectivePrice)}</Text>
            {hasSale ? <Text style={styles.productOldPrice}>{money(product.price)}</Text> : null}
          </View>
          {onAdd ? (
            <Pressable
              onPress={(event: GestureResponderEvent) => {
                event.stopPropagation();
                onAdd();
              }}
              style={styles.addButton}
              hitSlop={8}
            >
              <Ionicons name="add" size={18} color={colors.white} />
            </Pressable>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

export function QuantityStepper({
  value,
  onChange,
  max = 99,
  compact = false,
}: {
  value: number;
  onChange: (value: number) => void;
  max?: number;
  compact?: boolean;
}) {
  return (
    <View style={[styles.stepper, compact ? styles.stepperCompact : null]}>
      <Pressable onPress={() => onChange(Math.max(1, value - 1))} style={styles.stepperButton} hitSlop={6}>
        <Ionicons name="remove" size={16} color={colors.leaf700} />
      </Pressable>
      <Text style={styles.stepperValue}>{value}</Text>
      <Pressable onPress={() => onChange(Math.min(max, value + 1))} style={styles.stepperButton} hitSlop={6}>
        <Ionicons name="add" size={16} color={colors.leaf700} />
      </Pressable>
    </View>
  );
}

export function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action ? (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text style={styles.sectionAction}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function LoadingState({ label = "Loading..." }: { label?: string }) {
  return (
    <View style={styles.state}>
      <ActivityIndicator color={colors.leaf700} size="large" />
      <Text style={styles.stateText}>{label}</Text>
    </View>
  );
}

export function EmptyState({
  title,
  text,
  action,
  onAction,
  icon = "leaf-outline",
}: {
  title: string;
  text?: string;
  action?: string;
  onAction?: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View style={styles.state}>
      <View style={styles.stateIcon}>
        <Ionicons name={icon} size={26} color={colors.leaf600} />
      </View>
      <Text style={styles.stateTitle}>{title}</Text>
      {text ? <Text style={styles.stateText}>{text}</Text> : null}
      {action && onAction ? <Button title={action} onPress={onAction} style={{ marginTop: 16, paddingHorizontal: 28 }} /> : null}
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View style={styles.state}>
      <View style={[styles.stateIcon, { backgroundColor: colors.dangerBg }]}>
        <Ionicons name="alert-circle-outline" size={26} color={colors.danger} />
      </View>
      <Text style={styles.stateTitle}>Something went wrong</Text>
      <Text style={styles.stateText}>{message}</Text>
      {onRetry ? <Button title="Try again" onPress={onRetry} style={{ marginTop: 16, paddingHorizontal: 24 }} /> : null}
    </View>
  );
}

const buttonStyles = StyleSheet.create({
  primary: { backgroundColor: colors.leaf700 },
  secondary: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border },
  ghost: { backgroundColor: "transparent" },
  danger: { backgroundColor: colors.danger },
});

const buttonTextStyles = StyleSheet.create({
  primary: { color: colors.white },
  secondary: { color: colors.leaf800 },
  ghost: { color: colors.leaf700 },
  danger: { color: colors.white },
});

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 14,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerTitle: { fontSize: 24, fontWeight: "800", color: colors.ink, letterSpacing: -0.4 },
  headerSubtitle: { fontSize: 13, color: colors.muted, marginTop: 2 },
  button: {
    minHeight: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 18,
  },
  buttonText: { fontSize: 15, fontWeight: "700" },
  fieldLabel: { fontSize: 12, fontWeight: "700", color: colors.body, textTransform: "uppercase", letterSpacing: 0.5 },
  input: {
    minHeight: 50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    paddingHorizontal: 14,
    fontSize: 15,
    color: colors.ink,
  },
  fieldError: { fontSize: 12, color: colors.danger },
  badge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, alignSelf: "flex-start" },
  badgeText: { fontSize: 11, fontWeight: "700" },
  productCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    ...cardShadow,
  },
  productImage: { width: "100%", height: 138, backgroundColor: colors.leaf50 },
  saleTag: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: colors.warning,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  saleText: { color: colors.white, fontSize: 9, fontWeight: "800", letterSpacing: 0.6 },
  productBody: { padding: 11, gap: 3 },
  productName: { fontSize: 13, fontWeight: "700", color: colors.ink, minHeight: 34, lineHeight: 17 },
  productUnit: { fontSize: 11, color: colors.muted },
  productFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 5 },
  productPrice: { fontSize: 15, fontWeight: "800", color: colors.leaf800 },
  productOldPrice: { fontSize: 10, color: colors.muted, textDecorationLine: "line-through" },
  addButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.leaf700,
    alignItems: "center",
    justifyContent: "center",
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.white,
    padding: 3,
    gap: 10,
  },
  stepperCompact: { padding: 2, gap: 6 },
  stepperButton: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: colors.leaf50,
    alignItems: "center",
    justifyContent: "center",
  },
  stepperValue: { minWidth: 24, textAlign: "center", fontWeight: "700", color: colors.ink },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginTop: 26,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: colors.ink },
  sectionAction: { fontSize: 13, fontWeight: "700", color: colors.leaf700 },
  state: { alignItems: "center", justifyContent: "center", padding: 32, gap: 8 },
  stateIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.leaf50,
    marginBottom: 4,
  },
  stateTitle: { fontSize: 17, fontWeight: "800", color: colors.ink, textAlign: "center" },
  stateText: { fontSize: 13, color: colors.muted, textAlign: "center", lineHeight: 20 },
});
