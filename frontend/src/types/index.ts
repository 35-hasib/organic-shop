export type Role = "ADMIN" | "CUSTOMER";
export type OrderStatus = "PENDING" | "CONFIRMED" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED" | "RETURNED";
export type PaymentStatus = "UNPAID" | "PAID" | "REFUNDED";

export interface User {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: Role;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  nameBn: string;
  slug: string;
  description?: string | null;
  descriptionBn?: string | null;
  imageUrl?: string | null;
  parentId?: string | null;
  active: boolean;
  sortOrder: number;
  children?: Category[];
  _count?: { products: number };
}

export interface Review {
  id: string;
  rating: number;
  comment?: string | null;
  createdAt: string;
  user: { name: string };
}

export interface Product {
  id: string;
  name: string;
  nameBn: string;
  slug: string;
  sku: string;
  description: string;
  descriptionBn: string;
  ingredients?: string | null;
  ingredientsBn?: string | null;
  origin?: string | null;
  originBn?: string | null;
  storageInstructions?: string | null;
  storageInstructionsBn?: string | null;
  certification?: string | null;
  certificationBn?: string | null;
  categoryId: string;
  category?: Pick<Category, "id" | "name" | "nameBn" | "slug">;
  price: string;
  salePrice: string | null;
  effectivePrice: string;
  unit: string;
  stock: number;
  lowStockThreshold: number;
  images: string[];
  published: boolean;
  featured: boolean;
  inStock: boolean;
  ratingAverage: number;
  reviewCount: number;
  reviews?: Review[];
  createdAt: string;
  orderItems?: { id: string; quantity: number }[];
  _count?: { orderItems: number; reviews: number };
}

export interface CartItem {
  id: string;
  quantity: number;
  unitPrice: string;
  lineTotal: string;
  product: Product;
}

export interface Cart {
  items: CartItem[];
  count: number;
  subtotal: string;
}

export interface Address {
  id: string;
  label: string;
  recipientName: string;
  phone: string;
  division: string;
  district: string;
  area: string;
  addressLine: string;
  postalCode?: string | null;
  isDefault: boolean;
}

export interface DeliveryArea {
  id: string;
  name: string;
  nameBn: string;
  division: string;
  district: string;
  charge: string;
  freeDeliveryThreshold: string | null;
  active: boolean;
  sortOrder: number;
}

export interface Coupon {
  id: string;
  code: string;
  description?: string | null;
  type: "PERCENTAGE" | "FIXED";
  value: string;
  minOrderAmount: string;
  maxDiscount?: string | null;
  usageLimit?: number | null;
  usedCount: number;
  perCustomerLimit: number;
  startsAt?: string | null;
  expiresAt?: string | null;
  active: boolean;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productNameBn: string;
  unit: string;
  price: string;
  salePrice: string | null;
  quantity: number;
  lineTotal: string;
  imageUrl?: string | null;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentMethod: string;
  paymentStatus: PaymentStatus;
  subtotal: string;
  discount: string;
  deliveryFee: string;
  total: string;
  couponCode?: string | null;
  shippingName: string;
  shippingPhone: string;
  shippingDivision: string;
  shippingDistrict: string;
  shippingArea: string;
  shippingAddress: string;
  shippingPostalCode?: string | null;
  note?: string | null;
  createdAt: string;
  deliveredAt?: string | null;
  cancelledAt?: string | null;
  items: OrderItem[];
  statusHistory?: { id: string; status: OrderStatus; note?: string | null; createdAt: string }[];
  requests?: { id: string; type: string; status: string; reason: string; adminNote?: string | null; createdAt: string }[];
}

export interface Banner {
  id: string;
  title: string;
  titleBn: string;
  subtitle?: string | null;
  subtitleBn?: string | null;
  imageUrl: string;
  link?: string | null;
  sortOrder: number;
  active: boolean;
}

export interface Settings {
  [key: string]: string;
}
