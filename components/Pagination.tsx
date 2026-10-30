import { ChevronLeft, ChevronRight } from "lucide-react";
import { ListLink } from "@/components/ListNavigation";
import { hasNextPage, listHref, type ListQuery } from "@/lib/merkl/query";

export type PaginationProps = {
  page: number;
  pageSize: number;
  count: number;
  total: number | null;
  query: ListQuery;
};

export function Pagination({
  page,
  pageSize,
  count,
  total,
  query,
  className = "",
}: PaginationProps & {
  className?: string;
}) {
  const hasPrev = page > 0;
  const hasNext = hasNextPage({ page, pageSize, count, total });

  if (!hasPrev && !hasNext) return null;

  return (
    <div className={`flex items-center justify-between gap-3 ${className}`}>
      <p className="text-xs text-muted-foreground">
        Page {page + 1}
        {total != null ? ` of ${Math.max(1, Math.ceil(total / pageSize))}` : ""}
      </p>
      <div className="flex gap-1.5">
        {hasPrev ? (
          <ListLink
            href={listHref({ ...query, page: page - 1 })}
            className="inline-flex h-8 cursor-pointer items-center rounded-md border border-border bg-card px-3 text-xs font-medium text-foreground/85 hover:bg-muted"
          >
            Previous
          </ListLink>
        ) : (
          <span className="inline-flex h-8 items-center rounded-md border border-border px-3 text-xs text-muted-foreground/60">
            Previous
          </span>
        )}
        {hasNext ? (
          <ListLink
            href={listHref({ ...query, page: page + 1 })}
            className="inline-flex h-8 cursor-pointer items-center rounded-md border border-border bg-card px-3 text-xs font-medium text-foreground/85 hover:bg-muted"
          >
            Next
          </ListLink>
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
  total,
  query,
}: PaginationProps) {
  const hasPrev = page > 0;
  const hasNext = hasNextPage({ page, pageSize, count, total });

  return (
    <div className="flex shrink-0 items-center gap-0.5">
      {hasPrev ? (
        <ListLink
          href={listHref({ ...query, page: page - 1 })}
          aria-label="Previous page"
          className="inline-flex size-9 cursor-pointer items-center justify-center rounded-lg border border-border bg-card text-foreground/85 active:bg-muted"
        >
          <ChevronLeft className="size-4" />
        </ListLink>
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
        <ListLink
          href={listHref({ ...query, page: page + 1 })}
          aria-label="Next page"
          className="inline-flex size-9 cursor-pointer items-center justify-center rounded-lg border border-border bg-card text-foreground/85 active:bg-muted"
        >
          <ChevronRight className="size-4" />
        </ListLink>
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
