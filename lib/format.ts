const usdCompact = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1,
});

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const usdFine = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

export function formatUsd(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return "—";
  return Math.abs(value) >= 1000 ? usdCompact.format(value) : usd.format(value);
}

export function formatApr(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return "—";
  // Merkl returns APR as a percent number (e.g. 4.75 = 4.75%), not a ratio.
  return `${value.toFixed(2)}%`;
}

/**
 * APR shown in the product UI.
 * Merkl `apr` is incentive-only; `totalApr` matches app.merkl.xyz (protocol + Merkl).
 */
export function displayApr(opportunity: {
  apr?: number | null;
  totalApr?: number | null;
  nativeApr?: number | null;
}) {
  if (opportunity.totalApr != null && Number.isFinite(opportunity.totalApr)) {
    return opportunity.totalApr;
  }
  if (opportunity.nativeApr != null && Number.isFinite(opportunity.nativeApr)) {
    return opportunity.nativeApr;
  }
  return opportunity.apr ?? null;
}

/**
 * Expected daily rewards for $1k deposited.
 * Prefer live Merkl pool rate when the daily pool is > 0; else APR/365.
 */
export function dailyRewardsPer1k(input: {
  dailyRewards?: number | null;
  tvl?: number | null;
  apr?: number | null;
}) {
  const { dailyRewards, tvl, apr } = input;
  if (
    tvl != null &&
    tvl > 0 &&
    dailyRewards != null &&
    Number.isFinite(dailyRewards) &&
    dailyRewards > 0
  ) {
    return (dailyRewards / tvl) * 1000;
  }
  if (apr != null && Number.isFinite(apr) && apr > 0) {
    return ((apr / 100) * 1000) / 365;
  }
  return null;
}

export function formatDailyPer1k(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return "—";
  if (value >= 1) return `${usdFine.format(value)}/d`;
  if (value >= 0.01) return `${usdFine.format(value)}/d`;
  if (value > 0) return "<$0.01/d";
  return "$0/d";
}

/** Parse Merkl campaign timestamps (unix seconds). */
export function parseMerklUnix(value: string | number | null | undefined) {
  if (value == null || value === "") return null;
  const seconds = Number(value);
  if (!Number.isFinite(seconds) || seconds <= 0) return null;
  return seconds * 1000;
}

/**
 * Remaining whole days until campaign end.
 * Pass `nowMs` from the caller — RSC must not call `Date.now()` during prerender.
 */
export function remainingCampaignDays(
  latestCampaignEnd?: string | number | null,
  nowMs: number = 0,
) {
  const endMs = parseMerklUnix(latestCampaignEnd);
  if (endMs == null) return null;
  return Math.ceil((endMs - nowMs) / 86_400_000);
}

export function formatRemainingDays(days: number | null | undefined) {
  if (days == null || Number.isNaN(days)) return "—";
  if (days < 0) return "Ended";
  if (days === 0) return "<1d";
  if (days === 1) return "1d";
  return `${days}d`;
}

/** Merkl occasionally returns asset URLs with trailing whitespace. */
export function sanitizeAssetUrl(url: string | null | undefined) {
  const trimmed = url?.trim();
  return trimmed || undefined;
}
