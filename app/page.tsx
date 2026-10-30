import { Suspense } from "react";
import { OpportunityFilters } from "@/components/OpportunityFilters";
import { OpportunityList } from "@/components/OpportunityList";
import { Pagination } from "@/components/Pagination";
import { RequestInspector } from "@/components/RequestInspector";
import { HomePageSkeleton } from "@/components/skeletons";
import { getChains, getOpportunities } from "@/lib/merkl/client";
import {
  DEFAULT_ORDER,
  DEFAULT_PAGE_SIZE,
  normalizeUiSort,
} from "@/lib/merkl/constants";

function first(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0];
  return value;
}

async function OpportunityResults({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const filters = {
    search: first(params.search),
    chainId: first(params.chainId),
    status: first(params.status) ?? "LIVE",
    action: first(params.action),
    minimumTvl: first(params.minimumTvl),
    maximumTvl: first(params.maximumTvl),
    minimumApr: first(params.minimumApr),
    maximumApr: first(params.maximumApr),
    minimumDailyRewards: first(params.minimumDailyRewards),
    maximumDailyRewards: first(params.maximumDailyRewards),
    asset: first(params.asset),
    tokenTypes: first(params.tokenTypes),
    sort: normalizeUiSort(first(params.sort)),
    order: first(params.order) ?? DEFAULT_ORDER,
    page: Number(first(params.page) ?? 0),
    items: DEFAULT_PAGE_SIZE,
  };

  const [chains, result] = await Promise.all([
    getChains(),
    getOpportunities(filters),
  ]);

  const queryParams = {
    search: filters.search,
    chainId: filters.chainId,
    status: filters.status,
    action: filters.action,
    minimumTvl: filters.minimumTvl,
    maximumTvl: filters.maximumTvl,
    minimumApr: filters.minimumApr,
    maximumApr: filters.maximumApr,
    minimumDailyRewards: filters.minimumDailyRewards,
    maximumDailyRewards: filters.maximumDailyRewards,
    asset: filters.asset,
    tokenTypes: filters.tokenTypes,
    sort: filters.sort,
    order: filters.order,
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
          sort={filters.sort}
        />
      </div>

      <div className="mt-4">
        <OpportunityFilters
          chains={chains}
          values={filters}
          pagination={{
            page: result.meta.page,
            pageSize: result.meta.items,
            count: result.meta.count,
            params: queryParams,
          }}
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
                sort={filters.sort}
                order={filters.order}
              />
            </div>
          )}

          <Pagination
            page={result.meta.page}
            pageSize={result.meta.items}
            count={result.meta.count}
            params={queryParams}
            className="hidden md:flex"
          />
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
