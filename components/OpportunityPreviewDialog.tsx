"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { AssetIcon } from "@/components/AssetIcon";
import { RewardTokenStack } from "@/components/RewardTokenStack";
import { StatusBadge } from "@/components/StatusBadge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  rewardModelLabel,
  rewardTokens,
  type RewardModelLabel,
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
import type { Opportunity } from "@/lib/merkl/types";
import { useNow } from "@/lib/use-now";

export function OpportunityPreviewDialog({
  opportunity,
  open,
  onOpenChange,
}: {
  opportunity: Opportunity | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const now = useNow();

  if (!opportunity) return null;

  const protocolLabel = opportunity.protocol?.name ?? "Unknown";
  const chainName = opportunity.chain?.name ?? String(opportunity.chainId);
  const days = remainingCampaignDays(
    opportunity.latestCampaignEnd,
    now,
  );
  const per1k = dailyRewardsPer1k({
    dailyRewards: opportunity.dailyRewards,
    tvl: opportunity.tvl,
    apr: displayApr(opportunity),
  });

  const models = [
    ...new Set(
      (opportunity.aprRecord?.breakdowns ?? [])
        .map((b) => rewardModelLabel(b.distributionType))
        .filter((v): v is RewardModelLabel => v != null),
    ),
  ];
  const rewards = rewardTokens(opportunity);

  const stats: {
    label: string;
    value: ReactNode;
    tip?: string;
    emphasize?: boolean;
  }[] = [
    { label: "APR", value: formatApr(displayApr(opportunity)) },
    { label: "TVL", value: formatUsd(opportunity.tvl) },
    {
      label: "Daily pool",
      value: (
        <span className="inline-flex items-center gap-1.5">
          <RewardTokenStack tokens={rewards} size={14} />
          {formatUsd(opportunity.dailyRewards)}
        </span>
      ),
    },
    {
      label: "$/day per $1k",
      value: formatDailyPer1k(per1k),
      tip: `Expected daily reward for $1k deposited: ${formatDailyPer1k(per1k)}`,
      emphasize: true,
    },
    { label: "Ends in", value: formatRemainingDays(days) },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(92vh,44rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-xl md:max-w-2xl">
        <DialogHeader className="space-y-0 border-b border-border px-3 py-2.5 text-left sm:px-5 sm:py-4">
          <div className="flex items-start gap-2.5 sm:gap-3">
            <AssetIcon
              src={opportunity.protocol?.icon}
              label={protocolLabel}
              size={36}
            />
            <div className="min-w-0 flex-1 pr-6">
              <div className="flex flex-wrap items-center gap-1 sm:gap-1.5">
                <StatusBadge status={opportunity.status} />
                <span className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  {opportunity.action}
                </span>
                {models.map((model) => (
                  <span
                    key={model}
                    className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
                  >
                    {model}
                  </span>
                ))}
              </div>
              <DialogTitle className="mt-1 text-sm leading-snug sm:mt-1.5 sm:text-base">
                {opportunity.name}
              </DialogTitle>
              <DialogDescription className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] sm:mt-1 sm:text-xs">
                <span>{protocolLabel}</span>
                <span className="text-muted-foreground/60">·</span>
                <span className="inline-flex items-center gap-1">
                  <AssetIcon
                    src={opportunity.chain?.icon}
                    label={chainName}
                    size={12}
                    rounded="full"
                  />
                  {chainName}
                </span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-3 py-3 sm:space-y-5 sm:px-5 sm:py-4">
          <dl className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {stats.map((stat) => (
              <div
                key={stat.label}
                title={stat.tip}
                className={`rounded-lg px-2.5 py-2 sm:px-3 ${
                  stat.emphasize
                    ? "border border-primary/30 bg-primary/5"
                    : "border border-border bg-muted/60"
                }`}
              >
                <dt className="text-[10px] font-medium text-muted-foreground">
                  {stat.label}
                </dt>
                <dd className="mt-0.5 font-mono text-sm font-semibold tabular-nums text-foreground">
                  {stat.value}
                </dd>
              </div>
            ))}
          </dl>

          {opportunity.tokens && opportunity.tokens.length > 0 ? (
            <section>
              <h3 className="text-[11px] font-medium text-muted-foreground">
                Position tokens
              </h3>
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {opportunity.tokens.slice(0, 8).map((token) => (
                  <li
                    key={token.id}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2 py-1 text-xs text-foreground/85"
                    title={token.name}
                  >
                    <AssetIcon
                      src={token.icon}
                      label={token.symbol}
                      size={12}
                      rounded="full"
                    />
                    {token.symbol}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {opportunity.description ? (
            <section>
              <h3 className="text-[11px] font-medium text-muted-foreground">
                About
              </h3>
              <p className="mt-1.5 line-clamp-4 text-sm leading-relaxed text-muted-foreground">
                {opportunity.description}
              </p>
            </section>
          ) : null}

          {opportunity.howToSteps && opportunity.howToSteps.length > 0 ? (
            <section>
              <h3 className="text-[11px] font-medium text-muted-foreground">
                How to participate
              </h3>
              <ol className="mt-1.5 list-decimal space-y-1 pl-4 text-sm leading-relaxed text-muted-foreground">
                {opportunity.howToSteps.slice(0, 4).map((step) => (
                  <li key={step} className="line-clamp-2">
                    {step}
                  </li>
                ))}
              </ol>
            </section>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-1.5 border-t border-border bg-muted/50 px-3 py-2 sm:gap-2 sm:px-5 sm:py-3">
          <Link
            href={`/opportunities/${opportunity.id}`}
            className="inline-flex h-8 cursor-pointer items-center rounded-lg px-2.5 text-xs font-medium text-muted-foreground transition hover:text-foreground sm:h-9 sm:px-3 sm:text-sm"
            onClick={() => onOpenChange(false)}
          >
            Full details
          </Link>
          {opportunity.depositUrl ? (
            <a
              href={opportunity.depositUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-8 cursor-pointer items-center rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground transition hover:bg-primary/85 sm:h-9 sm:px-3.5 sm:text-sm"
            >
              Deposit
            </a>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
