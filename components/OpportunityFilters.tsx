"use client";

import { ListFilter, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { AssetIcon } from "@/components/AssetIcon";
import { AssetTypeBadges } from "@/components/AssetTypeBadges";
import { FilterSelect } from "@/components/FilterSelect";
import {
  ListLink,
  ListResults,
  useListNavigation,
} from "@/components/ListNavigation";
import { MetricRangeFilter } from "@/components/MetricRangeFilter";
import { PaginationControls, type PaginationProps } from "@/components/Pagination";
import { ToggleBadges } from "@/components/ToggleBadges";
import { TvlRangeFilter } from "@/components/TvlRangeFilter";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  APR_STEPS,
  ASSET_FILTERS,
  DAILY_REWARDS_STEPS,
  EXCLUDE_ZERO_FILTERS,
  TOKEN_TYPE_FILTERS,
  formatAprBound,
  formatAprRangeLabel,
  formatDailyRewardsBound,
  formatDailyRewardsRangeLabel,
  formatTvlRangeLabel,
  isAboveZero,
  OPPORTUNITY_ACTIONS,
  OPPORTUNITY_STATUSES,
} from "@/lib/merkl/constants";
import {
  ALL_STATUSES,
  DEFAULT_STATUS,
  listHref,
  parseCsv,
  type OpportunityFilterValues,
} from "@/lib/merkl/query";
import type { MerklChain } from "@/lib/merkl/types";

const searchInputClass =
  "h-8 rounded-md border border-border bg-muted/40 px-2.5 text-sm text-foreground outline-none transition placeholder:text-muted-foreground hover:border-border focus:border-primary focus:ring-2 focus:ring-primary/25";

const SEARCH_DEBOUNCE_MS = 350;
const FILTERS_OPEN_KEY = "merkl-filters-open";

const sidebarListeners = new Set<() => void>();
// Last value set this session, so the toggle still works when storage is blocked.
let sidebarOpenOverride: boolean | null = null;

function subscribeSidebarOpen(listener: () => void) {
  sidebarListeners.add(listener);
  return () => {
    sidebarListeners.delete(listener);
  };
}

function readSidebarOpen() {
  if (sidebarOpenOverride !== null) return sidebarOpenOverride;
  try {
    return window.localStorage.getItem(FILTERS_OPEN_KEY) !== "0";
  } catch {
    return true;
  }
}

function readServerSidebarOpen() {
  return true;
}

function writeSidebarOpen(open: boolean) {
  sidebarOpenOverride = open;
  try {
    window.localStorage.setItem(FILTERS_OPEN_KEY, open ? "1" : "0");
  } catch {
    /* ignore */
  }
  sidebarListeners.forEach((listener) => listener());
}

function isDefaultLiveStatus(status: string | undefined) {
  return status === DEFAULT_STATUS;
}

function countActiveFilters(values: OpportunityFilterValues) {
  let count = 0;
  if (values.search) count += 1;
  count += parseCsv(values.chainId).length;
  if (!isDefaultLiveStatus(values.status)) {
    const statuses = parseCsv(values.status);
    count +=
      statuses.length === OPPORTUNITY_STATUSES.length ? 1 : statuses.length;
  }
  count += parseCsv(values.action).length;
  if (values.minimumTvl || values.maximumTvl) count += 1;
  if (values.minimumApr || values.maximumApr) count += 1;
  if (values.minimumDailyRewards || values.maximumDailyRewards) count += 1;
  if (values.asset) count += 1;
  count += parseCsv(values.tokenTypes).length;
  return count;
}

type Chip = {
  key: string;
  label: string;
  icon?: string | null;
  clear: Partial<OpportunityFilterValues>;
};

function ActiveChips({
  values,
  chains,
}: {
  values: OpportunityFilterValues;
  chains: MerklChain[];
}) {
  const chips: Chip[] = [];

  if (values.search) {
    chips.push({
      key: "search",
      label: `“${values.search}”`,
      clear: { search: undefined },
    });
  }

  for (const id of parseCsv(values.chainId)) {
    const chain = chains.find((c) => String(c.id) === id);
    const remaining = parseCsv(values.chainId).filter((item) => item !== id);
    chips.push({
      key: `chain-${id}`,
      label: chain?.name ?? `Chain ${id}`,
      icon: chain?.icon,
      clear: { chainId: remaining.length ? remaining.join(",") : undefined },
    });
  }

  if (!isDefaultLiveStatus(values.status)) {
    const statuses = parseCsv(values.status);
    if (statuses.length === OPPORTUNITY_STATUSES.length) {
      chips.push({
        key: "status-all",
        label: "All statuses",
        clear: { status: "LIVE" },
      });
    } else {
      for (const status of statuses) {
        const remaining = statuses.filter((item) => item !== status);
        chips.push({
          key: `status-${status}`,
          label: status,
          clear: {
            status: remaining.length ? remaining.join(",") : "LIVE",
          },
        });
      }
    }
  }

  for (const action of parseCsv(values.action)) {
    const remaining = parseCsv(values.action).filter((item) => item !== action);
    chips.push({
      key: `action-${action}`,
      label: action,
      clear: { action: remaining.length ? remaining.join(",") : undefined },
    });
  }

  if (values.asset) {
    const meta = ASSET_FILTERS.find((item) => item.value === values.asset);
    chips.push({
      key: `asset-${values.asset}`,
      label: meta?.label ?? values.asset,
      clear: { asset: undefined },
    });
  }

  for (const tokenType of parseCsv(values.tokenTypes)) {
    const meta = TOKEN_TYPE_FILTERS.find((item) => item.value === tokenType);
    const remaining = parseCsv(values.tokenTypes).filter(
      (item) => item !== tokenType,
    );
    chips.push({
      key: `tokenType-${tokenType}`,
      label: meta?.label ?? tokenType,
      clear: {
        tokenTypes: remaining.length ? remaining.join(",") : undefined,
      },
    });
  }

  if (values.minimumTvl || values.maximumTvl) {
    chips.push({
      key: "tvl",
      label:
        formatTvlRangeLabel(values.minimumTvl, values.maximumTvl) ?? "TVL",
      clear: { minimumTvl: undefined, maximumTvl: undefined },
    });
  }

  if (values.minimumApr || values.maximumApr) {
    chips.push({
      key: "apr",
      label:
        formatAprRangeLabel(values.minimumApr, values.maximumApr) ?? "APR",
      clear: { minimumApr: undefined, maximumApr: undefined },
    });
  }

  if (values.minimumDailyRewards || values.maximumDailyRewards) {
    chips.push({
      key: "daily",
      label:
        formatDailyRewardsRangeLabel(
          values.minimumDailyRewards,
          values.maximumDailyRewards,
        ) ?? "Daily",
      clear: {
        minimumDailyRewards: undefined,
        maximumDailyRewards: undefined,
      },
    });
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {chips.map((chip) => (
        <ListLink
          key={chip.key}
          href={listHref({ ...values, ...chip.clear })}
          className="group inline-flex items-center gap-1.5 rounded-full border border-border bg-card py-0.5 pr-2 pl-1 text-[11px] font-medium text-muted-foreground transition hover:border-border hover:text-foreground"
          title={`Clear ${chip.label}`}
        >
          {chip.key.startsWith("chain-") ? (
            <AssetIcon
              src={chip.icon}
              label={chip.label}
              size={14}
              rounded="full"
            />
          ) : null}
          <span>{chip.label}</span>
          <span className="text-muted-foreground/60 group-hover:text-muted-foreground">×</span>
        </ListLink>
      ))}
    </div>
  );
}

function FilterFields({
  values,
  chainOptions,
  statusOptions,
  actionOptions,
  push,
}: {
  values: OpportunityFilterValues;
  chainOptions: { value: string; label: string; icon?: string | null }[];
  statusOptions: { value: string; label: string }[];
  actionOptions: { value: string; label: string }[];
  push: (patch: Partial<OpportunityFilterValues>) => void;
}) {
  const statusValue = values.status ?? "LIVE";
  const statusSelectValue = statusValue === ALL_STATUSES ? "" : statusValue;

  return (
    <div className="flex flex-col gap-4">
      <label className="space-y-1.5 text-xs font-medium text-muted-foreground">
        Chain
        <FilterSelect
          label="Chain"
          emptyLabel="All chains"
          multiple
          value={values.chainId ?? ""}
          options={chainOptions}
          onChange={(chainId) => push({ chainId: chainId || undefined })}
          className="w-full [&_button]:w-full"
        />
      </label>
      <label className="space-y-1.5 text-xs font-medium text-muted-foreground">
        Status
        <FilterSelect
          label="Status"
          emptyLabel="All statuses"
          multiple
          value={statusSelectValue}
          options={statusOptions}
          onChange={(status) =>
            push({ status: status ? status : ALL_STATUSES })
          }
          className="w-full [&_button]:w-full"
        />
      </label>
      <label className="space-y-1.5 text-xs font-medium text-muted-foreground">
        Action
        <FilterSelect
          label="Action"
          emptyLabel="All actions"
          multiple
          value={values.action ?? ""}
          options={actionOptions}
          onChange={(action) => push({ action: action || undefined })}
          className="w-full [&_button]:w-full"
        />
      </label>
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-muted-foreground">Asset type</p>
        <AssetTypeBadges
          value={values.asset}
          onChange={(asset) => push({ asset })}
        />
      </div>
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-muted-foreground">Campaign token type</p>
        <ToggleBadges
          value={values.tokenTypes}
          options={TOKEN_TYPE_FILTERS}
          onChange={(tokenTypes) => push({ tokenTypes })}
          ariaLabel="Campaign token type"
        />
      </div>
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-muted-foreground">
          Exclude zeros
        </p>
        <div
          className="inline-flex flex-wrap items-center gap-1.5"
          role="group"
          aria-label="Exclude zero metrics"
        >
          {EXCLUDE_ZERO_FILTERS.map((badge) => {
            const active =
              badge.value === "tvl"
                ? isAboveZero(values.minimumTvl)
                : badge.value === "apr"
                  ? isAboveZero(values.minimumApr)
                  : isAboveZero(values.minimumDailyRewards);
            return (
              <button
                key={badge.value}
                type="button"
                aria-pressed={active}
                onClick={() => {
                  if (badge.value === "tvl") {
                    push({
                      minimumTvl: active ? undefined : badge.floor,
                    });
                    return;
                  }
                  if (badge.value === "apr") {
                    push({
                      minimumApr: active ? undefined : badge.floor,
                    });
                    return;
                  }
                  push({
                    minimumDailyRewards: active ? undefined : badge.floor,
                  });
                }}
                className={`inline-flex h-8 cursor-pointer items-center rounded-full border px-3 text-xs font-semibold tracking-wide transition ${
                  active
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card text-muted-foreground hover:border-border hover:text-foreground"
                }`}
              >
                {badge.label}
              </button>
            );
          })}
        </div>
      </div>
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-muted-foreground">TVL range</p>
        <TvlRangeFilter
          minimumTvl={values.minimumTvl}
          maximumTvl={values.maximumTvl}
          onChange={push}
          className="w-full"
        />
      </div>
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-muted-foreground">APR range</p>
        <MetricRangeFilter
          label="APR"
          minKey="minimumApr"
          maxKey="maximumApr"
          minValue={values.minimumApr}
          maxValue={values.maximumApr}
          steps={APR_STEPS}
          formatBound={formatAprBound}
          onChange={push}
          className="w-full"
        />
      </div>
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-muted-foreground">Daily rewards</p>
        <MetricRangeFilter
          label="Daily"
          minKey="minimumDailyRewards"
          maxKey="maximumDailyRewards"
          minValue={values.minimumDailyRewards}
          maxValue={values.maximumDailyRewards}
          steps={DAILY_REWARDS_STEPS}
          formatBound={formatDailyRewardsBound}
          onChange={push}
          className="w-full"
        />
      </div>
    </div>
  );
}

export function OpportunityFilters({
  chains,
  values,
  pagination,
  children,
}: {
  chains: MerklChain[];
  values: OpportunityFilterValues;
  pagination?: PaginationProps;
  children: ReactNode;
}) {
  const { navigate } = useListNavigation();
  const [sheetOpen, setSheetOpen] = useState(false);
  const sidebarOpen = useSyncExternalStore(
    subscribeSidebarOpen,
    readSidebarOpen,
    readServerSidebarOpen,
  );
  const setFiltersOpen = writeSidebarOpen;

  const [search, setSearch] = useState(values.search ?? "");
  const [urlSearch, setUrlSearch] = useState(values.search ?? "");
  if ((values.search ?? "") !== urlSearch) {
    const next = values.search ?? "";
    if (!next || search === urlSearch) setSearch(next);
    setUrlSearch(next);
  }

  const chainOptions = useMemo(
    () =>
      chains.map((chain) => ({
        value: String(chain.id),
        label: chain.name,
        icon: chain.icon,
      })),
    [chains],
  );

  const statusOptions = useMemo(
    () =>
      OPPORTUNITY_STATUSES.map((status) => ({
        value: status,
        label: status,
      })),
    [],
  );

  const actionOptions = useMemo(
    () =>
      OPPORTUNITY_ACTIONS.map((action) => ({
        value: action,
        label: action,
      })),
    [],
  );

  const push = (patch: Partial<OpportunityFilterValues>) => {
    // Any filter change restarts from the first page.
    navigate(listHref({ ...values, ...patch, page: 0 }));
  };

  useEffect(() => {
    const handle = window.setTimeout(() => {
      const next = search.trim();
      const current = (values.search ?? "").trim();
      if (next === current) return;
      push({ search: next || undefined });
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally debounce local draft only
  }, [search]);

  const activeCount = countActiveFilters(values);
  const filterFields = (
    <FilterFields
      values={values}
      chainOptions={chainOptions}
      statusOptions={statusOptions}
      actionOptions={actionOptions}
      push={push}
    />
  );

  const filterCountBadge =
    activeCount > 0 ? (
      <span className="inline-flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
        {activeCount}
      </span>
    ) : null;

  return (
    <div className="lg:flex lg:items-start lg:gap-6">
      {sidebarOpen ? (
        <aside className="sticky top-14 z-10 hidden w-60 shrink-0 self-start lg:block">
          <div className="rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2.5">
              <h2 className="text-sm font-semibold text-foreground">Filters</h2>
              <div className="flex items-center gap-1">
                <ListLink
                  href="/"
                  className="cursor-pointer rounded-md px-1.5 py-1 text-xs font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
                >
                  Reset
                </ListLink>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="text-muted-foreground"
                  aria-label="Hide filters"
                  title="Hide filters"
                  onClick={() => setFiltersOpen(false)}
                >
                  <PanelLeftClose className="size-4" />
                </Button>
              </div>
            </div>
            <div className="max-h-[calc(100vh-5.5rem)] overflow-y-auto p-4">
              {filterFields}
            </div>
          </div>
        </aside>
      ) : null}

      <div className="min-w-0 flex-1 space-y-3 pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-0">
        <div className="space-y-2">
          {/* Desktop search + show/hide filters */}
          <div className="hidden items-center gap-2 md:flex">
            <Button
              type="button"
              variant="outline"
              className="hidden shrink-0 gap-1.5 lg:inline-flex"
              aria-pressed={sidebarOpen}
              aria-label={sidebarOpen ? "Hide filters" : "Show filters"}
              title={sidebarOpen ? "Hide filters" : "Show filters"}
              onClick={() => setFiltersOpen(!sidebarOpen)}
            >
              {sidebarOpen ? (
                <PanelLeftClose className="size-4" />
              ) : (
                <PanelLeftOpen className="size-4" />
              )}
              Filters
              {filterCountBadge}
            </Button>

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search opportunities…"
              aria-label="Search"
              className={`${searchInputClass} min-w-0 flex-1`}
            />
          </div>

          <ActiveChips values={values} chains={chains} />
        </div>

        <ListResults>{children}</ListResults>
      </div>

      {/* Mobile sticky chrome: search, filters, pagination */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 px-3 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] shadow-[0_-12px_32px_rgba(0,0,0,0.35)] backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-7xl items-center gap-2">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search…"
            aria-label="Search"
            className={`${searchInputClass} min-w-0 flex-1`}
          />

          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="shrink-0 gap-1.5"
              >
                <ListFilter className="size-4" />
                Filters
                {filterCountBadge}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-sm">
              <SheetHeader className="border-b border-border">
                <SheetTitle>Filters</SheetTitle>
                <SheetDescription>
                  Narrow by chain, status, action, asset type, or TVL range.
                </SheetDescription>
              </SheetHeader>
              <div className="flex-1 overflow-y-auto p-4">{filterFields}</div>
              <SheetFooter className="border-t border-border sm:flex-row">
                <Button variant="outline" asChild className="flex-1">
                  <ListLink href="/" onClick={() => setSheetOpen(false)}>
                    Reset
                  </ListLink>
                </Button>
                <SheetClose asChild>
                  <Button type="button" className="flex-1">
                    Done
                  </Button>
                </SheetClose>
              </SheetFooter>
            </SheetContent>
          </Sheet>

          {pagination ? <PaginationControls {...pagination} /> : null}
        </div>
      </div>
    </div>
  );
}
