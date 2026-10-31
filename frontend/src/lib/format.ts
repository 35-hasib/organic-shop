export function money(value: number | string | null | undefined) {
  const amount = Number(value || 0);
  return `৳${amount.toLocaleString("en-BD", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export function date(value: string | null | undefined, lang = "en") {
  if (!value) return "";
  return new Date(value).toLocaleDateString(lang === "bn" ? "bn-BD" : "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function dateTime(value: string | null | undefined, lang = "en") {
  if (!value) return "";
  return new Date(value).toLocaleString(lang === "bn" ? "bn-BD" : "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function discountPercent(price: string, salePrice: string | null) {
  if (!salePrice) return 0;
  return Math.round(((Number(price) - Number(salePrice)) / Number(price)) * 100);
}

export function statusLabel(status: string, lang = "en") {
  const labels: Record<string, [string, string]> = {
    PENDING: ["Pending", "অপেক্ষমাণ"],
    CONFIRMED: ["Confirmed", "নিশ্চিত"],
    PROCESSING: ["Processing", "প্রস্তুত হচ্ছে"],
    SHIPPED: ["Shipped", "পাঠানো হয়েছে"],
    DELIVERED: ["Delivered", "ডেলিভারি হয়েছে"],
    CANCELLED: ["Cancelled", "বাতিল"],
    RETURNED: ["Returned", "ফেরত"],
    UNPAID: ["Unpaid", "অপরিশোধিত"],
    PAID: ["Paid", "পরিশোধিত"],
    REFUNDED: ["Refunded", "ফেরত দেওয়া হয়েছে"],
    APPROVED: ["Approved", "অনুমোদিত"],
    REJECTED: ["Rejected", "প্রত্যাখ্যাত"],
  };
  const pair = labels[status] || [status, status];
  return lang === "bn" ? pair[1] : pair[0];
}

export function statusColor(status: string) {
  switch (status) {
    case "DELIVERED":
    case "PAID":
    case "APPROVED":
      return "bg-leaf-100 text-leaf-700";
    case "SHIPPED":
    case "PROCESSING":
      return "bg-blue-50 text-blue-700";
    case "CONFIRMED":
      return "bg-amber-50 text-amber-700";
    case "CANCELLED":
    case "RETURNED":
    case "REJECTED":
      return "bg-red-50 text-red-700";
    case "REFUNDED":
      return "bg-purple-50 text-purple-700";
    default:
      return "bg-stone-100 text-stone-700";
  }
}

export function idempotencyKey() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `ord-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}
