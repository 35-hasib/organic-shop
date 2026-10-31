import type { ReactNode } from "react";

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="border-b border-stone-200 bg-cream-100">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-10 sm:flex-row sm:items-end sm:justify-between sm:px-6 sm:py-12 lg:px-8">
        <div>
          <h1 className="font-display text-4xl text-stone-900 sm:text-5xl">{title}</h1>
          {subtitle && <p className="mt-2 max-w-2xl text-stone-500">{subtitle}</p>}
        </div>
        {action}
      </div>
    </div>
  );
}
