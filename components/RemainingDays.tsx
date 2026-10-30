"use client";

import { useSyncExternalStore } from "react";
import {
  formatRemainingDays,
  remainingCampaignDays,
} from "@/lib/format";

function subscribe() {
  return () => {};
}

function getNow() {
  return Date.now();
}

function getServerNow() {
  return 0;
}

/** Client-only remaining-days label (avoids `Date.now()` during RSC prerender). */
export function RemainingDays({
  end,
  className,
}: {
  end?: string | number | null;
  className?: string;
}) {
  const now = useSyncExternalStore(subscribe, getNow, getServerNow);
  const days = remainingCampaignDays(end, now);
  return (
    <span className={className}>{formatRemainingDays(days)}</span>
  );
}
