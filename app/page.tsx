import { Suspense } from "react";
import { OpportunityFilters } from "@/components/OpportunityFilters";
import { OpportunityList } from "@/components/OpportunityList";
import { Pagination } from "@/components/Pagination";
import { RequestInspector } from "@/components/RequestInspector";
import { HomePageSkeleton } from "@/components/skeletons";
import { getChains, getOpportunities } from "@/lib/merkl/client";
import { DEFAULT_PAGE_SIZE } from "@/lib/merkl/constants";
import { parseListQuery } from "@/lib/merkl/query";

async function OpportunityResults({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const query = {
    ...parseListQuery(await searchParams),
    items: DEFAULT_PAGE_SIZE,
  };

  const [chains, result] = await Promise.all([
    getChains(),
    getOpportunities(query),
  ]);

  const pagination = {
    page: result.meta.page,
    pageSize: result.meta.items,
    count: result.meta.count,
    total: result.meta.total,
    query,
  };

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Opportunities
        </h1>
        <RequestInspector
          localApiPath={result.meta.localApiPath}
          upstreamUrl={result.meta.upstreamUrl}
          count={result.meta.count}
          total={result.meta.total}
          sort={query.sort}
        />
      </div>

      <div className="mt-4">
        <OpportunityFilters
          chains={chains}
          values={query}
          pagination={pagination}
        >
          {result.data.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-card px-6 py-14 text-center">
              <p className="font-medium text-foreground">
                No opportunities found
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Try widening filters or resetting the TVL range.
              </p>
            </div>
          ) : (
            <div className="min-h-[36rem] md:min-h-[44rem]">
              <OpportunityList
                data={result.data}
                sort={query.sort}
                order={query.order}
              />
            </div>
          )}

          <Pagination {...pagination} className="hidden md:flex" />
        </OpportunityFilters>
      </div>
    </>
  );
}

export default function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 sm:py-6">
      <Suspense fallback={<HomePageSkeleton />}>
        <OpportunityResults searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
