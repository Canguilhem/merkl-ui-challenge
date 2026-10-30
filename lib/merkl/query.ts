import { displayApr } from "@/lib/format";
import {
  ASSET_FILTERS,
  ASSET_TO_MERKL,
  DEFAULT_ORDER,
  DEFAULT_PAGE_SIZE,
  DEFAULT_SORT,
  normalizeUiSort,
  OPPORTUNITY_ACTIONS,
  OPPORTUNITY_STATUSES,
  toUpstreamSort,
  TOKEN_TYPE_FILTERS,
  type AssetFilterValue,
} from "@/lib/merkl/constants";
import type { Opportunity } from "@/lib/merkl/types";

export const DEFAULT_STATUS = "LIVE";
const MAX_PAGE_SIZE = 100;

export function parseCsv(value: string | undefined) {
  if (!value) return [] as string[];
  return value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

type FieldParser = (raw: string | undefined) => string | undefined;

const text: FieldParser = (raw) => raw?.trim() || undefined;

const decimal: FieldParser = (raw) =>
  raw && /^\d+(\.\d+)?$/.test(raw.trim()) ? raw.trim() : undefined;

/** Deduped and sorted, so `1,2` and `2,1` are the same query. */
function csvOf(isValid: (value: string) => boolean): FieldParser {
  return (raw) => {
    const values = [...new Set(parseCsv(raw).filter(isValid))].sort();
    return values.length > 0 ? values.join(",") : undefined;
  };
}

function firstOf(allowed: readonly string[]): FieldParser {
  return (raw) => parseCsv(raw).find((value) => allowed.includes(value));
}

function isOneOf(allowed: readonly string[]) {
  return (value: string) => allowed.includes(value);
}

/**
 * The single definition of a list filter: its URL param and how it is validated.
 * Key order is the canonical serialization order. Every key is forwarded to Merkl
 * as-is, except `asset`, which maps to `stablecoin` / `tokens`.
 */
const FILTER_FIELDS = {
  search: text,
  chainId: csvOf((value) => /^\d+$/.test(value)),
  status: csvOf(isOneOf(OPPORTUNITY_STATUSES)),
  action: csvOf(isOneOf(OPPORTUNITY_ACTIONS)),
  minimumTvl: decimal,
  maximumTvl: decimal,
  minimumApr: decimal,
  maximumApr: decimal,
  minimumDailyRewards: decimal,
  maximumDailyRewards: decimal,
  asset: firstOf(ASSET_FILTERS.map((filter) => filter.value)),
  tokenTypes: csvOf(isOneOf(TOKEN_TYPE_FILTERS.map((type) => type.value))),
} satisfies Record<string, FieldParser>;

const FILTER_KEYS = Object.keys(FILTER_FIELDS) as FilterKey[];

export type FilterKey = keyof typeof FILTER_FIELDS;

export type OpportunityFilterValues = Partial<Record<FilterKey, string>> & {
  sort?: string;
  order?: string;
};

export type ListQuery = OpportunityFilterValues & {
  status: string;
  sort: string;
  order: "asc" | "desc";
  page: number;
  items: number;
};

/** Canonical "every status" value, as produced by the `status` parser. */
export const ALL_STATUSES = FILTER_FIELDS.status(
  OPPORTUNITY_STATUSES.join(","),
) as string;

type RawParams =
  | URLSearchParams
  | Record<string, string | string[] | number | undefined>;

function reader(raw: RawParams) {
  if (raw instanceof URLSearchParams) {
    return (key: string) => raw.get(key) ?? undefined;
  }
  return (key: string) => {
    const value = raw[key];
    if (Array.isArray(value)) return value[0];
    return value === undefined ? undefined : String(value);
  };
}

function integer(raw: string | undefined, fallback: number) {
  const value = raw ? Number(raw) : Number.NaN;
  return Number.isInteger(value) ? value : fallback;
}

/**
 * URL params (page or API) → validated query. Invalid values are dropped rather
 * than forwarded, so they cannot reach Merkl or add cache entries.
 */
export function parseListQuery(raw: RawParams): ListQuery {
  const read = reader(raw);
  const filters: OpportunityFilterValues = {};
  for (const key of FILTER_KEYS) {
    const value = FILTER_FIELDS[key](read(key));
    if (value !== undefined) filters[key] = value;
  }

  return {
    ...filters,
    status: filters.status ?? DEFAULT_STATUS,
    sort: normalizeUiSort(read("sort")),
    order: read("order") === "asc" ? "asc" : "desc",
    page: Math.max(0, integer(read("page"), 0)),
    items: Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, integer(read("items"), DEFAULT_PAGE_SIZE)),
    ),
  };
}

/**
 * Canonical query string with defaults omitted. Two requests for the same data
 * always produce the same string, so it doubles as URL and cache key.
 */
export function serializeListQuery(
  input: OpportunityFilterValues & { page?: number; items?: number },
) {
  const query = parseListQuery(input);
  const params = new URLSearchParams();
  for (const key of FILTER_KEYS) {
    const value = query[key];
    if (!value || (key === "status" && value === DEFAULT_STATUS)) continue;
    params.set(key, value);
  }
  if (query.sort !== DEFAULT_SORT) params.set("sort", query.sort);
  if (query.order !== DEFAULT_ORDER) params.set("order", query.order);
  if (query.page > 0) params.set("page", String(query.page));
  if (query.items !== DEFAULT_PAGE_SIZE) params.set("items", String(query.items));
  return params.toString();
}

/** Query string for the filters alone: the count is shared by pages and sorts. */
export function serializeFilters(query: ListQuery) {
  return serializeListQuery({
    ...query,
    sort: DEFAULT_SORT,
    order: DEFAULT_ORDER,
    page: 0,
    items: DEFAULT_PAGE_SIZE,
  });
}

export function listHref(
  input: OpportunityFilterValues & { page?: number; items?: number },
) {
  const query = serializeListQuery(input);
  return query ? `/?${query}` : "/";
}

export function toMerklFilters(query: ListQuery) {
  const filters: Record<string, string | undefined> = {};
  for (const key of FILTER_KEYS) {
    if (key !== "asset") filters[key] = query[key];
  }
  const asset = query.asset
    ? ASSET_TO_MERKL[query.asset as AssetFilterValue]
    : undefined;
  if (asset?.stablecoin) filters.stablecoin = "true";
  if (asset?.tokens) filters.tokens = asset.tokens;
  return filters;
}

export function toMerklListParams(query: ListQuery) {
  return {
    page: query.page,
    items: query.items,
    ...toMerklFilters(query),
    sort: toUpstreamSort(query.sort),
    order: query.order,
  };
}

/**
 * Merkl sometimes returns a row out of place, so re-sort the fetched page by the
 * value its column shows (`displayApr`, not incentive-only `apr`). This only fixes
 * order within a page; Merkl still decides which rows are on it.
 */
export function stabilizePageOrder(
  data: Opportunity[],
  sort: string,
  order: "asc" | "desc",
) {
  const dir = order === "asc" ? 1 : -1;
  const copy = [...data];

  if (sort === "apr") {
    copy.sort((a, b) => ((displayApr(a) ?? 0) - (displayApr(b) ?? 0)) * dir);
  } else if (sort === "tvl") {
    copy.sort((a, b) => ((a.tvl ?? 0) - (b.tvl ?? 0)) * dir);
  } else if (sort === "dailyRewards") {
    copy.sort((a, b) => ((a.dailyRewards ?? 0) - (b.dailyRewards ?? 0)) * dir);
  }

  return copy;
}

/** Uses the Merkl total when known; if the count call failed, a full page may have more. */
export function hasNextPage({
  page,
  pageSize,
  count,
  total,
}: {
  page: number;
  pageSize: number;
  count: number;
  total: number | null;
}) {
  return total == null ? count >= pageSize : (page + 1) * pageSize < total;
}
