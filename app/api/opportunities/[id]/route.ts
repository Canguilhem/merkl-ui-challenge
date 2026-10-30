import { NextResponse } from "next/server";
import { getOpportunity } from "@/lib/merkl/client";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  try {
    const opportunity = await getOpportunity(id);

    if (!opportunity) {
      return NextResponse.json(
        { error: "Opportunity not found" },
        { status: 404 },
      );
    }

    // CDN hint; local caching is cacheLife in lib/merkl/client.ts.
    return NextResponse.json(
      { data: opportunity },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      },
    );
  } catch (error) {
    console.error("Failed to fetch opportunity", error);
    return NextResponse.json(
      { error: "Failed to fetch opportunity from Merkl" },
      { status: 502 },
    );
  }
}
