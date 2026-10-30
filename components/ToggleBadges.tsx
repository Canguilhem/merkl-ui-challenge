"use client";

import { parseCsv } from "@/lib/merkl/query";

export function ToggleBadges({
  value,
  options,
  onChange,
  ariaLabel,
  className = "",
}: {
  value?: string;
  options: readonly { value: string; label: string }[];
  onChange: (next: string | undefined) => void;
  ariaLabel: string;
  className?: string;
}) {
  const selected = parseCsv(value);

  const toggle = (key: string) => {
    const next = selected.includes(key)
      ? selected.filter((item) => item !== key)
      : [...selected, key];
    onChange(next.length ? next.join(",") : undefined);
  };

  return (
    <div
      className={`inline-flex flex-wrap items-center gap-1.5 ${className}`}
      role="group"
      aria-label={ariaLabel}
    >
      {options.map((badge) => {
        const active = selected.includes(badge.value);
        return (
          <button
            key={badge.value}
            type="button"
            aria-pressed={active}
            onClick={() => toggle(badge.value)}
            className={`inline-flex h-8 cursor-pointer items-center rounded-full border px-3 text-xs font-semibold tracking-wide transition ${
              active
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-card text-muted-foreground hover:border-border hover:text-foreground"
            }`}
          >
            {badge.label}
          </button>
        );
      })}
    </div>
  );
}
