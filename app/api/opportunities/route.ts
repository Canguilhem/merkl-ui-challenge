import { NextRequest, NextResponse } from "next/server";
import { getOpportunities } from "@/lib/merkl/client";

function first(value: string | null) {
  return value?.trim() || undefined;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const result = await getOpportunities({
      page: Number(searchParams.get("page") ?? 0),
      items: Number(searchParams.get("items") ?? 20),
      chainId: first(searchParams.get("chainId")),
      status: first(searchParams.get("status")),
      action: first(searchParams.get("action")),
      minimumTvl: first(searchParams.get("minimumTvl")),
      maximumTvl: first(searchParams.get("maximumTvl")),
      minimumApr: first(searchParams.get("minimumApr")),
      maximumApr: first(searchParams.get("maximumApr")),
      minimumDailyRewards: first(searchParams.get("minimumDailyRewards")),
      maximumDailyRewards: first(searchParams.get("maximumDailyRewards")),
      search: first(searchParams.get("search")),
      asset: first(searchParams.get("asset")),
      tokenTypes: first(searchParams.get("tokenTypes")),
      sort: first(searchParams.get("sort")),
      order: first(searchParams.get("order")),
    });

    // CDN hint; local caching is cacheLife in getOpportunities().
    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch opportunities";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
