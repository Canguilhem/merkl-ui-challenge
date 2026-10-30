"use client";

import { useEffect, useState } from "react";
import { Slider } from "@/components/ui/slider";
import {
  TVL_RANGE_MAX_INDEX,
  formatTvlBound,
  indicesToTvlParams,
  tvlParamsToIndices,
} from "@/lib/merkl/constants";

const DEBOUNCE_MS = 300;

export function TvlRangeFilter({
  minimumTvl,
  maximumTvl,
  onChange,
  className = "",
}: {
  minimumTvl?: string;
  maximumTvl?: string;
  onChange: (next: {
    minimumTvl?: string;
    maximumTvl?: string;
  }) => void;
  className?: string;
}) {
  const urlIndices = tvlParamsToIndices(minimumTvl, maximumTvl);
  const [indices, setIndices] = useState(urlIndices);
  const [urlKey, setUrlKey] = useState(`${minimumTvl ?? ""}|${maximumTvl ?? ""}`);

  if (`${minimumTvl ?? ""}|${maximumTvl ?? ""}` !== urlKey) {
    setUrlKey(`${minimumTvl ?? ""}|${maximumTvl ?? ""}`);
    setIndices(urlIndices);
  }

  useEffect(() => {
    const handle = window.setTimeout(() => {
      const next = indicesToTvlParams(indices);
      const sameMin = (next.minimumTvl ?? "") === (minimumTvl ?? "");
      const sameMax = (next.maximumTvl ?? "") === (maximumTvl ?? "");
      if (sameMin && sameMax) return;
      onChange(next);
    }, DEBOUNCE_MS);

    return () => window.clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- debounce local draft only
  }, [indices]);

  const [minIndex, maxIndex] = indices;

  return (
    <div className={`min-w-[12rem] space-y-1.5 ${className}`}>
      <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
        <span>TVL</span>
        <span className="tabular-nums text-foreground/85">
          {formatTvlBound(minIndex, "min")} – {formatTvlBound(maxIndex, "max")}
        </span>
      </div>
      <Slider
        min={0}
        max={TVL_RANGE_MAX_INDEX}
        step={1}
        value={indices}
        onValueChange={(value) => {
          if (!Array.isArray(value) || value.length < 2) return;
          const nextMin = Math.min(value[0], value[1]);
          const nextMax = Math.max(value[0], value[1]);
          setIndices([nextMin, nextMax]);
        }}
        aria-label="TVL range"
        className="w-full"
      />
    </div>
  );
}
