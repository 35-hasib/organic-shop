import { Sprout } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

export function Loading({ label }: { label?: string }) {
  const { t } = useLanguage();
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 text-stone-500">
      <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-leaf-100">
        <Sprout className="h-7 w-7 animate-pulse text-leaf-600" />
      </div>
      <p className="text-sm">{label || t("common.loading")}</p>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const { t } = useLanguage();
  return (
    <div className="mx-auto flex min-h-[40vh] max-w-md flex-col items-center justify-center gap-4 text-center">
      <p className="text-stone-600">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-primary">
          {t("common.tryAgain")}
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title, text, action }: { title: string; text?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-stone-300 bg-white/60 px-6 py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-cream-200">
        <Sprout className="h-7 w-7 text-leaf-600" />
      </div>
      <h3 className="font-display text-2xl text-stone-800">{title}</h3>
      {text && <p className="mt-2 max-w-md text-sm text-stone-500">{text}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
