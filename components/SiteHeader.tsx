import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-card/90 backdrop-blur-md">
      <div className="mx-auto flex h-12 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2.5 text-sm font-semibold tracking-tight text-foreground"
        >
          <span className="inline-flex h-6 w-6 items-center justify-center rounded bg-primary text-[10px] font-bold tracking-tight text-primary-foreground">
            Op
          </span>
          Opps
        </Link>
        <a
          href="/api/opportunities?status=LIVE&items=5"
          className="cursor-pointer text-xs font-medium text-muted-foreground transition hover:text-foreground"
          target="_blank"
          rel="noreferrer"
        >
          API
        </a>
      </div>
    </header>
  );
}
