import { NextRequest, NextResponse } from "next/server";
import { getOpportunities } from "@/lib/merkl/client";
import { parseListQuery } from "@/lib/merkl/query";

export async function GET(request: NextRequest) {
  // Outside the try: reading the URL makes Next bail out of prerendering by throwing.
  const query = parseListQuery(request.nextUrl.searchParams);

  try {
    const result = await getOpportunities(query);

    // CDN hint; local caching is cacheLife in lib/merkl/client.ts.
    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    console.error("Failed to fetch opportunities", error);
    return NextResponse.json(
      { error: "Failed to fetch opportunities from Merkl" },
      { status: 502 },
    );
  }
}
