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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-5">
          <div className="flex items-start gap-3">
            <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${danger ? "bg-rose-50 text-rose-600" : "bg-leaf-50 text-leaf-700"}`}>
              <AlertTriangle className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-900">{title}</h2>
              <p className="mt-1 text-sm text-slate-500">{message}</p>
            </div>
          </div>
          <button type="button" onClick={onCancel} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex gap-3 p-5">
          <button type="button" onClick={onCancel} className="btn-secondary flex-1">{cancelLabel}</button>
          <button type="button" onClick={onConfirm} className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition ${danger ? "bg-rose-600 hover:bg-rose-700" : "bg-leaf-700 hover:bg-leaf-800"}`}>{confirmLabel}</button>
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
