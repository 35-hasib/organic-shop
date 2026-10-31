import type { ReactNode } from "react";

export function SectionHeading({
  eyebrow,
  title,
  text,
  action,
  center = false,
}: {
  eyebrow?: string;
  title: string;
  text?: string;
  action?: ReactNode;
  center?: boolean;
}) {
  return (
    <div className={`mb-8 flex flex-col gap-4 sm:flex-row sm:items-end ${center ? "sm:flex-col sm:items-center sm:text-center" : "sm:justify-between"}`}>
      <div className={center ? "max-w-2xl" : ""}>
        {eyebrow && <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-leaf-600">{eyebrow}</p>}
        <h2 className="font-display text-3xl text-stone-900 sm:text-4xl">{title}</h2>
        {text && <p className="mt-2 max-w-xl text-stone-500">{text}</p>}
      </div>
      {action}
    </div>
  );
}
