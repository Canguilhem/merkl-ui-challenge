"use client";

import Image from "next/image";
import { useState } from "react";
import { sanitizeAssetUrl } from "@/lib/format";

function initialsFor(label: string) {
  const parts = label.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

export function AssetIcon({
  src,
  label,
  size = 28,
  rounded = "md",
}: {
  src?: string | null;
  label: string;
  size?: number;
  rounded?: "md" | "full";
}) {
  const [failed, setFailed] = useState(false);
  const clean = sanitizeAssetUrl(src);
  const radius = rounded === "full" ? "rounded-full" : "rounded-md";
  const showImage = Boolean(clean) && !failed;

  if (!showImage) {
    return (
      <span
        className={`inline-flex shrink-0 items-center justify-center bg-muted font-semibold text-muted-foreground ${radius}`}
        style={{ width: size, height: size, fontSize: Math.max(9, size * 0.36) }}
        aria-hidden
        title={label}
      >
        {initialsFor(label)}
      </span>
    );
  }

  return (
    <span
      className={`relative inline-flex shrink-0 overflow-hidden ${radius}`}
      style={{ width: size, height: size }}
      title={label}
    >
      <Image
        src={clean!}
        alt=""
        width={size}
        height={size}
        className={`h-full w-full object-cover ${radius}`}
        unoptimized
        onError={() => setFailed(true)}
      />
    </span>
  );
}
