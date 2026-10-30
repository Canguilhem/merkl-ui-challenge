import { cacheLife } from "next/cache";
import {
  DEFAULT_ORDER,
  DEFAULT_PAGE_SIZE,
  DEFAULT_SORT,
  MERKL_API_BASE,
  normalizeUiSort,
  resolveAssetParams,
  toUpstreamSort,
} from "@/lib/merkl/constants";
import type {
  MerklChain,
  Opportunity,
  OpportunityListParams,
  OpportunityListResult,
} from "@/lib/merkl/types";

/**
 * Stabilize page order. Merkl `sort=apr` (and sometimes others) can be
 * non-monotonic within a page, so re-sort the fetched page by the requested key.
 */
function stabilizePageOrder(
  data: Opportunity[],
  sort: string | undefined,
  order: string | undefined,
) {
  const dir = order === "asc" ? 1 : -1;
  const key = sort || DEFAULT_SORT;
  const copy = [...data];

  if (key === "apr") {
    copy.sort((a, b) => ((a.apr ?? 0) - (b.apr ?? 0)) * dir);
  } else if (key === "tvl") {
    copy.sort((a, b) => ((a.tvl ?? 0) - (b.tvl ?? 0)) * dir);
  } else if (key === "rewards" || key === "dailyRewards") {
    copy.sort((a, b) => ((a.dailyRewards ?? 0) - (b.dailyRewards ?? 0)) * dir);
  }

  return copy;
}

class MerklApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "MerklApiError";
    this.status = status;
  }
}

function buildUrl(
  path: string,
  params?: Record<string, string | number | undefined>,
) {
  const url = new URL(path, `${MERKL_API_BASE}/`);

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === "") continue;
      url.searchParams.set(key, String(value));
    }
  }

  return url;
}

async function merklFetch<T>(
  path: string,
  params?: Record<string, string | number | undefined>,
): Promise<T> {
  const url = buildUrl(path, params);
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "merkl-ui-demo/0.1",
    },
  });

  if (!response.ok) {
    throw new MerklApiError(
      `Merkl API ${response.status} for ${url.pathname}`,
      response.status,
    );
  }

  return response.json() as Promise<T>;
}

function normalizeListParams(
  params: OpportunityListParams = {},
): Required<
  Pick<OpportunityListParams, "page" | "items">
> &
  OpportunityListParams {
  return {
    page: Number.isFinite(params.page) ? Math.max(0, Number(params.page)) : 0,
    items: Number.isFinite(params.items)
      ? Math.min(100, Math.max(1, Number(params.items)))
      : DEFAULT_PAGE_SIZE,
    chainId: params.chainId || undefined,
    status: params.status || undefined,
    action: params.action || undefined,
    minimumTvl: params.minimumTvl || undefined,
    maximumTvl: params.maximumTvl || undefined,
    minimumApr: params.minimumApr || undefined,
    maximumApr: params.maximumApr || undefined,
    minimumDailyRewards: params.minimumDailyRewards || undefined,
    maximumDailyRewards: params.maximumDailyRewards || undefined,
    search: params.search || undefined,
    asset: params.asset || undefined,
    tokenTypes: params.tokenTypes || undefined,
    sort: normalizeUiSort(params.sort),
    order: params.order === "asc" || params.order === "desc"
      ? params.order
      : DEFAULT_ORDER,
  };
}

/**
 * Cached Merkl opportunities list.
 * Shared by SSR pages and `/api/opportunities` so both stay behind one cache key.
 */
export async function getOpportunities(
  params: OpportunityListParams = {},
): Promise<OpportunityListResult> {
  "use cache";
  cacheLife("minutes");

  const filters = normalizeListParams(params);
  const assetParams = resolveAssetParams(filters.asset);
  const upstreamSort = toUpstreamSort(filters.sort);
  const merklQuery = {
    page: filters.page,
    items: filters.items,
    // Merkl accepts comma-separated chainId / status / action.
    chainId: filters.chainId,
    status: filters.status,
    action: filters.action,
    minimumTvl: filters.minimumTvl,
    maximumTvl: filters.maximumTvl,
    minimumApr: filters.minimumApr,
    maximumApr: filters.maximumApr,
    minimumDailyRewards: filters.minimumDailyRewards,
    maximumDailyRewards: filters.maximumDailyRewards,
    search: filters.search,
    tokenTypes: filters.tokenTypes,
    sort: upstreamSort,
    order: filters.order,
    ...(assetParams.stablecoin ? { stablecoin: "true" } : {}),
    ...(assetParams.tokens ? { tokens: assetParams.tokens } : {}),
  };
  const upstreamUrl = buildUrl("opportunities", merklQuery).toString();
  const raw = await merklFetch<Opportunity[]>("opportunities", merklQuery);
  const data = stabilizePageOrder(raw, filters.sort, filters.order);

  const localParams = new URLSearchParams();
  for (const [key, value] of Object.entries({
    ...filters,
    page: filters.page,
    items: filters.items,
  })) {
    if (value === undefined || value === "") continue;
    if (key === "page" && Number(value) === 0) continue;
    localParams.set(key, String(value));
  }

  return {
    data,
    meta: {
      page: filters.page!,
      items: filters.items!,
      count: data.length,
      source: "merkl",
      filters,
      upstreamUrl,
      localApiPath: `/api/opportunities?${localParams.toString()}`,
    },
  };
}

export async function getOpportunity(id: string): Promise<Opportunity | null> {
  "use cache";
  cacheLife("minutes");

  try {
    return await merklFetch<Opportunity>(`opportunities/${encodeURIComponent(id)}`);
  } catch (error) {
    if (error instanceof MerklApiError && error.status === 404) {
      return null;
    }
    throw error;
  }
}

export async function getChains(): Promise<MerklChain[]> {
  "use cache";
  cacheLife("hours");

  const chains = await merklFetch<MerklChain[]>("chains");
  return [...chains].sort((a, b) => {
    const liveDiff = (b.liveCampaigns ?? 0) - (a.liveCampaigns ?? 0);
    if (liveDiff !== 0) return liveDiff;
    return a.name.localeCompare(b.name);
  });
}

export { MerklApiError };
