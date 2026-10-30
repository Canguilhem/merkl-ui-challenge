export const MERKL_API_BASE = "https://api.merkl.xyz/v4";

export const OPPORTUNITY_ACTIONS = [
  "POOL",
  "HOLD",
  "DROP",
  "LEND",
  "BORROW",
  "LONG",
  "SHORT",
  "SWAP",
  "STAKE",
] as const;

export const OPPORTUNITY_STATUSES = ["LIVE", "SOON", "PAST"] as const;

export const DEFAULT_PAGE_SIZE = 20;

export const DEFAULT_SORT = "tvl" as const;
export const DEFAULT_ORDER = "desc" as const;

/** Column ids that map 1:1 to Merkl `sort`, except dailyRewards → rewards. */
export const SORTABLE_COLUMNS = ["apr", "tvl", "dailyRewards"] as const;

/** Merkl accepts: apr | tvl | rewards | maxDailyRewards | lastCampaignCreatedAt. */
export const MERKL_NATIVE_SORTS = new Set([
  "apr",
  "tvl",
  "rewards",
  "maxDailyRewards",
  "lastCampaignCreatedAt",
]);

/** Merkl `tokenTypes` — POINT / PRETGE campaigns (comma-separated). */
export const TOKEN_TYPE_FILTERS = [
  { value: "POINT", label: "Points" },
  { value: "PRETGE", label: "Pre-TGE" },
] as const;

export type TokenTypeFilterValue = (typeof TOKEN_TYPE_FILTERS)[number]["value"];

/** UI asset focus → Merkl query params (stablecoin / tokens). */
export const ASSET_FILTERS = [
  { value: "stablecoin", label: "Stablecoins" },
  { value: "eth", label: "ETH" },
  { value: "btc", label: "BTC" },
] as const;

export type AssetFilterValue = (typeof ASSET_FILTERS)[number]["value"];

export const ASSET_TO_MERKL: Record<
  AssetFilterValue,
  { stablecoin?: boolean; tokens?: string }
> = {
  stablecoin: { stablecoin: true },
  eth: { tokens: "ETH,WETH" },
  btc: { tokens: "BTC,WBTC,cbBTC,tBTC" },
};

/** Resolve one or more UI asset keys (`stablecoin,eth`) into Merkl params. */
export function resolveAssetParams(asset: string | undefined) {
  const selected = (asset ?? "")
    .split(",")
    .map((part) => part.trim())
    .filter((part): part is AssetFilterValue =>
      part === "stablecoin" || part === "eth" || part === "btc",
    );

  if (selected.length === 0) return {};

  let stablecoin = false;
  const tokens = new Set<string>();

  for (const key of selected) {
    const mapped = ASSET_TO_MERKL[key];
    if (mapped.stablecoin) stablecoin = true;
    if (mapped.tokens) {
      for (const symbol of mapped.tokens.split(",")) tokens.add(symbol);
    }
  }

  return {
    ...(stablecoin ? { stablecoin: true as const } : {}),
    ...(tokens.size > 0 ? { tokens: [...tokens].join(",") } : {}),
  };
}

/** Merkl mins just above 0 — exclude empty metrics without a coarse floor. */
export const ZERO_FLOOR_TVL = 1;
export const ZERO_FLOOR_APR = 0.01;
export const ZERO_FLOOR_DAILY = 1;

/** Discrete TVL ladder for the range slider (avoids a useless linear 0→$1B scale). */
export const TVL_STEPS = [
  0,
  ZERO_FLOOR_TVL,
  10_000,
  50_000,
  100_000,
  250_000,
  500_000,
  1_000_000,
  5_000_000,
  10_000_000,
  50_000_000,
  100_000_000,
  500_000_000,
  1_000_000_000,
] as const;

export const TVL_RANGE_MAX_INDEX = TVL_STEPS.length - 1;

const tvlCompact = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1,
});

export function formatTvlBound(index: number, edge: "min" | "max") {
  const clamped = Math.min(Math.max(index, 0), TVL_RANGE_MAX_INDEX);
  if (edge === "min" && clamped === 0) return "Any";
  if (edge === "max" && clamped === TVL_RANGE_MAX_INDEX) return "Any";
  if (edge === "min" && TVL_STEPS[clamped] === ZERO_FLOOR_TVL) return ">$0";
  return tvlCompact.format(TVL_STEPS[clamped]);
}

export function tvlParamsToIndices(
  minimumTvl?: string,
  maximumTvl?: string,
): [number, number] {
  const minValue = minimumTvl ? Number(minimumTvl) : 0;
  const maxValue = maximumTvl ? Number(maximumTvl) : TVL_STEPS[TVL_RANGE_MAX_INDEX];

  const minIndex = TVL_STEPS.findIndex((step) => step >= minValue);
  const maxIndex = [...TVL_STEPS]
    .map((step, index) => ({ step, index }))
    .reverse()
    .find((entry) => entry.step <= maxValue)?.index;

  return [
    minIndex === -1 ? 0 : minIndex,
    maxIndex ?? TVL_RANGE_MAX_INDEX,
  ];
}

export function indicesToTvlParams(indices: [number, number]): {
  minimumTvl?: string;
  maximumTvl?: string;
} {
  const [minIndex, maxIndex] = indices;
  return {
    minimumTvl:
      minIndex > 0 ? String(TVL_STEPS[minIndex]) : undefined,
    maximumTvl:
      maxIndex < TVL_RANGE_MAX_INDEX ? String(TVL_STEPS[maxIndex]) : undefined,
  };
}

export function formatTvlRangeLabel(
  minimumTvl?: string,
  maximumTvl?: string,
) {
  if (!minimumTvl && !maximumTvl) return null;
  const [minIndex, maxIndex] = tvlParamsToIndices(minimumTvl, maximumTvl);
  return `TVL ${formatTvlBound(minIndex, "min")}–${formatTvlBound(maxIndex, "max")}`;
}

/** Discrete APR ladder (%). */
export const APR_STEPS = [
  0,
  ZERO_FLOOR_APR,
  0.5,
  1,
  2,
  5,
  10,
  20,
  50,
  100,
  250,
  500,
  1_000,
  5_000,
  50_000,
] as const;

export const APR_RANGE_MAX_INDEX = APR_STEPS.length - 1;

export function formatAprBound(index: number, edge: "min" | "max") {
  const clamped = Math.min(Math.max(index, 0), APR_RANGE_MAX_INDEX);
  if (edge === "min" && clamped === 0) return "Any";
  if (edge === "max" && clamped === APR_RANGE_MAX_INDEX) return "Any";
  const value = APR_STEPS[clamped];
  if (edge === "min" && value === ZERO_FLOOR_APR) return ">0%";
  return value >= 100 ? `${value.toFixed(0)}%` : `${value}%`;
}

export function formatAprRangeLabel(
  minimumApr?: string,
  maximumApr?: string,
) {
  if (!minimumApr && !maximumApr) return null;
  const minValue = minimumApr ? Number(minimumApr) : 0;
  const maxValue = maximumApr
    ? Number(maximumApr)
    : APR_STEPS[APR_RANGE_MAX_INDEX];
  const minIndex = APR_STEPS.findIndex((step) => step >= minValue);
  const maxIndex =
    [...APR_STEPS]
      .map((step, index) => ({ step, index }))
      .reverse()
      .find((entry) => entry.step <= maxValue)?.index ?? APR_RANGE_MAX_INDEX;
  return `APR ${formatAprBound(minIndex === -1 ? 0 : minIndex, "min")}–${formatAprBound(maxIndex, "max")}`;
}

/** Discrete daily rewards ladder (USD). */
export const DAILY_REWARDS_STEPS = [
  0,
  ZERO_FLOOR_DAILY,
  10,
  50,
  100,
  250,
  500,
  1_000,
  5_000,
  10_000,
  50_000,
  100_000,
  500_000,
  5_000_000,
] as const;

export const DAILY_REWARDS_RANGE_MAX_INDEX = DAILY_REWARDS_STEPS.length - 1;

const dailyCompact = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1,
});

export function formatDailyRewardsBound(index: number, edge: "min" | "max") {
  const clamped = Math.min(Math.max(index, 0), DAILY_REWARDS_RANGE_MAX_INDEX);
  if (edge === "min" && clamped === 0) return "Any";
  if (edge === "max" && clamped === DAILY_REWARDS_RANGE_MAX_INDEX) return "Any";
  if (edge === "min" && DAILY_REWARDS_STEPS[clamped] === ZERO_FLOOR_DAILY) {
    return ">$0";
  }
  return dailyCompact.format(DAILY_REWARDS_STEPS[clamped]);
}

/** Quick-exclude badges → Merkl min params just above zero. */
export const EXCLUDE_ZERO_FILTERS = [
  { value: "tvl", label: "0 TVL", floor: String(ZERO_FLOOR_TVL) },
  { value: "apr", label: "0 APR", floor: String(ZERO_FLOOR_APR) },
  { value: "daily", label: "0 Daily", floor: String(ZERO_FLOOR_DAILY) },
] as const;

export type ExcludeZeroFilterValue =
  (typeof EXCLUDE_ZERO_FILTERS)[number]["value"];

export function isAboveZero(min?: string) {
  return min != null && min !== "" && Number(min) > 0;
}

export function formatDailyRewardsRangeLabel(
  minimumDailyRewards?: string,
  maximumDailyRewards?: string,
) {
  if (!minimumDailyRewards && !maximumDailyRewards) return null;
  const minValue = minimumDailyRewards ? Number(minimumDailyRewards) : 0;
  const maxValue = maximumDailyRewards
    ? Number(maximumDailyRewards)
    : DAILY_REWARDS_STEPS[DAILY_REWARDS_RANGE_MAX_INDEX];
  const minIndex = DAILY_REWARDS_STEPS.findIndex((step) => step >= minValue);
  const maxIndex =
    [...DAILY_REWARDS_STEPS]
      .map((step, index) => ({ step, index }))
      .reverse()
      .find((entry) => entry.step <= maxValue)?.index ??
    DAILY_REWARDS_RANGE_MAX_INDEX;
  return `Daily ${formatDailyRewardsBound(minIndex === -1 ? 0 : minIndex, "min")}–${formatDailyRewardsBound(maxIndex, "max")}`;
}

export function toMerklSort(columnId: string): string {
  if (columnId === "dailyRewards") return "rewards";
  return columnId;
}

export function fromMerklSort(sort: string | undefined): string {
  if (sort === "rewards") return "dailyRewards";
  return sort || DEFAULT_SORT;
}

const UI_SORTS = new Set<string>(SORTABLE_COLUMNS);

/** Drop unknown / legacy URL sorts (e.g. old `endsIn`) to the default. */
export function normalizeUiSort(sort: string | undefined): string {
  const key = fromMerklSort(sort);
  return UI_SORTS.has(key) ? key : DEFAULT_SORT;
}

/** Map UI/URL sort key → Merkl `sort` query. Unknown keys fall back to default. */
export function toUpstreamSort(sort: string | undefined): string {
  const key = normalizeUiSort(sort);
  if (key === "dailyRewards") return "rewards";
  if (MERKL_NATIVE_SORTS.has(key)) return key;
  return DEFAULT_SORT;
}
