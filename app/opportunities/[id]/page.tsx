import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AssetIcon } from "@/components/AssetIcon";
import { RemainingDays } from "@/components/RemainingDays";
import { RewardTokenStack } from "@/components/RewardTokenStack";
import { OpportunityDetailSkeleton } from "@/components/skeletons";
import { StatusBadge } from "@/components/StatusBadge";
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
  formatUsd,
} from "@/lib/format";
import { getOpportunity } from "@/lib/merkl/client";

async function OpportunityDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const opportunity = await getOpportunity(id);

  if (!opportunity) notFound();

  const protocolLabel = opportunity.protocol?.name ?? "Unknown protocol";
  const chainName = opportunity.chain?.name;
  const rewards = rewardTokens(opportunity);
  const models = [
    ...new Set(
      (opportunity.aprRecord?.breakdowns ?? [])
        .map((b) => rewardModelLabel(b.distributionType))
        .filter((v): v is RewardModelLabel => v != null),
    ),
  ];
  const per1k = dailyRewardsPer1k({
    dailyRewards: opportunity.dailyRewards,
    tvl: opportunity.tvl,
    apr: displayApr(opportunity),
  });

  const stats = [
    { label: "APR", value: formatApr(displayApr(opportunity)) },
    { label: "TVL", value: formatUsd(opportunity.tvl) },
    {
      label: "Daily pool",
      value: (
        <span className="inline-flex items-center gap-1.5">
          <RewardTokenStack tokens={rewards} size={16} />
          {formatUsd(opportunity.dailyRewards)}
        </span>
      ),
    },
    {
      label: "$/day per $1k",
      value: formatDailyPer1k(per1k),
      tip: `Expected daily reward for $1k deposited: ${formatDailyPer1k(per1k)}`,
      emphasize: true as const,
    },
    {
      label: "Ends in",
      value: <RemainingDays end={opportunity.latestCampaignEnd} />,
    },
  ];

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <Link
        href="/"
        className="cursor-pointer text-sm font-medium text-muted-foreground transition hover:text-foreground"
      >
        ← Back to list
      </Link>

      <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-4">
          <AssetIcon
            src={opportunity.protocol?.icon}
            label={protocolLabel}
            size={56}
          />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <StatusBadge status={opportunity.status} />
              <span className="rounded-md bg-muted px-2 py-0.5 font-mono text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                {opportunity.action}
              </span>
              {models.map((model) => (
                <span
                  key={model}
                  className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
                >
                  {model}
                </span>
              ))}
            </div>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              {opportunity.name}
            </h1>
            <p className="mt-1 flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
              <span>{protocolLabel}</span>
              {chainName ? (
                <>
                  <span className="text-muted-foreground/60">·</span>
                  <span className="inline-flex items-center gap-1">
                    <AssetIcon
                      src={opportunity.chain?.icon}
                      label={chainName}
                      size={14}
                      rounded="full"
                    />
                    {chainName}
                  </span>
                </>
              ) : null}
            </p>
          </div>
        </div>

        {opportunity.depositUrl ? (
          <a
            href={opportunity.depositUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-10 cursor-pointer items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary/85"
          >
            Deposit
          </a>
        ) : null}
      </div>

      <dl className="mt-8 grid grid-cols-2 gap-2 sm:grid-cols-5">
        {stats.map((stat) => (
          <div
            key={stat.label}
            title={"tip" in stat ? stat.tip : undefined}
            className={`rounded-xl px-3 py-3 ${
              "emphasize" in stat && stat.emphasize
                ? "border border-primary/30 bg-primary/5"
                : "border border-border bg-card"
            }`}
          >
            <dt className="text-[11px] font-medium text-muted-foreground">
              {stat.label}
            </dt>
            <dd className="mt-1 font-mono text-base font-semibold tabular-nums text-foreground sm:text-lg">
              {stat.value}
            </dd>
          </div>
        ))}
      </dl>

      {opportunity.tokens && opportunity.tokens.length > 0 ? (
        <section className="mt-8">
          <h2 className="text-[11px] font-medium text-muted-foreground">
            Position tokens
          </h2>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {opportunity.tokens.map((token) => (
              <li
                key={token.id}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1.5 text-xs text-foreground/85"
                title={
                  token.price != null
                    ? `${token.name} · ${formatUsd(token.price)}`
                    : token.name
                }
              >
                <AssetIcon
                  src={token.icon}
                  label={token.symbol}
                  size={14}
                  rounded="full"
                />
                {token.symbol}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {opportunity.description ? (
        <section className="mt-8">
          <h2 className="text-[11px] font-medium text-muted-foreground">
            About
          </h2>
          <p className="mt-2 text-sm leading-6 text-foreground/85">
            {opportunity.description}
          </p>
        </section>
      ) : null}

      {opportunity.howToSteps && opportunity.howToSteps.length > 0 ? (
        <section className="mt-8">
          <h2 className="text-[11px] font-medium text-muted-foreground">
            How to participate
          </h2>
          <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm leading-6 text-foreground/85">
            {opportunity.howToSteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </section>
      ) : null}

      <section className="mt-8 rounded-xl border border-border bg-card p-4 text-xs text-muted-foreground">
        <p>
          <span className="font-medium text-foreground/85">Opportunity ID:</span>{" "}
          <code className="font-mono">{opportunity.id}</code>
        </p>
        {opportunity.explorerAddress ? (
          <p className="mt-1 break-all">
            <span className="font-medium text-foreground/85">Explorer:</span>{" "}
            <code className="font-mono">{opportunity.explorerAddress}</code>
          </p>
        ) : null}
      </section>
    </main>
  );
}

export default function OpportunityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<OpportunityDetailSkeleton />}>
      <OpportunityDetail params={params} />
    </Suspense>
  );
}
