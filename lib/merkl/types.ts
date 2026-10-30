import type { ListQuery } from "@/lib/merkl/query";

export type OpportunityStatus = "LIVE" | "PAST" | "SOON";

export type OpportunityAction =
  | "POOL"
  | "HOLD"
  | "DROP"
  | "LEND"
  | "BORROW"
  | "LONG"
  | "SHORT"
  | "SWAP"
  | "INVALID"
  | "STAKE";

export type MerklToken = {
  id: string;
  name: string;
  symbol: string;
  address: string;
  chainId: number;
  decimals: number;
  icon?: string | null;
  price?: number | null;
};

export type MerklChain = {
  id: number;
  name: string;
  icon?: string | null;
  liveCampaigns?: number;
};

export type MerklProtocol = {
  id: string;
  name: string;
  icon?: string | null;
  url?: string | null;
};

export type AprBreakdown = {
  distributionType?: string | null;
  identifier?: string | null;
  type?: string | null;
  value?: number | null;
  timestamp?: string | number | null;
};

export type AprRecord = {
  cumulated?: number | null;
  timestamp?: string | number | null;
  breakdowns?: AprBreakdown[];
};

export type NativeAprRecord = {
  title?: string | null;
  description?: string | null;
  value?: number | null;
  timestamp?: string | number | null;
};

export type RewardBreakdown = {
  value?: number | null;
  distributionType?: string | null;
  token?: MerklToken & {
    verified?: boolean;
    isNative?: boolean;
    type?: string;
  };
};

export type RewardsRecord = {
  id?: string;
  total?: number | null;
  timestamp?: string | number | null;
  breakdowns?: RewardBreakdown[];
};

export type Opportunity = {
  id: string;
  name: string;
  description?: string | null;
  howToSteps?: string[];
  status: OpportunityStatus | string;
  action: OpportunityAction | string;
  type: string;
  identifier: string;
  chainId: number;
  tvl: number;
  apr: number;
  maxApr?: number | null;
  nativeApr?: number | null;
  totalApr?: number | null;
  dailyRewards: number;
  depositUrl?: string | null;
  explorerAddress?: string | null;
  tags?: string[];
  tokens?: MerklToken[];
  chain?: MerklChain;
  protocol?: MerklProtocol | null;
  aprRecord?: AprRecord | null;
  nativeAprRecord?: NativeAprRecord | null;
  rewardsRecord?: RewardsRecord | null;
  /** Unix seconds (string or number) for live campaign window. */
  earliestCampaignStart?: string | number | null;
  latestCampaignStart?: string | number | null;
  earliestCampaignEnd?: string | number | null;
  latestCampaignEnd?: string | number | null;
  liveCampaigns?: number;
};

export type OpportunityListResult = {
  data: Opportunity[];
  meta: {
    page: number;
    items: number;
    /** Rows on this page. */
    count: number;
    /** Rows matching the filters, or null if the Merkl count call failed. */
    total: number | null;
    source: "merkl";
    filters: ListQuery;
    /** Full Merkl URL used for this response (server-side). */
    upstreamUrl: string;
    /** Matching local BFF path for browser Network inspection. */
    localApiPath: string;
  };
};
