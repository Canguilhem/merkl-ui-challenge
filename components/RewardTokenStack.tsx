"use client";

import { AssetIcon } from "@/components/AssetIcon";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { MerklToken } from "@/lib/merkl/types";

/** Icon-only reward tokens with name tooltip. */
export function RewardTokenStack({
  tokens,
  size = 14,
}: {
  tokens: MerklToken[];
  size?: number;
}) {
  if (tokens.length === 0) return null;

  const shown = tokens.slice(0, 3);
  const extra = tokens.length - shown.length;
  const label = `Reward${tokens.length > 1 ? "s" : ""}: ${tokens
    .map((t) => t.symbol)
    .join(", ")}`;

  return (
    <Tooltip delayDuration={200}>
      <TooltipTrigger asChild>
        <span
          className="inline-flex shrink-0 cursor-help items-center"
          aria-label={label}
        >
          <span className="inline-flex -space-x-1">
            {shown.map((token) => (
              <AssetIcon
                key={token.id || token.symbol}
                src={token.icon}
                label={token.symbol}
                size={size}
                rounded="full"
              />
            ))}
          </span>
          {extra > 0 ? (
            <span className="ml-0.5 text-[10px] font-medium text-muted-foreground">
              +{extra}
            </span>
          ) : null}
        </span>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        sideOffset={6}
        className="max-w-xs border border-border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-lg"
      >
        <div className="space-y-1">
          {tokens.map((token) => (
            <p key={token.id || token.symbol} className="leading-snug">
              <span className="font-medium text-foreground">{token.symbol}</span>
              {token.name && token.name !== token.symbol ? (
                <span className="text-muted-foreground"> · {token.name}</span>
              ) : null}
            </p>
          ))}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
