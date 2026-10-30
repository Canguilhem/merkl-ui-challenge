const STATUS_STYLES: Record<string, string> = {
  LIVE: "text-emerald-300 bg-emerald-500/15 ring-1 ring-emerald-500/30",
  SOON: "text-warning bg-warning/15 ring-1 ring-warning/30",
  PAST: "text-muted-foreground bg-muted ring-1 ring-border",
};

const DOT_STYLES: Record<string, string> = {
  LIVE: "bg-emerald-400",
  SOON: "bg-warning",
  PAST: "bg-muted-foreground",
};

export function StatusBadge({ status }: { status: string }) {
  const styles =
    STATUS_STYLES[status] ?? "text-muted-foreground bg-muted ring-1 ring-border";
  const dot = DOT_STYLES[status] ?? "bg-muted-foreground";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded px-1.5 py-0.5 text-[11px] font-medium ${styles}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} aria-hidden />
      {status}
    </span>
  );
}
