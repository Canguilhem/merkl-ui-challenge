"use client";

import type { ReactNode } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function CellTip({
  tip,
  children,
  align = "end",
}: {
  tip: ReactNode | null | undefined;
  children: ReactNode;
  align?: "start" | "center" | "end";
}) {
  if (!tip) return <>{children}</>;

  return (
    <Tooltip delayDuration={200}>
      <TooltipTrigger asChild>
        <span className="cursor-help border-b border-dotted border-border/80">
          {children}
        </span>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        align={align}
        sideOffset={6}
        className="max-w-xs border border-border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-lg"
      >
        {tip}
      </TooltipContent>
    </Tooltip>
  );
}
