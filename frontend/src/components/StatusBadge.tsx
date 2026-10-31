import { statusColor, statusLabel } from "../lib/format";
import { useLanguage } from "../context/LanguageContext";

export function StatusBadge({ status }: { status: string }) {
  const { lang } = useLanguage();
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${statusColor(status)}`}>
      {statusLabel(status, lang)}
    </span>
  );
}
