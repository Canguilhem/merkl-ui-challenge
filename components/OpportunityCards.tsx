"use client";

import { useState } from "react";
import { AssetIcon } from "@/components/AssetIcon";
import { OpportunityPreviewDialog } from "@/components/OpportunityPreviewDialog";
import { RewardTokenStack } from "@/components/RewardTokenStack";
import { rewardTokens } from "@/lib/cell-info";
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

export function OpportunityCards({ data }: { data: Opportunity[] }) {
  const [preview, setPreview] = useState<Opportunity | null>(null);

  return (
    <>
      <ul className="space-y-2.5 md:hidden">
        {data.map((opportunity) => {
          const protocolLabel = opportunity.protocol?.name ?? "Unknown";
          const chainName =
            opportunity.chain?.name ?? String(opportunity.chainId);
          const days = remainingCampaignDays(
            opportunity.latestCampaignEnd,
            Date.now(),
          );
          const per1k = dailyRewardsPer1k({
            dailyRewards: opportunity.dailyRewards,
            tvl: opportunity.tvl,
            apr: displayApr(opportunity),
          });
          const rewards = rewardTokens(opportunity);
          const endsUrgent = days != null && days >= 0 && days <= 7;

          return (
            <li key={opportunity.id}>
              <button
                type="button"
                onClick={() => setPreview(opportunity)}
                className="w-full cursor-pointer rounded-xl bg-card px-3.5 py-3 text-left transition hover:bg-muted/40 active:bg-muted/60"
              >
                <div className="flex items-start gap-3">
                  <AssetIcon
                    src={opportunity.protocol?.icon}
                    label={protocolLabel}
                    size={40}
                  />
                  <div className="min-w-0 flex-1">
                    <h2 className="line-clamp-2 text-[15px] font-semibold leading-snug text-foreground">
                      {opportunity.name}
                    </h2>
                    <p className="mt-1 flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px] text-muted-foreground">
                      <span className="truncate">{protocolLabel}</span>
                      <span className="text-muted-foreground/50">·</span>
                      <span className="inline-flex min-w-0 items-center gap-1">
                        <AssetIcon
                          src={opportunity.chain?.icon}
                          label={chainName}
                          size={12}
                          rounded="full"
                        />
                        <span className="truncate">{chainName}</span>
                      </span>
                      <span className="text-muted-foreground/50">·</span>
                      <span className="font-mono text-[10px] tracking-wide">
                        {opportunity.action}
                      </span>
                      <span className="text-muted-foreground/50">·</span>
                      <span
                        className={`font-mono tabular-nums ${
                          endsUrgent ? "text-warning" : "text-muted-foreground"
                        }`}
                      >
                        {days == null || days < 0
                          ? formatRemainingDays(days)
                          : `${formatRemainingDays(days)} left`}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2.5 border-t border-border/70 pt-3">
                  <div>
                    <p className="text-[10px] font-medium text-muted-foreground">
                      APR
                    </p>
                    <p className="mt-0.5 font-mono text-sm font-semibold tabular-nums text-foreground">
                      {formatApr(displayApr(opportunity))}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-medium text-muted-foreground">
                      TVL
                    </p>
                    <p className="mt-0.5 font-mono text-sm font-semibold tabular-nums text-foreground">
                      {formatUsd(opportunity.tvl)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-medium text-muted-foreground">
                      Daily pool
                    </p>
                    <p className="mt-0.5 inline-flex items-center gap-1.5 font-mono text-sm font-semibold tabular-nums text-foreground">
                      <RewardTokenStack tokens={rewards} size={14} />
                      {formatUsd(opportunity.dailyRewards)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-medium text-muted-foreground">
                      $/day per $1k
                    </p>
                    <p
                      className="mt-0.5 font-mono text-sm font-semibold tabular-nums text-foreground"
                      title={`Expected daily reward for $1k deposited: ${formatDailyPer1k(per1k)}`}
                    >
                      {formatDailyPer1k(per1k)}
                    </p>
                  </div>
                </div>
              </button>
            </li>
          );
        })}
      </ul>

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
