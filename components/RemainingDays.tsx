"use client";

import {
  formatRemainingDays,
  remainingCampaignDays,
} from "@/lib/format";
import { useNow } from "@/lib/use-now";

/** Client-only remaining-days label (avoids `Date.now()` during RSC prerender). */
export function RemainingDays({
  end,
  className,
}: {
  end?: string | number | null;
  className?: string;
}) {
  const days = remainingCampaignDays(end, useNow());
  return (
    <span className={className}>{formatRemainingDays(days)}</span>
  );
}
