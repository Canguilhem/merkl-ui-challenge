import {
  dailyRewardsPer1k,
  displayApr,
  formatApr,
  formatDailyPer1k,
  formatRemainingDays,
  formatUsd,
  parseMerklUnix,
  remainingCampaignDays,
} from "@/lib/format";
import type { MerklToken, Opportunity, RewardBreakdown } from "@/lib/merkl/types";

/** Unique reward tokens from `rewardsRecord` (what you earn). */
export function rewardTokens(opportunity: Opportunity): MerklToken[] {
  const seen = new Set<string>();
  const tokens: MerklToken[] = [];
  for (const part of opportunity.rewardsRecord?.breakdowns ?? []) {
    const token = part.token;
    if (!token?.symbol) continue;
    const key = token.id || `${token.chainId}:${token.address}:${token.symbol}`;
    if (seen.has(key)) continue;
    seen.add(key);
    tokens.push(token);
  }
  return tokens;
}

export function rewardBreakdowns(opportunity: Opportunity): RewardBreakdown[] {
  return opportunity.rewardsRecord?.breakdowns ?? [];
}

/** Human labels for Merkl `distributionType` values. */
export function formatDistributionType(type: string | null | undefined) {
  if (!type) return null;
  switch (type) {
    case "FIX_REWARD_VALUE_PER_LIQUIDITY_VALUE":
      return "Fixed ($ reward / $ liquidity)";
    case "MAX_REWARD_VALUE_PER_LIQUIDITY_VALUE":
      return "Variable (max $ reward / $ liquidity)";
    case "DUTCH_AUCTION":
      return "Dutch auction";
    case "AAVE_NET_APR":
      return "Aave net APR";
    case "ERC4626_APR":
      return "ERC-4626 vault APR";
    case "SOFR_SPREAD_RATCHET":
      return "SOFR spread ratchet";
    default:
      return type
        .toLowerCase()
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
  }
}

export type RewardModelLabel =
  | "Fixed"
  | "Variable"
  | "Auction"
  | "Protocol rate";

export function rewardModelLabel(
  type: string | null | undefined,
): RewardModelLabel | null {
  if (!type) return null;
  if (type.startsWith("FIX_")) return "Fixed";
  if (type.startsWith("MAX_")) return "Variable";
  if (type.includes("DUTCH") || type.includes("AUCTION")) return "Auction";
  if (type.includes("APR") || type.includes("SOFR")) return "Protocol rate";
  return null;
}

function formatEndDate(value: string | number | null | undefined) {
  const ms = parseMerklUnix(value);
  if (ms == null) return null;
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(ms);
}

function TipLines({ lines }: { lines: string[] }) {
  if (lines.length === 0) return null;
  return (
    <div className="space-y-1 text-left">
      {lines.map((line) => (
        <p key={line} className="leading-snug">
          {line}
        </p>
      ))}
    </div>
  );
}

export function aprCellInfo(opportunity: Opportunity) {
  const lines: string[] = [];
  const shown = displayApr(opportunity);
  const breakdowns = opportunity.aprRecord?.breakdowns ?? [];
  const models = [
    ...new Set(
      breakdowns
        .map((b) => rewardModelLabel(b.distributionType))
        .filter((v): v is RewardModelLabel => v != null),
    ),
  ];
  const distributions = [
    ...new Set(
      breakdowns
        .map((b) => formatDistributionType(b.distributionType))
        .filter((v): v is string => v != null),
    ),
  ];

  lines.push(`APR: ${formatApr(shown)}`);
  if (opportunity.nativeApr != null && opportunity.nativeApr > 0) {
    lines.push(`Protocol APR: ${formatApr(opportunity.nativeApr)}`);
  }
  lines.push(`Merkl APR: ${formatApr(opportunity.apr)}`);

  if (models.length > 0) {
    lines.push(`Reward model: ${models.join(", ")}`);
  }
  for (const dist of distributions) {
    lines.push(`Campaign: ${dist}`);
  }
  if (breakdowns.length > 1) {
    for (const part of breakdowns.slice(0, 4)) {
      const label =
        formatDistributionType(part.distributionType) ??
        part.type ??
        "Component";
      lines.push(`· ${label}: ${formatApr(part.value)}`);
    }
  }
  if (opportunity.type) {
    lines.push(`Opportunity type: ${opportunity.type.replaceAll("_", " ")}`);
  }

  return lines.length > 0 ? <TipLines lines={lines} /> : null;
}

export function endsCellInfo(opportunity: Opportunity) {
  const lines: string[] = [];
  const end = formatEndDate(opportunity.latestCampaignEnd);
  const start = formatEndDate(opportunity.earliestCampaignStart);
  const days = remainingCampaignDays(opportunity.latestCampaignEnd, Date.now());

  if (end) lines.push(`Ends: ${end}`);
  if (start) lines.push(`Started: ${start}`);
  if (days != null) lines.push(`Remaining: ${formatRemainingDays(days)}`);
  if (opportunity.liveCampaigns != null) {
    lines.push(`Live campaigns: ${opportunity.liveCampaigns}`);
  }

  return lines.length > 0 ? <TipLines lines={lines} /> : null;
}

export function tvlCellInfo(opportunity: Opportunity) {
  const lines: string[] = [];
  if (opportunity.tvl != null) {
    lines.push(`TVL: ${formatUsd(opportunity.tvl)}`);
  }
  if (opportunity.tokens && opportunity.tokens.length > 0) {
    const symbols = opportunity.tokens
      .slice(0, 6)
      .map((t) => t.symbol)
      .join(", ");
    lines.push(`Tokens: ${symbols}`);
  }
  if (opportunity.type) {
    lines.push(`Type: ${opportunity.type.replaceAll("_", " ")}`);
  }
  return lines.length > 0 ? <TipLines lines={lines} /> : null;
}

export function dailyCellInfo(opportunity: Opportunity) {
  const lines: string[] = [];
  const per1k = dailyRewardsPer1k({
    dailyRewards: opportunity.dailyRewards,
    tvl: opportunity.tvl,
    apr: displayApr(opportunity),
  });

  lines.push(`Daily pool: ${formatUsd(opportunity.dailyRewards)}`);
  lines.push(
    `Expected daily reward for $1k deposited: ${formatDailyPer1k(per1k)}`,
  );

  const rewards = rewardBreakdowns(opportunity);
  const tokens = rewardTokens(opportunity);
  if (tokens.length > 0) {
    lines.push(
      `Reward token${tokens.length > 1 ? "s" : ""}: ${tokens
        .map((t) => t.symbol)
        .join(", ")}`,
    );
  }

  if (rewards.length > 0) {
    for (const part of rewards.slice(0, 5)) {
      const symbol = part.token?.symbol ?? "Reward";
      const model =
        rewardModelLabel(part.distributionType) ??
        formatDistributionType(part.distributionType);
      const amount = part.value != null ? formatUsd(part.value) : null;
      lines.push(
        [symbol, amount, model ? `(${model})` : null].filter(Boolean).join(" "),
      );
    }
  } else {
    const breakdowns = opportunity.aprRecord?.breakdowns ?? [];
    for (const part of breakdowns.slice(0, 3)) {
      const model =
        rewardModelLabel(part.distributionType) ??
        formatDistributionType(part.distributionType);
      if (model) lines.push(model);
    }
  }

  return lines.length > 0 ? <TipLines lines={lines} /> : null;
}
