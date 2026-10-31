import { useEffect, useRef, useState } from "react";
import { AlertTriangle, X } from "lucide-react";

interface ConfirmModalProps {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({ title, message, confirmLabel = "Confirm", cancelLabel = "Cancel", danger = true, onConfirm, onCancel }: ConfirmModalProps) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onCancel]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/45 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-stone-100 p-6">
          <div className="flex items-start gap-3">
            <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${danger ? "bg-rose-50 text-rose-600" : "bg-leaf-50 text-leaf-700"}`}>
              <AlertTriangle className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-display text-xl text-stone-900">{title}</h2>
              <p className="mt-1 text-sm text-stone-500">{message}</p>
            </div>
          </div>
          <button type="button" onClick={onCancel} className="rounded-xl p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-700" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex gap-3 p-6">
          <button type="button" onClick={onCancel} className="btn-secondary flex-1">{cancelLabel}</button>
          <button type="button" onClick={onConfirm} className={`flex-1 rounded-full px-4 py-3 text-sm font-semibold text-white transition ${danger ? "bg-rose-600 hover:bg-rose-700" : "bg-leaf-700 hover:bg-leaf-800"}`}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

export function useConfirm() {
  const [state, setState] = useState<{ title: string; message: string; confirmLabel?: string; cancelLabel?: string; danger?: boolean } | null>(null);
  const resolver = useRef<((value: boolean) => void) | null>(null);

  const confirm = (options: { title: string; message: string; confirmLabel?: string; cancelLabel?: string; danger?: boolean }) =>
    new Promise<boolean>((resolve) => {
      resolver.current = resolve;
      setState(options);
    });

  const close = (value: boolean) => {
    resolver.current?.(value);
    resolver.current = null;
    setState(null);
  };

  const modal = state ? (
    <ConfirmModal title={state.title} message={state.message} confirmLabel={state.confirmLabel} cancelLabel={state.cancelLabel} danger={state.danger} onConfirm={() => close(true)} onCancel={() => close(false)} />
  ) : null;

  return { confirm, modal };
}
