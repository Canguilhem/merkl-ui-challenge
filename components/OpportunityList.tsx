"use client";

import { OpportunityCards } from "@/components/OpportunityCards";
import { OpportunityTable } from "@/components/OpportunityTable";
import type { Opportunity } from "@/lib/merkl/types";

export function OpportunityList({
  data,
  sort,
  order,
}: {
  data: Opportunity[];
  sort?: string;
  order?: string;
}) {
  return (
    <>
      <OpportunityCards data={data} />
      <div className="hidden md:block">
        <OpportunityTable data={data} sort={sort} order={order} />
      </div>
    </>
  );
}
