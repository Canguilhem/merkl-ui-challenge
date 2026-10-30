import { cacheLife } from "next/cache";
import { MERKL_API_BASE } from "@/lib/merkl/constants";
import {
  parseListQuery,
  serializeFilters,
  serializeListQuery,
  stabilizePageOrder,
  toMerklFilters,
  toMerklListParams,
  type ListQuery,
} from "@/lib/merkl/query";
import type {
  MerklChain,
  Opportunity,
  OpportunityListResult,
} from "@/lib/merkl/types";

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

/**
 * Cached functions take the canonical query string as their only argument, so
 * that string is the cache key and every caller of the same query shares an entry.
 */
async function fetchOpportunityPage(canonicalQuery: string) {
  "use cache";
  cacheLife("minutes");

  const query = parseListQuery(new URLSearchParams(canonicalQuery));
  const raw = await merklFetch<Opportunity[]>(
    "opportunities",
    toMerklListParams(query),
  );
  return stabilizePageOrder(raw, query.sort, query.order);
}

async function fetchOpportunityCount(canonicalFilters: string) {
  "use cache";
  cacheLife("minutes");

  const query = parseListQuery(new URLSearchParams(canonicalFilters));
  return merklFetch<number>("opportunities/count", toMerklFilters(query));
}

/** Shared by SSR pages and `/api/opportunities`. */
export async function getOpportunities(
  query: ListQuery,
): Promise<OpportunityListResult> {
  const canonicalQuery = serializeListQuery(query);
  const [data, total] = await Promise.all([
    fetchOpportunityPage(canonicalQuery),
    // The list is still usable without a total, so a failed count is not fatal.
    fetchOpportunityCount(serializeFilters(query)).catch(() => null),
  ]);

  return {
    data,
    meta: {
      page: query.page,
      items: query.items,
      count: data.length,
      total,
      source: "merkl",
      filters: query,
      upstreamUrl: buildUrl(
        "opportunities",
        toMerklListParams(query),
      ).toString(),
      localApiPath: `/api/opportunities?${canonicalQuery}`,
    },
  };
}

export async function getOpportunity(id: string): Promise<Opportunity | null> {
  "use cache";
  cacheLife("minutes");

  try {
    return await merklFetch<Opportunity>(`opportunities/${encodeURIComponent(id)}`);
  } catch (error) {
    // Handled here because errors lose their type and message once they cross
    // the cache boundary. Merkl answers 404 for an unknown id, 400 for a malformed one.
    if (
      error instanceof MerklApiError &&
      (error.status === 404 || error.status === 400)
    ) {
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
