import { Minus, Plus } from "lucide-react";

export function QuantityInput({
  value,
  onChange,
  max = 99,
  min = 1,
  compact = false,
}: {
  value: number;
  onChange: (value: number) => void;
  max?: number;
  min?: number;
  compact?: boolean;
}) {
  return (
    <div className={`inline-flex items-center rounded-full border border-stone-300 bg-white ${compact ? "h-9" : "h-11"}`}>
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className="flex h-full w-9 items-center justify-center text-stone-500 hover:text-leaf-700 disabled:opacity-30"
        aria-label="Decrease quantity"
      >
        <Minus className="h-3.5 w-3.5" />
      </button>
      <span className={`min-w-8 text-center font-semibold text-stone-800 ${compact ? "text-sm" : ""}`}>{value}</span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className="flex h-full w-9 items-center justify-center text-stone-500 hover:text-leaf-700 disabled:opacity-30"
        aria-label="Increase quantity"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
