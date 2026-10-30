"use client";

import { ToggleBadges } from "@/components/ToggleBadges";
import { ASSET_FILTERS } from "@/lib/merkl/constants";

export function AssetTypeBadges({
  value,
  onChange,
  className = "",
}: {
  value?: string;
  onChange: (asset: string | undefined) => void;
  className?: string;
}) {
  return (
    <ToggleBadges
      value={value}
      options={ASSET_FILTERS}
      onChange={onChange}
      ariaLabel="Asset type"
      className={className}
    />
  );
}
