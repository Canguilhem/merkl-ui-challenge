"use client";

import { useId } from "react";
import { ASSET_FILTERS } from "@/lib/merkl/constants";

// Single choice: Merkl ignores `tokens` when `stablecoin` is set, so they can't combine.
const OPTIONS = [{ value: "", label: "All" }, ...ASSET_FILTERS];

export function AssetTypeBadges({
  value,
  onChange,
  className = "",
}: {
  value?: string;
  onChange: (asset: string | undefined) => void;
  className?: string;
}) {
  const name = useId();

  return (
    <div
      className={`inline-flex flex-wrap items-center gap-1.5 ${className}`}
      role="radiogroup"
      aria-label="Asset type"
    >
      {OPTIONS.map((option) => {
        const checked = (value ?? "") === option.value;
        return (
          <label
            key={option.value}
            className={`inline-flex h-8 cursor-pointer items-center rounded-full border px-3 text-xs font-semibold tracking-wide transition has-focus-visible:ring-2 has-focus-visible:ring-ring ${
              checked
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-card text-muted-foreground hover:border-border hover:text-foreground"
            }`}
          >
            <input
              type="radio"
              name={name}
              checked={checked}
              onChange={() => onChange(option.value || undefined)}
              className="sr-only"
            />
            {option.label}
          </label>
        );
      })}
    </div>
  );
}
