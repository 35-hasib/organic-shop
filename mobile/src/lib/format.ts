export function money(value: number | string | null | undefined) {
  return `৳${Number(value || 0).toLocaleString("en-BD", { maximumFractionDigits: 2 })}`;
}

export function date(value: string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function dateTime(value: string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function statusLabel(status: string) {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

export function statusTone(status: string) {
  switch (status) {
    case "DELIVERED":
    case "PAID":
    case "APPROVED":
      return "success";
    case "SHIPPED":
    case "PROCESSING":
      return "info";
    case "CONFIRMED":
      return "warning";
    case "CANCELLED":
    case "RETURNED":
    case "REJECTED":
      return "danger";
    default:
      return "neutral";
  }
}
