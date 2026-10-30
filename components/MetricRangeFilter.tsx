"use client";

import { useEffect, useState } from "react";
import { Slider } from "@/components/ui/slider";

const DEBOUNCE_MS = 300;

export function MetricRangeFilter({
  label,
  minKey,
  maxKey,
  minValue,
  maxValue,
  steps,
  formatBound,
  onChange,
  className = "",
}: {
  label: string;
  minKey: string;
  maxKey: string;
  minValue?: string;
  maxValue?: string;
  steps: readonly number[];
  formatBound: (index: number, edge: "min" | "max") => string;
  onChange: (next: Record<string, string | undefined>) => void;
  className?: string;
}) {
  const maxIndex = steps.length - 1;

  const toIndices = (min?: string, max?: string): [number, number] => {
    const minNum = min ? Number(min) : steps[0];
    const maxNum = max ? Number(max) : steps[maxIndex];
    const minIndex = steps.findIndex((step) => step >= minNum);
    const maxIdx = [...steps]
      .map((step, index) => ({ step, index }))
      .reverse()
      .find((entry) => entry.step <= maxNum)?.index;
    return [minIndex === -1 ? 0 : minIndex, maxIdx ?? maxIndex];
  };

  const toParams = (indices: [number, number]) => {
    const [minIndex, maxI] = indices;
    return {
      [minKey]: minIndex > 0 ? String(steps[minIndex]) : undefined,
      [maxKey]: maxI < maxIndex ? String(steps[maxI]) : undefined,
    };
  };

  const urlIndices = toIndices(minValue, maxValue);
  const [indices, setIndices] = useState(urlIndices);
  const [urlKey, setUrlKey] = useState(`${minValue ?? ""}|${maxValue ?? ""}`);

  if (`${minValue ?? ""}|${maxValue ?? ""}` !== urlKey) {
    setUrlKey(`${minValue ?? ""}|${maxValue ?? ""}`);
    setIndices(urlIndices);
  }

  useEffect(() => {
    const handle = window.setTimeout(() => {
      const next = toParams(indices);
      const sameMin = (next[minKey] ?? "") === (minValue ?? "");
      const sameMax = (next[maxKey] ?? "") === (maxValue ?? "");
      if (sameMin && sameMax) return;
      onChange(next);
    }, DEBOUNCE_MS);

    return () => window.clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- debounce local draft only
  }, [indices]);

  const [minIndex, maxI] = indices;

  return (
    <div className={`min-w-[12rem] space-y-1.5 ${className}`}>
      <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
        <span>{label}</span>
        <span className="tabular-nums text-foreground/85">
          {formatBound(minIndex, "min")} – {formatBound(maxI, "max")}
        </span>
      </div>
      <Slider
        min={0}
        max={maxIndex}
        step={1}
        value={indices}
        onValueChange={(value) => {
          if (!Array.isArray(value) || value.length < 2) return;
          setIndices([Math.min(value[0], value[1]), Math.max(value[0], value[1])]);
        }}
        aria-label={`${label} range`}
        className="w-full"
      />
    </div>
  );
}
