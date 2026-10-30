"use client";

import {
  createColumnHelper,
  rowSortingFeature,
  tableFeatures,
  useTable,
  type SortingState,
  type Updater,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { AssetIcon } from "@/components/AssetIcon";
import { CellTip } from "@/components/CellTip";
import { useListNavigation } from "@/components/ListNavigation";
import { OpportunityPreviewDialog } from "@/components/OpportunityPreviewDialog";
import { RewardTokenStack } from "@/components/RewardTokenStack";
import {
  aprCellInfo,
  dailyCellInfo,
  endsCellInfo,
  rewardTokens,
  tvlCellInfo,
} from "@/lib/cell-info";
import {
  dailyRewardsPer1k,
  displayApr,
  formatApr,
  formatDailyPer1k,
  formatRemainingDays,
  formatUsd,
  remainingCampaignDays,
} from "@/lib/format";
import { DEFAULT_ORDER, DEFAULT_SORT } from "@/lib/merkl/constants";
import { listHref, parseListQuery } from "@/lib/merkl/query";
import type { Opportunity } from "@/lib/merkl/types";
import { useNow } from "@/lib/use-now";

const features = tableFeatures({
  rowSortingFeature,
});

const columnHelper = createColumnHelper<typeof features, Opportunity>();

function SortIndicator({ sorted }: { sorted: false | "asc" | "desc" }) {
  if (sorted === "asc") {
    return <ArrowUp className="size-3.5 shrink-0 text-primary" aria-hidden />;
  }
  if (sorted === "desc") {
    return <ArrowDown className="size-3.5 shrink-0 text-primary" aria-hidden />;
  }
  return (
    <ChevronsUpDown className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
  );
}

const NUMERIC_IDS = new Set(["apr", "tvl", "dailyRewards", "endsIn"]);

function EndsCell({ opportunity }: { opportunity: Opportunity }) {
  const days = remainingCampaignDays(opportunity.latestCampaignEnd, useNow());
  const label = formatRemainingDays(days);
  const tone =
    days == null
      ? "text-muted-foreground"
      : days < 0
        ? "text-muted-foreground"
        : days <= 7
          ? "text-warning"
          : "text-foreground/85";
  return (
    <CellTip tip={endsCellInfo(opportunity)} align="end">
      <span
        className={`block text-right font-mono text-sm font-medium tabular-nums ${tone}`}
      >
        {label}
      </span>
    </CellTip>
  );
}

export function OpportunityTable({
  data,
  sort = DEFAULT_SORT,
  order = DEFAULT_ORDER,
}: {
  data: Opportunity[];
  sort?: string;
  order?: string;
}) {
  const { navigate } = useListNavigation();
  const searchParams = useSearchParams();
  const [preview, setPreview] = useState<Opportunity | null>(null);

  const columns = useMemo(
    () =>
      columnHelper.columns([
        columnHelper.accessor("name", {
          header: "Opportunity",
          enableSorting: false,
          cell: ({ row }) => {
            const opportunity = row.original;
            const protocolLabel = opportunity.protocol?.name ?? "Unknown";
            const chainName =
              opportunity.chain?.name ?? String(opportunity.chainId);
            return (
              <div className="flex min-w-0 items-center gap-2.5">
                <AssetIcon
                  src={opportunity.protocol?.icon}
                  label={protocolLabel}
                  size={28}
                />
                <span className="min-w-0">
                  <span className="block truncate font-medium text-foreground group-hover:text-primary">
                    {opportunity.name}
                  </span>
                  <span className="mt-0.5 flex min-w-0 items-center gap-1.5 text-[11px] text-muted-foreground">
                    <span className="truncate">{protocolLabel}</span>
                    <span className="text-muted-foreground/60">·</span>
                    <span className="inline-flex min-w-0 items-center gap-1">
                      <AssetIcon
                        src={opportunity.chain?.icon}
                        label={chainName}
                        size={12}
                        rounded="full"
                      />
                      <span className="truncate">{chainName}</span>
                    </span>
                    <span className="text-muted-foreground/60">·</span>
                    <span className="shrink-0 font-mono text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                      {opportunity.action}
                    </span>
                  </span>
                </span>
              </div>
            );
          },
        }),
        columnHelper.accessor("apr", {
          header: "APR",
          sortDescFirst: true,
          cell: ({ row }) => (
            <CellTip tip={aprCellInfo(row.original)}>
              <span className="block text-right font-mono tabular-nums text-foreground">
                {formatApr(displayApr(row.original))}
              </span>
            </CellTip>
          ),
        }),
        columnHelper.accessor("tvl", {
          header: "TVL",
          sortDescFirst: true,
          cell: ({ row }) => (
            <CellTip tip={tvlCellInfo(row.original)}>
              <span className="block text-right font-mono tabular-nums text-foreground">
                {formatUsd(row.original.tvl)}
              </span>
            </CellTip>
          ),
        }),
        columnHelper.accessor("dailyRewards", {
          header: () => (
            <span
              className="block w-full text-right"
              title="Total daily reward pool"
            >
              Daily
            </span>
          ),
          sortDescFirst: true,
          cell: ({ row }) => {
            const per1k = dailyRewardsPer1k({
              dailyRewards: row.original.dailyRewards,
              tvl: row.original.tvl,
              apr: displayApr(row.original),
            });
            const rewards = rewardTokens(row.original);
            return (
              <CellTip tip={dailyCellInfo(row.original)}>
                <span className="flex flex-col items-end text-right">
                  <span className="inline-flex items-center gap-1.5">
                    <RewardTokenStack tokens={rewards} size={14} />
                    <span className="font-mono tabular-nums text-foreground">
                      {formatUsd(row.original.dailyRewards)}
                    </span>
                  </span>
                  <span className="mt-0.5 font-mono text-[11px] tabular-nums text-muted-foreground">
                    {formatDailyPer1k(per1k)}
                    <span className="text-muted-foreground/70"> per $1k</span>
                  </span>
                </span>
              </CellTip>
            );
          },
        }),
        columnHelper.accessor((row) => row.latestCampaignEnd, {
          id: "endsIn",
          header: "Ends",
          enableSorting: false,
          cell: ({ row }) => <EndsCell opportunity={row.original} />,
        }),
      ]),
    [],
  );

  const sorting = useMemo<SortingState>(
    () => [
      {
        id: sort,
        desc: order !== "asc",
      },
    ],
    [sort, order],
  );

  const onSortingChange = (updater: Updater<SortingState>) => {
    const next = typeof updater === "function" ? updater(sorting) : updater;
    const active = next[0];

    navigate(
      listHref({
        ...parseListQuery(new URLSearchParams(searchParams.toString())),
        sort: active?.id ?? DEFAULT_SORT,
        order: active ? (active.desc ? "desc" : "asc") : DEFAULT_ORDER,
        page: 0,
      }),
    );
  };

  const table = useTable({
    features,
    columns,
    data,
    manualSorting: true,
    enableMultiSort: false,
    enableSortingRemoval: false,
    sortDescFirst: true,
    state: { sorting },
    onSortingChange,
    getRowId: (row) => row.id,
  });

  return (
    <>
      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full min-w-[720px] border-collapse text-left text-sm">
          <thead className="border-b border-border bg-muted text-[11px] font-medium tracking-wide text-muted-foreground">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const sorted = header.column.getIsSorted();
                  const numeric = NUMERIC_IDS.has(header.column.id);
                  const widthClass =
                    header.column.id === "name"
                      ? "w-[44%]"
                      : header.column.id === "endsIn"
                        ? "w-[4.5rem]"
                        : header.column.id === "dailyRewards"
                          ? "w-[7.5rem]"
                          : "w-[6rem]";

                  return (
                    <th
                      key={header.id}
                      className={`px-3 py-2.5 whitespace-nowrap ${widthClass} ${
                        numeric ? "text-right" : ""
                      }`}
                    >
                      {header.isPlaceholder ? null : canSort ? (
                        <button
                          type="button"
                          className={`inline-flex cursor-pointer items-center gap-1 rounded-md px-1 py-0.5 transition hover:bg-muted hover:text-foreground ${
                            numeric ? "ml-auto" : ""
                          } ${sorted ? "text-foreground" : ""}`}
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          <table.FlexRender header={header} />
                          <SortIndicator sorted={sorted} />
                        </button>
                      ) : (
                        <table.FlexRender header={header} />
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-border">
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                role="button"
                tabIndex={0}
                aria-label={`Preview ${row.original.name}`}
                className="group cursor-pointer transition-colors hover:bg-primary/10 focus-visible:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                onClick={() => setPreview(row.original)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setPreview(row.original);
                  }
                }}
              >
                {row.getAllCells().map((cell) => (
                  <td
                    key={cell.id}
                    className={`px-3 py-2.5 align-middle ${
                      NUMERIC_IDS.has(cell.column.id) ? "text-right" : ""
                    }`}
                  >
                    <table.FlexRender cell={cell} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <OpportunityPreviewDialog
        opportunity={preview}
        open={preview != null}
        onOpenChange={(open) => {
          if (!open) setPreview(null);
        }}
      />
    </>
  );
}
