import { NextResponse } from "next/server";
import { getOpportunity } from "@/lib/merkl/client";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const opportunity = await getOpportunity(id);

    if (!opportunity) {
      return NextResponse.json(
        { error: "Opportunity not found" },
        { status: 404 },
      );
    }

    // CDN hint; local caching is cacheLife in getOpportunity().
    return NextResponse.json(
      { data: opportunity },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch opportunity";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
