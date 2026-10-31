export type OrderStatus = "PENDING" | "CONFIRMED" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED" | "RETURNED";

export interface User {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: "ADMIN" | "CUSTOMER";
  createdAt?: string;
}

export interface Category {
  id: string;
  name: string;
  nameBn: string;
  slug: string;
  imageUrl?: string | null;
  description?: string | null;
  children?: Category[];
  _count?: { products: number };
}

export interface Review {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  user: { name: string };
}

export interface Product {
  id: string;
  name: string;
  nameBn: string;
  slug: string;
  description: string;
  descriptionBn: string;
  ingredients?: string | null;
  origin?: string | null;
  storageInstructions?: string | null;
  certification?: string | null;
  price: string;
  salePrice: string | null;
  effectivePrice: string;
  unit: string;
  stock: number;
  images: string[];
  featured: boolean;
  inStock: boolean;
  ratingAverage: number;
  reviewCount: number;
  category?: Pick<Category, "id" | "name" | "nameBn" | "slug">;
  reviews?: Review[];
}

export interface Banner {
  id: string;
  title: string;
  titleBn: string;
  subtitle?: string | null;
  subtitleBn?: string | null;
  imageUrl: string;
  link?: string | null;
}

export interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  product: Product;
  unitPrice: string;
  lineTotal: string;
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
}

export interface OrderItem {
  id: string;
  productName: string;
  productNameBn: string;
  unit: string;
  price: string;
  salePrice: string | null;
  quantity: number;
  lineTotal: string;
  imageUrl?: string | null;
}

export interface StatusHistory {
  id: string;
  status: OrderStatus;
  note?: string | null;
  createdAt: string;
}

export interface OrderRequest {
  id: string;
  type: "RETURN" | "REFUND";
  status: "PENDING" | "APPROVED" | "REJECTED";
  reason: string;
  adminNote?: string | null;
  createdAt: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentMethod: string;
  paymentStatus: "UNPAID" | "PAID" | "REFUNDED";
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
  note?: string | null;
  createdAt: string;
  items: OrderItem[];
  statusHistory?: StatusHistory[];
  requests?: OrderRequest[];
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}
