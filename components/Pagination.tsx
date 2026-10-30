import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function buildPageHref(
  page: number,
  params: Record<string, string | undefined>,
) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (!value) continue;
    search.set(key, value);
  }
  if (page > 0) search.set("page", String(page));
  const query = search.toString();
  return query ? `/?${query}` : "/";
}

export function Pagination({
  page,
  pageSize,
  count,
  params,
  className = "",
}: {
  page: number;
  pageSize: number;
  count: number;
  params: Record<string, string | undefined>;
  className?: string;
}) {
  const hasPrev = page > 0;
  const hasNext = count >= pageSize;

  if (!hasPrev && !hasNext) return null;

  return (
    <div className={`flex items-center justify-between gap-3 ${className}`}>
      <p className="text-xs text-muted-foreground">Page {page + 1}</p>
      <div className="flex gap-1.5">
        {hasPrev ? (
          <Link
            href={buildPageHref(page - 1, params)}
            className="inline-flex h-8 cursor-pointer items-center rounded-md border border-border bg-card px-3 text-xs font-medium text-foreground/85 hover:bg-muted"
          >
            Previous
          </Link>
        ) : (
          <span className="inline-flex h-8 items-center rounded-md border border-border px-3 text-xs text-muted-foreground/60">
            Previous
          </span>
        )}
        {hasNext ? (
          <Link
            href={buildPageHref(page + 1, params)}
            className="inline-flex h-8 cursor-pointer items-center rounded-md border border-border bg-card px-3 text-xs font-medium text-foreground/85 hover:bg-muted"
          >
            Next
          </Link>
        ) : (
          <span className="inline-flex h-8 items-center rounded-md border border-border px-3 text-xs text-muted-foreground/60">
            Next
          </span>
        )}
      </div>
    </div>
  );
}

/** Compact prev/next for the mobile bottom chrome. */
export function PaginationControls({
  page,
  pageSize,
  count,
  params,
}: {
  page: number;
  pageSize: number;
  count: number;
  params: Record<string, string | undefined>;
}) {
  const hasPrev = page > 0;
  const hasNext = count >= pageSize;

  return (
    <div className="flex shrink-0 items-center gap-0.5">
      {hasPrev ? (
        <Link
          href={buildPageHref(page - 1, params)}
          aria-label="Previous page"
          className="inline-flex size-9 cursor-pointer items-center justify-center rounded-lg border border-border bg-card text-foreground/85 active:bg-muted"
        >
          <ChevronLeft className="size-4" />
        </Link>
      ) : (
        <span
          aria-disabled
          className="inline-flex size-9 items-center justify-center rounded-lg border border-border text-muted-foreground/60"
        >
          <ChevronLeft className="size-4" />
        </span>
      )}
      <span className="min-w-[2.25rem] text-center text-[11px] font-medium tabular-nums text-muted-foreground">
        {page + 1}
      </span>
      {hasNext ? (
        <Link
          href={buildPageHref(page + 1, params)}
          aria-label="Next page"
          className="inline-flex size-9 cursor-pointer items-center justify-center rounded-lg border border-border bg-card text-foreground/85 active:bg-muted"
        >
          <ChevronRight className="size-4" />
        </Link>
      ) : (
        <span
          aria-disabled
          className="inline-flex size-9 items-center justify-center rounded-lg border border-border text-muted-foreground/60"
        >
          <ChevronRight className="size-4" />
        </span>
      )}
    </div>
  );
}
