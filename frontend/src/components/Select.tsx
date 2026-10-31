import React from "react";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "../lib/cn";

interface SelectOption {
  value: string;
  label: React.ReactNode;
  disabled?: boolean;
}

function getOptions(children: React.ReactNode): SelectOption[] {
  return (React.Children.toArray(children) as React.ReactElement[]).flatMap((child) => {
    if (!React.isValidElement(child)) return [];
    if (child.type === "option") {
      const value = (child.props as any)?.value ?? (child.props as any)?.children;
      return [{ value: String(value ?? ""), label: (child.props as any)?.children, disabled: (child.props as any)?.disabled }];
    }
    if (child.type === "optgroup") {
      return getOptions((child.props as any)?.children);
    }
    return [];
  });
}

export function Select({ className, children, value, onChange, disabled, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  const options = getOptions(children);
  const selected = options.find((option) => option.value === String(value ?? ""));
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const select = (nextValue: string) => {
    onChange?.({ target: { value: nextValue } } as React.ChangeEvent<HTMLSelectElement>);
    setOpen(false);
  };

  return (
    <div ref={rootRef} className={cn("relative", className?.includes("w-") ? "" : "w-full", className?.includes("sm:w-") ? "" : "")}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((current) => !current)}
        className={cn(
          "flex w-full items-center justify-between gap-3 whitespace-nowrap rounded-2xl border border-stone-200 bg-white px-4 py-3 text-left text-sm text-stone-800 shadow-sm transition hover:border-leaf-300 focus:border-leaf-500 focus:outline-none focus:ring-2 focus:ring-leaf-100 disabled:cursor-not-allowed disabled:opacity-60",
          className?.replace(/input/g, "").replace(/appearance-none/g, "")
        )}
      >
        <span className="whitespace-nowrap">{selected?.label ?? (props as any).placeholder ?? "Select"}</span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-stone-400 transition", open && "rotate-180")} />
      </button>
      {open && (
        <div className="absolute z-50 mt-2 min-w-full w-max rounded-2xl border border-stone-200 bg-white p-2 shadow-xl">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              disabled={option.disabled}
              onClick={() => select(option.value)}
              className={cn(
                "flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition",
                option.value === String(value ?? "") ? "bg-leaf-50 font-semibold text-leaf-800" : "text-stone-700 hover:bg-stone-50",
                option.disabled && "cursor-not-allowed opacity-40"
              )}
            >
              <span className="whitespace-nowrap">{option.label}</span>
              {option.value === String(value ?? "") && <Check className="h-4 w-4 shrink-0 text-leaf-600" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
