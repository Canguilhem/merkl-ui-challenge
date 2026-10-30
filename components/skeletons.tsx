import { DEFAULT_PAGE_SIZE } from "@/lib/merkl/constants";

function Bone({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-muted ${className}`}
      aria-hidden
    />
  );
}

function TableRowSkeleton() {
  return (
    <tr>
      <td className="px-3 py-2.5 align-middle">
        <div className="flex items-center gap-2.5">
          <Bone className="size-7 shrink-0 rounded-md" />
          <div className="min-w-0 flex-1 space-y-1.5">
            <Bone className="h-3.5 w-[70%]" />
            <Bone className="h-2.5 w-[45%]" />
          </div>
        </div>
      </td>
      <td className="px-3 py-2.5 align-middle">
        <Bone className="ml-auto h-3.5 w-12" />
      </td>
      <td className="px-3 py-2.5 align-middle">
        <Bone className="ml-auto h-3.5 w-14" />
      </td>
      <td className="px-3 py-2.5 align-middle">
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-1.5">
            <Bone className="size-3.5 rounded-full" />
            <Bone className="h-3.5 w-10" />
          </div>
          <Bone className="h-2.5 w-16" />
        </div>
      </td>
      <td className="px-3 py-2.5 align-middle">
        <Bone className="ml-auto h-3.5 w-8" />
      </td>
    </tr>
  );
}

function CardSkeleton() {
  return (
    <li className="rounded-xl bg-card px-3.5 py-3">
      <div className="flex items-start gap-3">
        <Bone className="size-10 shrink-0 rounded-md" />
        <div className="min-w-0 flex-1 space-y-2">
          <Bone className="h-4 w-[80%]" />
          <Bone className="h-2.5 w-[60%]" />
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2.5 border-t border-border/70 pt-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className={index % 2 === 1 ? "text-right" : undefined}
          >
            <Bone className={`h-2 w-10 ${index % 2 === 1 ? "ml-auto" : ""}`} />
            <Bone
              className={`mt-1.5 h-4 w-14 ${index % 2 === 1 ? "ml-auto" : ""}`}
            />
          </div>
        ))}
      </div>
    </li>
  );
}

/** Matches OpportunityTable + OpportunityCards layout. */
export function OpportunityListSkeleton({
  rows = DEFAULT_PAGE_SIZE,
}: {
  rows?: number;
}) {
  return (
    <div aria-busy="true" aria-label="Loading opportunities">
      <ul className="space-y-2 md:hidden">
        {Array.from({ length: Math.min(rows, 6) }).map((_, index) => (
          <CardSkeleton key={index} />
        ))}
      </ul>

      <div className="hidden overflow-x-auto rounded-lg border border-border bg-card md:block">
        <table className="w-full min-w-[720px] border-collapse text-left text-sm">
          <thead className="border-b border-border bg-muted text-[11px] font-medium tracking-wide text-muted-foreground">
            <tr>
              <th className="w-[44%] px-3 py-2.5">
                <Bone className="h-2.5 w-20" />
              </th>
              <th className="w-[6rem] px-3 py-2.5">
                <Bone className="ml-auto h-2.5 w-8" />
              </th>
              <th className="w-[6rem] px-3 py-2.5">
                <Bone className="ml-auto h-2.5 w-8" />
              </th>
              <th className="w-[7.5rem] px-3 py-2.5">
                <Bone className="ml-auto h-2.5 w-10" />
              </th>
              <th className="w-[4.5rem] px-3 py-2.5">
                <Bone className="ml-auto h-2.5 w-8" />
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {Array.from({ length: rows }).map((_, index) => (
              <TableRowSkeleton key={index} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FiltersSidebarSkeleton() {
  return (
    <aside className="sticky top-14 hidden w-60 shrink-0 self-start lg:block">
      <div className="rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
          <Bone className="h-4 w-14" />
          <Bone className="h-3 w-10" />
        </div>
        <div className="space-y-4 p-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="space-y-1.5">
              <Bone className="h-3 w-12" />
              <Bone className="h-8 w-full rounded-md" />
            </div>
          ))}
          <div className="space-y-1.5">
            <Bone className="h-3 w-16" />
            <div className="flex flex-wrap gap-1.5">
              <Bone className="h-8 w-20 rounded-full" />
              <Bone className="h-8 w-12 rounded-full" />
              <Bone className="h-8 w-12 rounded-full" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Bone className="h-3 w-24" />
            <div className="flex flex-wrap gap-1.5">
              <Bone className="h-8 w-16 rounded-full" />
              <Bone className="h-8 w-16 rounded-full" />
            </div>
          </div>
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={`range-${index}`} className="space-y-2">
              <div className="flex justify-between">
                <Bone className="h-3 w-16" />
                <Bone className="h-3 w-14" />
              </div>
              <Bone className="h-1.5 w-full rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

/** Full home page shell: title, filters, list, chrome. */
export function HomePageSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading opportunities page">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <Bone className="h-7 w-40" />
        <div className="space-y-1 text-right">
          <Bone className="ml-auto h-3 w-40" />
          <Bone className="ml-auto h-3 w-56" />
        </div>
      </div>

      <div className="mt-4 lg:flex lg:items-start lg:gap-6">
        <FiltersSidebarSkeleton />

        <div className="min-w-0 flex-1 space-y-3 pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-0">
          <div className="hidden items-center gap-2 md:flex">
            <Bone className="h-8 w-[5.5rem] shrink-0 rounded-md" />
            <Bone className="h-8 min-w-0 flex-1 rounded-md" />
          </div>

          <OpportunityListSkeleton />

          <div className="hidden items-center justify-between md:flex">
            <Bone className="h-3 w-16" />
            <div className="flex gap-1.5">
              <Bone className="h-8 w-20 rounded-md" />
              <Bone className="h-8 w-14 rounded-md" />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile bottom chrome reservation */}
      <div
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 px-3 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] md:hidden"
        aria-hidden
      >
        <div className="mx-auto flex max-w-7xl items-center gap-2">
          <Bone className="h-8 min-w-0 flex-1 rounded-md" />
          <Bone className="h-8 w-[4.75rem] shrink-0 rounded-lg" />
          <div className="flex shrink-0 items-center gap-0.5">
            <Bone className="size-9 rounded-lg" />
            <Bone className="mx-1 h-3 w-5" />
            <Bone className="size-9 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}

/** Matches opportunity detail page structure. */
export function OpportunityDetailSkeleton() {
  return (
    <main
      className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6"
      aria-busy="true"
      aria-label="Loading opportunity"
    >
      <Bone className="h-4 w-28" />

      <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-4">
          <Bone className="size-14 shrink-0 rounded-md" />
          <div className="min-w-0 space-y-2">
            <div className="flex gap-2">
              <Bone className="h-5 w-14 rounded" />
              <Bone className="h-5 w-12 rounded" />
            </div>
            <Bone className="h-8 w-64 max-w-full sm:h-9" />
            <Bone className="h-4 w-40" />
          </div>
        </div>
        <Bone className="h-10 w-24 rounded-lg" />
      </div>

      <div className="mt-8 grid grid-cols-2 gap-2 sm:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className={`rounded-xl border px-3 py-3 ${
              index === 3
                ? "border-primary/30 bg-primary/5"
                : "border-border bg-card"
            }`}
          >
            <Bone className="h-2.5 w-10" />
            <Bone className="mt-2 h-5 w-14" />
          </div>
        ))}
      </div>

      <div className="mt-8 space-y-2">
        <Bone className="h-3 w-28" />
        <div className="flex flex-wrap gap-1.5">
          <Bone className="h-7 w-16 rounded-full" />
          <Bone className="h-7 w-20 rounded-full" />
        </div>
      </div>

      <div className="mt-8 space-y-2">
        <Bone className="h-3 w-16" />
        <Bone className="mt-2 h-4 w-full" />
        <Bone className="h-4 w-[92%]" />
        <Bone className="h-4 w-[80%]" />
      </div>

      <div className="mt-8 space-y-2">
        <Bone className="h-3 w-32" />
        <Bone className="mt-2 h-4 w-[90%]" />
        <Bone className="h-4 w-[85%]" />
        <Bone className="h-4 w-[70%]" />
      </div>
    </main>
  );
}
