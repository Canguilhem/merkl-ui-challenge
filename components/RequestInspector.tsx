type RequestInspectorProps = {
  localApiPath: string;
  upstreamUrl: string;
  count: number;
  sort?: string;
};

export function RequestInspector({
  localApiPath,
  upstreamUrl,
  count,
  sort,
}: RequestInspectorProps) {
  let upstreamPath = upstreamUrl;
  try {
    const url = new URL(upstreamUrl);
    upstreamPath = `${url.pathname}${url.search}`;
  } catch {
    // keep raw
  }

  return (
    <div className="flex w-full flex-col gap-1 text-xs text-muted-foreground sm:w-auto sm:items-end">
      <p className="tabular-nums">
        {count} on this page
        {sort ? ` · sorted by ${sort}` : ""}
      </p>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 sm:justify-end">
        <a
          href={localApiPath}
          target="_blank"
          rel="noreferrer"
          className="cursor-pointer font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
          title={localApiPath}
        >
          Open API JSON
        </a>
        <span
          className="hidden max-w-[24rem] truncate font-mono text-[11px] text-muted-foreground lg:inline"
          title={upstreamUrl}
        >
          upstream {upstreamPath}
        </span>
      </div>
    </div>
  );
}
