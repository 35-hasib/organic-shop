export function money(value: number | string | null | undefined) {
  const amount = Number(value || 0);
  return `৳${amount.toLocaleString("en-BD", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export function date(value: string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function dateTime(value: string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function todayInput(offset = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
}

export const ORDER_STATUSES = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "RETURNED"] as const;

export const NEXT_STATUSES: Record<string, string[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED", "RETURNED"],
  DELIVERED: ["RETURNED"],
  CANCELLED: [],
  RETURNED: [],
};

export function statusLabel(status: string) {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

export function statusColor(status: string) {
  switch (status) {
    case "DELIVERED":
    case "PAID":
    case "APPROVED":
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";
    case "SHIPPED":
    case "PROCESSING":
      return "bg-blue-50 text-blue-700 ring-blue-200";
    case "CONFIRMED":
      return "bg-amber-50 text-amber-700 ring-amber-200";
    case "CANCELLED":
    case "RETURNED":
    case "REJECTED":
      return "bg-rose-50 text-rose-700 ring-rose-200";
    case "REFUNDED":
      return "bg-purple-50 text-purple-700 ring-purple-200";
    default:
      return "bg-slate-100 text-slate-600 ring-slate-200";
  }
}
