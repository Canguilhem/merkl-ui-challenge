"use client";

import { useEffect, useId, useRef, useState } from "react";
import { AssetIcon } from "@/components/AssetIcon";
import { parseCsv } from "@/lib/merkl/query";

export type FilterSelectOption = {
  value: string;
  label: string;
  icon?: string | null;
};

function joinCsv(values: string[]) {
  return values.join(",");
}

export function FilterSelect({
  label,
  value,
  options,
  onChange,
  multiple = false,
  emptyLabel = "All",
  className = "",
}: {
  label: string;
  /** Single value, or comma-separated values when `multiple`. */
  value: string;
  options: FilterSelectOption[];
  onChange: (value: string) => void;
  multiple?: boolean;
  emptyLabel?: string;
  className?: string;
}) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const selectedValues = multiple ? parseCsv(value) : value ? [value] : [];
  const selectedOptions = options.filter((option) =>
    selectedValues.includes(option.value),
  );

  const triggerLabel = (() => {
    if (selectedOptions.length === 0) return emptyLabel;
    if (!multiple) return selectedOptions[0]?.label ?? label;
    if (selectedOptions.length === 1) return selectedOptions[0].label;
    return `${selectedOptions.length} selected`;
  })();

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const toggle = (optionValue: string) => {
    if (!multiple) {
      onChange(optionValue);
      setOpen(false);
      return;
    }

    const next = selectedValues.includes(optionValue)
      ? selectedValues.filter((item) => item !== optionValue)
      : [...selectedValues, optionValue];
    onChange(joinCsv(next));
  };

  const clearAll = () => {
    onChange("");
    if (!multiple) setOpen(false);
  };

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((current) => !current)}
        className={`inline-flex h-8 min-w-[7.5rem] cursor-pointer items-center justify-between gap-2 rounded-md border bg-card px-2.5 text-left text-sm transition hover:border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 ${
          selectedValues.length > 0
            ? "border-primary/40 text-foreground"
            : "border-border text-foreground"
        }`}
      >
        <span className="flex min-w-0 items-center gap-1.5">
          {multiple && selectedOptions[0]?.icon ? (
            <span className="flex shrink-0 -space-x-1">
              {selectedOptions.slice(0, 3).map((option) => (
                <AssetIcon
                  key={option.value}
                  src={option.icon}
                  label={option.label}
                  size={14}
                  rounded="full"
                />
              ))}
            </span>
          ) : !multiple && selectedOptions[0]?.icon ? (
            <AssetIcon
              src={selectedOptions[0].icon}
              label={selectedOptions[0].label}
              size={14}
              rounded="full"
            />
          ) : null}
          <span className="truncate">{triggerLabel}</span>
        </span>
        <svg
          viewBox="0 0 12 12"
          className={`h-3 w-3 shrink-0 text-muted-foreground transition ${open ? "rotate-180" : ""}`}
          aria-hidden
        >
          <path
            d="M2.5 4.5 6 8l3.5-3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open ? (
        <ul
          id={listId}
          role="listbox"
          aria-label={label}
          aria-multiselectable={multiple || undefined}
          className="absolute left-0 z-30 mt-1 max-h-64 min-w-full overflow-auto rounded-lg border border-border bg-card py-1 shadow-lg shadow-black/30"
        >
          <li>
            <button
              type="button"
              role="option"
              aria-selected={selectedValues.length === 0}
              className={`flex w-full cursor-pointer items-center justify-between gap-3 px-3 py-1.5 text-left text-sm transition hover:bg-muted ${
                selectedValues.length === 0
                  ? "font-medium text-primary"
                  : "text-foreground/85"
              }`}
              onClick={clearAll}
            >
              <span className="truncate">{emptyLabel}</span>
              {selectedValues.length === 0 ? (
                <span className="text-primary" aria-hidden>
                  ✓
                </span>
              ) : null}
            </button>
          </li>
          {options.map((option) => {
            const isSelected = selectedValues.includes(option.value);
            return (
              <li key={option.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  className={`flex w-full cursor-pointer items-center justify-between gap-3 px-3 py-1.5 text-left text-sm transition hover:bg-muted ${
                    isSelected
                      ? "font-medium text-primary"
                      : "text-foreground/85"
                  }`}
                  onClick={() => toggle(option.value)}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    {option.icon ? (
                      <AssetIcon
                        src={option.icon}
                        label={option.label}
                        size={16}
                        rounded="full"
                      />
                    ) : null}
                    <span className="truncate">{option.label}</span>
                  </span>
                  {isSelected ? (
                    <span className="text-primary" aria-hidden>
                      ✓
                    </span>
                  ) : multiple ? (
                    <span
                      className="size-3.5 shrink-0 rounded border border-border"
                      aria-hidden
                    />
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
