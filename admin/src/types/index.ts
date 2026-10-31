export type Role = "ADMIN" | "CUSTOMER";
export type OrderStatus = "PENDING" | "CONFIRMED" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED" | "RETURNED";

export interface User {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: Role;
  active?: boolean;
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
  category?: Category;
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
  createdAt: string;
  _count?: { orderItems: number; reviews: number };
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

export interface StatusHistory {
  id: string;
  status: OrderStatus;
  note?: string | null;
  createdAt: string;
  editor?: { name: string } | null;
}

export interface OrderRequest {
  id: string;
  type: "RETURN" | "REFUND";
  status: "PENDING" | "APPROVED" | "REJECTED";
  reason: string;
  adminNote?: string | null;
  createdAt: string;
  order?: { id: string; orderNumber: string; status: OrderStatus; total: string };
  user?: { id: string; name: string; email: string | null; phone: string | null };
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
  shippingPostalCode?: string | null;
  note?: string | null;
  createdAt: string;
  deliveredAt?: string | null;
  cancelledAt?: string | null;
  items: OrderItem[];
  user?: User;
  statusHistory?: StatusHistory[];
  requests?: OrderRequest[];
}

export interface Customer extends User {
  _count?: { orders: number };
  totalSpent?: string;
  lastOrderAt?: string | null;
  addresses?: { id: string; label: string; addressLine: string; area: string; district: string; division: string; phone: string }[];
  orders?: Order[];
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
  createdAt: string;
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

export interface ContactMessage {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  subject: string;
  message: string;
  handled: boolean;
  createdAt: string;
}

export interface InventoryMovement {
  id: string;
  type: string;
  quantity: number;
  referenceType?: string | null;
  referenceId?: string | null;
  note?: string | null;
  createdAt: string;
  editor?: { name: string } | null;
}

export interface Stats {
  revenue: string;
  orders: number;
  pendingOrders: number;
  customers: number;
  products: number;
  lowStock: number;
  averageOrderValue: string;
  statusCounts: Record<string, number>;
  dailySales: { date: string; revenue: string }[];
  topProducts: { name: string; quantity: number; revenue: string }[];
  recentOrders: Order[];
}

export interface Report {
  from: string;
  to: string;
  orderCount: number;
  validOrderCount: number;
  revenue: string;
  averageOrderValue: string;
  daily: { date: string; revenue: string }[];
  products: { name: string; quantity: number; revenue: string }[];
  orders: Order[];
}

export type Settings = Record<string, string>;
